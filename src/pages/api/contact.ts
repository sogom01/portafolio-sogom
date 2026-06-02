import type { APIRoute } from 'astro';
import { ContactSchema } from '../../logic/schemas/contact.schema';
import { hashIp } from '../../lib/hash';
import { logger } from '../../lib/logger';
import { rateLimit } from '../../lib/rate-limit';
import { escapeHtml, escapeHtmlMultiline } from '../../lib/sanitize';
import { createEmailService } from '../../services/email';
import { verifyTurnstileToken } from '../../services/turnstile/verify';

export const prerender = false;

/**
 * Cabeceras estándar de respuesta JSON. No incluyen información del
 * servidor ni stack traces.
 */
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init.headers ?? {}) },
  });

/**
 * Anti-CSRF ligero: el Origin de un POST cross-site nunca coincide con
 * nuestro propio sitio. Para forms tradicionales sin fetch, el Origin
 * no siempre llega, así que validamos Referer como fallback.
 *
 * Nota: este check es suficiente para un endpoint público sin sesión.
 * Si se añade auth con cookies, hay que añadir CSRF tokens reales.
 */
function isAllowedOrigin(request: Request, allowedOrigin: string): boolean {
  const origin = request.headers.get('origin');
  if (origin) return origin === allowedOrigin;

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin === allowedOrigin;
    } catch {
      return false;
    }
  }
  // Sin Origin ni Referer: rechazamos. Un cliente legítimo siempre
  // envía al menos uno.
  return false;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const startedAt = Date.now();
  // requestId corto para correlacionar logs del mismo request.
  const requestId = crypto.randomUUID().slice(0, 8);

  const ip = clientAddress ?? 'unknown';
  const ipHash = await hashIp(ip);

  // 1. Rate limit por IP hasheada (defense in depth: la IP en claro
  //    nunca toca el store del rate limiter).
  const rl = rateLimit({ key: ipHash, max: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    logger.warn({
      event: 'contact.rate_limited',
      requestId,
      ipHash,
      retryAfter: rl.retryAfter,
    });
    return json(
      { ok: false, error: 'Demasiadas peticiones. Intenta de nuevo en un minuto.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      },
    );
  }

  // 2. Origin/Referer check (CSRF ligero).
  // En desarrollo local saltamos la verificación: estarás probando desde
  // http://localhost:4321 que es distinto de PUBLIC_SITE_URL. En producción
  // (Vercel) la check sí se aplica y rechaza POSTs cross-site.
  const allowedOrigin = process.env.PUBLIC_SITE_URL ?? import.meta.env.PUBLIC_SITE_URL;
  if (!import.meta.env.DEV && allowedOrigin && !isAllowedOrigin(request, allowedOrigin)) {
    logger.warn({ event: 'contact.bad_origin', requestId, ipHash });
    return json({ ok: false, error: 'Origen no permitido.' }, { status: 403 });
  }

  // 3. Parsear JSON con manejo defensivo.
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    logger.warn({ event: 'contact.invalid_json', requestId, ipHash });
    return json({ ok: false, error: 'Cuerpo del request inválido.' }, { status: 400 });
  }

  // 4. Validar con Zod (safeParse — no lanza).
  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    // 4a. Honeypot trampa: si el problema es que el campo honeypot
    //     vino con contenido, devolvemos 200 silencioso para no avisar
    //     al bot. Cualquier otro error de validación se reporta con 400.
    const honeypotTriggered = parsed.error.issues.some((issue) => issue.path[0] === 'honeypot');
    if (honeypotTriggered) {
      logger.warn({ event: 'contact.honeypot_triggered', requestId, ipHash });
      return json({ ok: true, message: 'Mensaje recibido.' });
    }

    // Mensajes neutros: no devolvemos el detalle interno completo, solo
    // los mensajes user-facing de Zod ya escritos por nosotros.
    const messages = parsed.error.issues.map((i) => i.message);
    // Logueamos los NOMBRES de los campos que fallaron (no su contenido).
    // Esto facilita debugging sin filtrar datos del usuario.
    const failedFields = parsed.error.issues.map((i) => String(i.path[0] ?? 'unknown'));
    logger.warn({
      event: 'contact.validation_failed',
      requestId,
      ipHash,
      issuesCount: messages.length,
      failedFields,
    });
    return json({ ok: false, error: 'Datos inválidos.', details: messages }, { status: 400 });
  }

  const { name, email, message, turnstileToken } = parsed.data;

  // 5. Verificar token Turnstile.
  // En dev mode saltamos la verificación contra Cloudflare. Esto permite
  // desarrollar sin depender de la red a challenges.cloudflare.com.
  // En producción siempre se aplica.
  if (!import.meta.env.DEV) {
    const turnstile = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstile.ok) {
      if (turnstile.error.kind === 'invalid-token') {
        logger.warn({
          event: 'contact.turnstile_invalid',
          requestId,
          ipHash,
          codes: turnstile.error.codes,
        });
        return json(
          { ok: false, error: 'Verificación anti-bot no superada. Refresca e inténtalo de nuevo.' },
          { status: 400 },
        );
      }
      // Red caída: 503 para que el cliente reintente, no 500.
      logger.error({
        event: 'contact.turnstile_network',
        requestId,
        ipHash,
        message: turnstile.error.message,
      });
      return json(
        { ok: false, error: 'Servicio anti-bot no disponible. Intenta más tarde.' },
        { status: 503 },
      );
    }
  } else {
    logger.warn({ event: 'contact.turnstile_skipped_dev', requestId, ipHash });
  }

  // 6. Sanitizar y construir el email.
  //    Aunque Zod ya rechazó <> en el nombre, escapamos por defense in
  //    depth: si un día relajamos el schema, la capa de email queda OK.
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessageHtml = escapeHtmlMultiline(message);

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px;">
      <h2 style="margin:0 0 12px;">Nuevo mensaje desde el portafolio</h2>
      <p><strong>De:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">
      <p>${safeMessageHtml}</p>
    </div>
  `.trim();

  const text = `Nuevo mensaje desde el portafolio\n\nDe: ${name} <${email}>\n\n${message}`;

  // 7. Enviar email vía la abstracción EmailService.
  let emailService;
  try {
    emailService = createEmailService();
  } catch (e) {
    logger.error({
      event: 'contact.email_config_missing',
      requestId,
      ipHash,
      message: e instanceof Error ? e.message : 'unknown',
    });
    return json({ ok: false, error: 'Servicio temporalmente no disponible.' }, { status: 503 });
  }

  const sent = await emailService.send({
    fromName: name,
    replyTo: email,
    subject: `[Portafolio] Mensaje de ${name}`,
    html,
    text,
  });

  if (!sent.ok) {
    logger.error({
      event: 'contact.email_send_failed',
      requestId,
      ipHash,
      kind: sent.error.kind,
      message: sent.error.message,
    });
    return json(
      { ok: false, error: 'No pudimos enviar tu mensaje ahora mismo. Intenta más tarde.' },
      { status: 502 },
    );
  }

  // 8. Log de éxito (sin contenido).
  logger.info({
    event: 'contact.sent',
    requestId,
    ipHash,
    durationMs: Date.now() - startedAt,
    messageId: sent.value.id,
  });

  return json({ ok: true, message: 'Mensaje enviado. Gracias.' });
};

// Cualquier otro método → 405. Sin esto, Astro responde 404 lo que
// confunde a clientes legítimos que usaron el verbo equivocado.
export const GET: APIRoute = () =>
  new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });

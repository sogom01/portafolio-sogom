import { err, ok, type Result } from '../../lib/result';

const ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type TurnstileError =
  | { kind: 'invalid-token'; codes: string[] }
  | { kind: 'network'; message: string };

interface CloudflareResponse {
  success: boolean;
  'error-codes'?: string[];
  hostname?: string;
  challenge_ts?: string;
}

/**
 * Verifica un token de Turnstile contra Cloudflare.
 *
 * El `ip` se pasa como sugerencia a Cloudflare; mejora la decisión del
 * desafío y permite detectar token-reuse desde IPs distintas. No es
 * obligatorio.
 */
export async function verifyTurnstileToken(
  token: string,
  ip?: string,
  // Leemos tanto de process.env (producción/Vercel) como de import.meta.env
  // (dev server de Astro/Vite). En dev mode, Vite no siempre rellena
  // process.env, por eso necesitamos el fallback.
  secret: string | undefined = process.env.TURNSTILE_SECRET_KEY ??
    import.meta.env.TURNSTILE_SECRET_KEY,
): Promise<Result<true, TurnstileError>> {
  if (!secret) {
    return err({ kind: 'network', message: 'TURNSTILE_SECRET_KEY no configurada.' });
  }

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      return err({ kind: 'network', message: `Cloudflare devolvió ${response.status}` });
    }

    const data = (await response.json()) as CloudflareResponse;
    if (!data.success) {
      return err({
        kind: 'invalid-token',
        codes: data['error-codes'] ?? ['unknown'],
      });
    }

    return ok(true);
  } catch (e) {
    return err({
      kind: 'network',
      message: e instanceof Error ? e.message : 'Fallo de red contactando Cloudflare.',
    });
  }
}

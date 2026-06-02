import { z } from 'zod';

/**
 * Schema del formulario de contacto.
 *
 * Reglas: validación → sanitización (en lib/sanitize) → escape al embeber.
 * Cada capa rechaza un tipo de ataque distinto (defense in depth):
 *   1. Aquí: rechazo de input estructuralmente inválido.
 *   2. sanitize.ts: neutralización de HTML para el body del email.
 *   3. Escape en plantilla: contexto-específico al construir el HTML final.
 */
export const ContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(80, 'El nombre no puede superar 80 caracteres.')
    // Rechazamos caracteres que sugieren intento de HTML/script injection.
    // No es la defensa final (escape lo es), pero filtra ruido.
    .regex(/^[^<>]+$/, 'El nombre contiene caracteres no permitidos.'),

  email: z.email('El correo no tiene un formato válido.').max(200, 'El correo es demasiado largo.'),

  message: z
    .string()
    .trim()
    .min(10, 'El mensaje debe tener al menos 10 caracteres.')
    .max(2000, 'El mensaje no puede superar 2000 caracteres.'),

  turnstileToken: z.string().min(1, 'Falta la verificación anti-bot. Refresca la página.'),

  // Honeypot: campo oculto que un humano nunca rellena.
  // Si llega con contenido, marcamos como bot y descartamos en silencio.
  honeypot: z.string().max(0, 'Bot detectado.').optional().default(''),
});

export type ContactInput = z.infer<typeof ContactSchema>;

/** Subset de campos que viajan al servicio de email. */
export type ContactPayload = Pick<ContactInput, 'name' | 'email' | 'message'>;

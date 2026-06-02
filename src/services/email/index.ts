import { ResendEmailService } from './resend.service';
import type { EmailService } from './types';

export type { ContactEmailPayload, EmailError, EmailService } from './types';

/**
 * Factoría: devuelve la implementación concreta a partir del entorno.
 *
 * El endpoint nunca importa `ResendEmailService` directamente: pide un
 * `EmailService` a esta factoría. Eso permite cambiar el proveedor (o
 * inyectar un fake en tests) tocando un único lugar.
 *
 * Lanza si la configuración es inválida — es un error de programador,
 * no de runtime esperado.
 */
export function createEmailService(): EmailService {
  // Doble lectura: process.env funciona en producción (Node/Vercel),
  // import.meta.env funciona en dev (Astro/Vite). Sin el fallback,
  // los secrets quedan undefined en dev mode.
  const apiKey = process.env.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL ?? import.meta.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL ?? import.meta.env.CONTACT_TO_EMAIL;

  if (!apiKey || !from || !to) {
    throw new Error(
      'Variables de entorno de email faltantes: RESEND_API_KEY, CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL',
    );
  }

  return new ResendEmailService({ apiKey, from, to });
}

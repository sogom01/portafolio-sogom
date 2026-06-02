import type { Result } from '../../lib/result';

export interface ContactEmailPayload {
  /** Nombre del remitente, ya sanitizado a texto plano por el caller. */
  fromName: string;
  /** Email del remitente para responder. */
  replyTo: string;
  /** Asunto del email. */
  subject: string;
  /** Body en HTML (ya escapado). */
  html: string;
  /** Body en texto plano alternativo. */
  text: string;
}

export type EmailError =
  | { kind: 'config'; message: string }
  | { kind: 'transport'; message: string; status?: number }
  | { kind: 'unknown'; message: string };

export interface EmailService {
  /**
   * Envía un email transaccional. Devuelve el id del proveedor en éxito.
   * Nunca lanza: errores tipados en el Result.
   */
  send(payload: ContactEmailPayload): Promise<Result<{ id: string }, EmailError>>;
}

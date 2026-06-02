import { Resend } from 'resend';
import { err, ok } from '../../lib/result';
import type { ContactEmailPayload, EmailError, EmailService } from './types';

export interface ResendConfig {
  apiKey: string;
  from: string;
  to: string;
}

export class ResendEmailService implements EmailService {
  private readonly client: Resend;

  constructor(private readonly config: ResendConfig) {
    this.client = new Resend(config.apiKey);
  }

  async send(payload: ContactEmailPayload) {
    try {
      const { data, error } = await this.client.emails.send({
        from: `${payload.fromName} <${this.config.from}>`,
        to: [this.config.to],
        replyTo: payload.replyTo,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      if (error) {
        const transportError: EmailError = {
          kind: 'transport',
          message: error.message ?? 'Resend rechazó el envío.',
        };
        return err(transportError);
      }

      if (!data?.id) {
        const unknownError: EmailError = {
          kind: 'unknown',
          message: 'Resend respondió sin id de mensaje.',
        };
        return err(unknownError);
      }

      return ok({ id: data.id });
    } catch (e) {
      const unknownError: EmailError = {
        kind: 'unknown',
        message: e instanceof Error ? e.message : 'Fallo inesperado al enviar.',
      };
      return err(unknownError);
    }
  }
}

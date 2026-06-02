import { describe, it, expect } from 'vitest';
import { ContactSchema } from '../../src/logic/schemas/contact.schema';

describe('ContactSchema', () => {
  const valid = {
    name: 'Juan',
    email: 'juan@example.com',
    message: 'Hola, me gustaría hablar contigo.',
    turnstileToken: 'abc',
    honeypot: '',
  };

  it('acepta input válido', () => {
    const result = ContactSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('aplica trim a name y message', () => {
    const result = ContactSchema.safeParse({
      ...valid,
      name: '   Juan   ',
      message: '   Hola, mensaje válido   ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Juan');
      expect(result.data.message).toBe('Hola, mensaje válido');
    }
  });

  it('rechaza name con <>', () => {
    const result = ContactSchema.safeParse({ ...valid, name: 'Juan <script>' });
    expect(result.success).toBe(false);
  });

  it('rechaza email malformado', () => {
    const result = ContactSchema.safeParse({ ...valid, email: 'no-es-email' });
    expect(result.success).toBe(false);
  });

  it('rechaza mensaje < 10 chars', () => {
    const result = ContactSchema.safeParse({ ...valid, message: 'hola' });
    expect(result.success).toBe(false);
  });

  it('rechaza mensaje > 2000 chars', () => {
    const result = ContactSchema.safeParse({ ...valid, message: 'a'.repeat(2001) });
    expect(result.success).toBe(false);
  });

  it('rechaza turnstileToken vacío', () => {
    const result = ContactSchema.safeParse({ ...valid, turnstileToken: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza si honeypot tiene contenido (bot detectado)', () => {
    const result = ContactSchema.safeParse({ ...valid, honeypot: 'spam' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'honeypot')).toBe(true);
    }
  });

  it('honeypot ausente equivale a vacío', () => {
    const { honeypot: _omit, ...withoutHoneypot } = valid;
    const result = ContactSchema.safeParse(withoutHoneypot);
    expect(result.success).toBe(true);
  });
});

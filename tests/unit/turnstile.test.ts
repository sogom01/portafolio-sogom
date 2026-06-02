import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyTurnstileToken } from '../../src/services/turnstile/verify';

describe('verifyTurnstileToken', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devuelve ok cuando Cloudflare responde success:true', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    const r = await verifyTurnstileToken('token', '1.2.3.4', 'secret');
    expect(r.ok).toBe(true);
  });

  it('devuelve invalid-token cuando success:false', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }), {
        status: 200,
      }),
    );
    const r = await verifyTurnstileToken('token', undefined, 'secret');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.kind).toBe('invalid-token');
      if (r.error.kind === 'invalid-token') {
        expect(r.error.codes).toContain('invalid-input-response');
      }
    }
  });

  it('devuelve network error cuando Cloudflare responde 5xx', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response('', { status: 502 }));
    const r = await verifyTurnstileToken('token', undefined, 'secret');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('network');
  });

  it('devuelve network error si fetch lanza', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('ECONNREFUSED'));
    const r = await verifyTurnstileToken('token', undefined, 'secret');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('network');
  });

  it('falla con network si no hay secret configurado', async () => {
    const r = await verifyTurnstileToken('token', undefined, undefined);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('network');
  });
});

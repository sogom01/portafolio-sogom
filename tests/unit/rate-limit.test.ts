import { describe, it, expect, beforeEach } from 'vitest';
import { _resetRateLimitStore, rateLimit } from '../../src/lib/rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    _resetRateLimitStore();
  });

  it('permite la primera petición', () => {
    const r = rateLimit({ key: 'a', max: 3, windowMs: 1000, now: () => 0 });
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(2);
  });

  it('bloquea cuando se supera max en la ventana', () => {
    rateLimit({ key: 'a', max: 2, windowMs: 1000, now: () => 0 });
    rateLimit({ key: 'a', max: 2, windowMs: 1000, now: () => 100 });
    const r = rateLimit({ key: 'a', max: 2, windowMs: 1000, now: () => 200 });
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfter).toBeGreaterThan(0);
  });

  it('reinicia el contador al cerrar la ventana', () => {
    rateLimit({ key: 'a', max: 1, windowMs: 1000, now: () => 0 });
    rateLimit({ key: 'a', max: 1, windowMs: 1000, now: () => 500 }); // bloqueado
    const r = rateLimit({ key: 'a', max: 1, windowMs: 1000, now: () => 2000 });
    expect(r.allowed).toBe(true);
  });

  it('aísla claves distintas (IPs distintas)', () => {
    rateLimit({ key: 'a', max: 1, windowMs: 1000, now: () => 0 });
    const r = rateLimit({ key: 'b', max: 1, windowMs: 1000, now: () => 0 });
    expect(r.allowed).toBe(true);
  });
});

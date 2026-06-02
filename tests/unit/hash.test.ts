import { describe, it, expect } from 'vitest';
import { hashIp, sha256Hex } from '../../src/lib/hash';

describe('sha256Hex', () => {
  it('produce el digest conocido del string vacío', async () => {
    // SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    expect(await sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('es determinista', async () => {
    const a = await sha256Hex('hola');
    const b = await sha256Hex('hola');
    expect(a).toBe(b);
  });

  it('produce hashes distintos para entradas distintas', async () => {
    const a = await sha256Hex('1.2.3.4');
    const b = await sha256Hex('1.2.3.5');
    expect(a).not.toBe(b);
  });
});

describe('hashIp', () => {
  it('produce un hash de 64 chars hex', async () => {
    const h = await hashIp('192.168.1.1');
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it('mismo IP con misma sal → mismo hash', async () => {
    const a = await hashIp('192.168.1.1');
    const b = await hashIp('192.168.1.1');
    expect(a).toBe(b);
  });
});

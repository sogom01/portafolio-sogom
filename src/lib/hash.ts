/**
 * Hash SHA-256 hex de un string usando la Web Crypto API (disponible en
 * Vercel Edge y Node 18+). Sin dependencias externas.
 *
 * Uso: hashear la IP antes de loguearla. Con sal por entorno (no es la
 * misma cada despliegue) hacemos el log no-correlacionable con la IP en
 * claro. Cumplimiento GDPR mínimo: la IP es dato personal.
 */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hashea la IP con una sal del entorno. Si no hay sal configurada cae a
 * un valor por defecto, lo que es subóptimo pero no rompe el servicio.
 */
export async function hashIp(ip: string): Promise<string> {
  // process.env en prod, import.meta.env en dev (Astro/Vite).
  const salt = process.env.IP_HASH_SALT ?? import.meta.env.IP_HASH_SALT ?? 'dev-salt-change-me';
  return sha256Hex(`${salt}|${ip}`);
}

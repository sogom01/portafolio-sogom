/**
 * Rate limiter en memoria con ventana fija.
 *
 * Limitaciones conocidas:
 *  - Vive en el proceso: cada función serverless tiene su propio Map.
 *    En la práctica Vercel reusa instancias "calientes" así que mitiga
 *    spam de origen único razonablemente, pero un atacante distribuído
 *    lo evade.
 *  - Cuando lleguen clientes reales y volumen, migrar a Upstash Redis
 *    (tier gratuito) o al rate-limit nativo de Vercel.
 *
 * El argumento `now` es inyectable para tests deterministas.
 */
const store = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitOptions {
  /** Identificador del cliente (típicamente IP hasheada). */
  key: string;
  /** Número máximo de peticiones permitidas en la ventana. */
  max: number;
  /** Tamaño de la ventana en milisegundos. */
  windowMs: number;
  /** Inyección para tests; en producción usa Date.now. */
  now?: () => number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Segundos hasta el siguiente reset (para Retry-After header). */
  retryAfter: number;
}

export function rateLimit({
  key,
  max,
  windowMs,
  now = Date.now,
}: RateLimitOptions): RateLimitResult {
  const currentTime = now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= currentTime) {
    store.set(key, { count: 1, resetAt: currentTime + windowMs });
    return { allowed: true, remaining: max - 1, retryAfter: 0 };
  }

  if (entry.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - currentTime) / 1000),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: max - entry.count,
    retryAfter: 0,
  };
}

/** Solo para tests: limpiar el store entre casos. */
export function _resetRateLimitStore(): void {
  store.clear();
}

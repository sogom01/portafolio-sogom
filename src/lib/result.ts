/**
 * Discriminated union para errores tipados sin lanzar excepciones.
 *
 * El `throw` queda reservado para fallos verdaderamente excepcionales
 * (bug, OOM). Para fallos esperados (input inválido, API remota caída,
 * rate limit) se devuelve un Result. Esto fuerza al consumidor a manejar
 * el caso de error en tiempo de compilación.
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

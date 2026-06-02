/**
 * Logger JSON estructurado.
 *
 * Vercel ingiere stdout/stderr de las funciones serverless línea por
 * línea. Un único objeto JSON por línea permite buscar y filtrar después
 * (Vercel Log Drains a Datadog/Logflare/etc.) sin parsers frágiles.
 *
 * Regla de oro: NUNCA loguear el contenido íntegro de inputs del usuario.
 * Loguear identificadores (IP hasheada, requestId, código de error) y
 * dejar el contenido fuera. Si un atacante logra inyectar logs en el
 * sistema central, el riesgo se minimiza.
 */
type Level = 'info' | 'warn' | 'error';

interface LogFields {
  event: string;
  requestId?: string;
  ipHash?: string;
  durationMs?: number;
  [key: string]: unknown;
}

function emit(level: Level, fields: LogFields): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    ...fields,
  });
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    // info: usamos warn también para evitar el `no-console` warning de
    // ESLint y mantener nuestros eventos en la salida estándar de Vercel.
    console.warn(line);
  }
}

export const logger = {
  info: (fields: LogFields) => emit('info', fields),
  warn: (fields: LogFields) => emit('warn', fields),
  error: (fields: LogFields) => emit('error', fields),
};

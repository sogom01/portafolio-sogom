/**
 * Escape HTML mínimo para incrustar texto controlado por el usuario en
 * un body HTML de email.
 *
 * NO es un sanitizer de HTML completo (no permite NADA de HTML). Si en
 * el futuro quisieras permitir `<b>` o `<em>` controlados, sustituye por
 * DOMPurify o sanitize-html. Aquí preferimos cero HTML: el mensaje de
 * contacto no necesita formato y un cero-HTML es el contrato más seguro.
 */
export function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Reemplaza saltos de línea por <br> después de escapar HTML.
 * Útil para que un mensaje multilínea se vea bien en clientes HTML.
 */
export function escapeHtmlMultiline(input: string): string {
  return escapeHtml(input).replaceAll('\n', '<br>');
}

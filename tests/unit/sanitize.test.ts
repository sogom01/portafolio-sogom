import { describe, it, expect } from 'vitest';
import { escapeHtml, escapeHtmlMultiline } from '../../src/lib/sanitize';

describe('escapeHtml', () => {
  it('escapa los 5 caracteres peligrosos', () => {
    expect(escapeHtml(`<script>alert("xss")</script>`)).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
  });

  it('escapa & antes que < para evitar doble-escape', () => {
    expect(escapeHtml('A & <b>')).toBe('A &amp; &lt;b&gt;');
  });

  it('escapa apóstrofo', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('devuelve string vacío para entrada vacía', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('no altera texto inocuo', () => {
    expect(escapeHtml('Hola mundo, qué tal')).toBe('Hola mundo, qué tal');
  });
});

describe('escapeHtmlMultiline', () => {
  it('reemplaza saltos de línea por <br> después de escapar', () => {
    expect(escapeHtmlMultiline('línea 1\nlínea 2')).toBe('línea 1<br>línea 2');
  });

  it('escapa y luego inserta <br> sin escapar el <br> mismo', () => {
    expect(escapeHtmlMultiline('<b>x</b>\ny')).toBe('&lt;b&gt;x&lt;/b&gt;<br>y');
  });
});

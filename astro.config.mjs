// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Modo "server" permite endpoints dinámicos.
  // Cada página estática se marca con `export const prerender = true`
  // en su frontmatter. Esto deja /api/contact como la única ruta
  // ejecutada en función serverless; el resto se sirve por CDN.
  output: 'server',

  adapter: vercel({
    // No añadimos trackers ni servicios extra: lo declaramos explícito
    // para que la decisión sea auditable.
    webAnalytics: { enabled: false },
    imageService: false,
  }),

  vite: {
    plugins: [tailwindcss()],
  },
});

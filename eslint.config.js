import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import security from 'eslint-plugin-security';
import noSecrets from 'eslint-plugin-no-secrets';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', '.astro/**', '.vercel/**', 'public/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,

  // TypeScript files — añadimos plugins de seguridad
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      security,
      'no-secrets': noSecrets,
    },
    rules: {
      ...security.configs.recommended.rules,
      'no-secrets/no-secrets': ['error', { tolerance: 4.5 }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Astro files — globals del navegador + reglas de seguridad
  {
    files: ['**/*.astro'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: { security },
    rules: {
      ...security.configs.recommended.rules,
    },
  },
);

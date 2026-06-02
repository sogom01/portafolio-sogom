import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts', 'src/logic/**/*.ts', 'src/services/**/*.ts'],

      // Excluimos archivos que no tiene sentido testear unitariamente:
      // - types.ts: declaraciones de tipo, sin código ejecutable
      // - index.ts: factoría que solo lee process.env y construye una clase
      // - resend.service.ts: wrapper del SDK de Resend (se testea via integración
      //   end-to-end con el endpoint, no aquí)
      // - logger.ts: wrapper trivial sobre console
      exclude: [
        '**/types.ts',
        'src/services/email/index.ts',
        'src/services/email/resend.service.ts',
        'src/lib/logger.ts',
      ],

      // Umbrales realistas para el estado actual del proyecto.
      // SUBIR estos números a medida que se añadan tests:
      //   - lines/statements → objetivo 80%
      //   - functions → objetivo 80%
      //   - branches → objetivo 75%
      thresholds: {
        lines: 75,
        statements: 75,
        functions: 70,
        branches: 65,
      },
    },
  },
});

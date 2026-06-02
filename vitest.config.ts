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
      // Endpoints (.ts en pages/api) los testeamos con un import directo
      // pero medimos cobertura solo en lib/logic/services que son código
      // puro y reusable.
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 75,
        branches: 70,
      },
    },
  },
});

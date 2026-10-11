// Config separada: o plugin da Cloudflare não roda dentro do Vitest.
// As regras de negócio são funções puras, então o runtime Node basta.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['worker/**/*.test.ts', 'src/**/*.test.ts'],
  },
});

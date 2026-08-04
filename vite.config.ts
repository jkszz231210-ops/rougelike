import { defineConfig } from 'vite';

export default defineConfig({
  base: '/rougelike/',
  build: {
    target: 'es2022',
    sourcemap: true
  }
});

import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist-desktop',
    lib: {
      entry: fileURLToPath(new URL('../src/desktop.ts', import.meta.url)),
      name: 'ShibaPet',
      formats: ['iife'],
      fileName: () => 'pet.js',
    },
  },
});

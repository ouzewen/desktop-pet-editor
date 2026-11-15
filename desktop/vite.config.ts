import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  build: {
    outDir: 'build/desktop',
    lib: {
      entry: fileURLToPath(new URL('../src/desktop.ts', import.meta.url)),
      name: 'DesktopPet',
      formats: ['iife'],
      fileName: () => 'pet.js',
    },
  },
});

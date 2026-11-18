import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { copyPublicAssets } from '../scripts/copy-public-assets.ts';

export default defineConfig({
  plugins: [copyPublicAssets()],
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

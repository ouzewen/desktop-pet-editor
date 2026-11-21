import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { copyPublicAssets } from '../scripts/copy-public-assets.ts';

import { pixel80DesktopAssets } from '../scripts/pixel80-desktop-assets.ts';

export default defineConfig(({ mode }) => ({
  plugins: [copyPublicAssets(), pixel80DesktopAssets(mode === 'cat-pixel80')],
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
}));

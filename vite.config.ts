import { defineConfig } from 'vite';
import { copyPublicAssets } from './scripts/copy-public-assets.ts';

export default defineConfig({
  plugins: [copyPublicAssets()],
  build: {
    outDir: 'build/web',
  },
});

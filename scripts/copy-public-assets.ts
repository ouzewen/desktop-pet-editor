import { cpSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { checkPetAssets } from './pet-asset-check.ts';

export function copyPublicAssets(): Plugin {
  let publicDir: string;
  let root: string;
  const privatePath = 'assets/cat/custom';
  return {
    name: 'copy-pet-public-assets',
    apply: 'build',
    config: () => ({ build: { copyPublicDir: false } }),
    configResolved(config) { ({ root, publicDir } = config); },
    buildStart() {
      if (publicDir) checkPetAssets(root, publicDir);
    },
    writeBundle({ dir }) {
      if (!dir || !publicDir) return;
      const privateSource = resolve(publicDir, privatePath);
      // Clear any output left behind by an older build.
      rmSync(resolve(dir, privatePath), { recursive: true, force: true });
      cpSync(publicDir, dir, {
        recursive: true,
        filter: source => resolve(source) !== privateSource,
      });
    },
  };
}

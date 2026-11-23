import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { assetFiles, assetGroups, breedEyeGlints, calicoBodyOutlinePath, catMouthPath, catNosePath, frontTyping, frontTypingEffectsPath,
  mouthSkinPath, orangeBodyOutlinePath, orangeForelegBodyPath, orangePath, orangePawsBodyPath, orangeSquareGlints, tailPath, typingAtlases, typingEffectPath } from '../src/pet-assets.ts';
import { checkPng } from './pet-asset-check.ts';

const groups = new Set([
  'cat.orange.base', 'cat.breed.CC11', 'cat.listening', 'cat.shredder', 'cat.zip', 'cat.convert',
  'cat.ear-masks', 'cat.tails.shared', 'cat.calico-crown', 'cat.calico-face-finish',
  'cat.face-fur', 'cat.body-patterns',
  ...assetGroups.filter(group => group.usage === 'current'
    && /^cat\.(ear\.|accessory\.|photo-part\.|forehead\.)/.test(group.id)).map(group => group.id),
  ...['CC02', 'CC03', 'CC04', 'CC05', 'CC06', 'CC07', 'CC08'].map(id => 'cat.breed.' + id),
]);
const shared = new Set([
  orangePath + 'eye_glints', breedEyeGlints,
  catNosePath + 'NO05', ...['CN06', 'CN07', 'CN08'].map(id => catMouthPath + id), mouthSkinPath,
  typingEffectPath + 'orange_eye_patch', typingAtlases['reference-v2'].path + 'effort_eyes',
  tailPath + 'idle_remove', tailPath + 'typing_remove',
  frontTyping.path + 'laptop', frontTyping.path + 'paws',
  ...['gentle', 'fast', 'frenzy', 'paws', 'heat', 'air', 'sparks', 'steam', 'sweat']
    .map(part => frontTypingEffectsPath + part),
]);
const previousFiles = assetGroups.flatMap(group => group.files.filter(file => groups.has(group.id) || shared.has(file.key)));
const faceGroups = new Set(['cat.face-parts', 'cat.noses', 'cat.centered-noses', 'cat.mouths', 'cat.mouths.historical-cn05']);
const blinkEyes = /\/eye_Y02$/;
const previousKeys = new Set(previousFiles.map(file => file.key));
const additions = assetGroups.flatMap(group => group.files.filter(file => !previousKeys.has(file.key) &&
  (file.key === calicoBodyOutlinePath || file.key === orangeForelegBodyPath || file.key === orangePawsBodyPath || file.key === orangeBodyOutlinePath || file.key === orangeSquareGlints || group.id.startsWith('cat.ear-retouch.') || group.id.startsWith('cat.body-outline.') || (group.id.startsWith('cat.resting-30.') || group.id.startsWith('cat.component-recipes')) || group.id === 'cat.li-hua-coat' || group.id.startsWith('cat.li-hua-coat.') || group.id === 'cat.pet-love' || faceGroups.has(group.id) || group.id.startsWith('cat.face-edges.') || (group.usage === 'compatibility' && blinkEyes.test(file.key)))));
const heat = frontTypingEffectsPath + 'heat';

export function pixel80DesktopAssets(preview: boolean): Plugin {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const source = join(root, preview ? 'output/cat-pixel80/assets' : 'desktop/assets-pixel80');
  const previous = join(root, 'desktop/assets-pixel80-v1');
  const render = join(root, 'src/render.ts');
  const legacy = render + '?legacy-cat-art';
  const firstPixel80 = render + '?first-pixel80-cat-art';
  const files = [...previousFiles, ...additions];
  return {
    name: 'pixel80-desktop-art',
    enforce: 'pre',
    config: () => ({ define: { 'import.meta.env.VITE_PET_PIXEL80_KEYS': JSON.stringify(files.map(file => file.key)) } }),
    resolveId(id) {
      if (id === './cat-legacy-render') return legacy;
      if (id === './cat-pixel80-v1-render') return firstPixel80;
    },
    load(id) {
      if (id === legacy) return readFileSync(render, 'utf8').replace('import.meta.env.VITE_PET_PIXEL80_KEYS', 'undefined');
      if (id === firstPixel80) return readFileSync(render, 'utf8')
        .replace('import.meta.env.VITE_PET_PIXEL80_KEYS', JSON.stringify([...previousKeys]))
        .replace('const directory = ', `const directory = layer === ${JSON.stringify(heat)} ? 'assets-pixel80-v1' : `);
    },
    buildStart() {
      for (const file of files) checkPng(source, file);
      checkPng(previous, assetFiles.get(heat)!);
    },
    writeBundle({dir}) {
      if (!dir) throw Error('Desktop pixel art output directory is missing');
      for (const {key} of files) {
        const destination = join(dir, 'assets-pixel80', key + '.png');
        mkdirSync(dirname(destination), {recursive:true});
        copyFileSync(join(source, key + '.png'), destination);
      }
      const previousHeat = join(dir, 'assets-pixel80-v1', heat + '.png');
      mkdirSync(dirname(previousHeat), {recursive: true});
      copyFileSync(join(previous, heat + '.png'), previousHeat);
    },
  };
}

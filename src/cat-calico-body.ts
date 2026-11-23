import type { CatRenderConfig } from './cat';
import { furPatchParts, furPatchesFor } from './cat-fur-patches';
import { catPhotoParts } from './pet-assets';
import data from './cat-calico-body-palette.json';

type Palette = Record<keyof typeof data.markers, string>;
type RGB = readonly [number, number, number];

const bodyPalettes = new Map<string, Palette>([
  ['CC01/native', data.palettes.orange],
  ['CC04/native', data.palettes.siamese],
  ['CC03/native', data.palettes.calico],
  ['CC03/breed:CC10', data.palettes.CC10],
  ['CC03/breed:CC12', data.palettes.CC12],
]);

export function calicoBodyPalette(config: CatRenderConfig) {
  if (config.bodyBase === 'solid' || config.bodyPattern !== 'native' || config.tail !== 'CT05'
    || config.forelegPatternSource !== undefined && config.forelegPatternSource !== 'native'
    || furPatchParts.some(part => part !== 'head' && furPatchesFor(config.furPatches, part).length)
    || config.photoCoatParts?.some(part => ['torso', 'base'].includes(catPhotoParts[part].slot))) return;
  return bodyPalettes.get(config.palette + '/' + config.coat);
}

function rgb(hex: string): RGB {
  const color = Number.parseInt(hex, 16);
  return [color >>> 16, (color >>> 8) & 0xff, color & 0xff];
}

export function recolorCalicoBody(index: ImageData, palette: Palette) {
  const colors = new Map(Object.entries(data.markers).map(([name, hex]) =>
    [Number.parseInt(hex, 16), rgb(palette[name as keyof Palette])]));
  const pixels = index.data.slice();
  for (let i = 0; i < pixels.length; i += 4) {
    if (!pixels[i + 3]) continue;
    const marker = (pixels[i]! << 16) | (pixels[i + 1]! << 8) | pixels[i + 2]!;
    const fill = colors.get(marker);
    if (fill) pixels.set(fill, i);
  }
  return new ImageData(pixels, index.width, index.height);
}

export function recolorCalicoBodyPaws(painted: ImageData, original: ImageData, palette: Palette) {
  const base = rgb(palette['16 Socks - base']);
  const soft = rgb(palette['17 Socks - soft']);
  const shadow = rgb(palette['19 Socks - shadow']);
  // Keep the original cel's geometry and use its actual light/dark steps
  // for the moving toes. The existing action outline already fits the pose.
  for (let i = 0; i < painted.data.length; i += 4) {
    const raw = original.data;
    if (!raw[i + 3] || raw[i]! < 140) continue;
    const green = raw[i + 1]!;
    painted.data.set(green >= 245 ? base : green >= 225 ? soft : shadow, i);
  }
  return painted;
}

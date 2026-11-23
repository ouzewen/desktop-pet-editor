import type { CatRenderConfig } from './cat';
import { furPatchesFor } from './cat-fur-patches';
import { catPhotoParts } from './pet-assets';
import data from './cat-chin-palette.json';

type ToneMap = Readonly<Record<string, readonly string[]>>;
type Paint = (x: number, y: number, rgba: Uint8ClampedArray) => void;
type ChinCoat = { id: string; stock: boolean };

const stockIds = new Map([
  ['CC01/native', 'orange'], ['CC02/jetBlack', 'black'], ['CC02/breed:CC09', 'CC09'],
  ['CC02/breed:CC11', 'CC11'], ['CC03/native', 'calico'], ['CC03/breed:CC10', 'CC10'],
  ['CC03/breed:CC12', 'CC12'], ['CC04/native', 'siamese'], ['CC05/native', 'british_blue'],
  ['CC06/native', 'american_shorthair'], ['CC07/native', 'li_hua'], ['CC08/native', 'ragdoll'],
]);

export function chinCoat(config: CatRenderConfig, body: boolean): ChinCoat | undefined {
  // Authored pigment and user fur patches own their existing boundaries.
  const slot = body ? 'torso' : 'head';
  if (furPatchesFor(config.furPatches, slot).length
    || config.photoCoatParts?.some(part => catPhotoParts[part].slot === slot || catPhotoParts[part].slot === 'base')
    || (!body && (config.calicoCrown || config.calicoCrownTop || config.calicoFaceFinish))
    || config.whiteDistribution) return;
  const stockId = stockIds.get(config.palette + '/' + config.coat);
  const stock = stockId !== undefined && config.faceBase !== 'solid' && config.pattern === 'P00'
    && (config.cheekPattern ?? 'native') === 'native' && config.bodyBase !== 'solid'
    && config.bodyPattern === 'native';
  return { id: stockId ?? (config.palette === 'CC07' ? 'li_hua' : ''), stock };
}

function rgba(hex: string) {
  const color = Number.parseInt(hex, 16);
  return Uint8ClampedArray.of(color >>> 16, (color >>> 8) & 255, color & 255, 255);
}

const liHuaRestore = data.liHuaRestoredFur.map(([x, y, color]) => ({
  x: Number(x), y: Number(y), color: rgba(String(color)),
}));

const cell = ({ data, width }: ImageData, x: number, y: number) => {
  const index = (y * width + x) * 4;
  return data.subarray(index, index + 4);
};
const luminance = (color: ArrayLike<number>) => color[0]! * .25 + color[1]! * .65 + color[2]! * .1;
const shift = (color: Uint8ClampedArray, delta: number) =>
  Uint8ClampedArray.of(color[0]! + delta, color[1]! + delta, color[2]! + delta, 255);

export function paintCatChin(source: ImageData, guide: ImageData, coat: ChinCoat, body: boolean, paint: Paint) {
  const palette = (data.palettes as Readonly<Record<string, ToneMap>>)[coat.id];
  if (coat.stock && (coat.id === 'calico' || coat.id === 'CC12')) return;
  if (coat.id === 'li_hua') {
    for (const { x, y, color } of liHuaRestore) {
      if (body && y < 43) continue;
      const old = cell(source, x, y);
      if (old[3] !== 255) continue;
      if (coat.stock) paint(x, y, color);
      else {
        // Sample the surrounding fur on the same side of the removed band.
        const edgeY = body || y >= 43 ? 47 : 38;
        const donor = cell(source, x, edgeY);
        if (donor[3] === 255 && luminance(donor) > luminance(old) + 4) paint(x, y, donor);
      }
    }
  }
  if (body) return;
  for (let y = 39; y <= 43; y++) {
    for (let x = 17; x <= 57; x++) {
      const marker = cell(guide, x, y);
      const old = cell(source, x, y);
      if (!marker[3] || old[3] !== 255) continue;
      const deep = marker[0] === 216;
      if (coat.stock && coat.id === 'li_hua') {
        paint(x, y, rgba(deep ? '977A64' : 'A78B74'));
        continue;
      }
      const rgb = ((old[0]! << 16) | (old[1]! << 8) | old[2]!).toString(16).padStart(6, '0').toUpperCase();
      const selected = coat.stock && palette?.[rgb]?.[Number(deep)];
      if (selected) {
        paint(x, y, rgba(selected));
        continue;
      }
      const left = cell(source, x - 1, y);
      const right = cell(source, x + 1, y);
      const above = cell(source, x, y - 1);
      const light = luminance(old);
      // Keep the silhouette and the dark side of a sharp existing mark.
      if (!left[3] || !right[3] || !above[3] || light + 22 < Math.max(luminance(left), luminance(right), luminance(above))) continue;
      const amount = Math.min(deep ? 13 : 7, Math.max(1, Math.floor(light * .07)));
      paint(x, y, shift(old, -amount));
    }
  }
}

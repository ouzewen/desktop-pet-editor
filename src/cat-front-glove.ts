import { hasHoneyGoldFur, type CatRenderConfig } from './cat';
import { furPatchesFor } from './cat-fur-patches';
import { catPhotoParts } from './pet-assets';

// Exported marker colors in front-glove.aseprite. Each side uses the same
// color roles, and the authoring source owns the cuff geometry.
const sleeveMarker = 0xdc8d58;
const sleeveStepMarker = 0xd29a52;
const shadeMarker = 0x7da3bc;
const paws = [
  { mirror: false, foreleg: 'leftForeleg', paw: 'leftPaw' },
  { mirror: true, foreleg: 'rightForeleg', paw: 'rightPaw' },
] as const;

type Pixel = Uint8ClampedArray;

function rgbAt(data: Pixel, offset: number) {
  return (data[offset]! << 16) | (data[offset + 1]! << 8) | data[offset + 2]!;
}

export function hasNativeFrontGloves(config: CatRenderConfig) {
  return (config.forelegPatternSource ?? 'native') === 'native'
    && !config.photoCoatParts?.some(part => ['torso', 'base'].includes(catPhotoParts[part].slot));
}

function continuousSleeveTint(config: CatRenderConfig) {
  // On these presets the chest-colored forearm runs into a same-color cuff.
  // Separate the two using an existing fur tone from that coat.
  if (config.coat === 'jetBlack') return 0x151416;
  if (config.coat === 'breed:CC09') return 0xedebea;
  if (config.coat === 'breed:CC12') return 0xf7f3ee;
  if (config.coat === 'breed:CC10') return 0x34282a;
  if (config.palette === 'CC03' && config.coat === 'native') return 0xe7e6e9;
}

export function paintFrontGloves(source: ImageData, guide: ImageData, config: CatRenderConfig,
  paint: (x: number, y: number, color: Pixel) => void,
) {
  const { data, width } = source;
  const markers = guide.data;
  const solidCoat = config.coat === 'jetBlack' || config.coat === 'breed:CC09';
  const tint = config.bodyBase === 'solid' ? undefined : continuousSleeveTint(config);
  // Only use a tint if it is in this exact rendering's palette. This also
  // keeps alternative colorways and other fur choices on their own pigments.
  const hasTint = tint !== undefined && data.some((value, offset) =>
    offset % 4 === 0 && value === tint >>> 16 && data[offset + 3] === 255 && rgbAt(data, offset) === tint);
  const sleeve = hasTint && tint !== undefined
    ? new Uint8ClampedArray([tint >>> 16, tint >>> 8 & 255, tint & 255, 255]) : undefined;
  for (const { mirror, foreleg, paw } of paws) {
    if (furPatchesFor(config.furPatches, foreleg).length || furPatchesFor(config.furPatches, paw).length) continue;
    const column = (x: number) => mirror ? 75 - x : x;
    const offsetAt = (x: number, y: number) => (y * width + column(x)) * 4;
    const color = (x: number, y: number) => {
      const start = offsetAt(x, y);
      return data.subarray(start, start + 4);
    };
    const main = color(32, 69);
    const edge = color(29, 70);
    let shadow = color(30, 70);
    if (rgbAt(main, 0) === rgbAt(shadow, 0) && hasHoneyGoldFur(config)) shadow = color(31, 66);
    if (!main[3]) continue;
    for (let y = 0; y < guide.height; y++) {
      for (let x = 0; x < 38; x++) {
        const offset = offsetAt(x, y);
        if (markers[offset + 3] !== 255 || data[offset + 3] !== 255) continue;
        const pigment = rgbAt(data, offset);
        if (pigment === rgbAt(edge, 0)) continue; // existing structure ink
        const role = rgbAt(markers, offset);
        if (role === sleeveMarker || role === sleeveStepMarker) {
          const matchingGlove = pigment === rgbAt(main, 0) || pigment === rgbAt(shadow, 0);
          const nearbySolidFur = solidCoat && Math.abs(data[offset]! - main[0]!) <= 4
            && Math.abs(data[offset + 1]! - main[1]!) <= 4 && Math.abs(data[offset + 2]! - main[2]!) <= 4;
          if (!matchingGlove && !nearbySolidFur) continue;
          if (sleeve) {
            paint(column(x), y, sleeve);
          } else if (role === sleeveStepMarker) {
            const donor = color(x, y - 1);
            if (donor[3] === 255 && rgbAt(donor, 0) !== rgbAt(edge, 0)) paint(column(x), y, donor);
          }
        } else {
          const value = role === shadeMarker && shadow[3] === 255 ? shadow : main;
          if (rgbAt(value, 0) !== pigment) paint(column(x), y, value);
        }
      }
    }
  }
}

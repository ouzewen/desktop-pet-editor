import { catCoatSchemes, nativeCatFur, type CatConfig } from './cat';
import { bodyPatternChannel } from './cat-body-pattern';

type RGB = readonly [number, number, number];
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const colors = new Map<string, readonly [RGB, RGB, RGB]>();

function tones(config: CatConfig) {
  const key = `${config.palette}/${config.coat}`;
  const cached = colors.get(key);
  if (cached) return cached;
  const hex = config.coat === 'native' ? nativeCatFur[config.palette] : catCoatSchemes[config.coat].colors;
  const result = hex.map(value => {
    const number = Number.parseInt(value.slice(1), 16);
    return [number >>> 16, (number >>> 8) & 255, number & 255] as const;
  }) as unknown as readonly [RGB, RGB, RGB];
  colors.set(key, result);
  return result;
}

// The shared orange drawing distinguishes fur from eyes, mouth, nose,
// whiskers and the outline, independent of the selected breed's pigment.
function isFur(guide: Uint8ClampedArray, offset: number) {
  const red = guide[offset]!, green = guide[offset + 1]!, blue = guide[offset + 2]!;
  return !!guide[offset + 3] && red >= 140 && green >= 82 && red - green >= 24 && green - blue >= 16;
}

function furDepth(x: number, y: number) {
  const px = Math.floor(x / 2) * 2, py = Math.floor(y / 2) * 2;
  return 0.035 + 0.095 * clamp((Math.abs(px - 151) - 32) / 80)
    + 0.055 * clamp((py - 135) / 40);
}

export function clearForeheadFur(
  image: ImageData, guide: Uint8ClampedArray, region: Uint8ClampedArray, config: CatConfig,
) {
  const { data, width } = image;
  const [base, marking] = tones(config);
  // This is a separate piece of clean fur. Sampling an old stripe or point
  // at the boundary would stretch it into a new triangular marking.
  for (let offset = 0; offset < data.length; offset += 4) {
    if (!data[offset + 3] || !region[offset + 3] || !isFur(guide, offset)) continue;
    const depth = furDepth(offset / 4 % width, Math.floor(offset / 4 / width));
    for (let c = 0; c < 3; c++) data[offset + c] = base[c]! + (marking[c]! - base[c]!) * depth;
  }
}

export function paintForeheadFur(
  image: ImageData, guide: Uint8ClampedArray, region: Uint8ClampedArray,
  pattern: Uint8ClampedArray, config: CatConfig,
) {
  const [, marking, pale] = tones(config);
  const { data } = image;
  for (let offset = 0; offset < data.length; offset += 4) {
    if (!data[offset + 3] || !region[offset + 3] || !pattern[offset + 3] || !isFur(guide, offset)) continue;
    const dark = pattern[offset]! / 255, light = pattern[offset + 1]! / 255;
    const strength = Math.max(dark, light);
    for (let channel = 0; channel < 3; channel++) {
      const color = light > dark ? pale[channel]! : marking[channel]!;
      data[offset + channel] = data[offset + channel]! + (color - data[offset + channel]!) * strength;
    }
  }
}

export function paintHeadFur(
  image: ImageData, guide: Uint8ClampedArray, region: Uint8ClampedArray,
  pattern: Uint8ClampedArray | undefined, config: CatConfig, atlas?: Uint8ClampedArray,
) {
  if (config.bodyPattern === 'native') return;
  const [base, marking] = tones(config);
  const channel = config.bodyPattern === 'plain' ? 0 : bodyPatternChannel[config.bodyPattern];
  const { data, width } = image;
  for (let offset = 0; offset < data.length; offset += 4) {
    if (!data[offset + 3]) continue;
    const column = (offset / 4) % width, row = Math.floor(offset / 4 / width);
    if (atlas) {
      // Legacy mouth/nose cels include a narrow coat-colored fringe which
      // differs by breed. Keep their actual ink and pink tissue; the rest
      // is background fur, including the calico's baked white rim.
      const red = atlas[offset]!, green = atlas[offset + 1]!, blue = atlas[offset + 2]!;
      const ink = red < 145 && green < 70;
      const pink = red >= 110 && red > green * 1.25 && blue > green * 0.75;
      if (row < 88 && (ink || pink)) continue;
    } else if (!isFur(guide, offset)) continue;
    // Every atlas cell occupies the same mouth/nose rectangle on the head.
    const x = atlas ? 128 + column % 48 : column;
    const y = atlas ? 119 + row % 44 : row;
    const world = (y * 320 + x) * 4;
    if (!region[world + 3]) continue;
    const depth = furDepth(x, y);
    const ink = (pattern?.[world + channel] ?? 0) / 255;
    const shade = depth + (1 - depth) * ink;
    for (let c = 0; c < 3; c++) data[offset + c] = base[c]! + (marking[c]! - base[c]!) * shade;
  }
}

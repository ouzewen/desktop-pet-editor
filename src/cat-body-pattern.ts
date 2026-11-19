import { sittingForelegAt } from './cat-fur-patches';
import { catKeepsBreedPigment, catPatternFurColors, hasIndependentFur, hasShortCalicoChest, type CatRenderConfig } from './cat';

type RGB = readonly [number, number, number];

export const bodyPatternChannel = { mackerel: 0, classic: 1, spotted: 2 } as const;

// Green levels for the outline cutoff, main stripe and faded stripe edge in
// the original tabby cels. Solid and point coats have no separate stripe layer.
const nativeStripeGreen: Partial<Record<CatRenderConfig['palette'], readonly [number, number, number]>> = {
  CC01: [82, 128, 158],
  CC02: [51, 64, 69],
  CC06: [116, 151, 183],
  CC07: [51, 84, 112],
};

export function usesNativeBodyStripes(config: CatRenderConfig) {
  return config.bodyBase === 'solid' && config.bodyPattern === 'native'
    && hasIndependentFur(config.furPatternColors);
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));
function fromHex(hex: string): RGB {
  const value = Number.parseInt(hex.slice(1), 16);
  return [value >>> 16, (value >>> 8) & 255, value & 255];
}

export function usesBodyPattern(config: CatRenderConfig): boolean {
  return config.bodyBase === 'solid'
    || (config.bodyPattern !== 'native' && (config.bodyPattern !== 'plain' || !catKeepsBreedPigment(config)));
}

// Shade the existing local pigment so one marking can cross multiple coat
// colors without flooding the underlying color regions.
export function breedPatternShade(config: CatRenderConfig) {
  const [baseHex, markingHex] = catPatternFurColors(config);
  const base = fromHex(baseHex), marking = fromHex(markingHex);
  return base.map((channel, index) => Math.min(1, marking[index]! / Math.max(1, channel)));
}

export function shadeBreedPattern(data: Uint8ClampedArray, offset: number, shade: readonly number[], ink: number) {
  for (let c = 0; c < 3; c++) data[offset + c] = data[offset + c]! * (1 - (1 - shade[c]!) * ink);
}

export function isLaptopFur(red: number, green: number, blue: number) {
  return red >= 148 && red - green > 32 && green - blue > 19;
}

export const calicoChestBounds = { left: 102, right: 201, top: 174, bottom: 216 } as const;

function paintShortCalicoChest(image: ImageData, original: Uint8ClampedArray, pale: RGB, nativeCoat: boolean) {
  const { data, width } = image;
  const { left, right, top, bottom } = calicoChestBounds;
  const center = 151;
  for (let y = top; y < bottom; y++) {
    const row = Math.floor((y - top) / 2) * 2;
    const depth = row / (bottom - top);
    const sourceY = 176 + Math.floor(row * 0.75 / 2) * 2;
    const taper = 1 - 0.88 * depth ** 1.5;
    for (let x = left; x <= right; x++) {
      const offset = (y * width + x) * 4;
      const sourceX = center + Math.round((x - center) / taper);
      if (!data[offset + 3] || sourceX < left || sourceX > right) continue;
      const sample = (sourceY * width + sourceX) * 4;
      const red = original[sample]!, green = original[sample + 1]!, blue = original[sample + 2]!;
      if (!original[sample + 3] || Math.min(red, green, blue) < 174 || Math.max(red, green, blue) - Math.min(red, green, blue) > 32) continue;
      // Reuse the white chest paint and its stepped edge, compressed to a
      // short bib. Keep the last few steps slightly warmer against the torso.
      const strength = 1 - 0.13 * depth ** 3;
      const fur = nativeCoat ? [red, green, blue] : pale;
      for (let c = 0; c < 3; c++) data[offset + c] = data[offset + c]! + (fur[c]! - data[offset + c]!) * strength;
    }
  }
}

export function paintBodyPattern(
  image: ImageData,
  guide: Uint8ClampedArray,
  pattern: Uint8ClampedArray | undefined,
  config: CatRenderConfig,
  typing: boolean,
  laptopOnly = false,
  original?: Uint8ClampedArray,
) {
  if (!usesBodyPattern(config)) return;
  const solid = config.bodyBase === 'solid';
  const pigmentShade = !solid && catKeepsBreedPigment(config) ? breedPatternShade(config) : undefined;
  const colors = catPatternFurColors(config);
  const nativeStripes = usesNativeBodyStripes(config) ? nativeStripeGreen[config.palette] : undefined;
  const base = fromHex(colors[0]), marking = fromHex(colors[1]), pale = fromHex(colors[2]);
  const channel = config.bodyPattern === 'native' || config.bodyPattern === 'plain' ? 0 : bodyPatternChannel[config.bodyPattern];
  const paleChest = !solid && config.palette !== 'CC02';
  const { data, width } = image;
  const splitForelegs = config.forelegPatternSource === 'separate' && !typing;

  for (let offset = 0; offset < data.length; offset += 4) {
    if (!data[offset + 3] || !(guide[offset + 3] || original?.[offset + 3])) continue;
    const red = guide[offset]!, green = guide[offset + 1]!, blue = guide[offset + 2]!;
    if (laptopOnly && !isLaptopFur(red, green, blue)) continue;
    const fur = red >= 140 && green >= 82 && red - green >= 24 && green - blue >= 16;
    const white = red >= 174 && green >= 155 && red - blue <= 56;
    // Include breed fur that extends slightly past the shared orange guide,
    // especially the calico's charcoal patches and pale paw-edge pixels.
    const r = original?.[offset] ?? 0, g = original?.[offset + 1] ?? 0, b = original?.[offset + 2] ?? 0;
    const basePigment = solid && ((g >= 37 && Math.abs(r - g) <= 20 && Math.abs(g - b) <= 15)
      || (r >= 160 && g >= 145 && b >= 130));
    if (!fur && !white && !basePigment) continue;

    const column = offset / 4 % width, row = Math.floor(offset / 4 / width);
    let ink = (pattern?.[offset + channel] ?? 0) / 255;
    if (nativeStripes && original?.[offset + 3]) {
      const [outlineCutoff, stripe, edge] = nativeStripes;
      if (g >= outlineCutoff) ink = clamp((edge - g) / (edge - stripe));
    }
    if (splitForelegs && sittingForelegAt(column, row)) ink = 0;
    if (pigmentShade) {
      if (ink) shadeBreedPattern(data, offset, pigmentShade, ink);
      continue;
    }

    if (white && paleChest && !fur) {
      if (config.coat === 'native' && config.palette === 'CC01') continue;
      const shade = 0.18 * (1 - clamp((green - 168) / 80));
      for (let c = 0; c < 3; c++) data[offset + c] = pale[c]! + (marking[c]! - pale[c]!) * shade;
      continue;
    }
    const x = Math.floor((offset / 4 % width) / 2) * 2;
    const y = Math.floor(offset / 4 / width / 2) * 2;
    // Shade the clean fur by body position so the old pigment does not show through.
    const depth = 0.04 + 0.13 * clamp((y - (typing ? 157 : 200)) / 79)
      + 0.12 * clamp((Math.abs(x - 151) - 52) / 75);
    const shade = depth + (1 - depth) * ink;
    for (let c = 0; c < 3; c++) data[offset + c] = base[c]! + (marking[c]! - base[c]!) * shade;
  }
  // Reconstruct saved pixel-editor bases from the short-white-chest preview.
  if (!typing && original && hasShortCalicoChest(config)) paintShortCalicoChest(image, original, pale, config.coat === 'native');
}

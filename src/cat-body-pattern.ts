import { catCoatSchemes, nativeCatFur, type CatConfig } from './cat';

type RGB = readonly [number, number, number];

export const bodyPatternChannel = { mackerel: 0, classic: 1, spotted: 2 } as const;

export const bodyPatternLayers = [
  'body', 'typing_body',
  ...['gentle', 'fast'].flatMap(mode => Array.from({ length: 4 }, (_, i) => `typing_arms_${mode}_${i}`)),
  ...Array.from({ length: 3 }, (_, i) => `typing_front_${i}`),
];

const clamp = (value: number) => Math.max(0, Math.min(1, value));
function fromHex(hex: string): RGB {
  const value = Number.parseInt(hex.slice(1), 16);
  return [value >>> 16, (value >>> 8) & 255, value & 255];
}

export function isLaptopFur(red: number, green: number, blue: number) {
  return red >= 148 && red - green > 32 && green - blue > 19;
}

export function paintBodyPattern(
  image: ImageData,
  guide: Uint8ClampedArray,
  pattern: Uint8ClampedArray | undefined,
  config: CatConfig,
  typing: boolean,
  laptopOnly = false,
) {
  if (config.bodyPattern === 'native') return;
  const colors = config.coat === 'native' ? nativeCatFur[config.palette] : catCoatSchemes[config.coat].colors;
  const base = fromHex(colors[0]), marking = fromHex(colors[1]), pale = fromHex(colors[2]);
  const channel = config.bodyPattern === 'plain' ? 0 : bodyPatternChannel[config.bodyPattern];
  const paleChest = config.palette !== 'CC02';
  const { data, width } = image;

  for (let offset = 0; offset < data.length; offset += 4) {
    if (!data[offset + 3] || !guide[offset + 3]) continue;
    const red = guide[offset]!, green = guide[offset + 1]!, blue = guide[offset + 2]!;
    if (laptopOnly && !isLaptopFur(red, green, blue)) continue;
    const fur = red >= 140 && green >= 82 && red - green >= 24 && green - blue >= 16;
    const white = red >= 174 && green >= 155 && red - blue <= 56;
    if (!fur && !white) continue;

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
    const ink = (pattern?.[offset + channel] ?? 0) / 255;
    const shade = depth + (1 - depth) * ink;
    for (let c = 0; c < 3; c++) data[offset + c] = base[c]! + (marking[c]! - base[c]!) * shade;
  }
}

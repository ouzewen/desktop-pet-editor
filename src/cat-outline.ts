import { catCoatSchemes, type CatConfig } from './cat';

export type OutlineVersion = 'adaptive' | 'original';

const outlineColors = new Map<string, readonly number[]>();

function outlineColor(coat: Exclude<CatConfig['coat'], 'native'>) {
  const cached = outlineColors.get(coat);
  if (cached) return cached;
  // Use the marking pigment's hue, with enough depth to separate both pale
  // fur and darker patches. Light coats get a softer line automatically.
  const hex = Number.parseInt(catCoatSchemes[coat].colors[1].slice(1), 16);
  const color = [hex >>> 16, (hex >>> 8) & 255, hex & 255].map(channel => Math.round(channel * 0.58));
  outlineColors.set(coat, color);
  return color;
}

export function recolorCatOutline(
  image: ImageData, guide: Uint8ClampedArray, config: CatConfig, head = false,
) {
  if (config.coat === 'native') return;
  const color = outlineColor(config.coat);
  const { data, width } = image;
  for (let offset = 0; offset < data.length; offset += 4) {
    if (!data[offset + 3] || !guide[offset + 3]) continue;
    // Classify the original orange drawing, never the recolored result:
    // a dark fur patch or pupil is not an outline just because it is dark.
    const red = guide[offset]!, green = guide[offset + 1]!, blue = guide[offset + 2]!;
    if (red > 140 || green > 78 || blue > 74) continue;
    if (head) {
      const x = offset / 4 % width, y = Math.floor(offset / 4 / width);
      // The face keeps its own ink and independent pupil colors. The
      // head source includes baked eyes/mouth underneath the face layers.
      if (y >= 92 && y <= 143 && ((x >= 87 && x <= 132) || (x >= 168 && x <= 215))) continue;
      if (x >= 126 && x <= 178 && y >= 117 && y <= 164) continue;
    }
    data.set(color, offset);
  }
}

import { catCoatColors, type CatRenderConfig } from './cat';

export type OutlineVersion = 'adaptive' | 'original';

const outlineColors = new Map<string, readonly number[]>();

function isOutline(guide: Uint8ClampedArray, offset: number) {
  return guide[offset + 3] && guide[offset]! <= 140 && guide[offset + 1]! <= 78 && guide[offset + 2]! <= 74;
}

function outlineColor(coat: Exclude<CatRenderConfig['coat'], 'native'>) {
  const cached = outlineColors.get(coat);
  if (cached) return cached;
  // Use the marking pigment's hue, with enough depth to separate both pale
  // fur and darker patches. Light coats get a softer line automatically.
  const hex = Number.parseInt(catCoatColors(coat)[1].slice(1), 16);
  const color = [hex >>> 16, (hex >>> 8) & 255, hex & 255].map(channel => Math.round(channel * 0.58));
  outlineColors.set(coat, color);
  return color;
}

export function recolorCatOutline(
  image: ImageData, guide: Uint8ClampedArray, config: CatRenderConfig, head = false,
) {
  if (config.coat === 'native') return;
  const color = outlineColor(config.coat);
  const { data, width } = image;
  for (let offset = 0; offset < data.length; offset += 4) {
    // Classify the original orange drawing, never the recolored result:
    // a dark fur patch or pupil is not an outline just because it is dark.
    if (!data[offset + 3] || !isOutline(guide, offset)) continue;
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

export function clearForeheadOutlineSpots(image: ImageData, guide: Uint8ClampedArray) {
  const { data, width } = image;
  const offset = (x: number, y: number) => (y * width + x) * 4;
  // The two valleys where the ears reach the crown have extra ink below
  // the outer contour. Preserve three rows at the silhouette on every ear.
  for (const [left, right] of [[115, 131], [170, 186]] as const) {
    for (let x = left; x <= right; x++) {
      for (let y = 52; y <= 58; y++) {
        const pixel = offset(x, y);
        if (!isOutline(guide, pixel) || !data[pixel + 3] || !data[offset(x, y - 3) + 3]
          || !data[offset(x - 2, y - 1) + 3] || !data[offset(x + 2, y - 1) + 3]) continue;
        // Copy the coat under this column so split and point-color coats
        // retain their local pigment at the ear seam.
        let sample = offset(x, y + 1);
        while (sample <= offset(x, 61) && isOutline(guide, sample)) sample += width * 4;
        if (data[sample + 3]) data.set(data.subarray(sample, sample + 3), pixel);
      }
    }
  }
}

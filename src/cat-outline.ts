import { catCoatColors, type CatRenderConfig } from './cat';

export type OutlineVersion = 'adaptive' | 'original';

type OutlineInk = readonly [number, number, number];
const outlineColors = new Map<string, OutlineInk>();

export function isOutline(guide: Uint8ClampedArray, offset: number) {
  return guide[offset + 3] && guide[offset]! <= 140 && guide[offset + 1]! <= 78 && guide[offset + 2]! <= 74;
}

function outlineColor(coat: Exclude<CatRenderConfig['coat'], 'native'>) {
  const cached = outlineColors.get(coat);
  if (cached) return cached;
  // Use the marking pigment's hue, with enough depth to separate both pale
  // fur and darker patches. Light coats get a softer line automatically.
  const hex = Number.parseInt(catCoatColors(coat)[1].slice(1), 16);
  const shade = (channel: number) => Math.round(channel * 0.58);
  const color: OutlineInk = [shade(hex >>> 16), shade((hex >>> 8) & 255), shade(hex & 255)];
  outlineColors.set(coat, color);
  return color;
}

// Ink sampled from the approved 80 px front sources. Shared props such as
// the laptop keep their own pigments; only cat fur parts use this table.
const pixel80BreedInk = {
  CC01: [58, 30, 19],
  CC02: [32, 27, 30],
  CC03: [62, 34, 29],
  CC04: [57, 36, 30],
  CC05: [46, 49, 60],
  CC06: [55, 52, 55],
  CC07: [62, 39, 24],
  CC08: [78, 49, 36],
} as const satisfies Record<CatRenderConfig['palette'], OutlineInk>;

export const pixel80CalicoDarkInk = [39, 33, 32] as const;

const pixel80CoatInk: Partial<Record<CatRenderConfig['coat'], { base: OutlineInk; warm?: OutlineInk }>> = {
  'breed:CC09': { base: [112, 112, 119] },
  'breed:CC10': { base: [41, 30, 34], warm: [69, 41, 30] },
  'breed:CC11': { base: [84, 55, 37] },
  'breed:CC12': { base: [83, 93, 112], warm: [112, 79, 62] },
};

export function pixel80CatOutline(config: Pick<CatRenderConfig, 'palette' | 'coat'>): OutlineInk {
  return config.coat === 'native' ? pixel80BreedInk[config.palette]
    : pixel80CoatInk[config.coat]?.base ?? outlineColor(config.coat);
}

export function pixel80WarmOutline(coat: CatRenderConfig['coat']) {
  return pixel80CoatInk[coat]?.warm;
}

function hasWarmFur(data: Uint8ClampedArray, offset: number) {
  const r = data[offset]!, g = data[offset + 1]!, b = data[offset + 2]!;
  return r - g > 22 && g - b > 12;
}

export function recolorCatOutline(
  image: ImageData, guide: Uint8ClampedArray, config: CatRenderConfig, head = false, charcoal?: Uint8ClampedArray,
  pixel80 = false, additionalInk?: Uint8ClampedArray,
) {
  if (config.coat === 'native') return;
  const color = pixel80 ? pixel80CatOutline(config) : outlineColor(config.coat);
  const warm = pixel80 ? pixel80WarmOutline(config.coat) : undefined;
  const { data, width, height } = image;
  const coat = warm ? data.slice() : undefined;
  // Use adjacent fur one coarse pixel inward to keep the dark and orange
  // sides of split coats distinct, including through changes of ear shape.
  const steps = [[-4, 0], [4, 0], [0, -4], [0, 4]] as const;
  for (let offset = 0; offset < data.length; offset += 4) {
    // Classify the original orange drawing, never the recolored result:
    // a dark fur patch or pupil is not an outline just because it is dark.
    if (!data[offset + 3]) continue;
    // Some charcoal limb lines sit outside the corresponding orange lines.
    // Soften any original ink still visible after the white fur was painted.
    const charcoalInk = charcoal?.[offset + 3] && charcoal[offset + 1]! < 49
      && data[offset + 1]! < color[1]!;
    const extraInk = additionalInk?.[offset + 3] && data[offset + 1]! < 36;
    if (!isOutline(guide, offset) && !charcoalInk && !extraInk) continue;
    if (head) {
      const x = offset / 4 % width, y = Math.floor(offset / 4 / width);
      // The face keeps its own ink and independent pupil colors. The
      // head source includes baked eyes/mouth underneath the face layers.
      if (y >= 92 && y <= 143 && ((x >= 87 && x <= 132) || (x >= 168 && x <= 215))) continue;
      if (x >= 126 && x <= 178 && y >= 117 && y <= 164) continue;
    }
    let ink = color;
    if (coat && warm) {
      const x = offset / 4 % width, y = Math.floor(offset / 4 / width);
      let warmCount = 0, furCount = 0;
      for (const [dx, dy] of steps) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const neighbor = (ny * width + nx) * 4;
        if (!coat[neighbor + 3] || isOutline(guide, neighbor)) continue;
        furCount++;
        if (hasWarmFur(coat, neighbor)) warmCount++;
      }
      if (warmCount && 2 * warmCount > furCount) ink = warm;
    }
    data.set(ink, offset);
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

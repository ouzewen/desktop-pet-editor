// Native CC07 pigments shared by the drawn fur, tail and moving forepaws.
export const liHuaFur = {
  ink: [64, 53, 45],
  base: [166, 141, 114],
  shadow: [142, 120, 100],
  warm: [182, 155, 127],
  toe: [164, 138, 114],
  stripe: [87, 71, 58],
  tip: [72, 60, 50],
} as const;

const { ink, base, shadow, warm, toe } = liHuaFur;

// Replace the baked CC07 pigments on their own fur layers. The face's pink
// lining and baked eye pigments are retained until the normal expression pass.
export function toneLiHuaFur(image: ImageData, face: boolean, customEars?: (pixel: number) => boolean) {
  const { data, width } = image;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3] || customEars?.(i)) continue;
    const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
    const y = i / 4 / width / 4;
    const brown = r - g >= 12 && g - b >= 7;
    if ((!face || y >= 40) && b >= 198 && r >= g - 3 && r - b <= 25) {
      data.set(y >= 62 ? (b >= 240 ? toe : shadow) : base, i);
    } else if (brown && r <= 96) {
      data.set(ink, i);
    } else if (brown) {
      // In the inner face and torso, the authored stripes replace the former
      // copper marks. The ear tips retain their original shape and shade steps.
      const tone = face && y < 18 && r < 151 ? shadow
        : r > 197 ? warm : (!face && r > 140 && g < 112) ? shadow : base;
      data.set(tone, i);
    }
  }
}

// Medians sampled from the generated reference's left cat. Keep previous
// palettes above for exact reconstruction of v13–v15 artwork.
export const liHuaReferenceFur = {
  ink: [49, 32, 23],
  base: [139, 116, 98],
  shadow: [144, 121, 103],
  warm: [178, 152, 126],
  toe: [195, 168, 140],
  stripe: [65, 47, 39],
  tip: [69, 51, 42],
  iris: '#2C1D16',
  rim: [246, 239, 230],
  glint: '#F6DEC3',
  nose: [197, 130, 115],
  noseShadow: [194, 125, 112],
  line: '#312017',
} as const;

export type LiHuaStyle = boolean | 'reference';
export const liHuaPigments = (style: LiHuaStyle) => style === 'reference' ? liHuaReferenceFur : liHuaFur;

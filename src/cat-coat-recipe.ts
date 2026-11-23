import { catCoatColors, type CatCoatScheme } from './cat';

export const coatPart = {
  leftEar: 1, rightEar: 2, leftEye: 3, rightEye: 4, nose: 5, mouth: 6, tail: 7,
} as const;

const pigment = { fur: 1, outline: 2, feature: 3, featureInk: 4 } as const;

type Color = readonly [number, number, number];
type Anchors = {
  // Native reference swatches, ordered from shadow to main to high fur.
  fur: readonly [number, number, number];
  outline: readonly number[];
  split?: { warm: number; dark: number };
};

const swatches = {
  black: { fur: [0x151416, 0x19181a, 0x333236], outline: [0x0a0a0b, 0x413945] },
  CC09: { fur: [0xedebea, 0xf4f2ef, 0xfdfdfd], outline: [0x707077] },
  orange: { fur: [0xd07645, 0xf2ad6c, 0xfdfdfd], outline: [0x3a1e13, 0x68402a] },
  british_blue: { fur: [0x717376, 0x95999f, 0xfdfdfd], outline: [0x2e313c, 0x434954] },
  american_shorthair: { fur: [0x919398, 0xc4c5c8, 0xfdfdfd], outline: [0x373437, 0x4a464c] },
  CC11: { fur: [0xcb9053, 0xe1b36e, 0xf9e2b7], outline: [0x543725, 0x664831] },
  siamese: { fur: [0x6e472c, 0xfdf3e1, 0xfdfdfd], outline: [0x39241e, 0x51382b, 0x341d0f] },
  ragdoll: { fur: [0xc69064, 0xfae8cb, 0xfdfdfd], outline: [0x4e3124, 0x634636, 0x381c11] },
  li_hua: { fur: [0x523e33, 0x907967, 0xc3a88c], outline: [0x312017, 0x3e2718] },
  CC10: { fur: [0x362d2d, 0xaf6a3a, 0xd9a64c], outline: [0x291e22, 0x45291e, 0x4c3840, 0x68412f],
    split: { warm: 0xaf6a3a, dark: 0x362d2d } },
  calico: { fur: [0x393433, 0xf2a45f, 0xfdfdfd], outline: [0x272120, 0x3e221d, 0x594036, 0x674235, 0x381c11],
    split: { warm: 0xf2a45f, dark: 0x393433 } },
  CC12: { fur: [0x63666f, 0xe1c3a6, 0xfffaf3], outline: [0x535d70, 0x704f3e, 0x765947, 0x566173],
    split: { warm: 0xe1c3a6, dark: 0x63666f } },
} as const satisfies Record<string, Anchors>;

export type CatCoatRecipeId = keyof typeof swatches;
export type RecipeCoat = Exclude<CatCoatScheme, 'native'>;

const black: Color = [19, 17, 22];
const rgb = (n: number): Color => [n >>> 16, (n >>> 8) & 255, n & 255];
const code = (c: Color) => c[0] << 16 | c[1] << 8 | c[2];
const tone = ([r, g, b]: Color) => (r * 2 + g * 5 + b) / 8;
const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const mix = (a: Color, b: Color, t: number): Color => [
  clamp(a[0] + (b[0] - a[0]) * t), clamp(a[1] + (b[1] - a[1]) * t), clamp(a[2] + (b[2] - a[2]) * t),
];
const scale = (a: Color, diff: number): Color => [clamp(a[0] + diff), clamp(a[1] + diff), clamp(a[2] + diff)];
const warm = ([r, g, b]: Color) => r - b >= 18 && r - g >= 8;

function recipePalette(id: CatCoatRecipeId, coat: RecipeCoat) {
  const source: Anchors = swatches[id];
  const inkColors = new Set(source.outline);
  const [a, b, c] = source.fur.map(n => tone(rgb(n))) as [number, number, number];
  const [base, mark, pale] = catCoatColors(coat).map(hex => rgb(Number.parseInt(hex.slice(1), 16))) as [Color, Color, Color];
  const white = id === 'CC09';
  const line = mix(mark, black, white ? .28 : .51);
  const warmLine = mix(base, black, id === 'CC12' ? .54 : .69);
  const softGold = id === 'CC11';
  const deep = mix(mark, black, softGold ? .12 : id === 'black' ? .2 : .25);
  const faceLine = id === 'black' ? undefined : line;
  return (native: Color, role: number) => {
    if (role === pigment.feature) return native;
    const isLine = role === pigment.outline || inkColors.has(code(native));
    if (role === pigment.featureInk && faceLine === undefined) return native;
    if (isLine || role === pigment.featureInk) {
      return source.split && warm(native) ? warmLine : line;
    }
    const t = tone(native);
    if (source.split && t < b - 7 && !warm(native)) {
      return scale(mark, (t - tone(rgb(source.split.dark))) * .56);
    }
    if (source.split && warm(native) && t < c - 16) {
      return scale(base, (t - tone(rgb(source.split.warm))) * .65);
    }
    if (t < a) return scale(deep, (t - a) * (softGold ? .31 : .55));
    if (t < b) return mix(mark, base, (t - a) / (b - a));
    if (t <= c) return mix(base, pale, (t - b) / (c - b));
    return scale(pale, (t - c) * .2);
  };
}

export function paintRecipeCoat(target: ImageData, roles: Uint8ClampedArray | undefined,
  id: CatCoatRecipeId, coat: RecipeCoat,
) {
  const color = recipePalette(id, coat);
  const {data} = target;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const rgb: Color = [data[i]!, data[i + 1]!, data[i + 2]!];
    data.set(color(rgb, roles?.[i] ?? pigment.fur), i);
  }
  if (roles) collapseNearFurSwatches(target, roles);
}

function collapseNearFurSwatches({data}: ImageData, roles: Uint8ClampedArray) {
  const colors = new Map<number, { count: number; furOnly: boolean }>();
  const read = (i: number) => data[i]! << 16 | data[i + 1]! << 8 | data[i + 2]!;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const key = read(i), fur = roles[i] === pigment.fur;
    const entry = colors.get(key) ?? { count: 0, furOnly: true };
    entry.count++;
    entry.furOnly &&= fur;
    colors.set(key, entry);
  }
  while (colors.size > 30) {
    const fur = [...colors].filter(([, v]) => v.furOnly).sort((a, b) => a[1].count - b[1].count);
    let closest = 10;
    let pair: readonly [number, number] | undefined;
    for (const [a] of fur) {
      for (const [b] of fur) {
        if (a === b || colors.get(a)!.count > colors.get(b)!.count) continue;
        const ac = rgb(a), bc = rgb(b);
        const distance = ac.reduce((sum, value, i) => sum + (value - bc[i]!) ** 2, 0);
        if (distance < closest) { closest = distance; pair = [a, b]; }
      }
    }
    if (!pair) return;
    const [a, b] = pair;
    colors.get(b)!.count += colors.get(a)!.count;
    colors.delete(a);
    const destination = rgb(b);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] && read(i) === a) data.set(destination, i);
    }
  }
}

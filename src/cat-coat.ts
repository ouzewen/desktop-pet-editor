import { catCoatSchemes, nativeCatFur, type CatConfig, type CatCoatScheme } from './cat';
import { isLaptopFur } from './cat-body-pattern';

type RGB = readonly [number, number, number];
export type CatCoatSurface = 'fur' | 'orange-head' | 'face-parts' | 'laptop';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const weight = (value: number, low: number, high: number) => clamp((value - low) / (high - low));

function mix(from: RGB, to: RGB, amount: number): RGB {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount,
  ];
}

function parseColor(hex: string): RGB {
  const value = Number.parseInt(hex.slice(1), 16);
  return [value >>> 16, (value >>> 8) & 255, value & 255];
}

function ramp(stops: readonly (readonly [number, RGB])[], tone: number): RGB {
  for (let i = 1; i < stops.length; i++) {
    const [high, to] = stops[i]!;
    if (tone <= high) {
      const [low, from] = stops[i - 1]!;
      return mix(from, to, weight(tone, low, high));
    }
  }
  return stops[stops.length - 1]![1];
}

const pigmentMap = new Map<string, (red: number, green: number, blue: number) => RGB>();

function coatPigments(palette: CatConfig['palette'], scheme: Exclude<CatCoatScheme, 'native'>) {
  const key = `${palette}/${scheme}`;
  const cached = pigmentMap.get(key);
  if (cached) return cached;
  const [base, marking, pale] = catCoatSchemes[scheme].colors.map(parseColor) as [RGB, RGB, RGB];
  const light = mix(base, pale, 0.5);
  const deepMarking = mix(marking, [30, 24, 29], 0.45);

  const stripes = [[92, deepMarking], [128, marking], [173, base], [220, light]] as const;
  const charcoal = [[39, deepMarking], [50, marking], [74, base], [96, light]] as const;
  const spots = [[43, deepMarking], [62, mix(deepMarking, marking, 0.45)], [100, marking]] as const;
  const points = [
    [55, deepMarking], [83, marking], [108, mix(marking, base, 0.22)],
    [173, base], [224, light], [248, pale],
  ] as const;
  const paleFur = [[168, mix(pale, marking, 0.37)], [248, pale]] as const;
  const [nativeBase, nativeMarking, nativePale] = nativeCatFur[palette];
  const markingTone = parseColor(nativeMarking)[1];
  const measured = [
    [Math.min(54, markingTone - 1), deepMarking], [markingTone, marking],
    [parseColor(nativeBase)[1], base], [parseColor(nativePale)[1], pale],
  ] as const;
  const colors = new Map<number, RGB>();

  function read(red: number, green: number, blue: number): RGB {
    const value = (red << 16) | (green << 8) | blue;
    const cachedColor = colors.get(value);
    if (cachedColor) return cachedColor;
    const original: RGB = [red, green, blue];
    const warm = weight(green - blue, 10, 35) * weight(red - green, 12, 34);
    const pink = weight(blue - green, -16, -3) * weight(red - green, 27, 44) * weight(red, 120, 153);
    let color: RGB;
    let strength: number;
    switch (palette) {
    case 'CC02':
      color = ramp(charcoal, green);
      strength = weight(green, 29, 46);
      break;
    case 'CC03': {
      const cool = mix(ramp(spots, green), ramp(paleFur, green), weight(green, 105, 175));
      color = mix(cool, ramp(stripes, green), warm);
      strength = weight(green, 35, 68);
      break;
    }
    case 'CC04':
      color = ramp(points, green);
      strength = weight(green, 35, 64);
      break;
    case 'CC01':
      color = mix(ramp(paleFur, green), ramp(stripes, green), Math.max(warm, 1 - weight(green, 140, 190)));
      strength = weight(green, 53, 99);
      break;
    default:
      color = ramp(measured, green);
      strength = weight(green, 52, 70);
      break;
    }
    const remapped = mix(original, color, strength * (1 - pink));
    colors.set(value, remapped);
    return remapped;
  }

  pigmentMap.set(key, read);
  return read;
}

function isFaceFur(palette: CatConfig['palette'], red: number, green: number, blue: number) {
  if (palette === 'CC02') return green >= 42 && red - green < 17;
  if (palette === 'CC04') return green >= 55 && green - blue > 14;
  return green >= 145 || (green >= 99 && green - blue >= 20);
}

export function recolorCatCoat(
  pixels: ImageData,
  palette: CatConfig['palette'],
  scheme: Exclude<CatCoatScheme, 'native'>,
  surface: CatCoatSurface,
  protectedEyes?: Uint8ClampedArray,
) {
  const { data, width } = pixels;
  const color = coatPigments(palette, scheme);
  for (let offset = 0; offset < data.length; offset += 4) {
    if (!data[offset + 3]) continue;
    const red = data[offset]!, green = data[offset + 1]!, blue = data[offset + 2]!;
    if (surface === 'face-parts' && !isFaceFur(palette, red, green, blue)) continue;
    if (surface === 'laptop' && !isLaptopFur(red, green, blue)) continue;
    if (surface === 'orange-head') {
      const x = (offset / 4) % width, y = Math.floor(offset / 4 / width);
      const eye = y >= 96 && y < 137 && ((x >= 91 && x < 130) || (x >= 172 && x < 212));
      if (protectedEyes?.[offset + 3] || (eye && green >= 175 && blue >= 172)) continue;
    }
    const [r, g, b] = color(red, green, blue);
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
  }
}

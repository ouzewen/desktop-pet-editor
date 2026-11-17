import { catCoatColors, nativeCatFur, type CatRenderConfig } from './cat';
import { bodyPatternChannel } from './cat-body-pattern';

type RGB = readonly [number, number, number];
const clamp = (value: number) => Math.max(0, Math.min(1, value));

function rgb(hex: string): RGB {
  const value = Number.parseInt(hex.slice(1), 16);
  return [value >>> 16, (value >>> 8) & 255, value & 255];
}

function mix(from: RGB, to: RGB, amount: number): RGB {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount,
  ];
}

// The shared Aseprite cels use the orange shadow, fur and highlight tones.
// Keep their silhouette and shading while assigning the chosen coat pigments.
export function paintCatTail(image: ImageData, patterns: Uint8ClampedArray, config: CatRenderConfig) {
  const colors = config.coat === 'native' ? nativeCatFur[config.palette] : catCoatColors(config.coat);
  let base = rgb(colors[0]);
  const marking = rgb(colors[1]), pale = rgb(colors[2]);
  const originalPattern = config.bodyPattern === 'native';
  const point = originalPattern && (config.palette === 'CC04' || config.palette === 'CC08');
  const calico = originalPattern && config.palette === 'CC03';
  const outline: RGB = config.palette === 'CC02' ? [32, 27, 30] : [68, 36, 22];
  let shadow = mix(base, marking, 0.8);
  let light = mix(base, pale, 0.3);
  if (point) {
    base = config.coat === 'native'
      ? config.palette === 'CC04' ? [127, 84, 57] : [193, 139, 96]
      : marking;
    shadow = mix(base, outline, 0.3);
    light = mix(base, rgb(colors[0]), 0.2);
  }
  if (calico && config.coat === 'native') {
    base = [241, 171, 105];
    shadow = [191, 115, 67];
    light = [247, 197, 147];
  }
  const pattern = originalPattern
    ? (['CC01', 'CC06', 'CC07'].includes(config.palette) ? 'mackerel' : 'plain')
    : config.bodyPattern;
  const channel = pattern === 'plain' ? undefined : bodyPatternChannel[pattern];
  const { data, width, height } = image;
  let top = height, bottom = 0;
  for (let offset = 3; offset < data.length; offset += 4) {
    if (!data[offset]) continue;
    const y = Math.floor(offset / 4 / width);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }

  for (let offset = 0; offset < data.length; offset += 4) {
    if (!data[offset + 3]) continue;
    const green = data[offset + 1]!;
    let color: RGB;
    if (green < 65) {
      color = outline;
    } else {
      color = green < 179
        ? mix(shadow, base, clamp((green - 138) / 41))
        : mix(base, light, clamp((green - 179) / 17));
      if (calico) {
        const y = Math.floor(offset / 4 / width);
        const position = (y - top) / Math.max(1, bottom - top);
        if (position < 0.19) color = mix(pale, shadow, 0.13 * clamp((179 - green) / 41));
        if (position > 0.39 && position < 0.7) {
          const dark = config.coat === 'native' ? [67, 60, 61] as const : mix(marking, outline, 0.3);
          color = mix(dark, light, 0.08 * clamp((green - 138) / 58));
        }
      }
      if (channel !== undefined) color = mix(color, marking, patterns[offset + channel]! / 255);
    }
    data[offset] = color[0];
    data[offset + 1] = color[1];
    data[offset + 2] = color[2];
  }
}

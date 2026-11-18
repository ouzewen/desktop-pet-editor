import type { CatArtPalette } from './cat-breeds';

type RGB = readonly [number, number, number];
type EarTones = { outline: RGB; shadow: RGB; fur: RGB; light: RGB };
type EarCoat = Exclude<CatArtPalette, 'CC01'>;

const charcoal: EarTones = { outline: [32, 27, 30], shadow: [57, 51, 61], fur: [79, 74, 87], light: [93, 86, 99] };
const calicoDark: EarTones = { outline: [49, 27, 18], shadow: [57, 49, 48], fur: [74, 66, 65], light: [89, 79, 77] };
const sealPoint: EarTones = { outline: [53, 31, 20], shadow: [89, 52, 35], fur: [127, 84, 57], light: [150, 105, 75] };
const britishBlue: EarTones = { outline: [68, 36, 22], shadow: [115, 117, 122], fur: [149, 153, 159], light: [178, 181, 186] };
const americanShorthair: EarTones = { outline: [68, 36, 22], shadow: [127, 122, 130], fur: [196, 197, 200], light: [211, 214, 220] };
const liHua: EarTones = { outline: [68, 36, 22], shadow: [123, 79, 53], fur: [185, 126, 76], light: [193, 133, 82] };
const ragdoll: EarTones = { outline: [68, 36, 22], shadow: [140, 92, 58], fur: [193, 139, 96], light: [222, 176, 130] };

// A missing color ramp retains the orange template, as on the calico's right ear.
const coats: Record<EarCoat, readonly [EarTones, EarTones?]> = {
  CC02: [charcoal, charcoal],
  CC03: [calicoDark],
  CC04: [sealPoint, sealPoint],
  CC05: [britishBlue, britishBlue],
  CC06: [americanShorthair, americanShorthair],
  CC07: [liHua, liHua],
  CC08: [ragdoll, ragdoll],
};

const cap = (value: number) => Math.max(0, Math.min(1, value));
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;

function earRamp(tones: EarTones) {
  return Array.from({ length: 256 }, (_, red) => {
    const [from, to, amount] = red < 125
      ? [tones.outline, tones.shadow, cap((red - 51) / 74)]
      : red < 241 ? [tones.shadow, tones.fur, (red - 125) / 116]
        : [tones.fur, tones.light, (red - 241) / 14];
    return from.map((channel, index) => mix(channel, to[index]!, amount));
  });
}

export function paintBreedEars(
  context: CanvasRenderingContext2D,
  shape: HTMLImageElement,
  blendMask: HTMLImageElement,
  crown: HTMLImageElement,
  coat: EarCoat,
) {
  const { width, height } = context.canvas;
  const read = (image: HTMLImageElement) => {
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, width, height);
  };
  const shared = read(shape).data;
  const blend = read(blendMask).data;
  const composed = read(crown);
  const result = composed.data;
  const ramps = coats[coat].map(tones => tones && earRamp(tones));

  for (let offset = 0; offset < result.length; offset += 4) {
    const left = blend[offset]!, right = blend[offset + 1]!;
    if (!left && !right) continue;
    // Within either mask, the template can add or remove silhouette pixels.
    const alpha = shared[offset + 3]!;
    if (!alpha) {
      result.fill(0, offset, offset + 4);
      continue;
    }
    const weight = result[offset + 3] ? Math.max(left, right) / 255 : 1;
    const ramp = ramps[right ? 1 : 0];
    const red = shared[offset]!, green = shared[offset + 1]!, blue = shared[offset + 2]!;
    const pigment = ramp?.[red];
    // Keep the pink lining and mix its reddish rim into the surrounding fur.
    const lining = cap((blue - green + 17) / 28) * cap((red - green - 24) / 16) * cap((red - 129) / 32);
    for (let channel = offset; channel < offset + 3; channel++) {
      const shade = shared[channel]!;
      const color = pigment ? mix(pigment[channel - offset]!, shade, lining) : shade;
      result[channel] = mix(result[channel]!, color, weight);
    }
    result[offset + 3] = alpha;
  }
  context.putImageData(composed, 0, 0);
}

export function paintInnerEarColor(
  image: ImageData, original: ImageData, color: RGB,
) {
  const { data, width, height } = original;
  // The original ear layer also includes the crown and fur along the sides
  // of the face. The lining is pink on the two ears, above the eyes.
  for (const [start, end] of [[0, 125], [176, width]] as const) {
    const lining: number[] = [];
    let greenTotal = 0;
    for (let y = 0; y < Math.min(104, height); y++) {
      for (let x = start; x < end; x++) {
        const offset = (y * width + x) * 4;
        const red = data[offset]!, green = data[offset + 1]!, blue = data[offset + 2]!;
        if (!data[offset + 3] || red < 145 || red - green < 31 || blue < green - 5) continue;
        lining.push(offset);
        greenTotal += green;
      }
    }
    if (!lining.length) continue;
    const average = greenTotal / lining.length;
    for (const offset of lining) {
      const shade = data[offset + 1]! - average;
      for (let channel = 0; channel < 3; channel++) image.data[offset + channel] = color[channel]! + shade;
    }
  }
}

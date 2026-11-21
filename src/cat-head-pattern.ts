import { catKeepsBreedPigment, catPatternFurColors, type CatRenderConfig } from './cat';
import { bodyPatternChannel, breedPatternShade, shadeBreedPattern, usesBodyPattern } from './cat-body-pattern';

type RGB = readonly [number, number, number];
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const colors = new Map<string, readonly [RGB, RGB, RGB]>();

function tones(config: CatRenderConfig) {
  const hex = catPatternFurColors(config);
  const key = hex.join('/');
  const cached = colors.get(key);
  if (cached) return cached;
  const result = hex.map(value => {
    const number = Number.parseInt(value.slice(1), 16);
    return [number >>> 16, (number >>> 8) & 255, number & 255] as const;
  }) as unknown as readonly [RGB, RGB, RGB];
  colors.set(key, result);
  return result;
}

// The shared orange drawing distinguishes fur from eyes, mouth, nose,
// whiskers and the outline, independent of the selected breed's pigment.
function isFur(guide: Uint8ClampedArray, offset: number) {
  const red = guide[offset]!, green = guide[offset + 1]!, blue = guide[offset + 2]!;
  return !!guide[offset + 3] && red >= 140 && green >= 82 && red - green >= 24 && green - blue >= 16;
}

function furDepth(x: number, y: number) {
  const px = Math.floor(x / 2) * 2, py = Math.floor(y / 2) * 2;
  return 0.035 + 0.095 * clamp((Math.abs(px - 151) - 32) / 80)
    + 0.055 * clamp((py - 135) / 40);
}

function isChestWhite(pixels: Uint8ClampedArray, index: number) {
  const offset = index * 4;
  const red = pixels[offset]!, green = pixels[offset + 1]!, blue = pixels[offset + 2]!;
  const low = Math.min(red, green, blue);
  return pixels[offset + 3] === 255 && low >= 224 && Math.max(red, green, blue) - low <= 20;
}

/** Map only the white chest fringe in the head cel to nearby fur pixels. */
export function chestFringeSamples(head: Uint8ClampedArray, body: Uint8ClampedArray, width: number) {
  const left = 96, right = 205, top = 162, seam = 176;
  const visited = new Set<number>();
  const samples: [target: number, fur: number][] = [];
  const neighbors = (at: number) => [at - 1, at + 1, at - width, at + width];
  const inNeck = (at: number) => {
    const x = at % width, y = Math.floor(at / width);
    return x >= left && x <= right && y >= top && y < seam;
  };
  function furAbove(at: number, fringe: ReadonlySet<number>) {
    const covered = (index: number) => fringe.has(index) || isChestWhite(head, index);
    let fur = at - width;
    while (covered(fur)) fur -= width;
    const upper = fur - 2 * width;
    return head[upper * 4 + 3] === 255 && !covered(upper) ? upper : fur;
  }
  for (let x = left; x <= right; x++) {
    const start = (seam - 1) * width + x;
    if (visited.has(start) || !isChestWhite(head, start) || !isChestWhite(body, start + width)) continue;
    const connected = [start];
    visited.add(start);
    let extendsIntoFace = false;
    for (let i = 0; i < connected.length; i++) {
      const at = connected[i]!;
      const column = at % width, row = Math.floor(at / width);
      if (row === top || column === left || column === right) extendsIntoFace = true;
      for (const next of neighbors(at)) {
        if (!inNeck(next) || visited.has(next) || !isChestWhite(head, next)) continue;
        visited.add(next);
        connected.push(next);
      }
    }
    // A large facial marking can touch the bib without belonging to it.
    if (extendsIntoFace) continue;
    const core = new Set(connected);
    const fringe = new Set(connected);
    // Include the one-pixel tinted rim where it is much lighter than the
    // surrounding fur. The gradual cream shading on point coats stays intact.
    for (const at of connected) {
      const reference = furAbove(at, core) * 4;
      if (head[reference + 3] !== 255) continue;
      for (const next of neighbors(at)) {
        if (!inNeck(next) || fringe.has(next) || isChestWhite(head, next)) continue;
        const offset = next * 4;
        const red = head[offset]!, green = head[offset + 1]!, blue = head[offset + 2]!;
        if (head[offset + 3] === 255 && red >= 232 && green >= 218 && blue >= 185 && red - blue <= 75
          && green - head[reference + 1]! >= 25 && blue - head[reference + 2]! >= 45) fringe.add(next);
      }
    }
    for (const at of fringe) {
      const fur = furAbove(at, fringe);
      if (head[fur * 4 + 3] === 255) samples.push([at * 4, fur * 4]);
    }
  }
  return samples;
}

export function paintSolidFace(
  image: ImageData, guide: Uint8ClampedArray, config: CatRenderConfig,
  forehead?: Uint8ClampedArray, cheeks?: Uint8ClampedArray, atlas?: Uint8ClampedArray, nativeHead?: Uint8ClampedArray,
) {
  const { data, width } = image;
  const [base, marking] = tones(config);
  const [nativeBase, nativeMarking] = nativeHead ? tones({ ...config, coat: 'native' }) : [base, marking];
  const nativeStripeCutoff = (nativeBase[1] + nativeMarking[1]) / 2;
  for (let offset = 0; offset < data.length; offset += 4) {
    if (!data[offset + 3]) continue;
    const column = offset / 4 % width, row = Math.floor(offset / 4 / width);
    const x = atlas ? 128 + column % 48 : column;
    const y = atlas ? 119 + row % 44 : row;
    const world = (y * 320 + x) * 4;
    if (!isFur(guide, world)) continue;
    if (atlas && row < 88) {
      const red = atlas[offset]!, green = atlas[offset + 1]!, blue = atlas[offset + 2]!;
      if ((red < 145 && green < 70) || (red >= 110 && red > green * 1.25 && blue > green * 0.75)) continue;
    }
    // The native cheek / crown controls still own the striped pigments.
    if (forehead?.[world + 3] || cheeks?.[world + 3]) {
      const nativeStripe = config.palette === 'CC01' ? guide[world + 1]! < 152
        : nativeHead?.[world + 3] && nativeHead[world + 1]! < nativeStripeCutoff;
      if (nativeStripe) continue;
    }
    const depth = furDepth(x, y);
    for (let c = 0; c < 3; c++) data[offset + c] = base[c]! + (marking[c]! - base[c]!) * depth;
  }
}

export function clearForeheadFur(
  image: ImageData, guide: Uint8ClampedArray, region: Uint8ClampedArray, config: CatRenderConfig,
) {
  const { data, width } = image;
  const [base, marking] = tones(config);
  // This is a separate piece of clean fur. Sampling an old stripe or point
  // at the boundary would stretch it into a new triangular marking.
  for (let offset = 0; offset < data.length; offset += 4) {
    if (!data[offset + 3] || !region[offset + 3] || !isFur(guide, offset)) continue;
    const depth = furDepth(offset / 4 % width, Math.floor(offset / 4 / width));
    for (let c = 0; c < 3; c++) data[offset + c] = base[c]! + (marking[c]! - base[c]!) * depth;
  }
}

export function paintGoldenTipping(image: ImageData, config: CatRenderConfig) {
  const { data, width } = image;
  const [, tip] = tones(config);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
    if (!data[i + 3] || r < 158 || g - b < 22 || r - g < 24) continue;
    const x = Math.floor((i / 4 % width) / 2), y = Math.floor(i / 4 / width / 2);
    // The dark tips concentrate near the crown and recede toward the face.
    // Step the transition on the same grid as the fur drawing.
    const grain = ((x * 7 + y * 11) % 9 - 4) / 2;
    const depth = clamp((48 - y + Math.min(7, Math.abs(x - 75) / 5) + grain) / 27);
    const shade = Math.round(depth * 5) / 10;
    for (let c = 0; c < 3; c++) data[i + c] = data[i + c]! + (tip[c]! - data[i + c]!) * shade;
  }
}

export function paintHoneyGoldFur({ data }: ImageData, artwork: Uint8ClampedArray, config: CatRenderConfig) {
  const reference = tones({ ...config, coat: 'breed:CC11' });
  const shifts = config.coat === 'breed:CC11' ? undefined
    : tones(config).map((tone, index) => tone.map((channel, c) => channel - reference[index]![c]!));
  for (let i = 0; i < data.length; i += 4) {
    if (!artwork[i + 3] || !isFur(data, i)) continue;
    if (!shifts) {
      data.set(artwork.subarray(i, i + 3), i);
      continue;
    }
    // Shift the painted shadows, base and cream highlights by their own
    // amounts, keeping the original stepped gradient between them.
    const green = artwork[i + 1]!;
    const pair = green < reference[0][1] ? [1, 0] : [0, 2];
    const from = pair[0]!, to = pair[1]!;
    const start = reference[from]![1], end = reference[to]![1];
    const blend = clamp((green - start) / (end - start));
    for (let c = 0; c < 3; c++) {
      const low = shifts[from]![c]!, high = shifts[to]![c]!;
      data[i + c] = artwork[i + c]! + low + (high - low) * blend;
    }
  }
}

export function paintForeheadFur(
  image: ImageData, guide: Uint8ClampedArray, region: Uint8ClampedArray,
  pattern: Uint8ClampedArray, config: CatRenderConfig,
) {
  const [, marking, pale] = tones(config);
  const pigmentShade = catKeepsBreedPigment(config) ? breedPatternShade(config) : undefined;
  const { data } = image;
  for (let offset = 0; offset < data.length; offset += 4) {
    if (!data[offset + 3] || !region[offset + 3] || !pattern[offset + 3] || !isFur(guide, offset)) continue;
    const dark = pattern[offset]! / 255, light = pattern[offset + 1]! / 255;
    if (pigmentShade && dark >= light) {
      shadeBreedPattern(data, offset, pigmentShade, dark);
      continue;
    }
    const strength = Math.max(dark, light);
    for (let channel = 0; channel < 3; channel++) {
      const color = light > dark ? pale[channel]! : marking[channel]!;
      data[offset + channel] = data[offset + channel]! + (color - data[offset + channel]!) * strength;
    }
  }
}

export function paintHeadFur(
  image: ImageData, guide: Uint8ClampedArray, region: Uint8ClampedArray,
  pattern: Uint8ClampedArray | undefined, config: CatRenderConfig, atlas?: Uint8ClampedArray,
) {
  if (!usesBodyPattern(config)) return;
  const pigmentShade = catKeepsBreedPigment(config) ? breedPatternShade(config) : undefined;
  const [base, marking] = tones(config);
  const channel = config.bodyPattern === 'native' || config.bodyPattern === 'plain' ? 0 : bodyPatternChannel[config.bodyPattern];
  const { data, width } = image;
  for (let offset = 0; offset < data.length; offset += 4) {
    if (!data[offset + 3]) continue;
    const column = (offset / 4) % width, row = Math.floor(offset / 4 / width);
    if (atlas) {
      // Legacy mouth/nose cels include a narrow coat-colored fringe which
      // differs by breed. Keep their actual ink and pink tissue; the rest
      // is background fur, including the calico's baked white rim.
      const red = atlas[offset]!, green = atlas[offset + 1]!, blue = atlas[offset + 2]!;
      const ink = red < 145 && green < 70;
      const pink = red >= 110 && red > green * 1.25 && blue > green * 0.75;
      if (row < 88 && (ink || pink)) continue;
    } else if (!isFur(guide, offset)) continue;
    // Every atlas cell occupies the same mouth/nose rectangle on the head.
    const x = atlas ? 128 + column % 48 : column;
    const y = atlas ? 119 + row % 44 : row;
    const world = (y * 320 + x) * 4;
    if (!region[world + 3]) continue;
    const ink = (pattern?.[world + channel] ?? 0) / 255;
    if (pigmentShade) {
      if (ink) shadeBreedPattern(data, offset, pigmentShade, ink);
      continue;
    }
    const depth = furDepth(x, y);
    const shade = depth + (1 - depth) * ink;
    for (let c = 0; c < 3; c++) data[offset + c] = base[c]! + (marking[c]! - base[c]!) * shade;
  }
}

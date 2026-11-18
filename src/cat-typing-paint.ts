// Transfer the existing breed/coat pigments onto newly painted geometry. The
// fixed shoulder pixels retain their exact original color; new paw pixels use
// the old paw pigments rather than borrowing white from the chest.
type Pigment = { x: number; y: number; source: readonly number[]; target: readonly number[] };
type Surface = 'fur' | 'pale' | 'paw' | 'ink';

function surface(red: number, green: number, blue: number): Exclude<Surface, 'paw'> {
  if (red >= 140 && green >= 82 && red - green >= 24 && green - blue >= 16) return 'fur';
  if (red >= 174 && green >= 155 && red - blue <= 56) return 'pale';
  return 'ink';
}

export function createTypingArmPainter(orange: ImageData, colored: ImageData) {
  const pigments: Record<Surface, Pigment[]> = { fur: [], pale: [], paw: [], ink: [] };
  const reference = orange.data, mapped = colored.data;
  const width = orange.width;
  // The source cels are pixel art with a 2px grid. Sampling each 2px block is
  // enough to retain their shades without doing a full search per new pixel.
  for (let y = 160; y < 222; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const offset = (y * width + x) * 4;
      if (!reference[offset + 3] || !mapped[offset + 3]) continue;
      const source = [...reference.subarray(offset, offset + 3)];
      const target = [...mapped.subarray(offset, offset + 3)];
      const kind = surface(source[0]!, source[1]!, source[2]!);
      // Only outline samples should provide ink; different old breed shapes
      // can put light fur where the orange template had an outline.
      if (kind === 'ink' && Math.max(...target) > 145) continue;
      const pigment = { x, y, source, target };
      pigments[kind].push(pigment);
      if (kind === 'pale' && y >= 187 && (x < 133 || x > 163)) pigments.paw.push(pigment);
    }
  }
  const colors = new Map<string, readonly number[]>();

  function colorAt(kind: Surface, red: number, green: number, blue: number, x: number, y: number) {
    const bx = Math.floor(x / 6) * 6 + 3, by = Math.floor(y / 6) * 6 + 3;
    const key = `${kind}/${red}/${green}/${blue}/${bx}/${by}`;
    const cached = colors.get(key);
    if (cached) return cached;
    const candidates = pigments[kind].length ? pigments[kind] : pigments[kind === 'paw' ? 'pale' : 'fur'];
    let best = Infinity;
    let result: readonly number[] = [red, green, blue];
    for (const sample of candidates) {
      const dr = red - sample.source[0]!, dg = green - sample.source[1]!, db = blue - sample.source[2]!;
      const distance = 2 * (bx - sample.x) ** 2 + (by - sample.y) ** 2;
      const score = distance + (dr * dr + dg * dg + db * db) * 0.7;
      if (score < best) { best = score; result = sample.target; }
    }
    colors.set(key, result);
    return result;
  }

  return (image: ImageData, paws?: Uint8ClampedArray) => {
    const pixels = image.data;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      if (!pixels[offset + 3]) continue;
      const red = pixels[offset]!, green = pixels[offset + 1]!, blue = pixels[offset + 2]!;
      const paw = Boolean(paws?.[offset + 3]);
      if (!paw && reference[offset + 3] && mapped[offset + 3]
        && red === reference[offset] && green === reference[offset + 1] && blue === reference[offset + 2]) {
        pixels.set(mapped.subarray(offset, offset + 3), offset);
        continue;
      }
      const kind = surface(red, green, blue);
      const index = offset / 4;
      const color = colorAt(paw && kind === 'pale' ? 'paw' : kind,
        red, green, blue, index % width, Math.floor(index / width));
      pixels.set(color, offset);
    }
    return image;
  };
}
function isFrontPawOutline(data: Uint8ClampedArray, offset: number) {
  return !!data[offset + 3] && data[offset]! < 140;
}

export function thickenPeekPawOutline(paw: ImageData, guide: ImageData) {
  const { data, width, height } = paw;
  // Add one step of the original 2px grid inward. The guide has no line
  // across the flat keyboard cut, which becomes the edge of the screen.
  const steps = [[0, -2], [-2, 0], [2, 0], [0, 2]] as const;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      if (!data[offset + 3] || isFrontPawOutline(guide.data, offset)) continue;
      for (const [dx, dy] of steps) {
        const sx = x + dx, sy = y + dy;
        if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
        const sample = (sy * width + sx) * 4;
        if (!isFrontPawOutline(guide.data, sample)) continue;
        // Extend the already recolored ink, so dark fur is never mistaken for linework.
        data.set(data.subarray(sample, sample + 3), offset);
        break;
      }
    }
  }
}

export function recolorFrontPaws(paws: ImageData, body: ImageData, darkOutline: boolean) {
  const { data, width } = paws;
  // Sample the toe fur on either side of the idle body. The two paws can
  // have different pigments, and their color must stay fixed as they lift.
  const colorAt = (x: number) => body.data.subarray((268 * width + x) * 4, (268 * width + x) * 4 + 3);
  const left = colorAt(123), right = colorAt(178);
  const referenceFill = [253, 252, 250];
  for (let offset = 0; offset < data.length; offset += 4) {
    if (!data[offset + 3]) continue;
    if (isFrontPawOutline(data, offset)) {
      if (darkOutline) data.set([32, 27, 30], offset);
      continue;
    }
    const color = offset / 4 % width < width / 2 ? left : right;
    for (let channel = 0; channel < 3; channel++) {
      data[offset + channel] = Math.round(data[offset + channel]! * color[channel]! / referenceFill[channel]!);
    }
  }
  return paws;
}

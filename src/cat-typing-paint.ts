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

  return (image: ImageData, paws: Uint8ClampedArray) => {
    const pixels = image.data;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      if (!pixels[offset + 3]) continue;
      const red = pixels[offset]!, green = pixels[offset + 1]!, blue = pixels[offset + 2]!;
      const paw = Boolean(paws[offset + 3]);
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

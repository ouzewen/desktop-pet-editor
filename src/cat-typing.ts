export type TypingAnimation = 'reference' | 'shared' | 'legacy';

export const catTypingFrameCount = 12;

export function catTypingFrameDuration(mode: 'gentle' | 'fast' | 'frenzy', animation: TypingAnimation = 'reference') {
  if (animation === 'legacy') return mode === 'gentle' ? 250 : 90;
  const duration = mode === 'gentle' ? 1000 : mode === 'fast' && animation === 'reference' ? 600 : 360;
  return duration / catTypingFrameCount;
}

// Small lateral recovery separates the descending and returning strokes.
// Both speeds share this same low-paw cycle and the same two painted poses.
const strokes = [
  [0, 0], [0, 1], [1, 3], [1, 5], [1, 7], [0, 9],
  [0, 10], [-1, 9], [-1, 7], [-1, 5], [-1, 3], [-1, 1],
] as const;

export function lowTypingArms(left: ImageData, right: ImageData, frame: number) {
  const { width, height } = left;
  const result = new ImageData(width, height);
  const leftPixels = new Uint32Array(left.data.buffer, left.data.byteOffset, left.data.length / 4);
  const rightPixels = new Uint32Array(right.data.buffer, right.data.byteOffset, right.data.length / 4);
  const output = new Uint32Array(result.data.buffer);
  const step = ((frame % catTypingFrameCount) + catTypingFrameCount) % catTypingFrameCount;
  const [drift, leftDown] = strokes[step]!;
  const split = 154;
  // These cels end at the keyboard. Moving their cropped bottom edge would
  // expose a strip of arm beside the laptop, so retain that original cutoff.
  let bottom = height;
  while (bottom > 0) {
    const start = (bottom - 1) * width;
    let painted = false;
    for (let x = 0; x < width; x++) {
      if (leftPixels[start + x] || rightPixels[start + x]) { painted = true; break; }
    }
    if (painted) break;
    bottom--;
  }

  for (const isLeft of [true, false]) {
    const source = isLeft ? leftPixels : rightPixels;
    const down = isLeft ? leftDown : 10 - leftDown;
    const horizontal = isLeft ? drift : -drift;
    const start = isLeft ? 0 : split;
    const end = isLeft ? split : width;
    for (let y = 0; y < bottom; y++) {
      // The shoulder stays fixed. Stretch only the short transition into
      // the paw, then translate the painted paw without scaling its detail.
      const sourceY = y <= 170 ? y : y < 182 + down
        ? 170 + Math.floor((y - 170) * 12 / (12 + down)) : y - down;
      const movement = Math.max(0, Math.min(1, (sourceY - 170) / 12));
      for (let x = start; x < end; x++) {
        const atCenter = Math.min(1, Math.abs(x - split) / 20);
        const sourceX = x - Math.round(horizontal * movement * atCenter);
        if (sourceX < 0 || sourceX >= width) continue;
        output[y * width + x] = source[sourceY * width + sourceX]!;
      }
    }
  }
  return result;
}

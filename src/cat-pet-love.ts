import { catPetLove } from './pet-assets';

export const catPetLoveFrameDuration = catPetLove.frameDuration;
export const catPetLoveFrameCount = catPetLove.frames;

// Upper chest settles before the bow. The face leads the ears back up;
// the chest stays low until the head has almost recovered.
const catPetLovePoses = [
  [0, 0, 0, 0], [0, 0, 0, 0], [0, 1, 0, 0], [1, 1, 0, 0],
  [2, 2, 0, 3], [3, 2, 1, 8], [4, 3, 2, 15], [5, 3, 3, 25],
  [6, 3, 4, 36], [6, 3, 5, 47], [7, 3, 6, 57], [7, 3, 7, 64],
  [7, 3, 7, 67], [7, 3, 7, 67], [7, 3, 7, 65], [7, 3, 7, 61],
  [7, 3, 7, 55], [7, 3, 7, 50], [6, 3, 6, 45], [6, 3, 6, 39],
  [5, 3, 5, 32], [4, 3, 4, 26], [3, 2, 3, 20], [2, 2, 2, 14],
  [2, 1, 1, 9], [1, 1, 1, 5], [0, 1, 0, 2], [0, 0, 0, 0],
  [0, 0, 0, 0], [0, 0, 0, 0],
] as const satisfies { length: typeof catPetLove.frames };

export function catPetLoveFrameAt(elapsedMs: number): number | undefined {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return undefined;
  const frame = Math.floor(elapsedMs / catPetLoveFrameDuration);
  return frame < catPetLoveFrameCount ? frame : undefined;
}

export function catPetLovePose(frame: number | undefined) {
  if (frame === undefined) return;
  const key = catPetLovePoses[frame];
  if (!key) return;
  const [drop, shoulders, crease, sweep] = key;
  return { frame, drop, shoulders, crease, sweep, squint: frame >= 1 && frame <= 26 };
}

const gridSize = 80;
const center = 37.5;
const unit = (x: number) => Math.min(1, Math.max(0, x));

function copyCell(source: ImageData, target: ImageData, sx: number, sy: number, x: number, y: number) {
  const from = (sy * gridSize + sx) * 4;
  target.data.set(source.data.subarray(from, from + 4), (y * gridSize + x) * 4);
}

function headRows(drop: number) {
  // Give the brow less travel than the nose. Ease the chin up into the neck
  // while carrying the existing eye and nose sprites at an integral offset.
  const destinations = Array.from({ length: gridSize }, (_, y) => {
    const brow = 0.64 + 0.36 * unit((y - 12) / 10);
    const chin = 1 - 0.32 * unit((y - 38) / 6);
    return y + Math.round(drop * brow * chin);
  });
  let sourceY = 0;
  return destinations.map((_, y) => {
    if (y < destinations[0]!) return -1;
    while (sourceY < gridSize - 1 && destinations[sourceY + 1]! <= y) sourceY++;
    return sourceY;
  });
}

export function warpCatPetLoveHead(source: ImageData, target: ImageData, drop: number, crease: number) {
  const root = 20;
  const rows = headRows(drop);
  for (let y = 0; y < gridSize; y++) {
    const headY = rows[y]!;
    if (headY < 0) continue;
    for (let x = 0; x < gridSize; x++) {
      const side = unit((Math.abs(x - center) - 6) / 12);
      const squeeze = 1 - crease * side / 17;
      const rawY = headY < root ? root + (headY - root) / squeeze : headY;
      const spread = 1 + crease * Math.min(14, Math.max(0, root - rawY)) / 420;
      const sx = Math.round(center + (x - center) / spread), sy = Math.round(rawY);
      if (sx >= 0 && sy >= 0 && sx < gridSize && sy < gridSize) copyCell(source, target, sx, sy, x, y);
    }
  }
  if (!crease) return;
  // Reapply the original one-cell rim where ear compression skips it.
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < drop + root; y++) {
      const into = (y * gridSize + x) * 4;
      if (!target.data[into + 3]) continue;
      const sx = Math.round(center + (x - center) / (1 + crease / 30));
      for (let sy = 0; sy < root; sy++) {
        if (!source.data[(sy * gridSize + sx) * 4 + 3]) continue;
        copyCell(source, target, sx, sy, x, y);
        break;
      }
      break;
    }
  }
}

export function warpCatPetLoveShoulders(source: ImageData, target: ImageData, amount: number) {
  const collarY = 44, pawY = 56;
  target.data.set(source.data);
  for (let y = collarY; y < pawY; y++) {
    const height = (pawY - y) / (pawY - collarY);
    const shoulderFade = unit((53 - y) / 8);
    const chestFollow = amount === 3 ? 0.75 + 0.25 * shoulderFade : shoulderFade;
    for (let x = 15; x <= 58; x++) {
      const distance = Math.abs(x - center);
      const side = unit((distance - 8) / 6);
      // Keep the neck's leading edge attached while the outer shoulder
      // line rounds down. Fade the pull out before the exposed tail.
      const edge = x < center ? unit((x - 15) / 4) : unit((58 - x) / 4);
      const settle = Math.round(amount * height * chestFollow * edge * (0.5 + 0.5 * side));
      const collar = y - Math.min(settle, y - collarY);
      const sy = side < 0.5 ? collar : y - settle;
      const sx = x + Math.sign(x - center) * Math.round(amount / 3 * height * side * edge);
      copyCell(source, target, sx, sy, x, y);
    }
  }
}

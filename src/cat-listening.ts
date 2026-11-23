import { CAT_SIZE, catListening } from './pet-assets';

const angles = [0, 2, 4, 6, 8, 10, 11, 11, 10, 8, 5, 2, -1, -4, -7, -9, -11, -11, -10, -8, -5, -3, -1];
const authoredCycle = 24;

export function catListeningFrameAt(elapsed: number) {
  return Math.floor(Math.max(0, elapsed) / catListening.frameDuration) % catListening.frames;
}

const neckStart = 151;
const neckEnd = 208;
const pivotX = 150.5;
const pivotY = 141;
const frameMaps = new Map<number, Int32Array>();

function smooth(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function listeningMap(frame: number, grid: number) {
  const key = frame * 8 + grid;
  const existing = frameMaps.get(key);
  if (existing) return existing;
  const map = new Int32Array(neckEnd * CAT_SIZE);
  // The authored poses shared a duplicate first and last frame.
  const phase = frame * 2 * Math.PI / authoredCycle;
  const lean = angles[frame]! * Math.PI / 180;
  const bob = -2 * Math.abs(Math.sin(phase));
  const earLeft = 3.6 * Math.sin(phase - 0.55) * Math.sin(phase / 2);
  const earRight = 3.6 * Math.sin(phase - 0.95) * Math.sin(phase / 2);

  const center = (grid - 1) / 2;
  for (let row = 0; row < neckEnd; row += grid) {
    const y = row + center;
    const headWeight = 1 - smooth((y - 142) / 33);
    const shoulderWeight = 1 - smooth((y - 145) / (neckEnd - 145));
    const blend = smooth((y - neckStart) / 16);
    const baseWeight = headWeight + (shoulderWeight - headWeight) * blend;
    for (let column = 0; column < CAT_SIZE; column += grid) {
      const x = column + center;
      // Relax the turn across the upper chest, pinning the right edge before
      // the tail. The lower body, paws and tail pixels stay in place.
      const weight = y < neckStart ? baseWeight : baseWeight * (1 - smooth((y - 171) / 14) * smooth((x - 221) / 15));
      const angle = lean * weight;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const dx = x - pivotX;
      const dy = y - pivotY - bob * weight;
      const sourceX = pivotX + dx * cos + dy * sin;
      const sourceY = pivotY - dx * sin + dy * cos;
      const ear = 1 - smooth((sourceY - 20) / 54);
      const wiggle = earLeft * (1 - smooth((sourceX - 97) / 32)) + earRight * smooth((sourceX - 173) / 32);
      const sx = Math.round(sourceX - ear * wiggle);
      const sy = Math.round(sourceY);
      const source = sx >= 0 && sx < CAT_SIZE && sy >= 0 && sy < CAT_SIZE ? sy * CAT_SIZE + sx : -1;
      for (let offset = 0; offset < grid; offset++) {
        const start = (row + offset) * CAT_SIZE + column;
        map.fill(source, start, start + grid);
      }
    }
  }

  frameMaps.set(key, map);
  return map;
}

const listeningGrid = 4;
const coarseSize = CAT_SIZE / listeningGrid;

export function listeningCell(index: number) {
  return Math.floor(index / CAT_SIZE / listeningGrid) * coarseSize
    + Math.floor(index % CAT_SIZE / listeningGrid);
}

function keepListeningEdits(base: Uint32Array, result: Uint32Array, map: Int32Array, edits: ReadonlySet<number>) {
  const visible = new Set<number>();
  const reserved = new Set<number>();
  for (let y = 0; y < neckEnd; y += listeningGrid) {
    for (let x = 0; x < CAT_SIZE; x += listeningGrid) {
      const i = y * CAT_SIZE + x;
      const source = map[i]!;
      if (source >= 0 && edits.has(listeningCell(source))) {
        visible.add(listeningCell(source));
        reserved.add(i);
      }
    }
  }
  // The inverse map can skip an isolated pixel when the head turns. Keep
  // deliberate ink on the closest occupied cell of the same moving head.
  for (const edit of edits) {
    if (visible.has(edit)) continue;
    const x = edit % coarseSize * listeningGrid, y = Math.floor(edit / coarseSize) * listeningGrid;
    let best = -1, distance = 2 * listeningGrid ** 2;
    for (let yy = Math.max(0, y - 36); yy <= Math.min(neckEnd - listeningGrid, y + 36); yy += listeningGrid) {
      for (let xx = Math.max(0, x - 36); xx <= Math.min(CAT_SIZE - listeningGrid, x + 36); xx += listeningGrid) {
        const at = yy * CAT_SIZE + xx;
        const source = map[at]!;
        if (source < 0 || !base[source] || reserved.has(at)) continue;
        const error = (source % CAT_SIZE - x - 1.5) ** 2 + (Math.floor(source / CAT_SIZE) - y - 1.5) ** 2;
        if (error < distance) {
          distance = error;
          best = at;
        }
      }
    }
    if (best < 0) continue;
    const color = base[(y + 2) * CAT_SIZE + x + 2]!;
    for (let row = 0; row < listeningGrid; row++) {
      const start = best + row * CAT_SIZE;
      result.fill(color, start, start + listeningGrid);
    }
    reserved.add(best);
  }
}

export function warpListeningPixels(base: Uint32Array, result: Uint32Array, frame: number, pixel80 = false,
  edits?: ReadonlySet<number>,
) {
  result.set(base);
  if (frame === 0 && !pixel80) return;
  const map = listeningMap(frame, pixel80 ? listeningGrid : 1);
  for (let index = 0; index < map.length; index++) {
    result[index] = base[map[index]!] ?? 0;
  }
  if (pixel80 && edits?.size) keepListeningEdits(base, result, map, edits);
}

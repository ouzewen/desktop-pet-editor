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

export function warpListeningPixels(base: Uint32Array, result: Uint32Array, frame: number, pixel80 = false) {
  result.set(base);
  if (frame === 0 && !pixel80) return;
  const map = listeningMap(frame, pixel80 ? 4 : 1);
  for (let index = 0; index < map.length; index++) {
    result[index] = base[map[index]!] ?? 0;
  }
}

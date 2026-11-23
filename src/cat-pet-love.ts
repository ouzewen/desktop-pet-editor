import { catPetLove } from './pet-assets';

export const catPetLoveDuration = catPetLove.frames * catPetLove.frameDuration;
// Sample the curve on the display callback. Finer clock buckets prevent
// a slightly early 60 Hz callback from reusing the preceding pose number.
export const catPetLoveFrameDuration = 1000 / 120;
export const catPetLoveFrameCount = Math.ceil(catPetLoveDuration / catPetLoveFrameDuration);

export function catPetLoveFrameAt(elapsedMs: number): number | undefined {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs >= catPetLoveDuration) return undefined;
  return Math.min(catPetLoveFrameCount - 1, Math.floor(elapsedMs / catPetLoveFrameDuration));
}

const smooth = (start: number, end: number, position: number) => {
  const t = Math.min(1, Math.max(0, (position - start) / (end - start)));
  return t * t * (3 - 2 * t);
};

// Build 90's 30 tail poses, 48 ms apart. Only the sampling cadence changes.
const originalTailSweep = [
  0, 0, 0, 0, 3, 8, 15, 25, 36, 47, 57, 64, 67, 67, 65,
  61, 55, 50, 45, 39, 32, 26, 20, 14, 9, 5, 2, 0, 0, 0,
] as const satisfies { length: typeof catPetLove.frames };

export function catPetLovePose(frame: number | undefined) {
  if (frame === undefined || frame < 0 || frame >= catPetLoveFrameCount) return undefined;
  const time = frame * catPetLoveFrameDuration;
  const arc = (a: number, b: number, c: number, d: number) =>
    smooth(a, b, time) * (1 - smooth(c, d, time));
  const phase = time / catPetLove.frameDuration;
  const first = Math.floor(phase);
  const a = originalTailSweep[first]!;
  const b = originalTailSweep[first + 1] ?? a;
  return {
    shoulders: 2.5 * arc(32, 390, 945, 1310),
    bow: 6 * arc(85, 540, 825, 1285),
    ears: arc(165, 570, 830, 1250),
    tail: a + (b - a) * (phase - first),
    squint: time >= 52 && time < 1260,
    heartFrame: Math.min(catPetLove.frames - 1, Math.floor(time / catPetLove.frameDuration)),
  };
}

export const petLoveGrid = 80;
const center = 37.5;
// A transparent marker stops seam repair from closing authored holes.
export const petLoveClear = 1;
const opaque = (value: number) => value >>> 24 !== 0;

function visitInteriorGaps(pixels: Uint32Array, left: number, top: number, right: number, bottom: number,
  visit: (cells: number[]) => void,
) {
  const grid = petLoveGrid;
  const visited = new Uint8Array(grid * grid);
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const first = y * grid + x;
      if (visited[first] || opaque(pixels[first]!)) continue;
      visited[first] = 1;
      const cells = [first];
      let open = false;
      for (const cell of cells) {
        const cx = cell % grid, cy = Math.floor(cell / grid);
        if (cx === left || cx === right || cy === top || cy === bottom) open = true;
        if (cx > left) add(cell - 1);
        if (cx < right) add(cell + 1);
        if (cy > top) add(cell - grid);
        if (cy < bottom) add(cell + grid);
      }
      if (!open) visit(cells);
      function add(i: number) {
        if (visited[i] || opaque(pixels[i]!)) return;
        visited[i] = 1;
        cells.push(i);
      }
    }
  }
}

export function protectPetLoveTailOpenings(tail: Uint32Array) {
  let opening = petLoveClear + 1;
  visitInteriorGaps(tail, 0, 0, petLoveGrid - 1, petLoveGrid - 1, cells => {
    if (cells.some(i => tail[i] === petLoveClear)) return;
    for (const i of cells) tail[i] = opening;
    opening++;
  });
}

type LovePose = NonNullable<ReturnType<typeof catPetLovePose>>;

export function warpPetLove(pixels: Uint32Array, target: Uint32Array, pose: LovePose) {
  const grid = petLoveGrid;
  // Invert one continuous, monotonic deformation from ear to shoulder.
  // The forward knots taper to zero above the stationary paws.
  const from = [0, 12, 21, 35, 44, 52, 57, 79];
  const { bow, shoulders, ears } = pose;
  const to = [0, 12 + bow * .62, 21 + bow * .88, 35 + bow,
    44 + bow * .48 + shoulders * .62, 52 + shoulders, 57, 79];
  const rows = new Float64Array(grid);
  let segment = 0;
  for (let y = 0; y < grid; y++) {
    while (segment < from.length - 2 && y > to[segment + 1]!) segment++;
    const f = (y - to[segment]!) / (to[segment + 1]! - to[segment]!);
    rows[y] = from[segment]! + f * (from[segment + 1]! - from[segment]!);
  }
  for (let y = 0; y < grid; y++) {
    const sampleY = rows[y]!;
    const earWeight = ears * (1 - smooth(5, 23, sampleY));
    const spread = 1 + earWeight * .13;
    const row = y * grid;
    for (let x = 0; x < grid; x++) {
      const dx = x - center;
      const earSide = smooth(6, 18, Math.abs(dx));
      const sy = Math.round(sampleY - 2 * earWeight * earSide);
      const sx = Math.round(center + dx / spread);
      const sample = sy * grid + sx;
      target[row + x] = sy >= 0 ? pixels[sample]! : 0;
    }
  }
}

export function drawPetLoveTail(tail: Uint32Array, target: Uint32Array, degrees: number, rootY: number, bent: boolean,
  edits: ReadonlySet<number>,
) {
  const grid = petLoveGrid;
  const rootX = 58;
  const rad = degrees * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const height = bent ? 1 - degrees / 330 : 1;
  const ownership = edits.size ? new Uint8Array(grid * grid) : undefined;
  const drawn = new Set<number>();
  // Match the original pivot and inverse rotation, with the current seated
  // pixels in front of the complete tail. Nearest-neighbor keeps 80px ink.
  for (let y = 32; y < grid; y++) {
    const dy = y + .5 - rootY;
    for (let x = 46; x < grid; x++) {
      const i = y * grid + x;
      if (target[i]) continue;
      const dx = x + .5 - rootX;
      const sx = Math.floor(rootX + cos * dx + sin * dy);
      const sy = Math.floor(rootY + (-sin * dx + cos * dy) / height);
      if (sx < 0 || sx >= grid || sy < 0 || sy >= grid) continue;
      const sample = sy * grid + sx;
      target[i] = tail[sample]!;
      if (ownership && target[i]) {
        ownership[i] = edits.has(sample) ? 2 : 1;
        if (ownership[i] === 2) drawn.add(sample);
      }
    }
  }
  // A one-cell brush mark can fall between two inverse samples. Put it
  // back on the nearest rotated tail pixel, respecting body occlusion.
  if (ownership) for (const sample of edits) {
    if (drawn.has(sample)) continue;
    const dx = sample % grid + .5 - rootX;
    const dy = (Math.floor(sample / grid) + .5 - rootY) * height;
    const x = rootX + cos * dx - sin * dy;
    const y = rootY + sin * dx + cos * dy;
    const cx = Math.floor(x), cy = Math.floor(y);
    if (cx < 1 || cx >= grid - 1 || cy < 1 || cy >= grid - 1 || (target[cy * grid + cx] && !ownership[cy * grid + cx])) continue;
    let nearest = -1, distance = Infinity;
    for (let row = cy - 1; row <= cy + 1; row++) {
      for (let col = cx - 1; col <= cx + 1; col++) {
        const i = row * grid + col;
        const error = (col + .5 - x) ** 2 + (row + .5 - y) ** 2;
        if (ownership[i] === 1 && opaque(target[i]!) && error < distance) {
          nearest = i;
          distance = error;
        }
      }
    }
    if (nearest >= 0) {
      target[nearest] = tail[sample]!;
      ownership[nearest] = 2;
    }
  }
  // Close raster gaps at the join. If nearest-neighbor rotation splits
  // a curled tail's original opening, keep its connected main component.
  const gaps: number[][] = [];
  const openings = new Map<number, number[]>();
  visitInteriorGaps(target, 55, 44, grid - 1, grid - 1, cells => {
    gaps.push(cells);
    for (const i of cells) {
      const mark = target[i]!;
      if (mark > petLoveClear && (openings.get(mark)?.length ?? 0) < cells.length) openings.set(mark, cells);
    }
  });
  const keep = new Set(openings.values());
  for (const cells of gaps) {
    if (keep.has(cells) || cells.some(i => target[i] === petLoveClear)) continue;
    if (cells.every(i => !target[i]) && cells.some(i => i % grid > 67)) continue;
    let fur = 0;
    let at = grid;
    for (const i of cells) {
      const x = i % grid;
      if (x < at && opaque(target[i - 1]!)) {
        at = x;
        fur = target[i - 1]!;
      }
    }
    if (fur) for (const i of cells) target[i] = fur;
  }
}

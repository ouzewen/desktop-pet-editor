import type { CatInkBounds, CatInkSurface } from './cat-ink';
import { CAT_SIZE } from './pet-assets';

export const furPatchParts = ['head', 'torso', 'leftForeleg', 'rightForeleg', 'leftPaw', 'rightPaw'] as const;
export type FurPatchPart = typeof furPatchParts[number];

type Point = readonly [number, number];
type Shape = { id: string; name: string; outline?: readonly Point[]; bands?: { count: number; width: number } };
type Preset = {
  id: string; name: string; part: FurPatchPart;
  x: number; y: number; width: number; height: number; color: string;
  shapes: readonly Shape[];
  mirror?: string;
};

const cuff = [
  { id: 'cuff', name: '平口', outline: [[0.04, 0.16], [0.96, 0.16], [1, 1], [0, 1]] },
  { id: 'rounded', name: '圆口', outline: [[0, 0.38], [0.19, 0.13], [0.5, 0], [0.81, 0.13], [1, 0.38], [1, 1], [0, 1]] },
  { id: 'slanted', name: '斜口', outline: [[0, 0.06], [1, 0.39], [1, 1], [0, 1]] },
] as const satisfies readonly Shape[];

const foreleg = [
  { id: 'long', name: '整段前肢', outline: [[0.04, 0], [0.96, 0], [1, 0.18], [0.98, 1], [0.02, 1], [0, 0.18]] },
  { id: 'tapered', name: '渐窄斑', outline: [[0.27, 0.08], [0.66, 0], [0.88, 0.18], [0.76, 0.48], [0.65, 0.78], [0.79, 1], [0.28, 1], [0.19, 0.8], [0.24, 0.45], [0.11, 0.24]] },
  ...cuff,
] as const satisfies readonly Shape[];

const forelegRings = [
  { id: 'three', name: '三道细环', bands: { count: 3, width: 0.12 } },
  { id: 'two', name: '两道宽环', bands: { count: 2, width: 0.22 } },
  { id: 'one', name: '单道环', bands: { count: 1, width: 0.22 } },
] as const satisfies readonly Shape[];

export const furPatchPresets: readonly Preset[] = [
  { id: 'blaze', name: '鼻梁斑', part: 'head', x: 151, y: 103, width: 30, height: 96, color: '#F6EBDE', shapes: [
    { id: 'stripe', name: '细条', outline: [[0.43, 0], [0.56, 0.035], [0.65, 0.11], [0.76, 0.14], [0.84, 0.24], [0.7, 0.58], [1, 0.86], [0.78, 1], [0.22, 1], [0, 0.86], [0.3, 0.58], [0.16, 0.24], [0.29, 0.11]] },
    { id: 'wide', name: '宽条', outline: [[0.22, 0], [0.76, 0], [0.89, 0.2], [0.77, 0.48], [1, 0.89], [0.78, 1], [0.22, 1], [0, 0.89], [0.21, 0.48], [0.11, 0.21]] },
    { id: 'vee', name: '倒 V', outline: [[0.47, 0], [0.54, 0], [0.69, 0.26], [0.84, 0.48], [1, 0.82], [0.84, 1], [0.16, 1], [0, 0.82], [0.16, 0.48], [0.31, 0.26]] },
    { id: 'nose-tip', name: '短鼻线', outline: [[0.36, 0.06], [0.54, 0], [0.64, 0.17], [0.65, 0.48], [0.87, 0.78], [1, 1], [0, 1], [0.22, 0.73], [0.34, 0.48]] },
  ] },
  { id: 'eye', name: '眼罩／头斑', part: 'head', x: 110, y: 111, width: 86, height: 74, color: '#343039', shapes: [
    { id: 'oval', name: '椭圆', outline: [[0.23, 0.03], [0.7, 0], [0.92, 0.2], [1, 0.5], [0.86, 0.8], [0.65, 1], [0.29, 0.96], [0.06, 0.72], [0, 0.43], [0.08, 0.16]] },
    { id: 'angle', name: '偏斜', outline: [[0.04, 0.23], [0.27, 0.02], [0.64, 0], [0.88, 0.17], [1, 0.48], [0.71, 0.82], [0.33, 1], [0.08, 0.83], [0, 0.61]] },
    { id: 'ear-tip', name: '耳顶小色斑', outline: [[0.03, 0.05], [0.91, 0], [1, 0.38], [0.8, 0.53], [0.67, 0.74], [0.49, 0.69], [0.30, 1], [0.16, 0.82], [0, 0.63]] },
    { id: 'chin', name: '小白下巴', outline: [[0.30, 0.04], [0.61, 0], [0.78, 0.20], [0.89, 0.50], [0.91, 0.76], [0.73, 0.98], [0.28, 1], [0.09, 0.76], [0.11, 0.47], [0.22, 0.21]] },
    { id: 'head-half', name: '半侧头斑', outline: [[0, 0], [0.93, 0], [0.95, 0.17], [0.91, 0.31], [0.97, 0.48], [0.92, 0.63], [0.79, 0.77], [0.63, 0.91], [0.35, 0.98], [0, 1]] },
    { id: 'cap', name: '头顶帽斑', outline: [[0, 0], [1, 0], [1, 0.82], [0.84, 0.89], [0.67, 0.71], [0.51, 0.47], [0.33, 0.74], [0.14, 1], [0, 0.94]] },
    { id: 'mask', name: '宽脸斑', outline: [[0, 0.32], [0.12, 0.08], [0.33, 0.02], [0.54, 0.09], [0.77, 0], [0.96, 0.22], [1, 0.61], [0.86, 0.88], [0.59, 0.91], [0.43, 1], [0.18, 0.94], [0.01, 0.73]] },
  ] },
  { id: 'chest', name: '胸口斑', part: 'torso', x: 150, y: 196, width: 118, height: 100, color: '#F6EBDE', shapes: [
    { id: 'bib', name: '围兜', outline: [[0.05, 0], [0.95, 0], [1, 0.28], [0.89, 0.51], [0.73, 0.66], [0.65, 0.87], [0.5, 1], [0.36, 0.89], [0.27, 0.69], [0.09, 0.5], [0, 0.24]] },
    { id: 'drop', name: '水滴', outline: [[0.46, 0], [0.57, 0], [0.68, 0.21], [0.91, 0.43], [1, 0.65], [0.91, 0.85], [0.72, 0.98], [0.31, 1], [0.09, 0.84], [0, 0.63], [0.09, 0.43], [0.33, 0.22]] },
    { id: 'full', name: '宽胸', outline: [[0, 0], [1, 0], [0.98, 0.82], [0.88, 0.97], [0.12, 1], [0.02, 0.84]] },
    { id: 'tuft', name: '小领结', outline: [[0.34, 0], [0.63, 0], [0.64, 0.23], [0.78, 0.29], [0.98, 0.41], [0.87, 0.58], [0.71, 0.63], [0.65, 0.84], [0.53, 0.79], [0.43, 1], [0.28, 0.81], [0.13, 0.75], [0.02, 0.53], [0.07, 0.34], [0.31, 0.26]] },
    { id: 'taper', name: '窄倒三角', outline: [[0.23, 0], [0.74, 0], [0.97, 0.29], [0.77, 0.56], [0.65, 0.71], [0.52, 1], [0.41, 0.83], [0.32, 0.82], [0.25, 0.60], [0.05, 0.34]] },
    { id: 'round-bib', name: '圆围兜', outline: [[0.26, 0], [0.75, 0], [0.98, 0.32], [0.91, 0.54], [0.82, 0.76], [0.69, 0.91], [0.51, 1], [0.33, 0.94], [0.19, 0.83], [0.07, 0.59], [0.02, 0.32]] },
    { id: 'continuous', name: '连片白胸', outline: [[0.29, 0], [0.71, 0], [0.82, 0.15], [0.99, 0.30], [0.92, 0.53], [0.86, 0.78], [0.91, 1], [0.10, 1], [0.15, 0.78], [0.08, 0.55], [0.02, 0.30], [0.18, 0.15]] },
    { id: 'wide-shoulders', name: '白肩连胸', outline: [[0.21, 0], [0.79, 0], [0.96, 0.12], [1, 0.24], [0.89, 0.36], [0.84, 0.50], [0.80, 0.73], [0.84, 1], [0.17, 1], [0.21, 0.73], [0.17, 0.50], [0.10, 0.36], [0, 0.24], [0.04, 0.12]] },
  ] },
  { id: 'bodySpot', name: '躯干／后身斑', part: 'torso', x: 204, y: 211, width: 63, height: 82, color: '#69606A', shapes: [
    { id: 'oval', name: '椭圆', outline: [[0.23, 0.03], [0.7, 0], [0.92, 0.2], [1, 0.5], [0.86, 0.8], [0.65, 1], [0.29, 0.96], [0.06, 0.72], [0, 0.43], [0.08, 0.16]] },
    { id: 'angle', name: '偏斜', outline: [[0.04, 0.23], [0.27, 0.02], [0.64, 0], [0.88, 0.17], [1, 0.48], [0.71, 0.82], [0.33, 1], [0.08, 0.83], [0, 0.61]] },
    { id: 'saddle', name: '肩背鞍斑', outline: [[0.03, 0.33], [0.17, 0.16], [0.41, 0.06], [0.66, 0], [1, 0.08], [1, 0.69], [0.84, 0.80], [0.67, 0.73], [0.51, 0.91], [0.30, 0.98], [0.17, 0.76], [0.06, 0.65]] },
    { id: 'flank-island', name: '侧腰岛斑', outline: [[0.14, 0.20], [0.37, 0.03], [0.62, 0.07], [0.84, 0.14], [1, 0.39], [0.92, 0.71], [0.74, 0.82], [0.57, 0.98], [0.26, 0.93], [0.12, 0.75], [0, 0.49]] },
    { id: 'hip', name: '近臀斑', outline: [[0.02, 0.68], [0.09, 0.40], [0.24, 0.33], [0.40, 0.12], [0.67, 0.04], [0.87, 0.16], [0.98, 0.34], [1, 0.89], [0.84, 1], [0.55, 0.96], [0.28, 1], [0.08, 0.88]] },
  ] },
  { id: 'leftForeleg', name: '画面左前肢斑', part: 'leftForeleg', x: 120, y: 237, width: 76, height: 112, color: '#F6EBDE', shapes: foreleg, mirror: 'rightForeleg' },
  { id: 'rightForeleg', name: '画面右前肢斑', part: 'rightForeleg', x: 181, y: 237, width: 76, height: 112, color: '#F6EBDE', shapes: foreleg, mirror: 'leftForeleg' },
  { id: 'leftRings', name: '画面左前肢横环', part: 'leftForeleg', x: 120, y: 238, width: 76, height: 78, color: '#815639', shapes: forelegRings, mirror: 'rightRings' },
  { id: 'rightRings', name: '画面右前肢横环', part: 'rightForeleg', x: 181, y: 238, width: 76, height: 78, color: '#815639', shapes: forelegRings, mirror: 'leftRings' },
  { id: 'leftSock', name: '画面左前爪斑', part: 'leftPaw', x: 127, y: 274, width: 56, height: 30, color: '#F6EBDE', shapes: cuff, mirror: 'rightSock' },
  { id: 'rightSock', name: '画面右前爪斑', part: 'rightPaw', x: 176, y: 274, width: 56, height: 30, color: '#F6EBDE', shapes: cuff, mirror: 'leftSock' },
];

export const furPatchLimit = 16;
export const furPatchBounds: Record<FurPatchPart, CatInkBounds> = {
  head: { x: 46, y: 22, width: 209, height: 146 },
  torso: { x: 54, y: 165, width: 187, height: 114 },
  leftForeleg: { x: 95, y: 197, width: 58, height: 86 },
  rightForeleg: { x: 153, y: 197, width: 54, height: 86 },
  leftPaw: { x: 105, y: 252, width: 48, height: 31 },
  rightPaw: { x: 153, y: 252, width: 48, height: 31 },
};
export const furPatchDimensions = { min: 8, max: 224 };

const presetById = new Map(furPatchPresets.map(preset => [preset.id, preset]));

export type FurPatch = {
  id: string; preset: string; shape: string; x: number; y: number;
  width: number; height: number; color: string; flipped: boolean; joinChin?: boolean;
};

export function readFurPatches(value: unknown): FurPatch[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > furPatchLimit) throw Error('毛色斑块存档无效');
  const seen = new Set<string>();
  return value.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object') throw Error('毛色斑块无效');
    const { id, preset, shape, x, y, width, height, color, flipped, joinChin } = entry as Partial<FurPatch>;
    const spec = typeof preset === 'string' ? presetById.get(preset) : undefined;
    if (!spec || typeof id !== 'string' || !/^[\w-]{1,64}$/.test(id) || seen.has(id)
      || typeof shape !== 'string' || !spec.shapes.some(option => option.id === shape)
      || typeof color !== 'string' || !/^#[\da-f]{6}$/i.test(color) || typeof flipped !== 'boolean'
      || (joinChin !== undefined && (spec.id !== 'chest' || typeof joinChin !== 'boolean'))) {
      throw Error('毛色斑块选项无效');
    }
    const bounds = furPatchBounds[spec.part];
    function coordinate(number: unknown, min: number, max: number) {
      if (typeof number !== 'number' || !Number.isInteger(number) || number < min || number > max) {
        throw Error('毛色斑块坐标或尺寸超出范围');
      }
      return number;
    }
    seen.add(id);
    return { id, preset: spec.id, shape,
      x: coordinate(x, bounds.x, bounds.x + bounds.width), y: coordinate(y, bounds.y, bounds.y + bounds.height),
      width: coordinate(width, furPatchDimensions.min, furPatchDimensions.max),
      height: coordinate(height, furPatchDimensions.min, furPatchDimensions.max), color: color.toUpperCase(), flipped, ...(joinChin === undefined ? {} : { joinChin }) };
  });
}

export function furPatchesFor(patches: readonly FurPatch[] | undefined, part: FurPatchPart) {
  return patches?.filter(patch => presetById.get(patch.preset)?.part === part) ?? [];
}

function pointInOutline(outline: readonly Point[], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [a, b] = outline[i]!, [c, d] = outline[j]!;
    if ((b > y) !== (d > y) && x < (c - a) * (y - b) / (d - b) + a) inside = !inside;
  }
  return inside;
}

type RGB = readonly [number, number, number];
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const brightness = (r: number, g: number, b: number) => (3 * r + 6 * g + b) / 10;
const rgb = (hex: string): RGB => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [value >> 16, (value >> 8) & 255, value & 255];
};

function rasterPatch(patch: FurPatch, target?: CatInkBounds, idle?: CatInkBounds, reverseY = false) {
  const shape = presetById.get(patch.preset)?.shapes.find(option => option.id === patch.shape);
  if (!shape) return;
  // Moving paws use the same color pattern and edge texture as the idle paw.
  const sx = target && idle ? target.width / idle.width : 1;
  const sy = target && idle ? target.height / idle.height : 1;
  return {
    shape, color: rgb(patch.color), flipped: patch.flipped, reverseY,
    left: (target && idle ? target.x - idle.x * sx : 0) + (patch.x - patch.width / 2) * sx,
    top: target && idle && reverseY
      ? target.y + (idle.y + idle.height - patch.y - patch.height / 2) * sy
      : (target && idle ? target.y - idle.y * sy : 0) + (patch.y - patch.height / 2) * sy,
    width: patch.width * sx, height: patch.height * sy,
    sourceWidth: patch.width, sourceHeight: patch.height,
  };
}
type RasterPatch = NonNullable<ReturnType<typeof rasterPatch>>;

// Short, coherent stepped runs follow the drawn fur. The texture is bound to
// the patch's coordinates and sampled in 2-pixel cells, with no soft alpha.
const edgeSteps = [0, 0.75, 1.5, 0.5, -0.75, -1.5, -0.5, 0.75] as const;
function covers(patch: RasterPatch, x: number, y: number) {
  const localX = (x - patch.left) / patch.width;
  const depth = (y - patch.top) / patch.height;
  const ny = patch.reverseY ? 1 - depth : depth;
  const nx = patch.flipped ? 1 - localX : localX;
  if (nx < -0.03 || nx > 1.03 || ny < -0.03 || ny > 1.03) return false;
  const row = Math.floor(Math.max(0, ny) * patch.sourceHeight / 6);
  const column = Math.floor(Math.max(0, nx) * patch.sourceWidth / 8);
  const u = nx + edgeSteps[row % edgeSteps.length]! / Math.max(40, patch.sourceWidth);
  const v = ny + edgeSteps[(column + 3) % edgeSteps.length]! / Math.max(40, patch.sourceHeight);
  if (patch.shape.outline) return pointInOutline(patch.shape.outline, u, v);
  const bands = patch.shape.bands;
  if (!bands || u < 0 || u > 1) return false;
  // Curve across the foreleg rather than laying an unbroken flat rectangle.
  const curve = 0.135 * (u - 0.5) ** 2 + 0.035 * (u - 0.5);
  const phase = (v + curve) * bands.count;
  return phase >= 0 && phase < bands.count && Math.abs(phase % 1 - 0.5) < bands.width * bands.count / 2;
}

export function furPatchColorAt(patches: readonly FurPatch[], x: number, y: number) {
  for (let i = patches.length - 1; i >= 0; i--) {
    const patch = rasterPatch(patches[i]!);
    if (patch && covers(patch, x, y)) return patch.color;
  }
}

export function sittingPawAt(x: number, y: number) {
  if (y < 252) return;
  const leftOuter = y < 264 ? 103 : 107;
  const leftInner = y < 256 ? 144 : y < 266 ? 149 : 153;
  const rightInner = y < 256 ? 158 : y < 266 ? 157 : 153;
  const rightOuter = y < 264 ? 199 : 194;
  if (x >= leftOuter && x < leftInner) return 'leftPaw';
  if (x >= rightInner && x < rightOuter) return 'rightPaw';
}

export function sittingForelegAt(x: number, y: number) {
  if (y < 201) return;
  if (y >= 252) {
    const paw = sittingPawAt(x, y);
    if (paw === 'leftPaw') return 'leftForeleg';
    if (paw === 'rightPaw') return 'rightForeleg';
    return;
  }
  const shoulder = Math.max(0, (225 - y) / 24);
  if (x >= 103 + Math.round(9 * shoulder) && x < 143 - Math.round(17 * shoulder)) return 'leftForeleg';
  if (x >= 157 + Math.round(18 * shoulder) && x < 200 - Math.round(10 * shoulder)) return 'rightForeleg';
}

type Foreleg = 'leftForeleg' | 'rightForeleg';
const forelegCache = new WeakMap<readonly FurPatch[], Record<Foreleg, FurPatch[]>>();

export function forelegFurPatches(patches: readonly FurPatch[] | undefined, limb: Foreleg): readonly FurPatch[] {
  if (!patches?.length) return [];
  const cached = forelegCache.get(patches);
  if (cached) return cached[limb];
  const result = { leftForeleg: furPatchesFor(patches, 'leftForeleg'), rightForeleg: furPatchesFor(patches, 'rightForeleg') };
  const chest = furPatchesFor(patches, 'torso').filter(patch => patch.preset === 'chest' && patch.joinChin === undefined);
  for (const [side, paw, shoulderX, toeX] of [
    ['leftForeleg', 'leftPaw', 115, 129], ['rightForeleg', 'rightPaw', 184, 177],
  ] as const) {
    if (result[side].length) continue;
    const socks = furPatchesFor(patches, paw);
    const sock = [...socks].reverse().find(patch => {
      const shape = rasterPatch(patch);
      return shape && covers(shape, toeX, 268) && patch.y - patch.height / 2 <= 251;
    });
    const color = sock && rgb(sock.color);
    const upper = furPatchColorAt(chest, shoulderX, 208);
    const lower = furPatchColorAt(chest, toeX, 243);
    // Older configurations painted the upper limb with a broad chest mark.
    // Carry that color through its matching long sock on the limb's own
    // surface. A short cuff or a deliberately different sock stays separate.
    if (!sock || !color || !upper || !lower
      || !color.every((channel, c) => Math.abs(channel - upper[c]!) <= 18 && Math.abs(channel - lower[c]!) <= 18)) continue;
    const preset = presetById.get(side)!;
    result[side].push({
      id: `joined-${side}`, preset: side, shape: 'long', x: preset.x, y: preset.y,
      width: preset.width, height: preset.height, color: sock.color, flipped: false,
    });
  }
  forelegCache.set(patches, result);
  return result[limb];
}

type NeckFur = { left: number; right: number; chin: RGB; chest: RGB; explicitJoin: boolean };
const neckCache = new WeakMap<readonly FurPatch[], NeckFur | null>();
const chinRow = 154;
const chestRow = 185;

export function connectedNeckFur(patches: readonly FurPatch[] | undefined) {
  if (!patches?.length) return;
  const cached = neckCache.get(patches);
  if (cached !== undefined) return cached ?? undefined;
  const head = furPatchesFor(patches, 'head');
  const torso = furPatchesFor(patches, 'torso');
  const specified = torso.filter(patch => patch.preset === 'chest' && patch.joinChin !== undefined);
  const chest = specified.length ? specified.filter(patch => patch.joinChin) : torso;
  let run: NeckFur | undefined;
  let best: NeckFur | undefined;
  // A broad overlap between similarly colored chin and chest marks describes
  // a continuous throat. A narrow blaze or a dark mask on its own does not.
  for (let x = 87; x <= 215; x += 2) {
    const chinColor = furPatchColorAt(head, x, chinRow);
    const chestColor = furPatchColorAt(chest, x, chestRow);
    if (!chinColor || !chestColor || brightness(...chinColor) < 176 || brightness(...chestColor) < 176
      || chinColor.some((value, channel) => Math.abs(value - chestColor[channel]!) > 30)) {
      run = undefined;
      continue;
    }
    if (!run || !run.chin.every((value, channel) => value === chinColor[channel])
      || !run.chest.every((value, channel) => value === chestColor[channel])) {
      run = { left: x, right: x, chin: chinColor, chest: chestColor, explicitJoin: specified.length > 0 };
    } else {
      run.right = x;
    }
    if (!best || run.right - run.left > best.right - best.left) best = run;
  }
  const result = best && best.right - best.left >= (specified.length ? 20 : 42) ? best : undefined;
  neckCache.set(patches, result ?? null);
  return result;
}

type PatchSurface = {
  guide: Uint8ClampedArray; surface?: CatInkSurface; idle?: CatInkBounds;
  keep?: Uint8Array; skin?: boolean; movingPaw?: boolean; neck?: NeckFur; reverseY?: boolean;
};

const detailOffsets = [-16, 16, -CAT_SIZE * 16, CAT_SIZE * 16] as const;

function furTone(guide: Uint8ClampedArray, original: Uint8ClampedArray, i: number, skin: boolean) {
  const r = guide[i]!, g = guide[i + 1]!, b = guide[i + 2]!;
  const lightness = brightness(r, g, b);
  // Pale and ochre areas in the source drawing use separate shade ramps.
  // Map each around its own main tone so the old pigmentation does not
  // become a second patch inside the replacement color.
  const pale = r - b < 54 && lightness > 174;
  const relief = guide[i + 3] ? clamp((lightness - (pale ? 243 : 180)) * (pale ? 0.59 : 0.53), -32, 14) : 0;
  if (skin) return relief;
  const tone = brightness(original[i]!, original[i + 1]!, original[i + 2]!);
  const x = i / 4 % CAT_SIZE;
  let detail = 0, count = 0;
  for (const offset of detailOffsets) {
    if ((offset === -16 && x < 4) || (offset === 16 && x >= CAT_SIZE - 4)) continue;
    const sample = i + offset;
    if (!original[sample + 3]) continue;
    const delta = tone - brightness(original[sample]!, original[sample + 1]!, original[sample + 2]!);
    if (Math.abs(delta) > 24) continue;
    detail += delta;
    count++;
  }
  return relief + (count ? clamp(detail / count, -7, 7) : 0);
}

export function paintFurPatches(
  image: ImageData, original: Uint8ClampedArray, patches: readonly FurPatch[], options: PatchSurface,
) {
  const { guide, surface, idle, keep, skin = false, movingPaw = false, neck, reverseY } = options;
  const { data } = image;
  const writable = (x: number, y: number) => {
    const index = y * CAT_SIZE + x, i = index * 4;
    if (!original[i + 3] || keep?.[index] || (surface?.mask && !surface.mask[index])) return false;
    const r = guide[i]!, g = guide[i + 1]!, b = guide[i + 2]!;
    return skin || !guide[i + 3] || !(movingPaw ? r < 140 : r <= 140 && g <= 78 && b <= 74);
  };
  const paint = (x: number, y: number, color: RGB, neckShade = 0) => {
    const i = (y * CAT_SIZE + x) * 4;
    const relief = furTone(guide, original, i, skin);
    const light = (brightness(...color) < 90 && relief < 0 ? relief * 0.67 : relief) + neckShade;
    const distance = Math.max(Math.abs(color[0] - original[i]!), Math.abs(color[1] - original[i + 1]!),
      Math.abs(color[2] - original[i + 2]!));
    // A shade close to the existing coat only needs a small color change.
    // Keep the original texture visible instead of exaggerating its pattern.
    const retain = skin ? 0 : Math.max(0, (56 - distance) * 0.008);
    for (let c = 0; c < 3; c++) data[i + c] = (color[c]! + light) * (1 - retain) + original[i + c]! * retain;
  };
  const rasters = patches.map(patch => rasterPatch(patch, surface?.bounds, idle, reverseY)).filter(patch => patch !== undefined);
  for (const patch of rasters) {
    const { left, top, width, height } = patch;
    for (let y = Math.max(0, Math.floor(top) - 3); y < Math.min(CAT_SIZE, top + height + 3); y++) {
      const py = 2 * Math.floor(y / 2) + 1;
      for (let x = Math.max(0, Math.floor(left) - 3); x < Math.min(CAT_SIZE, left + width + 3); x++) {
        if (writable(x, y) && covers(patch, 2 * Math.floor(x / 2) + 1, py)) paint(x, y, patch.color);
      }
    }
  }
  if (neck) {
    const topmostFirst = [...rasters].reverse();
    for (let y = chinRow; y <= chestRow; y++) {
      const height = clamp((y - chinRow) / (chestRow - chinRow), 0, 1);
      const blend = (index: 0 | 1 | 2) => neck.chin[index] + (neck.chest[index] - neck.chin[index]) * height;
      const color: RGB = [blend(0), blend(1), blend(2)];
      // Ease the extra throat shadow back into the existing light at both
      // ends of the join to avoid a horizontal band across the chest.
      const shadow = neck.explicitJoin ? -13 * Math.sin(height * Math.PI) ** 2
        : -17 * Math.max(0, 1 - Math.abs(y - 174) / 15);
      const tuck = Math.round(5 * Math.sin(height * Math.PI)) + (y % 6 >= 4 ? 2 : 0);
      for (let x = neck.left + tuck; x <= neck.right - tuck; x++) {
        if (!writable(x, y)) continue;
        const existing = topmostFirst.find(patch => covers(patch, 2 * Math.floor(x / 2) + 1, 2 * Math.floor(y / 2) + 1));
        if (!existing || existing.color.every((channel, c) => Math.abs(channel - color[c]!) <= 30)) {
          paint(x, y, color, shadow);
        }
      }
    }
  }
}

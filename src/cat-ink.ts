import { CAT_SIZE } from './pet-assets';

export const catInkParts = [
  'laptop', 'leftEar', 'rightEar', 'head', 'leftPaw', 'rightPaw', 'tail', 'torso', 'canvas',
] as const;
export type CatInkPart = typeof catInkParts[number];
export type CatInkBounds = { x: number; y: number; width: number; height: number };
export type CatInkSurface = { bounds: CatInkBounds; mask?: Uint8Array };
export type CatInkGeometry = Partial<Record<CatInkPart, CatInkSurface>>;
// Native brush colors are straight AARRGGBB. A zero change is an explicit erasure.
export type CatInkChange = [position: number, argb: number];
export type CatInkLayer = { bounds: CatInkBounds; paint: CatInkChange[]; erase: number[] };
export type CatInkDocument = { version: 1; parts: Partial<Record<CatInkPart, CatInkLayer>> };

const size = CAT_SIZE;
const fullBounds = { x: 0, y: 0, width: size, height: size };
const freeCanvas: CatInkSurface = { bounds: fullBounds };
const area = size * size;

function integer(value: unknown, limit: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < limit;
}

function validBounds(bounds: CatInkBounds | undefined): bounds is CatInkBounds {
  return !!bounds && integer(bounds.x, size) && integer(bounds.y, size)
    && integer(bounds.width, size + 1) && bounds.width > 0 && bounds.x + bounds.width <= size
    && integer(bounds.height, size + 1) && bounds.height > 0 && bounds.y + bounds.height <= size;
}

export function readCatInk(value: unknown): CatInkDocument {
  const doc = value as Partial<CatInkDocument> | null;
  if (!doc || doc.version !== 1 || !doc.parts || typeof doc.parts !== 'object' || Array.isArray(doc.parts)) {
    throw Error('像素笔迹存档版本无效');
  }
  for (const [part, layer] of Object.entries(doc.parts)) {
    if (!catInkParts.includes(part as CatInkPart) || !validBounds(layer?.bounds)
      || !Array.isArray(layer.paint) || !Array.isArray(layer.erase)) {
      throw Error('像素笔迹图层无效');
    }
    const limit = layer.bounds.width * layer.bounds.height;
    if (layer.paint.length + layer.erase.length > limit) throw Error('像素笔迹超出图层');
    const occupied = new Set<number>();
    for (const position of layer.erase) {
      if (!integer(position, limit) || occupied.has(position)) throw Error('擦除区域无效');
      occupied.add(position);
    }
    for (const change of layer.paint) {
      if (!Array.isArray(change) || change.length !== 2) throw Error('笔迹数据无效');
      const [position, value] = change;
      if (!integer(position, limit) || occupied.has(position)
        || !integer(value, 0x100000000) || value < 0x01000000) throw Error('笔迹数据无效');
      occupied.add(position);
    }
  }
  return doc as CatInkDocument;
}

function contains(surface: CatInkSurface, x: number, y: number) {
  const { bounds, mask } = surface;
  return x >= bounds.x && y >= bounds.y && x < bounds.x + bounds.width && y < bounds.y + bounds.height
    && (!mask || !!mask[y * size + x]);
}

const nearestPixels = new WeakMap<CatInkSurface, Map<number, number | undefined>>();

function nearestPixel(surface: CatInkSurface, x: number, y: number) {
  let cache = nearestPixels.get(surface);
  if (!cache) nearestPixels.set(surface, cache = new Map());
  const key = y * size + x;
  if (cache.has(key)) return cache.get(key);
  const { bounds } = surface;
  let closest: number | undefined, distance = Infinity;
  for (let dy = bounds.y; dy < bounds.y + bounds.height; dy++) {
    for (let dx = bounds.x; dx < bounds.x + bounds.width; dx++) {
      const step = (dx - x) ** 2 + (dy - y) ** 2;
      if (step < distance && contains(surface, dx, dy)) {
        distance = step;
        closest = dy * size + dx;
      }
    }
  }
  cache.set(key, closest);
  return closest;
}

export function projectCatInk(layer: CatInkLayer, surface: CatInkSurface): ReadonlyMap<number, number> {
  const result = new Map<number, number>();
  const from = layer.bounds, to = surface.bounds;
  const sx = to.width / from.width, sy = to.height / from.height;
  const moving = to.width !== size || to.height !== size;
  function put(position: number, value: number) {
    const x = position % from.width, y = Math.floor(position / from.width);
    const right = to.x + Math.ceil((x + 1) * sx - 0.5);
    const bottom = to.y + Math.ceil((y + 1) * sy - 0.5);
    let placed = false;
    // Assign the destination pixels whose centres fall inside this source pixel.
    for (let dy = to.y + Math.ceil(y * sy - 0.5); dy < bottom; dy++) {
      for (let dx = to.x + Math.ceil(x * sx - 0.5); dx < right; dx++) {
        if (!contains(surface, dx, dy)) continue;
        result.set(dy * size + dx, value);
        placed = true;
      }
    }
    // A one-pixel mark can otherwise vanish when an ear folds or a paw narrows.
    if (!placed && moving) {
      const target = nearestPixel(surface, to.x + Math.floor((x + 0.5) * sx), to.y + Math.floor((y + 0.5) * sy));
      if (target !== undefined) result.set(target, value);
    }
  }
  for (const position of layer.erase) put(position, 0);
  for (const [position, value] of layer.paint) put(position, value);
  return result;
}

export function captureCatInk(
  geometry: CatInkGeometry, changes: readonly CatInkChange[], previous?: CatInkDocument, offsetY = 0,
): CatInkDocument {
  if (changes.length > area) throw Error('像素改动超出画布');
  const parts = { ...previous?.parts };
  const updates = new Map<CatInkPart, Map<number, number>>();
  const canvasSurface = geometry.canvas ?? freeCanvas;
  const oldCanvas = parts.canvas && projectCatInk(parts.canvas, canvasSurface);
  for (const [index, value] of changes) {
    if (!integer(index, area) || !integer(value, 0x100000000)
      || (value !== 0 && value < 0x01000000)) throw Error('像素改动无效');
    const x = index % size, y = Math.floor(index / size) - offsetY;
    const onCanvasInk = !!oldCanvas?.get(index);
    const part = (!onCanvasInk && catInkParts.find(part => {
      const surface = geometry[part];
      return part !== 'canvas' && !!surface && contains(surface, x, y);
    })) || 'canvas';
    if (part === 'canvas' && value === 0 && !onCanvasInk) continue;
    const surface = part === 'canvas' ? canvasSurface : geometry[part]!;
    let pending = updates.get(part);
    if (!pending) {
      const prior = parts[part];
      updates.set(part, pending = new Map(prior ? projectCatInk(prior, surface) : undefined));
    }
    pending.set(part === 'canvas' ? index : y * size + x, value);
  }
  for (const [part, cells] of updates) {
    const { bounds } = part === 'canvas' ? canvasSurface : geometry[part]!;
    const layer: CatInkLayer = { bounds, paint: [], erase: [] };
    for (const [index, value] of [...cells].sort(([a], [b]) => a - b)) {
      const local = (Math.floor(index / size) - bounds.y) * bounds.width + index % size - bounds.x;
      if (value) layer.paint.push([local, value]);
      else layer.erase.push(local);
    }
    parts[part] = layer;
  }
  return { version: 1, parts };
}

type InkRaster = { x: number; y: number; paint?: HTMLCanvasElement; erase?: HTMLCanvasElement };
const rasters = new WeakMap<CatInkLayer, WeakMap<CatInkSurface, InkRaster | undefined>>();

function rasterize(layer: CatInkLayer, surface: CatInkSurface, part: CatInkPart) {
  let cache = rasters.get(layer);
  if (!cache) rasters.set(layer, cache = new WeakMap());
  if (cache.has(surface)) return cache.get(surface);
  const cells = projectCatInk(layer, surface);
  let left = size, top = size, right = 0, bottom = 0;
  let hasPaint = false, hasErase = false;
  for (const [index, value] of cells) {
    if (part === 'canvas' && !value) continue;
    const x = index % size, y = Math.floor(index / size);
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
    hasPaint ||= value !== 0;
    hasErase ||= part !== 'canvas' && value >>> 24 !== 255;
  }
  if (!hasPaint && !hasErase) {
    cache.set(surface, undefined);
    return;
  }

  const width = right - left + 1, height = bottom - top + 1;
  const raster: InkRaster = { x: left, y: top };
  for (const operation of ['paint', 'erase'] as const) {
    if (operation === 'paint' ? !hasPaint : !hasErase) continue;
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    const image = ctx.createImageData(width, height);
    for (const [index, value] of cells) {
      if (part === 'canvas' && !value) continue;
      const offset = ((Math.floor(index / size) - top) * width + index % size - left) * 4;
      if (operation === 'erase') {
        if (value >>> 24 !== 255) image.data[offset + 3] = 255;
      } else {
        image.data.set([(value >>> 16) & 255, (value >>> 8) & 255, value & 255, value >>> 24], offset);
      }
    }
    ctx.putImageData(image, 0, 0);
    raster[operation] = canvas;
  }
  cache.set(surface, raster);
  return raster;
}

export function applyCatInk(
  ctx: CanvasRenderingContext2D, ink: CatInkDocument, geometry: CatInkGeometry, parts: readonly CatInkPart[],
) {
  for (const part of parts) {
    const layer = ink.parts[part];
    const surface = part === 'canvas' ? geometry.canvas ?? freeCanvas : geometry[part];
    if (!layer || !surface) continue;
    const raster = rasterize(layer, surface, part);
    if (!raster) continue;
    ctx.save();
    if (raster.erase) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(raster.erase, raster.x, raster.y);
    }
    if (raster.paint) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(raster.paint, raster.x, raster.y);
    }
    ctx.restore();
  }
}

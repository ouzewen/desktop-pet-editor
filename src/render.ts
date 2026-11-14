/// <reference types="vite/client" />

import { palettes, type Config } from './model';

export const SIZE = 160;
export type Action = 'sit' | 'left' | 'right' | 'typing';
// The editor enumerates available actions; keep the deferred action IDs
// addressable for its existing timeline without showing them in G2a.
export const actions: Readonly<Record<Action, number>> = Object.defineProperties(
  { sit: 1, left: 0, right: 0, typing: 0 },
  { left: { enumerable: false }, right: { enumerable: false }, typing: { enumerable: false } },
);

const art = {
  tail: ['T01'],
  ear: ['E01', 'E02', 'E03'],
  eye: ['Y01', 'Y02', 'Y03'],
  muzzle: ['N01', 'N02'],
  pattern: ['P00', 'P02'],
} as const;

const baseLayers = [
  'frames/M1_body',
  'frames/M1_head_base',
  ...art.tail.map(id => `parts/M1_tail_${id}`),
  ...art.ear.map(id => `parts/M1_ear_${id}`),
];
const fixedLayers = [
  'parts/M1_pattern_P02',
  ...art.eye.map(id => `parts/M1_eye_${id}`),
  ...art.muzzle.map(id => `parts/M1_muzzle_${id}`),
];
const furSlots = ['g', 's', 'l'] as const;
type FurSlot = typeof furSlots[number];
const maskPath = (layer: string, slot: FurSlot) => `masks/${layer.split('/').at(-1)}_${slot}`;

function loadLayer(layer: string) {
  const image = new Image();
  image.src = `${import.meta.env.BASE_URL}assets/${layer}.png`;
  return image.decode().then(() => {
    if (image.naturalWidth !== SIZE || image.naturalHeight !== SIZE) throw Error(`图层尺寸错误 · ${layer}`);
    return [layer, image] as const;
  }).catch((error: unknown) => {
    console.error(`无法加载图层 · ${layer}`, error);
    return [layer, null] as const;
  });
}

// Decode before mounting React so preview and export share the synchronous renderer.
const images = new Map(await Promise.all([
  ...baseLayers,
  ...fixedLayers,
  ...baseLayers.flatMap(layer => furSlots.map(slot => maskPath(layer, slot))),
].map(loadLayer)));

function imageFor(layer: string) {
  const image = images.get(layer);
  if (!image) throw Error(`缺少图层 · ${layer}`);
  return image;
}

function makeLayer() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw Error('无法初始化图层画布');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

const tinted = new Map<string, HTMLCanvasElement>();
function furLayer(layer: string, palette: Config['palette']) {
  const source = imageFor(layer);
  if (palette === 'C01') return source;
  const key = `${layer}/${palette}`;
  const cached = tinted.get(key);
  if (cached) return cached;

  const result = makeLayer();
  const mask = makeLayer();
  result.ctx.drawImage(source, 0, 0);
  furSlots.forEach((slot, index) => {
    mask.ctx.clearRect(0, 0, SIZE, SIZE);
    mask.ctx.drawImage(imageFor(maskPath(layer, slot)), 0, 0);
    mask.ctx.globalCompositeOperation = 'source-in';
    mask.ctx.fillStyle = palettes[palette][index];
    mask.ctx.fillRect(0, 0, SIZE, SIZE);
    mask.ctx.globalCompositeOperation = 'source-over';
    result.ctx.drawImage(mask.canvas, 0, 0);
  });
  tinted.set(key, result.canvas);
  return result.canvas;
}

const headWithPattern = new Map<Config['palette'], HTMLCanvasElement>();
function headLayer(palette: Config['palette'], pattern: string) {
  const base = furLayer('frames/M1_head_base', palette);
  if (pattern === 'P00') return base;
  const cached = headWithPattern.get(palette);
  if (cached) return cached;

  // P02 belongs to the head surface. Combine it with the head before
  // placing that surface over the body so the opaque head cannot hide the markings.
  const head = makeLayer();
  head.ctx.drawImage(base, 0, 0);
  head.ctx.globalCompositeOperation = 'source-atop';
  head.ctx.drawImage(imageFor('parts/M1_pattern_P02'), 0, 0);
  headWithPattern.set(palette, head.canvas);
  return head.canvas;
}

function availability(config: Config) {
  return Object.entries(art).flatMap(([key, ids]) => {
    const id = config[key as keyof typeof art];
    return (ids as readonly string[]).includes(id) ? [] : [id];
  });
}

export function render(canvas: HTMLCanvasElement, config: Config, _action: Action = 'sit', _frame = 0) {
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw Error('无法初始化 Canvas');

  const unavailable = availability(config);
  ctx.imageSmoothingEnabled = false;
  canvas.title = unavailable.length ? `G2a 图层待交付 · ${unavailable.join(' / ')}` : '';
  canvas.setAttribute('aria-label', canvas.title || '宠物像素预览');

  try {
    ctx.drawImage(furLayer('parts/M1_tail_T01', config.palette), 0, 0);
    ctx.drawImage(furLayer('frames/M1_body', config.palette), 0, 0);
    ctx.drawImage(headLayer(config.palette, config.pattern === 'P02' ? 'P02' : 'P00'), 0, 0);
    const ear = art.ear.find(id => id === config.ear) ?? 'E01';
    const eye = art.eye.find(id => id === config.eye) ?? 'Y01';
    ctx.drawImage(furLayer(`parts/M1_ear_${ear}`, config.palette), 0, 0);
    ctx.drawImage(imageFor(`parts/M1_eye_${eye}`), 0, 0);
    ctx.drawImage(imageFor(`parts/M1_muzzle_${config.muzzle}`), 0, 0);
  } catch (error) {
    canvas.title = error instanceof Error ? error.message : String(error);
    canvas.setAttribute('aria-label', canvas.title);
    ctx.clearRect(0, 0, SIZE, SIZE);
    // The export caller reports asset failures through its existing status UI.
    if (!canvas.isConnected) throw error;
  }
}
export function png(config: Config, scale: 1 | 2 | 4) {
  const unavailable = availability(config);
  if (unavailable.length) throw Error(`G2a 图层待交付 · ${unavailable.join(' / ')}`);
  const source = document.createElement('canvas');
  render(source, config);
  const output = document.createElement('canvas');
  output.width = output.height = SIZE * scale;
  const ctx = output.getContext('2d');
  if (!ctx) throw Error('无法初始化 PNG 画布');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, output.width, output.height);
  return new Promise<Blob>((resolve, reject) => {
    output.toBlob(blob => blob ? resolve(blob) : reject(Error(`${scale}× PNG 编码失败`)), 'image/png');
  });
}

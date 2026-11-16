/// <reference types="vite/client" />

import { blackCatCoat, catOptions, catWalkFrames, orangeCatOptions, type CatConfig, type PetConfig } from './cat';
import { irisColors, palettes, type Config } from './model';

export const SIZE = 160;
const CAT_SIZE = 320;
export type TypingMode = 'gentle' | 'fast';
export type CatPose = { typingMode?: TypingMode; stretch?: number };
export type Action = 'sit' | 'left' | 'right' | 'typing';
export const actions: Readonly<Record<Action, number>> = { sit: 80, left: 6, right: 6, typing: 4 };

export function frameCount(config: PetConfig, action: Action) {
  return config.frame === 'CAT' && (action === 'left' || action === 'right') ? catWalkFrames : actions[action];
}

const art = {
  tail: ['T01', 'T02'],
  ear: ['E01', 'E02', 'E03', 'E04'],
  eye: ['Y01', 'Y02', 'Y03', 'Y04'],
  muzzle: ['N01', 'N02', 'N03'],
} as const;

const runBodies = Array.from({ length: 6 }, (_, i) => `motion/run_body_${i}`);
const typingPaws = ['left_0', 'left_1', 'right_0', 'right_1'].map(id => `motion/type_paw_${id}`);
const baseLayers = [
  ...runBodies,
  ...typingPaws,
  'motion/type_body',
  'motion/run_head',
  ...art.tail.map(id => `motion/run_tail_${id}`),
  ...art.ear.map(id => `motion/run_ear_${id}`),
  ...art.muzzle.map(id => `motion/run_muzzle_${id}`),
  'frames/M1_body',
  'frames/M1_head_base',
  'parts/M1_face_P01',
  'parts/M1_face_P02',
  ...art.tail.map(id => `parts/M1_tail_${id}`),
  ...art.ear.map(id => `parts/M1_ear_${id}`),
];
const fixedLayers = [
  'motion/type_keyboard',
  'motion/type_screen',
  'motion/run_face_P01',
  'motion/run_face_P02',
  ...art.eye.map(id => `motion/run_eye_${id}`),
  ...art.eye.map(id => `parts/M1_eye_${id}`),
  ...art.muzzle.map(id => `parts/M1_muzzle_${id}`),
];
const visibleIris = ['Y01', 'Y03', 'Y04'] as const;
const irisPath = (layer: string) => `masks/${layer.split('/').at(-1)}_iris`;
const furSlots = ['g', 's', 'l'] as const;
type FurSlot = typeof furSlots[number];
const maskPath = (layer: string, slot: FurSlot) => `masks/${layer.split('/').at(-1)}_${slot}`;

function loadLayer(layer: string) {
  const size = layer.startsWith('cat/hd/') || layer.startsWith('cat/new_/') ? CAT_SIZE : SIZE;
  const image = new Image();
  image.src = `${import.meta.env.BASE_URL}assets/${layer}.png`;
  return image.decode().then(() => {
    if (image.naturalWidth !== size || image.naturalHeight !== size) throw Error(`图层尺寸错误 · ${layer}`);
    return [layer, image] as const;
  }).catch((error: unknown) => {
    console.error(`无法加载图层 · ${layer}`, error);
    return [layer, null] as const;
  });
}

// Decode before mounting React so preview and export share the synchronous renderer.
const images = new Map<string, HTMLImageElement | null>();
export const assetsReady = Promise.all([
  ...baseLayers,
  ...fixedLayers,
  ...visibleIris.flatMap(id => [irisPath(`parts/M1_eye_${id}`), irisPath(`motion/run_eye_${id}`)]),
  ...baseLayers.flatMap(layer => furSlots.map(slot => maskPath(layer, slot))),
  maskPath('parts/M1_eye_Y01', 'g'),
  maskPath('parts/M1_eye_Y01', 's'),
  maskPath('parts/M1_muzzle_N01', 's'),
  maskPath('parts/M1_muzzle_N01', 'l'),
].map(loadLayer)).then(entries => {
  for (const [name, image] of entries) images.set(name, image);
});

const catWalkBodies = Array.from({ length: catWalkFrames }, (_, index) => `walk_body_${index}`);
const extraCatMuzzles = Object.keys(catOptions.muzzle).filter(id => id !== 'CN01');
const catEyes = Object.keys(catOptions.eye);
const catWalkFurLayers = [
  ...catWalkBodies, 'walk_head', 'walk_head_alt', 'walk_ears', 'walk_tail', 'walk_muzzle',
  'walk_ear_CE02', 'walk_ear_CE04',
  ...extraCatMuzzles.map(id => `walk_muzzle_${id}`),
];
const catCalicoLayers = new Set([
  ...catWalkBodies, 'walk_head', 'walk_head_alt', 'walk_tail',
]);
const catFurSlots = ['g', 's', 'l', 'w', 'd'] as const;
const catMarkings = ['P01', 'P02'] as const;
let catAssets: Promise<void> | undefined;
const orangePath = 'cat/new_/CAT_';
const breedLaptop = 'cat/hd/breeds/typing_laptop';
const breedPath = (palette: CatConfig['palette']) => `cat/hd/breeds/${palette}/`;
const catFrontEars = { CE01: 'upright', CE02: 'folded', CE03: 'round', CE04: 'droopy', CE05: 'curled' } as const;
const commonFrontLayers = [
  'body', 'iris',
  ...Object.values(catFrontEars).map(id => `ear_${id}`),
  ...['CN02', 'CN03', 'CN04'].map(id => `muzzle_${id}`),
  ...['P01', 'P02', 'P06'].map(id => `face_${id}`),
  'typing_body',
  ...Array.from({ length: 4 }, (_, i) => [`typing_arms_gentle_${i}`, `typing_arms_fast_${i}`]).flat(),
  ...[0, 1, 2].map(i => `typing_front_${i}`),
];
const orangeLayers = [
  ...commonFrontLayers, 'head_base', 'typing_laptop',
  ...Object.keys(orangeCatOptions.accessory).filter(id => id !== 'A00').map(id => `accessory_${id}`),
];
const breedLayers = [
  ...commonFrontLayers, 'head', 'eyes', 'aperture', 'muzzle_CN01', 'eye_Y02',
  ...catEyes.filter(id => id !== 'Y01' && id !== 'Y02')
    .flatMap(id => [`eye_${id}`, `eye_${id}_iris`, `eye_${id}_aperture`]),
];
export function prepareCatAssets() {
  return catAssets ??= Promise.all([
    breedLaptop,
    ...orangeLayers.map(layer => orangePath + layer),
    ...(['CC02', 'CC03', 'CC04'] as const).flatMap(palette => breedLayers.map(layer => breedPath(palette) + layer)),
    ...catWalkFurLayers.flatMap(layer => [
      `cat/${layer}`,
      ...catFurSlots.map(slot => `cat/masks/${layer}_${slot}`),
      ...(catCalicoLayers.has(layer) ? [`cat/masks/${layer}_calico`, `cat/masks/${layer}_calico_right`] : []),
    ]),
    ...catEyes.map(eye => `cat/walk_eye_${eye}`),
    ...catEyes.filter(eye => eye !== 'Y02').map(eye => `cat/masks/walk_eye_${eye}_iris`),
    ...catMarkings.map(mark => `cat/walk_face_${mark}`),
  ].map(loadLayer)).then(entries => {
    for (const [name, image] of entries) {
      if (!image) throw Error(`缺少猫图层 · ${name}`);
      images.set(name, image);
    }
  });
}

function imageFor(layer: string) {
  const image = images.get(layer);
  if (!image) throw Error(`缺少图层 · ${layer}`);
  return image;
}

function makeLayer(size = SIZE) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw Error('无法初始化图层画布');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

export type Gaze = { x: number; y: number };
const noGaze: Gaze = { x: 0, y: 0 };

const gazeFrameCache = new Map<string, HTMLCanvasElement>();

const tinted = new Map<string, HTMLCanvasElement>();

function paintMask(mask: CanvasRenderingContext2D, layer: string, color: string) {
  mask.clearRect(0, 0, mask.canvas.width, mask.canvas.height);
  mask.drawImage(imageFor(layer), 0, 0);
  mask.globalCompositeOperation = 'source-in';
  mask.fillStyle = color;
  mask.fillRect(0, 0, mask.canvas.width, mask.canvas.height);
  mask.globalCompositeOperation = 'source-over';
}
function furLayer(layer: string, palette: Config['palette'], slots: readonly FurSlot[] = furSlots) {
  const source = imageFor(layer);
  if (palette === 'C01') return source;
  const key = `${layer}/${palette}`;
  const cached = tinted.get(key);
  if (cached) return cached;

  const result = makeLayer();
  const mask = makeLayer();
  result.ctx.drawImage(source, 0, 0);
  slots.forEach(slot => {
    paintMask(mask.ctx, maskPath(layer, slot), palettes[palette][furSlots.indexOf(slot)]);
    result.ctx.drawImage(mask.canvas, 0, 0);
  });
  tinted.set(key, result.canvas);
  return result.canvas;
}

function eyeLayer(config: Config, side = false) {
  const layer = side ? `motion/run_eye_${config.eye}` : `parts/M1_eye_${config.eye}`;
  const base = !side && config.eye === 'Y01' ? furLayer(layer, config.palette, ['g', 's']) : imageFor(layer);
  if (config.eyeColor === 'natural' || config.eye === 'Y02') return base;
  const key = `${layer}/${config.palette}/${config.eyeColor}`;
  const cached = tinted.get(key);
  if (cached) return cached;

  const iris = makeLayer();
  iris.ctx.drawImage(imageFor(irisPath(layer)), 0, 0);
  iris.ctx.globalCompositeOperation = 'source-in';
  iris.ctx.fillStyle = irisColors[config.eyeColor];
  iris.ctx.fillRect(0, 0, SIZE, SIZE);

  const result = makeLayer();
  result.ctx.drawImage(base, 0, 0);
  result.ctx.drawImage(iris.canvas, 0, 0);
  tinted.set(key, result.canvas);
  return result.canvas;
}

function availability(config: Config) {
  return Object.entries(art).flatMap(([key, ids]) => {
    const id = config[key as keyof typeof art];
    return (ids as readonly string[]).includes(id) ? [] : [id];
  });
}

function drawRun(ctx: CanvasRenderingContext2D, config: Config, frame: number) {
  const rise = [0, 0, -2, -1, 1, 0][frame]!;
  const tailAngle = [-0.04, 0.02, 0.07, 0.03, -0.035, -0.07][frame]!;
  ctx.save();
  ctx.translate(105, 84);
  ctx.rotate(tailAngle);
  ctx.drawImage(furLayer(`motion/run_tail_${config.tail}`, config.palette), -105, -84);
  ctx.restore();
  ctx.drawImage(furLayer(runBodies[frame]!, config.palette), 0, 0);
  ctx.drawImage(furLayer('motion/run_head', config.palette), 0, rise);
  if (config.pattern === 'P01' || config.pattern === 'P06') {
    ctx.drawImage(imageFor('motion/run_face_P01'), 0, rise);
  }
  if (config.pattern === 'P02' || config.pattern === 'P06') {
    ctx.drawImage(imageFor('motion/run_face_P02'), 0, rise);
  }
  ctx.drawImage(furLayer(`motion/run_ear_${config.ear}`, config.palette), 0, rise);
  ctx.drawImage(eyeLayer(config, true), 0, rise);
  ctx.drawImage(furLayer(`motion/run_muzzle_${config.muzzle}`, config.palette), 0, rise);
}

function drawFront(ctx: CanvasRenderingContext2D, config: Config, typing: boolean, frame: number) {
  const bounce = typing ? 0 : frame % 36 >= 17 && frame % 36 < 30 ? -1 : 0;
  ctx.translate(0, bounce);
  ctx.save();
  if (!typing && frame >= 30 && frame <= 40) {
    // Keep the hidden attachment point inside the haunch while the tail swings.
    const [x, y] = config.tail === 'T01' ? [103, 98] : [109, 121];
    ctx.translate(x, y);
    ctx.rotate(Math.sin((frame - 30) * Math.PI / 5) * 0.12);
    ctx.translate(-x, -y);
  }
  ctx.drawImage(furLayer(`parts/M1_tail_${config.tail}`, config.palette), 0, 0);
  ctx.restore();

  ctx.drawImage(furLayer(typing ? 'motion/type_body' : 'frames/M1_body', config.palette), 0, 0);
  const nod = typing && frame % 2 === 0 ? 2 : 0;
  ctx.drawImage(furLayer('frames/M1_head_base', config.palette), 0, nod);
  if (config.pattern === 'P02' || config.pattern === 'P06') {
    ctx.drawImage(furLayer('parts/M1_face_P02', config.palette), 0, nod);
  }
  if (config.pattern === 'P01' || config.pattern === 'P06') {
    ctx.drawImage(furLayer('parts/M1_face_P01', config.palette), 0, nod);
  }
  ctx.drawImage(furLayer(`parts/M1_ear_${config.ear}`, config.palette), 0, nod);
  const blink = !typing && frame >= 25 && frame <= 26;
  ctx.drawImage(eyeLayer(blink ? { ...config, eye: 'Y02' } : config), 0, nod + (typing ? 1 : 0));
  const muzzle = `parts/M1_muzzle_${config.muzzle}`;
  ctx.drawImage(config.muzzle === 'N01' ? furLayer(muzzle, config.palette, ['s', 'l']) : imageFor(muzzle), 0, nod);
  if (typing) {
    ctx.drawImage(imageFor('motion/type_keyboard'), 0, 0);
    const taps = [[0, 1], [1, 1], [1, 0], [0, 0]][frame]!;
    ctx.drawImage(furLayer(`motion/type_paw_left_${taps[0]}`, config.palette), 0, 0);
    ctx.drawImage(furLayer(`motion/type_paw_right_${taps[1]}`, config.palette), 0, 0);
    ctx.drawImage(imageFor('motion/type_screen'), 0, 0);
  }
}

function catWalkFur(layer: string, palette: CatConfig['palette'], side: 'left' | 'right') {
  const source = imageFor(`cat/${layer}`);
  if (palette === 'CC01' || (palette === 'CC03' && !catCalicoLayers.has(layer))) return source;
  const otherFlank = palette === 'CC03' && side === 'right';
  const key = `cat/${layer}/${palette}${otherFlank ? '/right' : ''}`;
  const existing = tinted.get(key);
  if (existing) return existing;

  const result = makeLayer();
  const mask = makeLayer();
  result.ctx.drawImage(source, 0, 0);
  const apply = (slot: string, color: string) => {
    paintMask(mask.ctx, `cat/masks/${layer}_${slot}`, color);
    result.ctx.drawImage(mask.canvas, 0, 0);
  };
  if (palette === 'CC04') {
    const point = /ear|tail|muzzle/.test(layer);
    const colors = point
      ? ['#704932', '#4C2D20', '#946B4F', '#956B4C', '#63412D']
      : ['#F6E3CA', '#E9CDAE', '#FFF2DF', '#FFF9EF', '#9B7054'];
    catFurSlots.forEach((slot, index) => apply(slot, colors[index]!));
  } else if (palette === 'CC02') {
    catFurSlots.forEach((slot, index) => apply(slot, blackCatCoat[index]!));
  } else {
    result.ctx.drawImage(imageFor(`cat/masks/${layer}_calico${otherFlank ? '_right' : ''}`), 0, 0);
  }
  tinted.set(key, result.canvas);
  return result.canvas;
}

function tintCatEye(sourcePath: string, irisMask: string, color?: string) {
  const source = imageFor(sourcePath);
  if (!color) return source;
  const key = `${sourcePath}/${color}`;
  const cached = tinted.get(key);
  if (cached) return cached;
  const result = makeLayer(source.naturalWidth);
  const mask = makeLayer(source.naturalWidth);
  paintMask(mask.ctx, irisMask, color);
  result.ctx.drawImage(source, 0, 0);
  result.ctx.drawImage(mask.canvas, 0, 0);
  tinted.set(key, result.canvas);
  return result.canvas;
}

function gazeEye(sourcePath: string, irisMask: string, aperture: string, irisColor: string | undefined, gaze: Gaze) {
  const key = `${sourcePath}/${irisColor ?? 'natural'}/${gaze.x}/${gaze.y}`;
  const cached = gazeFrameCache.get(key);
  if (cached) return cached;

  const source = imageFor(sourcePath);
  const size = source.naturalWidth;
  // The bundled PNGs can be composited under WebKit's file-origin rules.
  const pupil = makeLayer(size);
  pupil.ctx.drawImage(tintCatEye(sourcePath, irisMask, irisColor), 0, 0);
  pupil.ctx.globalCompositeOperation = 'destination-in';
  pupil.ctx.drawImage(imageFor(aperture), 0, 0);

  const socket = makeLayer(size);
  paintMask(socket.ctx, aperture, aperture === irisMask ? '#442416' : '#fff9ef');
  const shifted = makeLayer(size);
  shifted.ctx.drawImage(pupil.canvas, gaze.x * size / SIZE, gaze.y * size / SIZE);
  shifted.ctx.globalCompositeOperation = 'destination-in';
  shifted.ctx.drawImage(source, 0, 0);

  const result = makeLayer(size);
  result.ctx.drawImage(source, 0, 0);
  result.ctx.drawImage(socket.canvas, 0, 0);
  result.ctx.drawImage(shifted.canvas, 0, 0);
  // Avoid retaining a full 320px canvas for every color, breed, and pointer position.
  const oldest = gazeFrameCache.keys().next().value;
  if (gazeFrameCache.size >= 64 && oldest) gazeFrameCache.delete(oldest);
  gazeFrameCache.set(key, result.canvas);
  return result.canvas;
}

function walkCatEye(config: CatConfig, gaze: Gaze) {
  const source = `cat/walk_eye_${config.eye}`;
  if (config.eye === 'Y02') return imageFor(source);
  const irisMask = `cat/masks/walk_eye_${config.eye}_iris`;
  const color = config.eyeColor === 'natural'
    ? (config.palette === 'CC02' ? '#C5D856' : undefined)
    : irisColors[config.eyeColor];
  if (gaze.x || gaze.y) return gazeEye(source, irisMask, irisMask, color, gaze);
  return tintCatEye(source, irisMask, color);
}

function frontCatEye(config: CatConfig, eye: CatConfig['eye'], gaze: Gaze) {
  const path = breedPath(config.palette);
  const alternate = eye === 'Y01' ? '' : `eye_${eye}_`;
  const source = path + (eye === 'Y01' ? 'eyes' : `eye_${eye}`);
  if (eye === 'Y02') return imageFor(source);
  const irisMask = path + alternate + 'iris';
  const defaultColor = config.palette === 'CC03' ? 'green' : config.palette === 'CC04' ? 'blue' : 'natural';
  const color = config.eyeColor === 'natural' || config.eyeColor === defaultColor ? undefined : irisColors[config.eyeColor];
  if (gaze.x || gaze.y) return gazeEye(source, irisMask, path + alternate + 'aperture', color, gaze);
  return tintCatEye(source, irisMask, color);
}

const orangeIris = new Map<string, HTMLCanvasElement>();
function drawCatFront(ctx: CanvasRenderingContext2D, config: CatConfig, typing: boolean, frame: number, gaze: Gaze, pose: CatPose) {
  const orange = config.palette === 'CC01';
  const path = orange ? orangePath : breedPath(config.palette);
  const accessory = config.accessory === 'A07' ? 'A06' : config.accessory;
  const mode = pose.typingMode ?? 'gentle';
  // Work in actual 320px coordinates; the outer renderer uses 160 logical units.
  ctx.save();
  ctx.scale(0.5, 0.5);
  const draw = (layer: string) => ctx.drawImage(imageFor(path + layer), 0, 0);
  const stretch = typing ? 0 : pose.stretch ?? 0;
  if (!typing && frame >= 17 && frame < 30) ctx.translate(0, -2);
  if (stretch) {
    ctx.translate(160, 278);
    ctx.scale(1 + Math.abs(stretch) * 0.11, 1 - Math.abs(stretch) * 0.055);
    ctx.translate(-160, -278);
  }
  if (typing) {
    draw('typing_body');
    draw(`typing_arms_${mode}_${frame}`);
  } else {
    draw('body');
  }
  ctx.save();
  if (typing) {
    ctx.translate(24, 4);
    ctx.scale(0.88, 0.88);
  } else if (stretch) ctx.translate(2 * Math.round(stretch * 7), 0);
  draw(orange ? 'head_base' : 'head');
  draw(`ear_${catFrontEars[config.ear]}`);
  if (config.pattern !== 'P00') draw(`face_${config.pattern}`);
  if (!orange) {
    const eye = !typing && frame >= 25 && frame <= 26 ? 'Y02' : config.eye;
    ctx.drawImage(frontCatEye(config, eye, typing ? noGaze : gaze), 0, 0);
  }
  if (!orange || config.muzzle !== 'CN01') draw(`muzzle_${config.muzzle}`);
  if (orange && config.eyeColor !== 'natural') {
    let iris = orangeIris.get(config.eyeColor);
    if (!iris) {
      const layer = makeLayer(CAT_SIZE);
      layer.ctx.drawImage(imageFor(orangePath + 'iris'), 0, 0);
      layer.ctx.globalCompositeOperation = 'source-in';
      layer.ctx.fillStyle = irisColors[config.eyeColor];
      layer.ctx.fillRect(0, 0, CAT_SIZE, CAT_SIZE);
      iris = layer.canvas;
      orangeIris.set(config.eyeColor, iris);
    }
    ctx.drawImage(iris, 0, 0);
  }
  if (accessory !== 'A00') ctx.drawImage(imageFor(`${orangePath}accessory_${accessory}`), 0, 0);
  ctx.restore();
  if (typing) {
    if (mode === 'fast' && frame < 3) draw(`typing_front_${frame}`);
    ctx.drawImage(imageFor(orange ? orangePath + 'typing_laptop' : breedLaptop), 0, 0);
  }
  ctx.restore();
}

function drawWalkingCat(ctx: CanvasRenderingContext2D, config: CatConfig, side: 'left' | 'right', frame: number, gaze: Gaze, pose: CatPose) {
  const headY = frame % 2;
  const drawFur = (layer: string, y = 0) => ctx.drawImage(catWalkFur(layer, config.palette, side), 0, y);
  const stretch = pose.stretch ?? 0;
  if (stretch) {
    ctx.translate(80, 139);
    ctx.scale(1 + Math.abs(stretch) * 0.11, 1 - Math.abs(stretch) * 0.055);
    ctx.translate(-80, -139);
  }
  drawFur('walk_tail', [0, -1, 0, 1][frame]);
  drawFur(catWalkBodies[frame]!);
  ctx.save();
  ctx.translate(Math.round(stretch * 7), 0);
  const sideEar = config.ear === 'CE03' ? 'CE01' : config.ear === 'CE05' ? 'CE02' : config.ear;
  if (sideEar === 'CE01') drawFur('walk_ears', headY);
  drawFur(sideEar === 'CE01' ? 'walk_head' : 'walk_head_alt', headY);
  for (const mark of catMarkings) {
    if (config.pattern === mark || config.pattern === 'P06') {
      ctx.drawImage(imageFor(`cat/walk_face_${mark}`), 0, headY);
    }
  }
  const look = side === 'right' ? { x: -gaze.x, y: gaze.y } : gaze;
  ctx.drawImage(walkCatEye(config, look), 0, headY, SIZE, SIZE);
  drawFur(config.muzzle === 'CN01' ? 'walk_muzzle' : `walk_muzzle_${config.muzzle}`, headY);
  if (sideEar !== 'CE01') drawFur(`walk_ear_${sideEar}`, headY);
  ctx.restore();
}

export function render(canvas: HTMLCanvasElement, config: PetConfig, action: Action = 'sit', frame = 0, gaze: Gaze = noGaze, catPose: CatPose = {}) {
  const size = config.frame === 'CAT' ? CAT_SIZE : SIZE;
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw Error('无法初始化 Canvas');

  const unavailable = config.frame === 'M1' ? availability(config) : [];
  ctx.resetTransform();
  ctx.clearRect(0, 0, size, size);
  ctx.scale(size / SIZE, size / SIZE);
  ctx.imageSmoothingEnabled = false;
  canvas.title = unavailable.length ? `素材待补充 · ${unavailable.join(' / ')}` : '';
  canvas.setAttribute('aria-label', canvas.title || '宠物像素预览');

  try {
    const pose = frame % frameCount(config, action);
    if (action === 'left' || action === 'right') {
      const left = makeLayer(size);
      left.ctx.scale(size / SIZE, size / SIZE);
      if (config.frame === 'CAT') drawWalkingCat(left.ctx, config, action, pose, gaze, catPose);
      else drawRun(left.ctx, config, pose);
      if (action === 'right') {
        ctx.translate(SIZE, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(left.canvas, 0, 0, SIZE, SIZE);
    } else if (config.frame === 'CAT') {
      drawCatFront(ctx, config, action === 'typing', pose, gaze, catPose);
    } else {
      drawFront(ctx, config, action === 'typing', pose);
    }
  } catch (error) {
    canvas.title = error instanceof Error ? error.message : String(error);
    canvas.setAttribute('aria-label', canvas.title);
    ctx.resetTransform();
    ctx.clearRect(0, 0, size, size);
    // The export caller reports asset failures through its existing status UI.
    if (!canvas.isConnected) throw error;
  }
}
export function png(config: Config, scale: 1 | 2 | 4) {
  const unavailable = availability(config);
  if (unavailable.length) throw Error(`素材待补充 · ${unavailable.join(' / ')}`);
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

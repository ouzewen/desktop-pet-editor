/// <reference types="vite/client" />

import { blackCatCoat, catIrisColors, catOptions, catWalkFrames, orangeCatOptions, type CatConfig, type PetConfig } from './cat';
import type { CatCustomization, CatPixelEdits } from './cat-custom';
import { paintBreedEars } from './cat-ears';
import { recolorCatCoat, type CatCoatSurface } from './cat-coat';
import { bodyPatternLayers, isLaptopFur, paintBodyPattern } from './cat-body-pattern';
import { paintCatTail } from './cat-tail';
import { clearForeheadFur, paintForeheadFur, paintHeadFur } from './cat-head-pattern';
import { catTypingFrameCount, lowTypingArms, type TypingAnimation } from './cat-typing';
import { createTypingArmPainter } from './cat-typing-paint';
import { recolorCatOutline, type OutlineVersion } from './cat-outline';
export type { OutlineVersion } from './cat-outline';
import { irisColors, palettes, type Config } from './model';

export const SIZE = 160;
const CAT_SIZE = 320;
export type TypingMode = 'gentle' | 'fast' | 'frenzy';
export type TypingLayout = 'aligned' | 'legacy';
export type LaptopVersion = 'clean' | 'original';
export type MarkingLayout = 'shared' | 'legacy';
export type { TypingAnimation } from './cat-typing';
export type CatPose = {
  typingMode?: TypingMode;
  typingLayout?: TypingLayout;
  typingAnimation?: TypingAnimation;
  laptopVersion?: LaptopVersion;
  outlineVersion?: OutlineVersion;
  typingEffects?: boolean;
  earLayout?: 'shared' | 'legacy';
  markingLayout?: MarkingLayout;
  stretch?: number;
  custom?: CatCustomization;
};
export type Action = 'sit' | 'left' | 'right' | 'typing';
export const actions: Readonly<Record<Action, number>> = { sit: 80, left: 6, right: 6, typing: 4 };

export function frameCount(config: PetConfig, action: Action) {
  if (config.frame !== 'CAT') return actions[action];
  if (action === 'typing') return catTypingFrameCount;
  return action === 'left' || action === 'right' ? catWalkFrames : actions[action];
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
  const atlas = /^cat\/hd\/typing-reference\/(?:arms|paws|sweat)_(?:gentle|fast|frenzy)$/.test(layer);
  const image = new Image();
  image.src = `${import.meta.env.BASE_URL}assets/${layer}.png`;
  return image.decode().then(() => {
    if (image.naturalWidth !== size || image.naturalHeight !== size * (atlas ? catTypingFrameCount : 1)) throw Error(`图层尺寸错误 · ${layer}`);
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
const extraCatMuzzles = Object.keys(catOptions.mouth).filter(id => id !== 'CN01');
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
const breedEyeGlints = 'cat/hd/breeds/eye_glints';
const facePartsPath = 'cat/hd/face-parts/';
const bodyPatternPath = 'cat/hd/body-patterns/';
const tailPath = 'cat/hd/tails/';
const typingEffectPath = 'cat/hd/typing-effects/';
const typingReferencePath = 'cat/hd/typing-reference/';
const headPatternPath = 'cat/hd/head-patterns/';
const foreheadParts = ['P01', 'P02', 'P04', 'P05', 'P06'];
const replacementTails = Object.keys(catOptions.tail).filter(tail => tail !== 'CT01');
const walkEyeGlints = 'cat/walk_eye_Y01_glints';
const breedPath = (palette: CatConfig['palette']) => `cat/hd/breeds/${palette}/`;
type FrontBreed = Exclude<CatConfig['palette'], 'CC01'>;
type LegacyFrontBreed = 'CC02' | 'CC03' | 'CC04';
const sharedBreedParts: Record<FrontBreed, LegacyFrontBreed> = {
  CC02: 'CC02', CC03: 'CC03', CC04: 'CC04',
  CC05: 'CC03', CC06: 'CC03', CC07: 'CC03', CC08: 'CC04',
};
const frontBreedPalettes = Object.keys(catOptions.palette)
  .filter((palette): palette is FrontBreed => palette !== 'CC01');
const catFrontEars = { CE01: 'upright', CE02: 'folded', CE03: 'round', CE04: 'droopy', CE05: 'curled' } as const;
const alternateFrontEars = Object.values(catFrontEars).filter(shape => shape !== 'upright');
const earMaskPath = 'cat/hd/ear-masks/';
const frontFaceMarkings = ['P01', 'P02', 'P06'].map(id => `face_${id}`);
const orangeLayers = [
  ...bodyPatternLayers, ...frontFaceMarkings, 'iris', 'head_base', 'eye_glints', 'typing_laptop',
  ...Object.values(catFrontEars).map(id => `ear_${id}`),
  ...Object.keys(orangeCatOptions.accessory).filter(id => id !== 'A00').map(id => `accessory_${id}`),
];
const breedLayers = [
  ...bodyPatternLayers, 'iris', 'head', 'ear_upright', 'eyes', 'aperture',
];
const legacyBreedLayers = [
  ...frontFaceMarkings, 'eye_Y02',
  ...catEyes.filter(id => id !== 'Y01' && id !== 'Y02')
    .flatMap(id => [`eye_${id}`, `eye_${id}_iris`]),
  ...['Y03', 'Y04', 'Y05', 'Y06'].map(id => `eye_${id}_aperture`),
  // Historical ears are read only when calculating paint changes from older pixel editor saves.
  ...alternateFrontEars.map(shape => `ear_${shape}`),
];
export function prepareCatAssets() {
  return catAssets ??= Promise.all([
    breedLaptop,
    breedEyeGlints,
    ...['effort_eyes', 'orange_eye_patch', 'sweat_0', 'sweat_1', 'sweat_2'].map(part => typingEffectPath + part),
    ...['gentle', 'fast', 'frenzy'].flatMap(mode => ['arms_', 'paws_'].map(part => typingReferencePath + part + mode)),
    ...['sweat_fast', 'sweat_frenzy', 'effort_eyes', 'mouth_flat', 'mouth_smile', 'mouth_region', 'laptop'].map(part => typingReferencePath + part),
    ...['forehead_region', 'face_region', 'face_patterns', ...foreheadParts.map(part => `forehead_${part}`)]
      .map(part => headPatternPath + part),
    ...Object.keys(catOptions.palette).map(palette => facePartsPath + palette),
    ...bodyPatternLayers.map(part => bodyPatternPath + part),
    ...['idle', 'typing'].flatMap(pose => [
      tailPath + pose + '_remove',
      ...replacementTails.flatMap(tail => [tailPath + pose + '_' + tail, tailPath + pose + '_' + tail + '_patterns']),
    ]),
    walkEyeGlints,
    ...alternateFrontEars.map(shape => earMaskPath + shape),
    ...orangeLayers.map(layer => orangePath + layer),
    ...frontBreedPalettes.flatMap(palette => {
      const layers = sharedBreedParts[palette] === palette ? [...breedLayers, ...legacyBreedLayers] : breedLayers;
      return layers.map(layer => breedPath(palette) + layer);
    }),
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

export function makeLayer(size = SIZE) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw Error('无法初始化图层画布');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

export type Gaze = { x: number; y: number; space?: 'pointer' };
export const horizontalGazeRange = { min: -16, max: 2 };
export const pointerGazeLimit = 100;
const noGaze: Gaze = { x: 0, y: 0 };

function pointerGlintOffset(gaze: Gaze, centerX: number, centerY: number, radiusX: number, radiusY: number) {
  const distance = Math.hypot(gaze.x, gaze.y);
  const strength = Math.min(1, distance / pointerGazeLimit);
  const divisor = Math.max(distance, pointerGazeLimit);
  // Move from the painted rest position towards a point in the pupil.
  return {
    x: centerX * strength + radiusX * gaze.x / divisor,
    y: centerY * strength + radiusY * gaze.y / divisor,
  };
}

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

function catWalkFur(layer: string, palette: 'CC01' | LegacyFrontBreed, side: 'left' | 'right') {
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

function coloredCatIris(irisMask: string, color: string) {
  const key = `${irisMask}/${color}`;
  const cached = tinted.get(key);
  if (cached) return cached;
  const mask = makeLayer(imageFor(irisMask).naturalWidth);
  paintMask(mask.ctx, irisMask, color);
  tinted.set(key, mask.canvas);
  return mask.canvas;
}

function coloredInnerPupil(path: string, color: string) {
  const key = `${path}innerPupil/${color}`;
  const cached = tinted.get(key);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(coloredCatIris(path + 'aperture', color), 0, 0);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(imageFor(path + 'iris'), 0, 0);
  tinted.set(key, canvas);
  return canvas;
}

function tintCatEye(sourcePath: string, irisMask: string, color?: string) {
  const source = imageFor(sourcePath);
  if (!color) return source;
  const key = `${sourcePath}/${irisMask}/${color}`;
  const cached = tinted.get(key);
  if (cached) return cached;
  const result = makeLayer(source.naturalWidth);
  result.ctx.drawImage(source, 0, 0);
  result.ctx.drawImage(coloredCatIris(irisMask, color), 0, 0);
  tinted.set(key, result.canvas);
  return result.canvas;
}

function walkCatEye(config: CatConfig) {
  const source = `cat/walk_eye_${config.eye}`;
  if (config.eye === 'Y02') return imageFor(source);
  const irisMask = `cat/masks/walk_eye_${config.eye}_iris`;
  const color = config.eyeColor === 'natural'
    ? (config.palette === 'CC02' ? '#C5D856' : undefined)
    : catIrisColors[config.eyeColor];
  return tintCatEye(source, irisMask, color);
}

const naturalFrontIris = {
  CC02: '#8F9B43', CC03: '#6B9756', CC04: '#6695D0',
  CC05: '#C1831A', CC06: '#326337', CC07: '#9B973C', CC08: '#478CC9',
} as const satisfies Record<FrontBreed, string>;

function frontCatEye(palette: FrontBreed, config: CatConfig, eye: CatConfig['eye']) {
  const template = eye === 'Y01' ? palette : sharedBreedParts[palette];
  const path = breedPath(template);
  const alternate = eye === 'Y01' ? '' : `eye_${eye}_`;
  const source = path + (eye === 'Y01' ? 'eyes' : `eye_${eye}`);
  if (eye === 'Y02') return imageFor(source);
  const single = config.innerPupil === 'none' && eye !== 'Y07';
  const irisMask = path + alternate + (single ? 'aperture' : 'iris');
  const defaultColor = palette === 'CC03' ? 'green' : palette === 'CC04' ? 'blue' : 'natural';
  const color = config.eyeColor === 'natural' || config.eyeColor === defaultColor
    ? (single || template !== palette ? naturalFrontIris[palette] : undefined) : catIrisColors[config.eyeColor];
  return tintCatEye(source, irisMask, color);
}

export function catHeadPlacement(typing: boolean, frame: number, layout: TypingLayout = 'aligned') {
  if (typing && layout === 'legacy') return { x: 24, y: 4, scale: 0.88 };
  return { x: 0, y: !typing && frame >= 17 && frame < 30 ? -2 : 0, scale: 1 };
}

export function alignTypingLayer(image: CanvasImageSource) {
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  const draftLeft = 24, draftWidth = 282, draftTop = 4;
  const draftNeck = 159, neck = 176, floor = 286;
  // Match the head above the neck and keep the laptop grounded below it.
  ctx.drawImage(image, draftLeft, draftTop, draftWidth, draftNeck - draftTop, 0, 0, CAT_SIZE, neck);
  ctx.drawImage(image, draftLeft, draftNeck, draftWidth, floor - draftNeck, 0, neck, CAT_SIZE, floor - neck);
  ctx.drawImage(image, draftLeft, floor, draftWidth, CAT_SIZE - floor, 0, floor, CAT_SIZE, CAT_SIZE - floor);
  return canvas;
}

const alignedTypingLayers = new Map<string, HTMLCanvasElement>();
function typingLayer(path: string, layout: TypingLayout | undefined) {
  if (layout === 'legacy') return imageFor(path);
  const cached = alignedTypingLayers.get(path);
  if (cached) return cached;
  const layer = alignTypingLayer(imageFor(path));
  alignedTypingLayers.set(path, layer);
  return layer;
}

export function catTypingLaptop(config: CatConfig, layout?: TypingLayout, version: LaptopVersion = 'clean') {
  // The new prop is already drawn in aligned coordinates and has no breed fur.
  // Historic raw-coordinate sources must continue using their original cel.
  if (version === 'clean' && layout !== 'legacy') return imageFor(typingReferencePath + 'laptop');
  if (config.tail !== 'CT01') return typingLayer(breedLaptop, layout);
  if (config.palette !== 'CC01') return typingLayer(breedLaptop, layout);
  // The orange cel contains a small stretch of tail next to the laptop.
  if (config.bodyPattern !== 'native') {
    return patternedBodyLayer(orangePath + 'typing_laptop', 'typing_body', config, layout, true);
  }
  return frontCoatLayer(typingLayer(orangePath + 'typing_laptop', layout), config, 'laptop');
}

type CatLayer = HTMLImageElement | HTMLCanvasElement;
let connectedTypingBody: { source: CatLayer; key: string; canvas: HTMLCanvasElement } | undefined;

function bodyWithTypingConnector(body: CatLayer, config: CatConfig, layout: TypingLayout | undefined, version: LaptopVersion) {
  if (version !== 'clean' || layout === 'legacy' || config.palette !== 'CC01' || config.tail !== 'CT01') return body;
  const key = `${config.coat}/${config.bodyPattern}`;
  if (connectedTypingBody?.source === body && connectedTypingBody.key === key) return connectedTypingBody.canvas;
  const connector = makeLayer(CAT_SIZE);
  // The old orange prop contains 84 extra opaque fur pixels at the tail root.
  // Mask away the common prop after its original fur recoloring, preserving
  // that connector exactly without carrying any computer-edge pixels with it.
  connector.ctx.drawImage(catTypingLaptop(config, layout, 'original'), 0, 0);
  connector.ctx.globalCompositeOperation = 'destination-out';
  connector.ctx.drawImage(typingLayer(breedLaptop, layout), 0, 0);
  const merged = makeLayer(CAT_SIZE);
  merged.ctx.drawImage(body, 0, 0);
  merged.ctx.drawImage(connector.canvas, 0, 0);
  // Treat the connector as fur so custom torso edits can cover it in every pose.
  connectedTypingBody = { source: body, key, canvas: merged.canvas };
  return merged.canvas;
}

const frontCoatLayers = new WeakMap<CatLayer, { key: string; canvas: HTMLCanvasElement }>();
let orangeEyePixels: Uint8ClampedArray | undefined;

function frontCoatLayer(source: CatLayer, { palette, coat }: CatConfig, surface: CatCoatSurface = 'fur') {
  if (coat === 'native') return source;
  const key = `${palette}/${coat}/${surface}`;
  const cached = frontCoatLayers.get(source);
  if (cached?.key === key) return cached.canvas;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0);
  const pixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
  if (surface === 'orange-head' && !orangeEyePixels) {
    ctx.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
    ctx.drawImage(imageFor(orangePath + 'iris'), 0, 0);
    orangeEyePixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE).data;
  }
  recolorCatCoat(pixels, palette, coat, surface, orangeEyePixels);
  ctx.putImageData(pixels, 0, 0);
  frontCoatLayers.set(source, { key, canvas });
  return canvas;
}

const outlinedLayers = new WeakMap<CatLayer, { coat: string; guide: CatLayer; head: boolean; canvas: HTMLCanvasElement }>();
const outlineGuides = new WeakMap<CatLayer, Uint8ClampedArray>();

function outlinedCatLayer(
  source: CatLayer, guide: CatLayer, config: CatConfig, version: OutlineVersion = 'original', head = false,
): CatLayer {
  if (version === 'original' || config.coat === 'native') return source;
  const cached = outlinedLayers.get(source);
  if (cached?.coat === config.coat && cached.guide === guide && cached.head === head) return cached.canvas;
  let guidePixels = outlineGuides.get(guide);
  if (!guidePixels) {
    guidePixels = layerPixels(guide).data;
    outlineGuides.set(guide, guidePixels);
  }
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  const pixels = layerPixels(source);
  recolorCatOutline(pixels, guidePixels, config, head);
  ctx.putImageData(pixels, 0, 0);
  outlinedLayers.set(source, { coat: config.coat, guide, head, canvas });
  return canvas;
}

const bodyPatternPixels = new Map<string, Uint8ClampedArray>();
let typingBodyGuide: Uint8ClampedArray | undefined;
const patternedLayers = new WeakMap<HTMLImageElement, { key: string; raw: HTMLCanvasElement; aligned?: HTMLCanvasElement }>();

function readBodyPixels(path: string) {
  const cached = bodyPatternPixels.get(path);
  if (cached) return cached;
  const { ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(imageFor(path), 0, 0);
  const pixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE).data;
  bodyPatternPixels.set(path, pixels);
  return pixels;
}

function bodyGuide(part: string) {
  const source = readBodyPixels(orangePath + part);
  if (part !== 'typing_body') return source;
  if (typingBodyGuide) return typingBodyGuide;
  // Other breeds put these tail pixels on their body cels instead of on the laptop.
  const laptop = readBodyPixels(orangePath + 'typing_laptop');
  const combined = source.slice();
  for (let offset = 0; offset < source.length; offset += 4) {
    if (source[offset + 3] || !laptop[offset + 3] || !isLaptopFur(laptop[offset]!, laptop[offset + 1]!, laptop[offset + 2]!)) continue;
    combined.set(laptop.subarray(offset, offset + 4), offset);
  }
  typingBodyGuide = combined;
  return combined;
}

function patternedBodyLayer(
  path: string, part: string, config: CatConfig, layout: TypingLayout | undefined, laptopOnly = false,
) {
  const source = imageFor(path);
  const key = `${config.palette}/${config.coat}/${config.bodyPattern}`;
  const typing = part !== 'body';
  let cached = patternedLayers.get(source);
  if (cached?.key !== key) {
    const { canvas, ctx } = makeLayer(CAT_SIZE);
    ctx.drawImage(source, 0, 0);
    const pixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
    const guide = laptopOnly ? readBodyPixels(path) : bodyGuide(part);
    const mask = config.bodyPattern === 'plain' ? undefined : readBodyPixels(bodyPatternPath + part);
    paintBodyPattern(pixels, guide, mask, config, typing, laptopOnly);
    ctx.putImageData(pixels, 0, 0);
    cached = { key, raw: canvas };
    patternedLayers.set(source, cached);
  }
  if (!typing || layout === 'legacy') return cached.raw;
  return cached.aligned ??= alignTypingLayer(cached.raw);
}

function frontBodyLayer(
  path: string, part: string, config: CatConfig, layout?: TypingLayout, outlineVersion?: OutlineVersion,
) {
  const asset = path + part;
  const source = config.bodyPattern !== 'native' ? patternedBodyLayer(asset, part, config, layout)
    : frontCoatLayer(part === 'body' ? imageFor(asset) : typingLayer(asset, layout), config);
  const guide = part === 'body' ? imageFor(orangePath + part) : typingLayer(orangePath + part, layout);
  return outlinedCatLayer(source, guide, config, outlineVersion);
}

type TypingArmFrames = { left: ImageData; right: ImageData; raw: HTMLCanvasElement[]; aligned: HTMLCanvasElement[] };
let sharedArmCache: { key: string; frames: TypingArmFrames } | undefined;

function sharedTypingArms(path: string, config: CatConfig, frame: number, layout?: TypingLayout, outlineVersion?: OutlineVersion) {
  const key = `${config.palette}/${config.coat}/${config.bodyPattern}/${outlineVersion}`;
  if (sharedArmCache?.key !== key) {
    const { ctx } = makeLayer(CAT_SIZE);
    ctx.drawImage(frontBodyLayer(path, 'typing_arms_gentle_0', config, 'legacy', outlineVersion), 0, 0);
    const left = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
    ctx.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
    ctx.drawImage(frontBodyLayer(path, 'typing_arms_gentle_2', config, 'legacy', outlineVersion), 0, 0);
    const right = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
    sharedArmCache = { key, frames: { left, right, raw: [], aligned: [] } };
  }
  const index = ((frame % catTypingFrameCount) + catTypingFrameCount) % catTypingFrameCount;
  const frames = sharedArmCache.frames;
  let raw = frames.raw[index];
  if (!raw) {
    const layer = makeLayer(CAT_SIZE);
    layer.ctx.putImageData(lowTypingArms(frames.left, frames.right, index), 0, 0);
    raw = frames.raw[index] = layer.canvas;
  }
  if (layout === 'legacy') return raw;
  return frames.aligned[index] ??= alignTypingLayer(raw);
}

const referenceAtlasFrames = new Map<string, HTMLCanvasElement>();
function referenceTypingFrame(part: string, frame: number) {
  const index = ((frame % catTypingFrameCount) + catTypingFrameCount) % catTypingFrameCount;
  const key = `${part}/${index}`;
  const cached = referenceAtlasFrames.get(key);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(imageFor(typingReferencePath + part), 0, index * CAT_SIZE, CAT_SIZE, CAT_SIZE, 0, 0, CAT_SIZE, CAT_SIZE);
  referenceAtlasFrames.set(key, canvas);
  return canvas;
}

function layerPixels(source: CatLayer) {
  const { ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0);
  return ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
}

let referenceArmCache: {
  key: string;
  paint: ReturnType<typeof createTypingArmPainter>;
  frames: Map<string, HTMLCanvasElement>;
} | undefined;

function referenceTypingArms(path: string, config: CatConfig, mode: TypingMode, frame: number, outlineVersion?: OutlineVersion) {
  const source = referenceTypingFrame(`arms_${mode}`, frame);
  if (config.palette === 'CC01' && config.coat === 'native' && config.bodyPattern === 'native') return source;
  const key = `${config.palette}/${config.coat}/${config.bodyPattern}`;
  if (referenceArmCache?.key !== key) {
    referenceArmCache = {
      key,
      paint: createTypingArmPainter(
        layerPixels(typingLayer(orangePath + 'typing_arms_gentle_0', 'aligned')),
        layerPixels(frontBodyLayer(path, 'typing_arms_gentle_0', config, 'aligned')),
      ),
      frames: new Map(),
    };
  }
  const frameKey = `${mode}/${frame % catTypingFrameCount}`;
  const cached = referenceArmCache.frames.get(frameKey);
  if (cached) return outlinedCatLayer(cached, source, config, outlineVersion);
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.putImageData(referenceArmCache.paint(layerPixels(source),
    layerPixels(referenceTypingFrame(`paws_${mode}`, frame)).data), 0, 0);
  referenceArmCache.frames.set(frameKey, canvas);
  return outlinedCatLayer(canvas, source, config, outlineVersion);
}

const tailPaintLayers = new WeakMap<HTMLImageElement, { key: string; raw: HTMLCanvasElement; aligned?: HTMLCanvasElement }>();
const tailBodyLayers = new WeakMap<CatLayer, { key: string; canvas: HTMLCanvasElement }>();

function selectedTail(config: CatConfig, typing: boolean, layout?: TypingLayout, outlineVersion?: OutlineVersion) {
  const asset = tailPath + (typing ? 'typing' : 'idle') + '_' + config.tail;
  const source = imageFor(asset);
  const key = `${config.palette}/${config.coat}/${config.bodyPattern}`;
  let cached = tailPaintLayers.get(source);
  if (cached?.key !== key) {
    const { canvas, ctx } = makeLayer(CAT_SIZE);
    ctx.drawImage(source, 0, 0);
    const pixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
    paintCatTail(pixels, readBodyPixels(asset + '_patterns'), config);
    ctx.putImageData(pixels, 0, 0);
    cached = { key, raw: canvas };
    tailPaintLayers.set(source, cached);
  }
  const result = !typing || layout === 'legacy' ? cached.raw : cached.aligned ??= alignTypingLayer(cached.raw);
  const guide = !typing || layout === 'legacy' ? source : typingLayer(asset, layout);
  return outlinedCatLayer(result, guide, config, outlineVersion);
}

function tailRemoval(typing: boolean, layout?: TypingLayout) {
  return typing ? typingLayer(tailPath + 'typing_remove', layout) : imageFor(tailPath + 'idle_remove');
}

function bodyWithSelectedTail(body: CatLayer, config: CatConfig, typing: boolean, layout?: TypingLayout, outlineVersion?: OutlineVersion) {
  if (config.tail === 'CT01') return body;
  const key = `${config.palette}/${config.coat}/${config.bodyPattern}/${config.tail}/${typing}/${layout}/${outlineVersion}`;
  const cached = tailBodyLayers.get(body);
  if (cached?.key === key) return cached.canvas;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(body, 0, 0);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(tailRemoval(typing, layout), 0, 0);
  ctx.globalCompositeOperation = 'destination-over';
  ctx.drawImage(selectedTail(config, typing, layout, outlineVersion), 0, 0);
  tailBodyLayers.set(body, { key, canvas });
  return canvas;
}

const composedEars = new Map<string, HTMLCanvasElement>();

function frontCatEars(config: CatConfig, layout?: CatPose['earLayout']) {
  const { palette, ear } = config;
  const shape = catFrontEars[ear];
  const part = `ear_${shape}`;
  if (palette === 'CC01') return imageFor(orangePath + part);
  const path = breedPath(palette);
  if (ear === 'CE01' || (layout === 'legacy' && sharedBreedParts[palette] === palette)) return imageFor(path + part);
  const key = path + part;
  const cached = composedEars.get(key);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  paintBreedEars(ctx, imageFor(orangePath + part), imageFor(earMaskPath + shape), imageFor(path + 'ear_upright'), palette);
  composedEars.set(key, canvas);
  return canvas;
}

type HiddenGlints = readonly [boolean, boolean];

function catHeadEye(config: CatConfig, typing: boolean, frame: number) {
  return !typing && frame >= 25 && frame <= 26 ? 'Y02' : config.eye;
}

type TypingEffects = Pick<CatPose, 'typingMode' | 'typingAnimation' | 'typingEffects'>;

function hasEffortEyes(typing: boolean, pose: TypingEffects) {
  if (!typing || pose.typingEffects === false) return false;
  const animation = pose.typingAnimation ?? 'reference';
  return animation === 'reference' ? pose.typingMode === 'frenzy' : animation === 'shared' && pose.typingMode === 'fast';
}

export function catGlintAperture(config: CatConfig, typing: boolean, frame: number, pose: TypingEffects = {}) {
  if (hasEffortEyes(typing, pose)) return;
  if (config.palette === 'CC01') return imageFor(orangePath + 'iris');
  if (catHeadEye(config, typing, frame) === 'Y01') return imageFor(breedPath(config.palette) + 'aperture');
}

const noseColumns = Object.keys(catOptions.nose);
const mouthColumns = Object.keys(catOptions.mouth);
const noseTips = [131, 131, 130, 133];
const mouthStems = [132, 132, 131, 134];

const patternedFaceAtlases = new WeakMap<HTMLImageElement, { key: string; canvas: HTMLCanvasElement }>();

function catFaceAtlas(config: CatConfig, markingLayout?: MarkingLayout) {
  const source = imageFor(facePartsPath + config.palette);
  const atlas = frontCoatLayer(source, config, 'face-parts');
  if (markingLayout === 'legacy' || config.bodyPattern === 'native') return atlas;
  const key = `${config.coat}/${config.bodyPattern}`;
  let cached = patternedFaceAtlases.get(source);
  if (cached?.key !== key) {
    const { canvas, ctx } = makeLayer(CAT_SIZE);
    ctx.drawImage(atlas, 0, 0);
    const pixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
    paintHeadFur(pixels, readBodyPixels(facePartsPath + 'CC01'), readBodyPixels(headPatternPath + 'face_region'),
      config.bodyPattern === 'plain' ? undefined : readBodyPixels(headPatternPath + 'face_patterns'), config,
      readBodyPixels(facePartsPath + config.palette));
    ctx.putImageData(pixels, 0, 0);
    cached = { key, canvas };
    patternedFaceAtlases.set(source, cached);
  }
  return cached.canvas;
}

function drawCatFaceParts(
  ctx: CanvasRenderingContext2D, config: CatConfig, markingLayout?: MarkingLayout,
  transientMouth?: 'smile' | 'flat',
) {
  // The Aseprite exporter packs the original face coordinates into three rows.
  const left = 128, top = 119, width = 48, height = 44;
  const atlas = catFaceAtlas(config, markingLayout);
  const mouth = mouthColumns.indexOf(config.mouth);
  const nose = noseColumns.indexOf(config.nose);
  const draw = (column: number, row: number) =>
    ctx.drawImage(atlas, column * width, row * height, width, height, left, top, width, height);
  draw(0, 2);
  if (transientMouth) {
    const path = typingReferencePath + `mouth_${transientMouth}`;
    const line = config.palette === 'CC02' ? coloredCatIris(path, '#201B1E') : imageFor(path);
    ctx.drawImage(line, 0, 0);
    const gap = 132 - noseTips[nose]! - 1;
    if (gap > 0) ctx.drawImage(line, 150, 132, 3, 1, 150, noseTips[nose]! + 1, 3, gap);
    // The nose remains an independent user choice, above the temporary mouth.
    draw(nose, 1);
    return;
  }
  draw(mouth, 0);

  const tip = noseTips[nose]!;
  const gap = mouthStems[mouth]! - tip - 1;
  if (gap > 0) {
    // Extend the existing mouth line to a shorter nose with its own ink color.
    const stemX = 150, sampleY = 134;
    ctx.drawImage(atlas, mouth * width + stemX - left, sampleY - top, 3, 1, stemX, tip + 1, 3, gap);
  }
  draw(nose, 1);
}

function drawCatGlints(
  ctx: CanvasRenderingContext2D, config: CatConfig, typing: boolean, frame: number, gaze: Gaze, scale: number,
  hidden?: HiddenGlints,
) {
  if (!catGlintAperture(config, typing, frame) || (hidden?.[0] && hidden[1])) return;
  const orange = config.palette === 'CC01';
  const leftEdge = orange ? horizontalGazeRange.min : -12;
  const { x, y } = gaze.space === 'pointer'
    ? pointerGlintOffset(gaze, orange ? -8 : -6, orange ? 5 : 4, 10, 9)
    : { x: Math.max(leftEdge, Math.min(horizontalGazeRange.max, Math.round(gaze.x))), y: 2 * Math.sign(gaze.y) };
  const dx = Math.round(x * scale) / scale, dy = Math.round(y * scale) / scale;
  const glints = imageFor(orange ? orangePath + 'eye_glints' : breedEyeGlints);
  if (!hidden?.[0] && !hidden?.[1]) {
    ctx.drawImage(glints, dx, dy);
  } else {
    const half = CAT_SIZE / 2;
    const left = hidden[0] ? half : 0;
    ctx.drawImage(glints, left, 0, half, CAT_SIZE, left + dx, dy, half, CAT_SIZE);
  }
}

const cleanEyeHeads = new WeakMap<HTMLImageElement, CatLayer>();
const sharedPatternHeads = new Map<string, HTMLCanvasElement>();
const sharedHeadGuides = new Map<string, Uint8ClampedArray>();
const headOutlineGuides = new Map<string, HTMLCanvasElement>();

function headOutlineGuide(config: CatConfig) {
  const shape = catFrontEars[config.ear];
  const cached = headOutlineGuides.get(shape);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(imageFor(orangePath + 'head_base'), 0, 0);
  ctx.drawImage(imageFor(orangePath + `ear_${shape}`), 0, 0);
  headOutlineGuides.set(shape, canvas);
  return canvas;
}

function headFurGuide(config: CatConfig, effort: boolean) {
  const key = `${config.ear}/${effort}`;
  const cached = sharedHeadGuides.get(key);
  if (cached) return cached;
  const { ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(imageFor(orangePath + 'head_base'), 0, 0);
  if (effort) ctx.drawImage(imageFor(typingEffectPath + 'orange_eye_patch'), 0, 0);
  const shape = catFrontEars[config.ear];
  ctx.drawImage(imageFor(orangePath + `ear_${shape}`), 0, 0);
  const data = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE).data;
  if (shape !== 'upright') {
    const ear = readBodyPixels(earMaskPath + shape);
    // A wide crown region can reach a folded or curled ear. Its solid
    // ownership mask protects that ear's painted folds; the soft root
    // transition remains available for the surrounding head fur.
    for (let offset = 0; offset < data.length; offset += 4) {
      if (ear[offset] === 255 || ear[offset + 1] === 255) data[offset + 3] = 0;
    }
  }
  sharedHeadGuides.set(key, data);
  return data;
}

function sharedPatternHead(config: CatConfig, effort: boolean, earLayout?: CatPose['earLayout']) {
  const key = `${config.palette}/${config.coat}/${config.bodyPattern}/${config.pattern}/${config.ear}/${effort}/${earLayout}`;
  const cached = sharedPatternHeads.get(key);
  if (cached) return cached;
  const orange = config.palette === 'CC01';
  const path = orange ? orangePath : breedPath(config.palette);
  const original = imageFor(path + (orange ? 'head_base' : 'head'));
  const base = effort && !orange ? headWithoutBakedEyes(original, config.palette) : original;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(frontCoatLayer(base, config, orange ? 'orange-head' : 'fur'), 0, 0);
  if (effort && orange) ctx.drawImage(frontCoatLayer(imageFor(typingEffectPath + 'orange_eye_patch'), config), 0, 0);
  ctx.drawImage(frontCoatLayer(frontCatEars(config, earLayout), config), 0, 0);
  if (config.pattern !== 'P00' || config.bodyPattern !== 'native') {
    const pixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
    const guide = headFurGuide(config, effort);
    if (config.pattern !== 'P00') {
      const region = readBodyPixels(headPatternPath + 'forehead_region');
      // These native coats have no baked forehead stripes: their dark/white
      // crown regions are continuous breed fur, not removable markings.
      // Keep that fur under the independent glyph; uniform replacement fur
      // and the striped breeds instead need a clean crown before painting.
      const nativeColorRegions = config.bodyPattern === 'native'
        && ['CC03', 'CC04', 'CC08'].includes(config.palette);
      if (!nativeColorRegions) clearForeheadFur(pixels, guide, region, config);
      if (foreheadParts.includes(config.pattern)) {
        paintForeheadFur(pixels, guide, region, readBodyPixels(headPatternPath + `forehead_${config.pattern}`), config);
      }
    }
    paintHeadFur(pixels, guide, readBodyPixels(headPatternPath + 'face_region'),
      config.bodyPattern === 'plain' ? undefined : readBodyPixels(headPatternPath + 'face_patterns'), config);
    ctx.putImageData(pixels, 0, 0);
  }
  // Keep a small set of recent appearances; typing frames reuse the same head.
  if (sharedPatternHeads.size >= 32) sharedPatternHeads.delete(sharedPatternHeads.keys().next().value!);
  sharedPatternHeads.set(key, canvas);
  return canvas;
}

function headWithoutBakedEyes(head: HTMLImageElement, palette: FrontBreed): CatLayer {
  const cached = cleanEyeHeads.get(head);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(head, 0, 0);
  const pixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
  const aperture = readBodyPixels(breedPath(palette) + 'aperture');
  const original = new Uint32Array(pixels.data.buffer).slice();
  let eyeArea = 0, bakedInk = 0;
  for (let offset = 0; offset < aperture.length; offset += 4) {
    if (!aperture[offset + 3]) continue;
    eyeArea++;
    const red = pixels.data[offset]!, green = pixels.data[offset + 1]!, blue = pixels.data[offset + 2]!;
    if (pixels.data[offset + 3] && green <= 55 && red - green >= 12 && green > blue) bakedInk++;
  }
  // Some older breed heads kept solid brown pupil underpaint. Clean heads
  // (including dark face markings) should retain every original fur pixel.
  if (!eyeArea || bakedInk / eyeArea < 0.8) {
    cleanEyeHeads.set(head, head);
    return head;
  }

  const mask = new Uint8Array(CAT_SIZE * CAT_SIZE);
  for (let y = 1; y < CAT_SIZE - 1; y++) {
    for (let x = 1; x < CAT_SIZE - 1; x++) {
      if (!aperture[(y * CAT_SIZE + x) * 4 + 3]) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        mask[(y + dy) * CAT_SIZE + x + dx] = 1;
      }
    }
  }
  const boundary: number[] = [];
  for (let y = 1; y < CAT_SIZE - 1; y++) {
    for (let x = 1; x < CAT_SIZE - 1; x++) {
      const index = y * CAT_SIZE + x;
      if (!mask[index] && pixels.data[index * 4 + 3]
        && (mask[index - 1] || mask[index + 1] || mask[index - CAT_SIZE] || mask[index + CAT_SIZE])) {
        boundary.push(index);
      }
    }
  }
  const output = new Uint32Array(pixels.data.buffer);
  for (let index = 0; index < mask.length; index++) {
    if (!mask[index]) continue;
    const x = index % CAT_SIZE, y = Math.floor(index / CAT_SIZE);
    let nearest = index, distance = Infinity;
    for (const sample of boundary) {
      const dx = sample % CAT_SIZE - x, dy = Math.floor(sample / CAT_SIZE) - y;
      const squared = dx * dx + dy * dy;
      if (squared < distance) { distance = squared; nearest = sample; }
    }
    // Copy an existing fur pixel; interpolation would add blurry eye edges.
    output[index] = original[nearest]!;
  }
  ctx.putImageData(pixels, 0, 0);
  cleanEyeHeads.set(head, canvas);
  return canvas;
}

export function drawCatHead(
  ctx: CanvasRenderingContext2D, config: CatConfig, typing: boolean, frame: number, gaze: Gaze,
  { scale = 1, earLayout, hideGlints, markingLayout, outlineVersion = 'adaptive', ...typingPose }:
    TypingEffects & { scale?: number; earLayout?: CatPose['earLayout']; hideGlints?: HiddenGlints; markingLayout?: MarkingLayout; outlineVersion?: OutlineVersion } = {},
) {
  const orange = config.palette === 'CC01';
  const path = orange ? orangePath : breedPath(config.palette);
  const accessory = config.accessory === 'A07' ? 'A06' : config.accessory;
  const eye = catHeadEye(config, typing, frame);
  const effort = hasEffortEyes(typing, typingPose);
  const referenceEffects = typing && (typingPose.typingAnimation ?? 'reference') === 'reference'
    && typingPose.typingEffects !== false;
  const mode = typingPose.typingMode ?? 'gentle';
  const transientMouth = referenceEffects && config.mouth === 'CN01'
    ? mode === 'frenzy' ? 'smile' : mode === 'fast' ? frame % catTypingFrameCount < 6 ? 'smile' : 'flat' : undefined
    : undefined;
  if (markingLayout === 'legacy') {
    const head = imageFor(path + (orange ? 'head_base' : 'head'));
    const base = effort && !orange ? headWithoutBakedEyes(head, config.palette) : head;
    ctx.drawImage(outlinedCatLayer(frontCoatLayer(base, config, orange ? 'orange-head' : 'fur'),
      imageFor(orangePath + 'head_base'), config, outlineVersion, true), 0, 0);
    if (effort && orange) ctx.drawImage(frontCoatLayer(imageFor(typingEffectPath + 'orange_eye_patch'), config), 0, 0);
    ctx.drawImage(outlinedCatLayer(frontCoatLayer(frontCatEars(config, earLayout), config),
      imageFor(orangePath + `ear_${catFrontEars[config.ear]}`), config, outlineVersion, true), 0, 0);
    if (['P01', 'P02', 'P06'].includes(config.pattern)) {
      const template = config.palette === 'CC01' ? config.palette : sharedBreedParts[config.palette];
      const face = imageFor((orange ? orangePath : breedPath(template)) + `face_${config.pattern}`);
      ctx.drawImage(frontCoatLayer(face, template === config.palette ? config : { ...config, palette: template }), 0, 0);
    }
  } else {
    ctx.drawImage(outlinedCatLayer(sharedPatternHead(config, effort, earLayout),
      headOutlineGuide(config), config, outlineVersion, true), 0, 0);
  }
  if (!effort && !orange) ctx.drawImage(frontCatEye(config.palette, config, eye), 0, 0);
  drawCatFaceParts(ctx, config, markingLayout, transientMouth);
  const hasInnerPupil = config.innerPupil === 'round';
  const pupilPath = breedPath(orange ? 'CC03' : config.palette);
  if (!effort && orange && (config.eyeColor !== 'natural' || hasInnerPupil)) {
    const mask = hasInnerPupil ? pupilPath + 'iris' : orangePath + 'iris';
    const color = catIrisColors[config.eyeColor === 'natural' ? 'amber' : config.eyeColor];
    ctx.drawImage(coloredCatIris(mask, color), 0, 0);
  }
  if (!effort && hasInnerPupil && config.innerEyeColor !== 'natural' && (orange || eye === 'Y01')) {
    ctx.drawImage(coloredInnerPupil(pupilPath, catIrisColors[config.innerEyeColor]), 0, 0);
  }
  if (effort) {
    const path = (referenceEffects ? typingReferencePath : typingEffectPath) + 'effort_eyes';
    const expression = config.palette === 'CC02'
      ? coloredCatIris(path, '#201B1E') : imageFor(path);
    ctx.drawImage(expression, 0, 0);
  } else {
    drawCatGlints(ctx, config, typing, frame, gaze, scale, hideGlints);
  }
  // New sweat belongs on the forehead, beneath hats and hair clips. Preserve
  // the old shared order when reconstructing older pixel-editor saves.
  if (referenceEffects && mode !== 'gentle') ctx.drawImage(referenceTypingFrame(`sweat_${mode}`, frame), 0, 0);
  if (accessory !== 'A00') ctx.drawImage(imageFor(`${orangePath}accessory_${accessory}`), 0, 0);
  if (effort && !referenceEffects) {
    const sweat = Math.floor((frame % catTypingFrameCount) / 3) - 1;
    if (sweat >= 0) ctx.drawImage(imageFor(typingEffectPath + `sweat_${sweat}`), 0, 0);
  }
}

function copyCatEdits(ctx: CanvasRenderingContext2D, edits: CatPixelEdits) {
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(edits.mask, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(edits.paint, 0, 0);
}

function clearCustomLayer({ scratch }: CatCustomization) {
  scratch.ctx.resetTransform();
  scratch.ctx.globalCompositeOperation = 'source-over';
  scratch.ctx.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
  return scratch;
}

function drawCatFront(ctx: CanvasRenderingContext2D, config: CatConfig, typing: boolean, frame: number, gaze: Gaze, pose: CatPose) {
  const orange = config.palette === 'CC01';
  const path = orange ? orangePath : breedPath(config.palette);
  const mode = pose.typingMode ?? 'gentle';
  const animation = pose.typingAnimation ?? 'reference';
  const effort = hasEffortEyes(typing, { ...pose, typingMode: mode });
  const custom = pose.custom;
  const sameIdle = !typing && custom?.source.action === 'sit';
  const layout = pose.typingLayout;
  const outlineVersion = pose.outlineVersion ?? 'adaptive';
  const laptopVersion = layout === 'legacy' ? 'original'
    : pose.laptopVersion ?? (animation === 'reference' ? 'clean' : 'original');
  const placement = catHeadPlacement(typing, frame, layout);
  const tracking = custom !== undefined && gaze.space === 'pointer';
  const edits = (tracking || effort ? custom?.following : undefined) ?? custom?.paint;
  const headEdits = typing ? edits?.typingHead : edits?.idleHead;
  const torsoEdits = typing ? custom?.typingTorso : custom?.idleTorso;
  const fullEdits = edits?.full;
  const headOptions = {
    scale: placement.scale, earLayout: pose.earLayout,
    markingLayout: pose.markingLayout, outlineVersion,
    hideGlints: tracking ? [true, true] as const : custom?.fixedGlints,
    typingMode: mode, typingAnimation: animation, typingEffects: pose.typingEffects,
  };
  const stretch = typing ? 0 : pose.stretch ?? 0;

  // Work in actual 320px coordinates; the outer renderer uses 160 logical units.
  ctx.save();
  ctx.scale(0.5, 0.5);
  if (!typing) ctx.translate(0, placement.y);
  if (stretch) {
    ctx.translate(160, 278);
    ctx.scale(1 + Math.abs(stretch) * 0.11, 1 - Math.abs(stretch) * 0.055);
    ctx.translate(-160, -278);
  }

  const selectedBody = bodyWithSelectedTail(frontBodyLayer(path, typing ? 'typing_body' : 'body', config, layout, outlineVersion), config, typing, layout, outlineVersion);
  const body = typing ? bodyWithTypingConnector(selectedBody, config, layout, laptopVersion) : selectedBody;
  if (custom && torsoEdits) {
    const { canvas, ctx: layer } = clearCustomLayer(custom);
    layer.drawImage(body, 0, 0);
    copyCatEdits(layer, torsoEdits);
    // Pose-specific arms and props stay above the stationary torso.
    layer.globalCompositeOperation = 'destination-in';
    layer.drawImage(body, 0, 0);
    ctx.drawImage(canvas, 0, 0);
  } else {
    ctx.drawImage(body, 0, 0);
  }
  if (typing) {
    const arms = animation === 'legacy'
      ? frontBodyLayer(path, `typing_arms_${mode}_${frame}`, config, layout, outlineVersion)
      : animation === 'shared' ? sharedTypingArms(path, config, frame, layout, outlineVersion)
        : referenceTypingArms(path, config, mode, frame, outlineVersion);
    ctx.drawImage(arms, 0, 0);
  }

  ctx.save();
  const headX = typing ? placement.x : 2 * Math.round(stretch * 7);
  const headY = typing ? placement.y : 0;
  if (custom && headEdits) {
    const { canvas, ctx: layer } = clearCustomLayer(custom);
    layer.translate(headX, headY);
    layer.scale(placement.scale, placement.scale);
    drawCatHead(layer, config, typing, frame, gaze, headOptions);
    layer.resetTransform();
    if (!typing) layer.translate(headX, 0);
    copyCatEdits(layer, headEdits);
    ctx.drawImage(canvas, 0, 0);
  } else {
    ctx.translate(headX, headY);
    ctx.scale(placement.scale, placement.scale);
    drawCatHead(ctx, config, typing, frame, gaze, headOptions);
  }
  ctx.restore();
  if (typing) {
    if (animation === 'legacy' && mode === 'fast' && frame < 3) {
      ctx.drawImage(frontBodyLayer(path, `typing_front_${frame}`, config, layout, outlineVersion), 0, 0);
    }
    const laptop = catTypingLaptop(config, layout, laptopVersion);
    if (custom?.laptop) {
      const { canvas, ctx: layer } = clearCustomLayer(custom);
      layer.drawImage(laptop, 0, 0);
      copyCatEdits(layer, custom.laptop);
      ctx.drawImage(canvas, 0, 0);
    } else {
      ctx.drawImage(laptop, 0, 0);
    }
    if (custom?.source.action === 'typing' && custom.source.frame === frame && custom.source.typingMode === mode
      && custom.source.typingAnimation === animation
      && custom.source.laptopVersion === laptopVersion
      && custom.source.markingLayout === (pose.markingLayout ?? 'shared') && fullEdits) {
      copyCatEdits(ctx, fullEdits);
    }
  } else if (sameIdle && fullEdits) {
    ctx.save();
    ctx.translate(0, -catHeadPlacement(false, custom.source.frame).y);
    copyCatEdits(ctx, fullEdits);
    ctx.restore();
  }
  if (tracking && !effort) {
    ctx.translate(headX, headY);
    ctx.scale(placement.scale, placement.scale);
    // Paint the moving reflection above the custom iris while respecting erasures.
    ctx.globalCompositeOperation = 'source-atop';
    drawCatGlints(ctx, config, typing, frame, gaze, placement.scale);
  }
  ctx.restore();
}

function drawWalkingCat(ctx: CanvasRenderingContext2D, config: CatConfig, side: 'left' | 'right', frame: number, gaze: Gaze, pose: CatPose) {
  const headY = frame % 2;
  // The workbench uses a stretch of the front-facing cat for drag; this is the legacy walk renderer.
  const palette = config.palette === 'CC01' ? 'CC01' : sharedBreedParts[config.palette];
  const drawFur = (layer: string, y = 0) => ctx.drawImage(catWalkFur(layer, palette, side), 0, y);
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
  ctx.drawImage(walkCatEye(config), 0, headY, SIZE, SIZE);
  if (config.eye === 'Y01') {
    const look = side === 'right' ? { ...gaze, x: -gaze.x } : gaze;
    const { x, y } = look.space === 'pointer'
      ? pointerGlintOffset(look, 1, 2, 2, 2)
      : { x: Math.sign(look.x), y: Math.sign(look.y) };
    ctx.drawImage(imageFor(walkEyeGlints), Math.round(x), headY + Math.round(y));
  }
  drawFur(config.mouth === 'CN01' ? 'walk_muzzle' : `walk_muzzle_${config.mouth}`, headY);
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
    const frames = config.frame === 'CAT' && action === 'typing' && catPose.typingAnimation === 'legacy'
      ? 4 : frameCount(config, action);
    const pose = ((frame % frames) + frames) % frames;
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

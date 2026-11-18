/// <reference types="vite/client" />

import { blackCatCoat, canChooseCatFaceBase, catFeatureColors, catIrisColors, catKeepsBreedPigment, catPupilStyle, catRenderConfig, currentFurPatternColors, hasShortCalicoChest,
  type CatConfig, type CatPupilStyle, type CatRenderConfig, type FurPatternColors, type PetConfig } from './cat';
import type { CatCustomization, CatPixelEdits } from './cat-custom';
import { applyCatInk, type CatInkBounds, type CatInkGeometry } from './cat-ink';
import type { CatFileAction, CatFileActionPose } from './cat-file-action';
import { warpListeningPixels } from './cat-listening';
import { splitJellySprite, warpJellySprite, type JellyPose } from './cat-jelly';
import { paintBreedEars, paintInnerEarColor } from './cat-ears';
import { recolorCatCoat, type CatCoatSurface } from './cat-coat';
import { isLaptopFur, paintBodyPattern, usesBodyPattern } from './cat-body-pattern';
import { paintCatTail } from './cat-tail';
import { clearForeheadFur, paintForeheadFur, paintHeadFur, paintSolidFace } from './cat-head-pattern';
import { catTypingFrameCountFor, currentTypingAnimation, frenzyRedFrame, frenzySteamLoopStart, isFrontTyping, lowTypingArms, usesFallingTyping, type TypingAnimation } from './cat-typing';
import { createTypingArmPainter, recolorFrontPaws, thickenPeekPawOutline } from './cat-typing-paint';
import { clearForeheadOutlineSpots, recolorCatOutline, type OutlineVersion } from './cat-outline';
export type { OutlineVersion } from './cat-outline';
import { irisColors, palettes, type Config } from './model';

import {
  assetFiles, assetsFor, atlasNoseTips, CAT_SIZE, PET_SIZE, dogArt as art, furSlots, irisPath, maskPath, runBodies,
  bodyPatternPath, breedArt, breedEyeGlints, breedLaptop, breedPath, catCalicoLayers, catFileActions, catFrontEars, catListening,
  catFurSlots, catMarkings, catMouthPath, catNosePath, catWalkBodies, catWalkFrames, earMaskPath, facePartsPath, faceTiles,
  foreheadParts, frontTyping, frontTypingEffects, frontTypingEffectsPath, headPatternPath, legacyMouthIds, legacyNoseOutlinePath, mouthSkinColumns, mouthSkinPath, mouthStems,
  orangePath, sharedMouthStyles, sharedNoseStyles,
  initialTailPath, referenceTailPath, sharedBreedParts, sharedTailStyles, tailPath, typingAtlases, typingEffectPath, typingGeometryPart, typingInkPatches, typingReferencePath,
  walkEyeGlints, type LegacyFrontBreed,
} from './pet-assets';

export const SIZE = PET_SIZE;
export type TypingMode = 'gentle' | 'fast' | 'frenzy';
export type TypingMouthVersion = 'shared' | 'legacy';
export type TypingLayout = 'aligned' | 'legacy';
export type LaptopVersion = 'clean' | 'original';
export const currentTypingInkVersion = 'clean-eyes' as const;
export type TypingInkVersion = typeof currentTypingInkVersion | 'clean' | 'original';
export const tailArtPaths = { clean: tailPath, reference: referenceTailPath, initial: initialTailPath } as const;
export type TailArtVersion = keyof typeof tailArtPaths;
export type MarkingLayout = 'clean-forehead' | 'shared' | 'legacy';
export function catMarkingLayout(pattern: CatConfig['pattern']): MarkingLayout {
  return pattern === 'P03' ? 'clean-forehead' : 'shared';
}
export type { TypingAnimation } from './cat-typing';
export type CatEdge = 'left' | 'right' | 'bottom';
export type CatPose = {
  typingMode?: TypingMode;
  typingLayout?: TypingLayout;
  typingAnimation?: TypingAnimation;
  frenzyHeatFrame?: number;
  laptopVersion?: LaptopVersion;
  typingInkVersion?: TypingInkVersion;
  typingMouthVersion?: TypingMouthVersion;
  tailArtVersion?: TailArtVersion;
  outlineVersion?: OutlineVersion;
  typingEffects?: boolean;
  earLayout?: 'shared' | 'legacy';
  markingLayout?: MarkingLayout;
  furPatternColors?: FurPatternColors;
  legacyNoseOutline?: boolean;
  stretch?: number;
  jelly?: JellyPose;
  listeningFrame?: number;
  fileAction?: CatFileActionPose;
  edge?: CatEdge;
  custom?: CatCustomization;
};
export type Action = 'sit' | 'left' | 'right' | 'typing';
export const actions: Readonly<Record<Action, number>> = { sit: 80, left: 6, right: 6, typing: 4 };

export function frameCount(config: PetConfig, action: Action, animation: TypingAnimation = currentTypingAnimation) {
  if (config.frame !== 'CAT') return actions[action];
  if (action === 'typing') return catTypingFrameCountFor(animation);
  return action === 'left' || action === 'right' ? catWalkFrames : actions[action];
}

type FurSlot = typeof furSlots[number];

function loadLayer(layer: string) {
  const asset = assetFiles.get(layer);
  if (!asset) throw Error(`未登记图层 · ${layer}`);
  const image = new Image();
  image.src = `${import.meta.env.BASE_URL}assets/${layer}.png`;
  return image.decode().then(() => {
    if (image.naturalWidth !== asset.width || image.naturalHeight !== asset.height) throw Error(`图层尺寸错误 · ${layer}`);
    return [layer, image] as const;
  }).catch((error: unknown) => {
    console.error(`无法加载图层 · ${layer}`, error);
    return [layer, null] as const;
  });
}

// Decode before mounting React so preview and export share the synchronous renderer.
const images = new Map<string, HTMLImageElement | null>();
export const assetsReady = Promise.all(assetsFor('dog').map(loadLayer)).then(entries => {
  for (const [name, image] of entries) images.set(name, image);
});

let catAssets: Promise<void> | undefined;
type ReferenceTypingAnimation = Extract<TypingAnimation, 'reference' | 'reference-v2'>;
type FrontBreed = Exclude<CatRenderConfig['palette'], 'CC01'>;
const referenceTypingPath = (animation: ReferenceTypingAnimation) => typingAtlases[animation].path;
const isReferenceTyping = (animation: TypingAnimation): animation is ReferenceTypingAnimation =>
  animation === 'reference' || animation === 'reference-v2';

export function prepareCatAssets() {
  return catAssets ??= Promise.all(assetsFor('cat').map(loadLayer)).then(entries => {
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

export function makeLayer(width = SIZE, height = width) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
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
  const art = imageFor(irisMask);
  const mask = makeLayer(art.naturalWidth, art.naturalHeight);
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

function coloredAlternateInnerPupil(path: string, color: string) {
  const key = `${path}alternateInnerPupil/${color}`;
  const cached = tinted.get(key);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  const { data } = layerPixels(imageFor(path + 'aperture'));
  const half = CAT_SIZE / 2;
  ctx.fillStyle = color;
  for (const start of [0, half]) {
    let left = start + half, right = -1, top = CAT_SIZE, bottom = -1;
    for (let y = 0; y < CAT_SIZE; y++) for (let x = start; x < start + half; x++) {
      if (!data[(y * CAT_SIZE + x) * 4 + 3]) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
    const centerX = (left + right) / 2, centerY = (top + bottom) / 2;
    const radiusX = (right - left + 1) * 0.30, radiusY = (bottom - top + 1) * 0.30;
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      if (data[(y * CAT_SIZE + x) * 4 + 3]
        && ((x - centerX) / radiusX) ** 2 + ((y - centerY) / radiusY) ** 2 <= 1) ctx.fillRect(x, y, 1, 1);
    }
  }
  tinted.set(key, canvas);
  return canvas;
}

const rimlessOpenEyes = new WeakMap<HTMLImageElement, HTMLCanvasElement>();

function cleanOpenEye(image: HTMLImageElement, aperture: Uint8ClampedArray) {
  const cached = rimlessOpenEyes.get(image);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  const pixels = layerPixels(image);
  const { data, width, height } = pixels;
  const half = width / 2;
  for (let y = 0; y < height; y++) {
    for (const start of [0, half]) {
      const row = y * width;
      let left = start + half, right = start - 1;
      // The native open-eye cel includes a thin strip of the old coat around
      // its white rim. Retain the sclera and everything between its edges.
      for (let x = start; x < start + half; x++) {
        const i = (row + x) * 4;
        const white = data[i + 3] && data[i]! >= 205 && data[i + 1]! >= 200 && data[i + 2]! >= 196;
        if (white || aperture[i + 3]) {
          left = Math.min(left, x);
          right = x;
        }
      }
      data.fill(0, (row + start) * 4, (row + left) * 4);
      data.fill(0, (row + right + 1) * 4, (row + start + half) * 4);
    }
  }
  ctx.putImageData(pixels, 0, 0);
  rimlessOpenEyes.set(image, canvas);
  return canvas;
}

function tintCatEye(sourcePath: string, irisMask: string, color?: string, cleanRimAperture?: string) {
  const image = imageFor(sourcePath);
  const source = cleanRimAperture ? cleanOpenEye(image, readBodyPixels(cleanRimAperture)) : image;
  if (!color) return source;
  const key = `${sourcePath}/${irisMask}/${color}/${cleanRimAperture ?? ''}`;
  const cached = tinted.get(key);
  if (cached) return cached;
  const result = makeLayer(image.naturalWidth);
  result.ctx.drawImage(source, 0, 0);
  result.ctx.drawImage(coloredCatIris(irisMask, color), 0, 0);
  tinted.set(key, result.canvas);
  return result.canvas;
}

function walkCatEye(config: CatRenderConfig, side: 'left' | 'right') {
  const source = `cat/walk_eye_${config.eye}`;
  if (config.eye === 'Y02') return imageFor(source);
  const irisMask = `cat/masks/walk_eye_${config.eye}_iris`;
  const { eyeColor } = catPupilStyle(config, side);
  const color = eyeColor === 'natural'
    ? (config.palette === 'CC02' ? '#C5D856' : undefined)
    : catIrisColors[eyeColor];
  return tintCatEye(source, irisMask, color);
}

const naturalFrontIris = {
  CC02: '#8F9B43', CC03: '#6B9756', CC04: '#6695D0',
  CC05: '#C1831A', CC06: '#326337', CC07: '#9B973C', CC08: '#478CC9',
} as const satisfies Record<FrontBreed, string>;

function frontCatEye(palette: FrontBreed, eye: CatRenderConfig['eye'], { eyeColor, innerPupil }: CatPupilStyle, cleanRim = false) {
  const template = eye === 'Y01' ? palette : sharedBreedParts[palette];
  const path = breedPath(template);
  const alternate = eye === 'Y01' ? '' : `eye_${eye}_`;
  const source = path + (eye === 'Y01' ? 'eyes' : `eye_${eye}`);
  if (eye === 'Y02') return imageFor(source);
  const single = innerPupil === 'none' && eye !== 'Y07';
  const irisMask = path + alternate + (single ? 'aperture' : 'iris');
  const defaultColor = palette === 'CC03' ? 'green' : palette === 'CC04' ? 'blue' : 'natural';
  const color = eyeColor === 'natural' || eyeColor === defaultColor
    ? (single || template !== palette ? naturalFrontIris[palette] : undefined) : catIrisColors[eyeColor];
  return tintCatEye(source, irisMask, color, eye === 'Y01' && cleanRim ? path + 'aperture' : undefined);
}

function orangeCatIris({ eyeColor, innerPupil }: CatPupilStyle, pupilPath: string) {
  if (eyeColor === 'natural' && innerPupil === 'none') return;
  const mask = innerPupil === 'round' ? pupilPath + 'iris' : orangePath + 'iris';
  return coloredCatIris(mask, catIrisColors[eyeColor === 'natural' ? 'amber' : eyeColor]);
}

function innerCatIris({ innerPupil, innerEyeColor }: CatPupilStyle, pupilPath: string, alternate = false) {
  if (innerPupil === 'round' && innerEyeColor !== 'natural') {
    const color = catIrisColors[innerEyeColor];
    return alternate ? coloredAlternateInnerPupil(pupilPath, color) : coloredInnerPupil(pupilPath, color);
  }
}

function drawEyePair(ctx: CanvasRenderingContext2D, left?: CatLayer, right?: CatLayer) {
  if (left === right) {
    if (left) ctx.drawImage(left, 0, 0);
    return;
  }
  // Front artwork has both eyes in one cel. The midpoint lies between the eyes.
  const half = CAT_SIZE / 2;
  if (left) ctx.drawImage(left, 0, 0, half, CAT_SIZE, 0, 0, half, CAT_SIZE);
  if (right) ctx.drawImage(right, half, 0, half, CAT_SIZE, half, 0, half, CAT_SIZE);
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

function catPatternCacheKey(config: CatRenderConfig) {
  return `${config.palette}/${config.coat}/${config.bodyBase}/${config.bodyPattern}/${config.furPatternColors ?? currentFurPatternColors}/${hasShortCalicoChest(config)}`;
}

function facePatternConfig(config: CatRenderConfig): CatRenderConfig {
  const faceBase = (config.furPatternColors ?? currentFurPatternColors) === currentFurPatternColors
    && config.faceBase === 'solid' && !canChooseCatFaceBase(config.palette) ? 'native' : config.faceBase;
  return { ...config, bodyPattern: config.cheekPattern ?? config.bodyPattern, bodyBase: undefined, faceBase };
}

function facePatternCacheKey(config: CatRenderConfig) {
  return `${catPatternCacheKey(config)}/${config.faceBase}`;
}

function cleanSolidFaceEyes(config: CatRenderConfig) {
  return config.faceBase === 'solid' && (config.furPatternColors ?? currentFurPatternColors) === currentFurPatternColors;
}

export function catTypingLaptop(appearance: CatConfig | CatRenderConfig, layout?: TypingLayout, version: LaptopVersion = 'clean',
  animation: TypingAnimation = currentTypingAnimation) {
  if (isFrontTyping(animation)) return imageFor(frontTyping.path + 'laptop');
  const config = catRenderConfig(appearance);
  // Older saves used either the cleaned prop or the original prop with fur.
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

function bodyWithTypingConnector(body: CatLayer, config: CatRenderConfig, layout: TypingLayout | undefined, version: LaptopVersion) {
  if (version !== 'clean' || layout === 'legacy' || config.palette !== 'CC01' || config.tail !== 'CT01') return body;
  const key = catPatternCacheKey(config);
  if (connectedTypingBody?.source === body && connectedTypingBody.key === key) return connectedTypingBody.canvas;
  const connector = makeLayer(CAT_SIZE);
  // The old orange prop contains 84 extra opaque fur pixels at the tail root.
  // Mask away the common prop after its original fur recoloring, preserving
  // that connector exactly without carrying any computer-edge pixels with it.
  connector.ctx.drawImage(catTypingLaptop(config, layout, 'original', 'legacy'), 0, 0);
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

function frontCoatLayer(source: CatLayer, { palette, coat }: CatRenderConfig, surface: CatCoatSurface = 'fur') {
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

function outlineGuidePixels(guide: CatLayer) {
  const cached = outlineGuides.get(guide);
  if (cached) return cached;
  const { data } = layerPixels(guide);
  outlineGuides.set(guide, data);
  return data;
}

function outlinedCatLayer(
  source: CatLayer, guide: CatLayer, config: CatRenderConfig, version: OutlineVersion = 'original', head = false,
): CatLayer {
  if (version === 'original' || config.coat === 'native') return source;
  const cached = outlinedLayers.get(source);
  if (cached?.coat === config.coat && cached.guide === guide && cached.head === head) return cached.canvas;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  const pixels = layerPixels(source);
  recolorCatOutline(pixels, outlineGuidePixels(guide), config, head);
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
  path: string, part: string, config: CatRenderConfig, layout: TypingLayout | undefined, laptopOnly = false,
) {
  const source = imageFor(path);
  const key = catPatternCacheKey(config);
  const typing = part !== 'body';
  let cached = patternedLayers.get(source);
  if (cached?.key !== key) {
    const { canvas, ctx } = makeLayer(CAT_SIZE);
    const base = catKeepsBreedPigment(config) ? frontCoatLayer(source, config) : source;
    ctx.drawImage(base, 0, 0);
    const pixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
    const guide = laptopOnly ? readBodyPixels(path) : bodyGuide(part);
    const mask = config.bodyPattern === 'plain' ? undefined : readBodyPixels(bodyPatternPath + part);
    paintBodyPattern(pixels, guide, mask, config, typing, laptopOnly,
      config.bodyBase === 'solid' ? readBodyPixels(path) : undefined);
    ctx.putImageData(pixels, 0, 0);
    cached = { key, raw: canvas };
    patternedLayers.set(source, cached);
  }
  if (!typing || layout === 'legacy') return cached.raw;
  return cached.aligned ??= alignTypingLayer(cached.raw);
}

function frontBodyLayer(
  path: string, part: string, config: CatRenderConfig, layout?: TypingLayout, outlineVersion?: OutlineVersion,
) {
  const asset = path + part;
  const source = usesBodyPattern(config) ? patternedBodyLayer(asset, part, config, layout)
    : frontCoatLayer(part === 'body' ? imageFor(asset) : typingLayer(asset, layout), config);
  const guide = part === 'body' ? imageFor(orangePath + part) : typingLayer(orangePath + part, layout);
  return outlinedCatLayer(source, guide, config, outlineVersion);
}

type TypingArmFrames = { left: ImageData; right: ImageData; raw: HTMLCanvasElement[]; aligned: HTMLCanvasElement[] };
let sharedArmCache: { key: string; frames: TypingArmFrames } | undefined;

function sharedTypingArms(path: string, config: CatRenderConfig, frame: number, layout?: TypingLayout, outlineVersion?: OutlineVersion) {
  const key = `${catPatternCacheKey(config)}/${outlineVersion}`;
  if (sharedArmCache?.key !== key) {
    const { ctx } = makeLayer(CAT_SIZE);
    ctx.drawImage(frontBodyLayer(path, 'typing_arms_gentle_0', config, 'legacy', outlineVersion), 0, 0);
    const left = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
    ctx.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
    ctx.drawImage(frontBodyLayer(path, 'typing_arms_gentle_2', config, 'legacy', outlineVersion), 0, 0);
    const right = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
    sharedArmCache = { key, frames: { left, right, raw: [], aligned: [] } };
  }
  const count = catTypingFrameCountFor('shared');
  const index = ((frame % count) + count) % count;
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
function referenceTypingFrame(part: string, frame: number, animation: ReferenceTypingAnimation) {
  const count = catTypingFrameCountFor(animation);
  const index = ((frame % count) + count) % count;
  const key = `${animation}/${part}/${index}`;
  const cached = referenceAtlasFrames.get(key);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(imageFor(referenceTypingPath(animation) + part), 0, index * CAT_SIZE, CAT_SIZE, CAT_SIZE, 0, 0, CAT_SIZE, CAT_SIZE);
  referenceAtlasFrames.set(key, canvas);
  return canvas;
}

function drawAtlasRegion(
  ctx: CanvasRenderingContext2D, layer: CatLayer, { x, y, width, height }: CatInkBounds, frame: number, columns: number,
) {
  const sx = frame % columns * width;
  const sy = Math.floor(frame / columns) * height;
  ctx.drawImage(layer, sx, sy, width, height, x, y, width, height);
}

function drawTypingRegion(ctx: CanvasRenderingContext2D, path: string, region: CatInkBounds, frame: number) {
  drawAtlasRegion(ctx, imageFor(path), region, frame, frontTyping.columns);
}

function drawFallingTypingCel(ctx: CanvasRenderingContext2D, part: keyof typeof frontTypingEffects, frame: number) {
  const region = frontTypingEffects[part];
  drawTypingRegion(ctx, frontTypingEffectsPath + part, region, frame % region.frames);
}

const frontPawFrames: HTMLCanvasElement[] = [];
function frontTypingPaws(frame: number, frenzy: boolean) {
  const phase = frame % frontTyping.pawFrames;
  const index = phase + (frenzy ? frontTyping.pawFrames : 0);
  if (frontPawFrames[index]) return frontPawFrames[index]!;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  if (frenzy) drawFallingTypingCel(ctx, 'paws', phase);
  else drawTypingRegion(ctx, frontTyping.path + 'paws', frontTyping.region, phase);
  return frontPawFrames[index] = canvas;
}

const frontPawColors = new WeakMap<CatLayer, WeakMap<HTMLCanvasElement, HTMLCanvasElement>>();
function coloredFrontPaws(source: HTMLCanvasElement, body: CatLayer, config: CatRenderConfig, outlineVersion: OutlineVersion) {
  if (config.palette === 'CC01' && config.coat === 'native' && !usesBodyPattern(config)) return source;
  let frames = frontPawColors.get(body);
  if (!frames) frontPawColors.set(body, frames = new WeakMap());
  let colored = frames.get(source);
  if (!colored) {
    const { canvas, ctx } = makeLayer(CAT_SIZE);
    const paws = recolorFrontPaws(layerPixels(source), layerPixels(body), config.palette === 'CC02');
    ctx.putImageData(paws, 0, 0);
    frames.set(source, colored = canvas);
  }
  return outlinedCatLayer(colored, source, config, outlineVersion);
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

const cleanedArmFrames = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();

function cleanTypingArmInk(source: HTMLCanvasElement, paws: HTMLCanvasElement) {
  const cached = cleanedArmFrames.get(source);
  if (cached) return cached;
  const patch = makeLayer(CAT_SIZE);
  patch.ctx.drawImage(imageFor(referenceTypingPath('reference-v2') + typingInkPatches.forearm), 0, 0);
  patch.ctx.globalCompositeOperation = 'destination-out';
  patch.ctx.drawImage(paws, 0, 0);
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0);
  ctx.drawImage(patch.canvas, 0, 0);
  cleanedArmFrames.set(source, canvas);
  return canvas;
}

function referenceTypingArms(
  path: string, config: CatRenderConfig, mode: TypingMode, frame: number,
  animation: ReferenceTypingAnimation, outlineVersion?: OutlineVersion, inkVersion?: TypingInkVersion,
) {
  const armPart = typingGeometryPart('arms', animation, mode);
  const raw = referenceTypingFrame(armPart, frame, animation);
  const clean = config.palette === 'CC01' && animation === 'reference-v2' && inkVersion !== 'original';
  const paws = referenceTypingFrame(typingGeometryPart('paws', animation, mode), frame, animation);
  const source = clean ? cleanTypingArmInk(raw, paws) : raw;
  if (config.palette === 'CC01' && config.coat === 'native' && !usesBodyPattern(config)) return source;
  const key = catPatternCacheKey(config);
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
  const frameKey = `${animation}/${armPart}/${frame % catTypingFrameCountFor(animation)}/${clean}`;
  const cached = referenceArmCache.frames.get(frameKey);
  if (cached) return outlinedCatLayer(cached, source, config, outlineVersion);
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.putImageData(referenceArmCache.paint(layerPixels(source), layerPixels(paws).data), 0, 0);
  referenceArmCache.frames.set(frameKey, canvas);
  return outlinedCatLayer(canvas, source, config, outlineVersion);
}

const tailPaintLayers = new WeakMap<HTMLImageElement, { key: string; raw: HTMLCanvasElement; aligned?: HTMLCanvasElement }>();
const tailBodyLayers = new WeakMap<CatLayer, { key: string; canvas: HTMLCanvasElement }>();

function selectedTail(config: CatRenderConfig, typing: boolean, layout: TypingLayout | undefined,
  outlineVersion: OutlineVersion, version: TailArtVersion) {
  const shared = Object.hasOwn(sharedTailStyles, config.tail);
  const path = shared ? tailArtPaths[version] : tailPath;
  const asset = path + (typing ? 'typing' : 'idle') + '_' + config.tail;
  const source = imageFor(asset);
  const key = catPatternCacheKey({ ...config, bodyPattern: config.tailPattern ?? config.bodyPattern, bodyBase: undefined });
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
  const needsAlignment = typing && layout !== 'legacy' && !shared;
  const result = needsAlignment ? cached.aligned ??= alignTypingLayer(cached.raw) : cached.raw;
  const guide = needsAlignment ? typingLayer(asset, layout) : source;
  return outlinedCatLayer(result, guide, config, outlineVersion);
}

function tailRemoval(typing: boolean, layout?: TypingLayout) {
  return typing ? typingLayer(tailPath + 'typing_remove', layout) : imageFor(tailPath + 'idle_remove');
}

function bodyWithSelectedTail(body: CatLayer, config: CatRenderConfig, typing: boolean, layout: TypingLayout | undefined,
  outlineVersion: OutlineVersion, version: TailArtVersion) {
  if (config.tail === 'CT01') return body;
  const key = `${catPatternCacheKey(config)}/${config.tail}/${config.tailPattern}/${typing}/${layout}/${outlineVersion}/${version}`;
  const cached = tailBodyLayers.get(body);
  if (cached?.key === key) return cached.canvas;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(body, 0, 0);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(tailRemoval(typing, layout), 0, 0);
  ctx.globalCompositeOperation = 'destination-over';
  ctx.drawImage(selectedTail(config, typing, layout, outlineVersion, version), 0, 0);
  tailBodyLayers.set(body, { key, canvas });
  return canvas;
}

const composedEars = new Map<string, HTMLCanvasElement>();

function frontCatEars(config: CatRenderConfig, layout?: CatPose['earLayout']) {
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

const earTintLayers = new WeakMap<CatLayer, { coat: CatRenderConfig['coat']; color: CatConfig['earColor']; canvas: HTMLCanvasElement }>();

function coloredFrontCatEars(config: CatRenderConfig, layout?: CatPose['earLayout']) {
  const source = frontCatEars(config, layout);
  const { coat, earColor } = config;
  if (earColor === 'natural') return frontCoatLayer(source, config);
  const cached = earTintLayers.get(source);
  if (cached?.coat === coat && cached.color === earColor) return cached.canvas;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(frontCoatLayer(source, config), 0, 0);
  const image = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
  const color = Number.parseInt(catFeatureColors[earColor].color.slice(1), 16);
  paintInnerEarColor(image, layerPixels(source), [color >>> 16, (color >>> 8) & 255, color & 255]);
  ctx.putImageData(image, 0, 0);
  earTintLayers.set(source, { coat, color: earColor, canvas });
  return canvas;
}

type HiddenGlints = readonly [boolean, boolean];

function catHeadEye(config: CatRenderConfig, typing: boolean, frame: number) {
  return !typing && frame >= 25 && frame <= 26 ? 'Y02' : config.eye;
}

type TypingEffects = Pick<CatPose, 'typingMode' | 'typingAnimation' | 'typingEffects' | 'typingInkVersion' | 'typingMouthVersion'>;

function hasEffortEyes(typing: boolean, frame: number, pose: TypingEffects) {
  if (!typing || pose.typingEffects === false) return false;
  const animation = pose.typingAnimation ?? currentTypingAnimation;
  // Rebuild the old transitional expression only for saves from that version.
  if (animation === 'front-v4') {
    const phase = frame % frontTyping.frames;
    return pose.typingMode === 'frenzy' && phase >= 29 && phase < 59;
  }
  return isFrontTyping(animation) || isReferenceTyping(animation)
    ? pose.typingMode === 'frenzy' : animation === 'shared' && pose.typingMode === 'fast';
}

export function catGlintAperture(appearance: CatConfig | CatRenderConfig, typing: boolean, frame: number, pose: TypingEffects = {}) {
  const config = catRenderConfig(appearance);
  if (hasEffortEyes(typing, frame, pose)) return;
  if (config.palette === 'CC01') return imageFor(orangePath + 'iris');
  if (catHeadEye(config, typing, frame) === 'Y01') return imageFor(breedPath(config.palette) + 'aperture');
}

export function catOpenEyeCoverage(appearance: CatConfig | CatRenderConfig) {
  const { palette } = catRenderConfig(appearance);
  // The orange head has baked eyes. Its fur patch covers their full outline.
  return imageFor(palette === 'CC01' ? typingEffectPath + 'orange_eye_patch' : breedPath(palette) + 'eyes');
}

const noseColumns = Object.keys(atlasNoseTips);
const mouthSkinPalettes = Object.keys(breedArt);
const outlinedNosePalettes = new Set<CatConfig['palette']>(['CC05', 'CC06', 'CC07', 'CC08']);
const typingMouths = { gentle: 'CN08', fast: 'CN06', frenzy: 'CN07' } as const satisfies
  Record<TypingMode, keyof typeof sharedMouthStyles>;
const walkMouths = { CN05: 'CN01', CN06: 'CN04', CN07: 'CN01', CN08: 'CN01', CN09: 'CN02' } as const;

export function hasLegacyNoseOutline({ nose, palette }: Pick<CatConfig, 'nose' | 'palette'>) {
  return nose === 'NO01' && outlinedNosePalettes.has(palette);
}

const patternedFaceAtlases = new WeakMap<HTMLImageElement, { key: string; canvas: HTMLCanvasElement }>();

function catFaceAtlas(config: CatRenderConfig, markingLayout?: MarkingLayout, effort = false) {
  const source = imageFor(facePartsPath + config.palette);
  const atlas = frontCoatLayer(source, config, 'face-parts');
  if (markingLayout === 'legacy' || (config.faceBase !== 'solid' && !usesBodyPattern(config))) return atlas;
  const key = `${facePatternCacheKey(config)}/${effort}`;
  let cached = patternedFaceAtlases.get(source);
  if (cached?.key !== key) {
    const { canvas, ctx } = makeLayer(CAT_SIZE);
    ctx.drawImage(atlas, 0, 0);
    const pixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
    if (config.faceBase === 'solid') paintSolidFace(pixels, headFurGuide(config, effort), config,
      undefined, undefined, readBodyPixels(facePartsPath + config.palette));
    paintHeadFur(pixels, readBodyPixels(facePartsPath + 'CC01'), readBodyPixels(headPatternPath + 'face_region'),
      config.bodyPattern === 'plain' ? undefined : readBodyPixels(headPatternPath + 'face_patterns'), config,
      readBodyPixels(facePartsPath + config.palette));
    ctx.putImageData(pixels, 0, 0);
    cached = { key, canvas };
    patternedFaceAtlases.set(source, cached);
  }
  return cached.canvas;
}

const oldNoseTints = new WeakMap<CatLayer, Map<string, HTMLCanvasElement>>();

function paintNoseColor(ctx: CanvasRenderingContext2D, color: readonly number[], originalGreen: number) {
  const { left, top, width, height } = faceTiles;
  const pixels = ctx.getImageData(left, top, width, height);
  for (let offset = 0; offset < pixels.data.length; offset += 4) {
    if (!pixels.data[offset + 3]) continue;
    const shade = pixels.data[offset + 1]! - originalGreen;
    for (let channel = 0; channel < 3; channel++) pixels.data[offset + channel] = color[channel]! + shade;
  }
  ctx.putImageData(pixels, left, top);
}

function nativeNoseColor(palette: CatRenderConfig['palette'], column = 0) {
  const { left, top, width, height } = faceTiles;
  const sample = ((height + 124 - top) * CAT_SIZE + column * width + 151 - left) * 4;
  return readBodyPixels(facePartsPath + palette).subarray(sample, sample + 3);
}

export function catNaturalSwatches(appearance: CatConfig) {
  const { palette } = catRenderConfig(appearance);
  const orange = palette === 'CC01';
  const base = orange ? orangePath : breedPath(palette);
  const sample = (path: string, x: number, y: number) => {
    const offset = (y * CAT_SIZE + x) * 4;
    return readBodyPixels(path).subarray(offset, offset + 3);
  };
  const hex = (rgb: Uint8ClampedArray) =>
    '#' + Array.from(rgb, channel => channel.toString(16).padStart(2, '0')).join('');
  const innerEyeColor = hex(sample(base + (orange ? 'head_base' : 'eyes'), 112, 117));
  const eyeColor = orange ? catIrisColors.amber : naturalFrontIris[palette];
  return {
    earColor: hex(sample(base + 'ear_upright', 80, 53)),
    noseColor: hex(nativeNoseColor(palette)),
    eyeColor,
    innerEyeColor,
    singleEyeColor: orange ? innerEyeColor : eyeColor,
  };
}

function drawNosePart(ctx: CanvasRenderingContext2D, config: CatRenderConfig, atlas: CatLayer) {
  const { left, top, width, height } = faceTiles;
  const { nose, noseColor, palette } = config;
  const column = noseColumns.indexOf(nose);
  if (column >= 0 && noseColor === 'natural') {
    ctx.drawImage(atlas, column * width, height, width, height, left, top, width, height);
    return;
  }
  // The unmodified per-breed atlas provides the natural nose pigment. The
  // new shapes are isolated from skin, mouth and eyes before recoloring.
  const natural = nativeNoseColor(palette, Math.max(0, column));
  const hex = noseColor === 'natural' ? undefined : Number.parseInt(catFeatureColors[noseColor].color.slice(1), 16);
  const color = hex === undefined ? [...natural] : [hex >>> 16, (hex >>> 8) & 255, hex & 255];
  const key = `nose/${nose}/${color.join(',')}`;
  if (column < 0) {
    const art = imageFor(catNosePath + nose);
    let recolored = tinted.get(key);
    if (!recolored) {
      const layer = makeLayer(CAT_SIZE);
      layer.ctx.drawImage(art, 0, 0);
      // The main pigment in the Aseprite source is #E77E8F.
      paintNoseColor(layer.ctx, color, 126);
      recolored = layer.canvas;
      tinted.set(key, recolored);
    }
    ctx.drawImage(recolored, 0, 0);
    return;
  }
  let variants = oldNoseTints.get(atlas);
  if (!variants) oldNoseTints.set(atlas, variants = new Map());
  let recolored = variants.get(key);
  if (!recolored) {
    const layer = makeLayer(CAT_SIZE);
    layer.ctx.drawImage(atlas, column * width, height, width, height, left, top, width, height);
    paintNoseColor(layer.ctx, color, natural[1]!);
    recolored = layer.canvas;
    variants.set(key, recolored);
  }
  ctx.drawImage(recolored, 0, 0);
}

const blackMouthLayers = new WeakMap<HTMLImageElement, HTMLCanvasElement>();
let cachedMouthSkin: { key: string; canvas: HTMLCanvasElement } | undefined;

function mouthSkinLayer(config: CatRenderConfig, markingLayout?: MarkingLayout) {
  const key = `${facePatternCacheKey(config)}/${markingLayout}`;
  if (cachedMouthSkin?.key === key) return cachedMouthSkin.canvas;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  const { left, top, width, height } = faceTiles;
  const skin = frontCoatLayer(imageFor(mouthSkinPath), config, 'face-parts');
  const cell = mouthSkinPalettes.indexOf(config.palette);
  ctx.drawImage(skin, cell % mouthSkinColumns * width, Math.floor(cell / mouthSkinColumns) * height,
    width, height, left, top, width, height);
  if (markingLayout !== 'legacy' && (config.faceBase === 'solid' || usesBodyPattern(config))) {
    const pixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
    const guide = headFurGuide(config, false);
    if (config.faceBase === 'solid') paintSolidFace(pixels, guide, config);
    paintHeadFur(pixels, guide, readBodyPixels(headPatternPath + 'face_region'),
      config.bodyPattern === 'plain' ? undefined : readBodyPixels(headPatternPath + 'face_patterns'), config);
    ctx.putImageData(pixels, 0, 0);
  }
  cachedMouthSkin = { key, canvas };
  return canvas;
}

function sharedMouthLayer(config: CatRenderConfig) {
  const art = imageFor(catMouthPath + config.mouth);
  if (config.palette !== 'CC02') return art;
  const cached = blackMouthLayers.get(art);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  const { left, top, width, height } = faceTiles;
  ctx.drawImage(art, 0, 0);
  const pixels = ctx.getImageData(left, top, width, height);
  for (let offset = 0; offset < pixels.data.length; offset += 4) {
    if (pixels.data[offset + 3] && pixels.data[offset + 1]! < 70) {
      pixels.data.set([38, 27, 28], offset);
    }
  }
  ctx.putImageData(pixels, left, top);
  blackMouthLayers.set(art, canvas);
  return canvas;
}

function drawCatFaceParts(
  ctx: CanvasRenderingContext2D, config: CatRenderConfig, markingLayout: MarkingLayout | undefined,
  transientMouth: 'smile' | 'flat' | undefined, animation: TypingAnimation, cleanMouth: boolean,
  legacyNoseOutline?: boolean, effortMouth = false, effort = false,
) {
  // The Aseprite exporter packs the original face coordinates into three rows.
  const { left, top, width, height } = faceTiles;
  const atlas = catFaceAtlas(config, markingLayout, effort);
  const customMouth = Object.hasOwn(sharedMouthStyles, config.mouth);
  const tip = atlasNoseTips[config.nose as keyof typeof atlasNoseTips]
    ?? sharedNoseStyles[config.nose as keyof typeof sharedNoseStyles][1];
  const draw = (column: number, row: number) =>
    ctx.drawImage(atlas, column * width, row * height, width, height, left, top, width, height);
  const drawNose = () => {
    if (legacyNoseOutline && hasLegacyNoseOutline(config)) {
      ctx.drawImage(imageFor(legacyNoseOutlinePath), 0, 0);
    }
    drawNosePart(ctx, config, atlas);
  };
  draw(0, 2);
  if (cleanMouth) {
    const patch = imageFor(referenceTypingPath('reference-v2') + typingInkPatches.mouth);
    ctx.drawImage(frontCoatLayer(patch, config), 0, 0);
  }
  if (customMouth) {
    // Restore the local fur before compositing the independent lips. Old
    // flattened saves still need the original face atlas and its exact pixels.
    ctx.drawImage(mouthSkinLayer(config, markingLayout), 0, 0);
  }
  if (effortMouth) {
    const path = frontTypingEffectsPath + 'mouth';
    const line = coloredCatIris(path, config.palette === 'CC02' ? '#261B1C' : '#442416');
    ctx.drawImage(line, 0, Math.max(0, tip - 130));
    drawNose();
    return;
  }
  if (transientMouth && isReferenceTyping(animation)) {
    const path = referenceTypingPath(animation) + `mouth_${transientMouth}`;
    const line = config.palette === 'CC02' ? coloredCatIris(path, '#201B1E') : imageFor(path);
    ctx.drawImage(line, 0, 0);
    const gap = 132 - tip - 1;
    if (gap > 0) ctx.drawImage(line, 150, 132, 3, 1, 150, tip + 1, 3, gap);
    // The nose remains an independent user choice, above the temporary mouth.
    drawNose();
    return;
  }
  if (customMouth) {
    const line = sharedMouthLayer(config);
    ctx.drawImage(line, 0, 0);
    const stemX = 149, stemY = 131, stemWidth = 4;
    const gap = stemY - tip - 1;
    if (gap > 0) ctx.drawImage(line, stemX, stemY, stemWidth, 1, stemX, tip + 1, stemWidth, gap);
  } else {
    const mouth = legacyMouthIds.indexOf(config.mouth as typeof legacyMouthIds[number]);
    draw(mouth, 0);
    const gap = mouthStems[mouth]! - tip - 1;
    if (gap > 0) {
      const stemX = 150, sampleY = 134;
      ctx.drawImage(atlas, mouth * width + stemX - left, sampleY - top, 3, 1, stemX, tip + 1, 3, gap);
    }
  }
  drawNose();
}

function drawCatGlints(
  ctx: CanvasRenderingContext2D, config: CatRenderConfig, typing: boolean, frame: number, gaze: Gaze, scale: number,
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
const cleanRimHeads = new WeakMap<HTMLImageElement, CatLayer>();
const expandedEyeMasks = new Map<string, Uint8Array>();
const sharedPatternHeads = new Map<string, HTMLCanvasElement>();
const sharedHeadGuides = new Map<string, Uint8ClampedArray>();
const nativeHeadPigment = new WeakMap<CatLayer, Uint8ClampedArray>();
const headOutlineGuides = new Map<string, HTMLCanvasElement>();
const bareForeheadHeads = new WeakMap<CatLayer, HTMLCanvasElement>();

function headOutlineGuide(config: CatRenderConfig) {
  const shape = catFrontEars[config.ear];
  const cached = headOutlineGuides.get(shape);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(imageFor(orangePath + 'head_base'), 0, 0);
  ctx.drawImage(imageFor(orangePath + `ear_${shape}`), 0, 0);
  headOutlineGuides.set(shape, canvas);
  return canvas;
}

function bareForeheadHead(head: CatLayer, guide: HTMLCanvasElement) {
  const cached = bareForeheadHeads.get(head);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(head, 0, 0);
  const pixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
  clearForeheadOutlineSpots(pixels, outlineGuidePixels(guide));
  ctx.putImageData(pixels, 0, 0);
  bareForeheadHeads.set(head, canvas);
  return canvas;
}

function expandedEyeMask(path: string) {
  const cached = expandedEyeMasks.get(path);
  if (cached) return cached;
  const guide = readBodyPixels(path);
  const mask = new Uint8Array(CAT_SIZE * CAT_SIZE);
  for (let y = 1; y < CAT_SIZE - 1; y++) {
    for (let x = 1; x < CAT_SIZE - 1; x++) {
      if (!guide[(y * CAT_SIZE + x) * 4 + 3]) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        mask[(y + dy) * CAT_SIZE + x + dx] = 1;
      }
    }
  }
  expandedEyeMasks.set(path, mask);
  return mask;
}

function headFurGuide(config: CatRenderConfig, effort: boolean, cleanSolidEyes = false) {
  const sharedNose = Object.hasOwn(sharedNoseStyles, config.nose);
  const sharedMouth = Object.hasOwn(sharedMouthStyles, config.mouth);
  const solid = config.faceBase === 'solid';
  const key = `${config.ear}/${effort}/${sharedNose}/${sharedMouth}/${solid}/${cleanSolidEyes ? config.palette : ''}`;
  const cached = sharedHeadGuides.get(key);
  if (cached) return cached;
  const { ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(imageFor(orangePath + 'head_base'), 0, 0);
  if (effort) ctx.drawImage(imageFor(typingEffectPath + 'orange_eye_patch'), 0, 0);
  if (sharedNose || sharedMouth) {
    // The old nose or mouth in the guide would reserve its pixels as ink,
    // even where a newly selected, smaller feature leaves visible fur.
    const { left, top, width, height } = faceTiles;
    const patchHeight = sharedMouth ? height : atlasNoseTips.NO01 - top + 1;
    ctx.drawImage(imageFor(facePartsPath + 'CC01'), 0, 2 * height, width, patchHeight,
      left, top, width, patchHeight);
    if (sharedMouth) ctx.drawImage(imageFor(mouthSkinPath), 0, 0, width, height, left, top, width, height);
  }
  const shape = catFrontEars[config.ear];
  ctx.drawImage(imageFor(orangePath + `ear_${shape}`), 0, 0);
  const data = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE).data;
  if (cleanSolidEyes) {
    // Treat the area reserved for the orange eyes as fur before the separate
    // breed eyes go down, including the edge formerly hidden by the old coat.
    const coverage = expandedEyeMask(breedPath(config.palette) + 'eyes');
    for (let i = 0; i < coverage.length; i++) {
      if (coverage[i] && data[i * 4 + 3]) data.set([243, 174, 109], i * 4);
    }
  }
  if (shape !== 'upright' || solid) {
    const ear = readBodyPixels(earMaskPath + (shape === 'upright' ? 'folded' : shape));
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

function nativeHeadPigmentGuide(head: CatLayer, ears: CatLayer) {
  const cached = nativeHeadPigment.get(ears);
  if (cached) return cached;
  const { ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(head, 0, 0);
  ctx.drawImage(ears, 0, 0);
  const data = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE).data;
  nativeHeadPigment.set(ears, data);
  return data;
}

function sharedPatternHead(config: CatRenderConfig, effort: boolean, earLayout?: CatPose['earLayout'], cleanEyeRim = false) {
  const sharedNose = Object.hasOwn(sharedNoseStyles, config.nose);
  const sharedMouth = Object.hasOwn(sharedMouthStyles, config.mouth);
  const key = `${facePatternCacheKey(config)}/${config.pattern}/${config.ear}/${config.earColor}/${effort}/${earLayout}/${sharedNose}/${sharedMouth}/${cleanEyeRim}`;
  const cached = sharedPatternHeads.get(key);
  if (cached) return cached;
  const { palette } = config;
  const orange = palette === 'CC01';
  const path = orange ? orangePath : breedPath(palette);
  const original = imageFor(path + (orange ? 'head_base' : 'head'));
  const base = effort && !orange ? headWithoutBakedEyes(original, palette, cleanEyeRim) : original;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(frontCoatLayer(base, config, orange ? 'orange-head' : 'fur'), 0, 0);
  if (effort && orange) ctx.drawImage(frontCoatLayer(imageFor(typingEffectPath + 'orange_eye_patch'), config), 0, 0);
  ctx.drawImage(coloredFrontCatEars(config, earLayout), 0, 0);
  if (config.faceBase === 'solid' || config.pattern !== 'P00' || usesBodyPattern(config)) {
    const pixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
    const solid = config.faceBase === 'solid';
    // Repaint behind the separate eye cels when removing the point mask.
    const guide = headFurGuide(config, effort || (solid && (palette === 'CC04' || palette === 'CC08')), cleanSolidFaceEyes(config));
    const forehead = readBodyPixels(headPatternPath + 'forehead_region');
    const cheeks = readBodyPixels(headPatternPath + 'face_region');
    if (solid) {
      const nativeHead = !orange && !catKeepsBreedPigment(config)
        ? nativeHeadPigmentGuide(original, frontCatEars(config, earLayout)) : undefined;
      paintSolidFace(pixels, guide, config, config.pattern === 'P00' ? forehead : undefined,
        config.bodyPattern === 'native' ? cheeks : undefined, undefined, nativeHead);
    }
    if (config.pattern !== 'P00') {
      // The crown shares the same pigment regions as the cheeks. Previous
      // snapshots only preserved them while the original coat was selected.
      const nativeColorRegions = catKeepsBreedPigment(config)
        || (config.bodyPattern === 'native' && ['CC03', 'CC04', 'CC08'].includes(config.palette));
      if (!nativeColorRegions) clearForeheadFur(pixels, guide, forehead, config);
      if (foreheadParts.includes(config.pattern)) {
        paintForeheadFur(pixels, guide, forehead, readBodyPixels(headPatternPath + `forehead_${config.pattern}`), config);
      }
    }
    paintHeadFur(pixels, guide, cheeks,
      config.bodyPattern === 'plain' ? undefined : readBodyPixels(headPatternPath + 'face_patterns'), config);
    ctx.putImageData(pixels, 0, 0);
  }
  // Keep a small set of recent appearances; typing frames reuse the same head.
  if (sharedPatternHeads.size >= 32) sharedPatternHeads.delete(sharedPatternHeads.keys().next().value!);
  sharedPatternHeads.set(key, canvas);
  return canvas;
}

function headWithoutBakedEyes(head: HTMLImageElement, palette: FrontBreed, cleanEyeRim: boolean): CatLayer {
  const cache = cleanEyeRim ? cleanRimHeads : cleanEyeHeads;
  const cached = cache.get(head);
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
  // The Siamese head already had its pupil ink removed, but kept thin
  // streaks from the original eye fill along the colorpoint mask.
  const hasOldSiameseFill = cleanEyeRim && palette === 'CC04';
  if (!eyeArea || (!hasOldSiameseFill && bakedInk / eyeArea < 0.8)) {
    cache.set(head, head);
    return head;
  }

  // The iris aperture excludes the sclera and can leave opaque flecks at
  // the rim. Use the complete open-eye cel when restoring the surrounding fur.
  const mask = expandedEyeMask(breedPath(palette) + (cleanEyeRim ? 'eyes' : 'aperture'));
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
    let red = 0, green = 0, blue = 0, weightSum = 0;
    for (const sample of boundary) {
      const dx = sample % CAT_SIZE - x, dy = Math.floor(sample / CAT_SIZE) - y;
      const squared = dx * dx + dy * dy;
      if (cleanEyeRim) {
        const color = original[sample]!;
        const weight = 1 / (squared * squared);
        red += (color & 255) * weight;
        green += ((color >>> 8) & 255) * weight;
        blue += ((color >>> 16) & 255) * weight;
        weightSum += weight;
      } else if (squared < distance) {
        distance = squared;
        nearest = sample;
      }
    }
    // Reconstruct opaque fur from the local colors. Copying a single
    // boundary pixel creates visible streaks across the old eye.
    if (weightSum) {
      const offset = index * 4;
      pixels.data[offset] = red / weightSum;
      pixels.data[offset + 1] = green / weightSum;
      pixels.data[offset + 2] = blue / weightSum;
      pixels.data[offset + 3] = 255;
    } else {
      output[index] = original[nearest]!;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  cache.set(head, canvas);
  return canvas;
}

export function drawCatHead(
  ctx: CanvasRenderingContext2D, appearance: CatConfig | CatRenderConfig, typing: boolean, frame: number, gaze: Gaze,
  { scale = 1, earLayout, hideGlints, markingLayout, legacyNoseOutline, outlineVersion = 'adaptive', closeEyes = false, ...typingPose }:
    TypingEffects & Pick<CatPose, 'earLayout' | 'markingLayout' | 'outlineVersion' | 'legacyNoseOutline'>
      & { scale?: number; hideGlints?: HiddenGlints; closeEyes?: boolean } = {},
) {
  const animation = typingPose.typingAnimation ?? currentTypingAnimation;
  const mode = typingPose.typingMode ?? 'gentle';
  const effectsAnimation = isFrontTyping(animation) ? 'reference-v2' : animation;
  const referenceEffects = typing && isReferenceTyping(effectsAnimation) && typingPose.typingEffects !== false;
  const frenzyEffects = referenceEffects && usesFallingTyping(animation) && mode === 'frenzy';
  const transitionalFace = frenzyEffects && animation === 'front-v4';
  const sharedTypingMouth = referenceEffects && effectsAnimation === 'reference-v2' && typingPose.typingMouthVersion !== 'legacy';
  const selected = catRenderConfig(appearance);
  const config = sharedTypingMouth ? { ...selected, mouth: transitionalFace ? typingMouths.gentle : typingMouths[mode] } : selected;
  const { palette } = config;
  const orange = palette === 'CC01';
  const faceConfig = facePatternConfig(config);
  const path = orange ? orangePath : breedPath(palette);
  const accessory = config.accessory === 'A07' ? 'A06' : config.accessory;
  const eye = catHeadEye(config, typing, frame);
  const effort = hasEffortEyes(typing, frame, typingPose);
  const eyesClosed = effort || closeEyes;
  const cleanEyeRim = !orange && (closeEyes || (effort && effectsAnimation === 'reference-v2'
    && (typingPose.typingInkVersion ?? currentTypingInkVersion) === currentTypingInkVersion));
  const leftPupil = catPupilStyle(config, 'left');
  const rightPupil = catPupilStyle(config, 'right');
  const cycleFrames = catTypingFrameCountFor(animation);
  const firstHalf = ((frame % cycleFrames) + cycleFrames) % cycleFrames < cycleFrames / 2;
  const transientMouth = referenceEffects && !sharedTypingMouth && (config.mouth === 'CN01' || config.mouth === 'CN05')
    ? mode === 'frenzy' ? 'smile' : mode === 'fast' ? firstHalf ? 'smile' : 'flat' : undefined
    : undefined;
  if (markingLayout === 'legacy') {
    const head = imageFor(path + (orange ? 'head_base' : 'head'));
    const base = eyesClosed && !orange ? headWithoutBakedEyes(head, palette, cleanEyeRim) : head;
    ctx.drawImage(outlinedCatLayer(frontCoatLayer(base, config, orange ? 'orange-head' : 'fur'),
      imageFor(orangePath + 'head_base'), config, outlineVersion, true), 0, 0);
    if (eyesClosed && orange) ctx.drawImage(frontCoatLayer(imageFor(typingEffectPath + 'orange_eye_patch'), config), 0, 0);
    ctx.drawImage(outlinedCatLayer(coloredFrontCatEars(config, earLayout),
      imageFor(orangePath + `ear_${catFrontEars[config.ear]}`), config, outlineVersion, true), 0, 0);
    if (['P01', 'P02', 'P06'].includes(config.pattern)) {
      const template = config.palette === 'CC01' ? config.palette : sharedBreedParts[config.palette];
      const face = imageFor((orange ? orangePath : breedPath(template)) + `face_${config.pattern}`);
      ctx.drawImage(frontCoatLayer(face, template === config.palette ? config : { ...config, palette: template }), 0, 0);
    }
  } else {
    const guide = headOutlineGuide(config);
    const head = outlinedCatLayer(sharedPatternHead(faceConfig, eyesClosed, earLayout, cleanEyeRim), guide, config, outlineVersion, true);
    const bareForehead = config.pattern === 'P03' && markingLayout !== 'shared';
    ctx.drawImage(bareForehead ? bareForeheadHead(head, guide) : head, 0, 0);
  }
  if (!eyesClosed && !orange) {
    const cleanRim = markingLayout !== 'legacy' && cleanSolidFaceEyes(faceConfig);
    drawEyePair(ctx, frontCatEye(palette, eye, leftPupil, cleanRim), frontCatEye(palette, eye, rightPupil, cleanRim));
  }
  const cleanMouth = orange && typing && animation === 'reference-v2' && typingPose.typingInkVersion !== 'original';
  const effortMouth = transitionalFace && effort && sharedTypingMouth;
  const orangeMouth = effortMouth && orange && faceConfig.faceBase !== 'solid' && config.coat === 'native' && faceConfig.bodyPattern === 'native'
    && config.nose === 'NO05' && markingLayout !== 'legacy';
  drawCatFaceParts(ctx, faceConfig, markingLayout, transientMouth, effectsAnimation, cleanMouth,
    legacyNoseOutline, effortMouth && !orangeMouth, effort);
  if (orangeMouth) ctx.drawImage(imageFor(frontTypingEffectsPath + 'mouth_orange'), 0, 0);
  const pupilPath = breedPath(orange ? 'CC03' : config.palette);
  if (!eyesClosed && orange) {
    drawEyePair(ctx, orangeCatIris(leftPupil, pupilPath), orangeCatIris(rightPupil, pupilPath));
  }
  if (!eyesClosed && (orange || eye === 'Y01')) {
    drawEyePair(ctx, innerCatIris(leftPupil, pupilPath), innerCatIris(rightPupil, pupilPath));
  } else if (!eyesClosed && !orange && (eye === 'Y03' || eye === 'Y04' || eye === 'Y05')
    && (config.leftInnerEyeColor !== undefined || config.rightInnerEyeColor !== undefined)) {
    // Legacy open-eye variants have an aperture but lack a separate inner
    // mask. Keep their original art until that side chooses an inner color.
    const alternatePath = `${breedPath(sharedBreedParts[palette])}eye_${eye}_`;
    drawEyePair(ctx,
      config.leftInnerEyeColor === undefined ? undefined : innerCatIris(leftPupil, alternatePath, true),
      config.rightInnerEyeColor === undefined ? undefined : innerCatIris(rightPupil, alternatePath, true));
  }
  if (effort) {
    const path = (referenceEffects ? referenceTypingPath(effectsAnimation) : typingEffectPath) + 'effort_eyes';
    const expression = config.palette === 'CC02'
      ? coloredCatIris(path, '#201B1E') : imageFor(path);
    ctx.drawImage(expression, 0, 0);
  } else if (!closeEyes) {
    drawCatGlints(ctx, config, typing, frame, gaze, scale, hideGlints);
  }
  // New sweat belongs on the forehead, beneath hats and hair clips. Preserve
  // the old shared order when reconstructing older pixel-editor saves.
  if (frenzyEffects) {
    drawFallingTypingCel(ctx, 'sweat', frame);
  } else if (referenceEffects && mode !== 'gentle') {
    ctx.drawImage(referenceTypingFrame(`sweat_${mode}`, frame, effectsAnimation), 0, 0);
  }
  if (accessory !== 'A00') ctx.drawImage(imageFor(`${orangePath}accessory_${accessory}`), 0, 0);
  if (effort && !referenceEffects) {
    const sweat = Math.floor((frame % catTypingFrameCountFor('shared')) / 3) - 1;
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

function frontCatLayers(config: CatRenderConfig, typing: boolean, frame: number, pose: CatPose) {
  const orange = config.palette === 'CC01';
  const path = orange ? orangePath : breedPath(config.palette);
  const mode = pose.typingMode ?? 'gentle';
  const animation = pose.typingAnimation ?? currentTypingAnimation;
  const layout = pose.typingLayout;
  const outlineVersion = pose.outlineVersion ?? 'adaptive';
  const tailArtVersion = pose.tailArtVersion ?? 'clean';
  const laptopVersion = layout === 'legacy' ? 'original'
    : pose.laptopVersion ?? (isFrontTyping(animation) || isReferenceTyping(animation) ? 'clean' : 'original');
  const historicalBody = typing && !isFrontTyping(animation);
  const bodyBase = frontBodyLayer(path, historicalBody ? 'typing_body' : 'body', config, layout, outlineVersion);
  const selectedBody = bodyWithSelectedTail(bodyBase, config, historicalBody, layout, outlineVersion, tailArtVersion);
  const body = historicalBody ? bodyWithTypingConnector(selectedBody, config, layout, laptopVersion) : selectedBody;
  const frenzyPaws = usesFallingTyping(animation) && mode === 'frenzy';
  const frontPaws = typing && isFrontTyping(animation) ? frontTypingPaws(frame, frenzyPaws) : undefined;
  const pawPigment = frontPaws && catKeepsBreedPigment(config) && usesBodyPattern(config)
    ? frontBodyLayer(path, 'body', { ...config, bodyPattern: 'native' }, layout, outlineVersion) : bodyBase;
  const arms = !typing ? undefined : frontPaws
    ? coloredFrontPaws(frontPaws, pawPigment, config, outlineVersion)
    : animation === 'legacy'
    ? frontBodyLayer(path, `typing_arms_${mode}_${frame}`, config, layout, outlineVersion)
    : animation === 'shared' ? sharedTypingArms(path, config, frame, layout, outlineVersion)
      : isReferenceTyping(animation) ? referenceTypingArms(path, config, mode, frame, animation, outlineVersion, pose.typingInkVersion) : undefined;
  const raisedPaws = typing && animation === 'legacy' && mode === 'fast' && frame < 3
    ? frontBodyLayer(path, `typing_front_${frame}`, config, layout, outlineVersion) : undefined;
  const laptop = typing ? catTypingLaptop(config, layout, laptopVersion, animation) : undefined;
  return { body, bodyBase, arms, frontPaws, frenzyPaws, historicalBody, raisedPaws, laptop, mode, animation, outlineVersion, laptopVersion, tailArtVersion };
}

const inkArea = CAT_SIZE * CAT_SIZE;
const inkBounds = { x: 0, y: 0, width: CAT_SIZE, height: CAT_SIZE };
const canvasInkGeometry: CatInkGeometry = { canvas: { bounds: inkBounds } };
const inkAlpha = new WeakMap<CatLayer, Uint8Array>();
const headInkCache = new Map<string, CatInkGeometry>();
const bodyInkCache = new Map<string, CatInkGeometry>();
const headInkParts = ['head', 'leftEar', 'rightEar'] as const;
const bodyInkParts = ['torso', 'tail', 'leftPaw', 'rightPaw'] as const;

function catLayerAlpha(source: CatLayer) {
  const cached = inkAlpha.get(source);
  if (cached) return cached;
  const { data } = layerPixels(source);
  const result = new Uint8Array(inkArea);
  for (let index = 0; index < inkArea; index++) result[index] = data[index * 4 + 3] ? 1 : 0;
  inkAlpha.set(source, result);
  return result;
}

function fittedInkSurface(mask: Uint8Array, bounds?: CatInkBounds) {
  if (bounds) return { bounds, mask };
  let left = CAT_SIZE, right = -1, top = CAT_SIZE, bottom = -1;
  for (let index = 0; index < mask.length; index++) {
    if (!mask[index]) continue;
    const x = index % CAT_SIZE, y = Math.floor(index / CAT_SIZE);
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  if (right < left) return;
  return { bounds: { x: left, y: top, width: right - left + 1, height: bottom - top + 1 }, mask };
}

function placedHeadMask(mask: Uint8Array, placement: ReturnType<typeof catHeadPlacement>) {
  if (placement.scale === 1) return mask;
  const result = new Uint8Array(inkArea);
  for (let y = placement.y; y < CAT_SIZE; y++) {
    const sourceY = Math.floor((y + 0.5 - placement.y) / placement.scale);
    if (sourceY >= CAT_SIZE) break;
    for (let x = placement.x; x < CAT_SIZE; x++) {
      const sourceX = Math.floor((x + 0.5 - placement.x) / placement.scale);
      if (sourceX >= CAT_SIZE) break;
      result[y * CAT_SIZE + x] = mask[sourceY * CAT_SIZE + sourceX]!;
    }
  }
  return result;
}

function catHeadInkGeometry(config: CatRenderConfig, typing: boolean, pose: CatPose): CatInkGeometry {
  const layout = typing ? pose.typingLayout : undefined;
  const key = `${config.palette}/${config.ear}/${config.accessory}/${pose.earLayout}/${layout}`;
  const cached = headInkCache.get(key);
  if (cached) return cached;
  const base = catLayerAlpha(imageFor(config.palette === 'CC01' ? `${orangePath}head_base` : `${breedPath(config.palette)}head`));
  const ears = catLayerAlpha(frontCatEars(config, pose.earLayout));
  const shape = catFrontEars[config.ear];
  // The upright cel also holds the crown. The folded-ear blend guide was
  // drawn over both those original ears and the replacement silhouette.
  const earRegions = readBodyPixels(earMaskPath + (shape === 'upright' ? 'folded' : shape));
  const accessory = config.accessory === 'A07' ? 'A06' : config.accessory;
  const worn = accessory !== 'A00' ? catLayerAlpha(imageFor(`${orangePath}accessory_${accessory}`)) : undefined;
  const leftEar = new Uint8Array(inkArea), rightEar = new Uint8Array(inkArea), head = new Uint8Array(inkArea);
  for (let index = 0; index < inkArea; index++) {
    const offset = index * 4;
    if (worn?.[index]) head[index] = 1;
    else if (ears[index] && earRegions[offset] === 255) leftEar[index] = 1;
    else if (ears[index] && earRegions[offset + 1] === 255) rightEar[index] = 1;
    else if (base[index] || ears[index]) head[index] = 1;
  }
  const placement = catHeadPlacement(typing, 0, layout);
  const bounds = placement.scale === 1 ? inkBounds : {
    x: placement.x, y: placement.y,
    width: Math.round(CAT_SIZE * placement.scale), height: Math.round(CAT_SIZE * placement.scale),
  };
  const geometry = {
    head: fittedInkSurface(placedHeadMask(head, placement), bounds),
    leftEar: fittedInkSurface(placedHeadMask(leftEar, placement)),
    rightEar: fittedInkSurface(placedHeadMask(rightEar, placement)),
  };
  if (headInkCache.size >= 24) headInkCache.delete(headInkCache.keys().next().value!);
  headInkCache.set(key, geometry);
  return geometry;
}

function idlePawAt(x: number, y: number) {
  // The idle front paws are baked into one cel, with the hind paws and
  // chest beside them. These cuts run along the shared front-paw outlines.
  if (y < 252) return;
  const leftEdge = y < 264 ? 103 : 107;
  const innerLeft = y < 256 ? 144 : y < 266 ? 149 : 153;
  const innerRight = y < 256 ? 158 : y < 266 ? 157 : 153;
  const rightEdge = y < 264 ? 199 : 194;
  if (x >= leftEdge && x < innerLeft) return 'leftPaw';
  if (x >= innerRight && x < rightEdge) return 'rightPaw';
}

function catBodyInkGeometry(
  config: CatRenderConfig, typing: boolean, frame: number, pose: CatPose, layers: ReturnType<typeof frontCatLayers>,
): CatInkGeometry {
  const { body, bodyBase, arms, frontPaws, frenzyPaws, historicalBody, laptop, mode, animation, outlineVersion, laptopVersion, tailArtVersion } = layers;
  const layout = pose.typingLayout;
  // The three speeds share the same geometry. Expression and letter effects
  // do not change which part owns an edited pixel.
  const armMode = animation === 'reference-v2' || (isFrontTyping(animation) && !frenzyPaws) ? '' : mode;
  const geometryFrame = frontPaws ? frame % frontTyping.pawFrames : frame;
  const poseKey = typing ? `${animation}/${layout}/${laptopVersion}/${armMode}/${geometryFrame}` : 'idle';
  const key = `${config.palette}/${config.tail}/${tailArtVersion}/${poseKey}`;
  const cached = bodyInkCache.get(key);
  if (cached) return cached;
  const bodyAlpha = catLayerAlpha(body), armsAlpha = arms && catLayerAlpha(arms);
  const laptopAlpha = laptop && catLayerAlpha(laptop);
  const baseAlpha = catLayerAlpha(bodyBase), removedTail = catLayerAlpha(tailRemoval(historicalBody, layout));
  const replacementTail = config.tail !== 'CT01'
    ? catLayerAlpha(selectedTail(config, historicalBody, layout, outlineVersion, tailArtVersion)) : undefined;
  const referencePaws = frontPaws ? catLayerAlpha(frontPaws) : typing && isReferenceTyping(animation)
    ? catLayerAlpha(referenceTypingFrame(typingGeometryPart('paws', animation, mode), frame, animation)) : undefined;
  const leftPaw = new Uint8Array(inkArea), rightPaw = new Uint8Array(inkArea);
  const tail = new Uint8Array(inkArea), torso = new Uint8Array(inkArea);
  for (let index = 0; index < inkArea; index++) {
    if (!bodyAlpha[index] && !armsAlpha?.[index]) continue;
    const x = index % CAT_SIZE, y = Math.floor(index / CAT_SIZE);
    // Older flattened arm cels have no paw mask. Give their low hand area
    // an owner when converting a historical editor save to the new format.
    let paw;
    if (!typing) paw = idlePawAt(x, y);
    else if (armsAlpha?.[index]) {
      const paintedPaw = referencePaws?.[index] ?? (layout === 'legacy'
        ? y >= 180 && x >= 92 && x < 209
        : y >= 200 && x >= 77 && x < 210);
      if (paintedPaw) paw = x < 150 ? 'leftPaw' : 'rightPaw';
    }
    if (paw === 'leftPaw') leftPaw[index] = 1;
    else if (paw === 'rightPaw') rightPaw[index] = 1;
    else if ((!historicalBody || !laptopAlpha?.[index]) && !armsAlpha?.[index] && bodyAlpha[index] && (replacementTail
      ? replacementTail[index] && (!baseAlpha[index] || removedTail[index])
      : baseAlpha[index] && removedTail[index])) tail[index] = 1;
    else torso[index] = 1;
  }
  const geometry = {
    torso: fittedInkSurface(torso, inkBounds), tail: fittedInkSurface(tail),
    leftPaw: fittedInkSurface(leftPaw), rightPaw: fittedInkSurface(rightPaw),
    laptop: laptopAlpha && fittedInkSurface(laptopAlpha, inkBounds),
  };
  if (bodyInkCache.size >= 72) bodyInkCache.delete(bodyInkCache.keys().next().value!);
  bodyInkCache.set(key, geometry);
  return geometry;
}

export function catInkGeometry(appearance: CatConfig, typing: boolean, frame: number, pose: CatPose = {}): CatInkGeometry {
  const config = catRenderConfig(appearance, pose.furPatternColors);
  const count = frameCount(appearance, typing ? 'typing' : 'sit', pose.typingAnimation);
  const index = ((frame % count) + count) % count;
  const layers = frontCatLayers(config, typing, index, pose);
  const head = catHeadInkGeometry(config, typing, pose);
  if (layers.frontPaws && head.head?.mask) {
    const paws = catLayerAlpha(layers.frontPaws);
    const mask = head.head.mask.map((pixel, index) => paws[index] ? 0 : pixel);
    return { ...canvasInkGeometry, ...catBodyInkGeometry(config, typing, index, pose, layers),
      ...head, head: { ...head.head, mask } };
  }
  // The idle bob moves all authored surfaces together. The pixel editor
  // accounts for that translation in its cursor coordinates.
  return { ...canvasInkGeometry, ...catBodyInkGeometry(config, typing, index, pose, layers), ...head };
}

function drawCatFront(ctx: CanvasRenderingContext2D, config: CatRenderConfig, typing: boolean, frame: number, gaze: Gaze, pose: CatPose,
  closeEyes = false,
) {
  const layers = frontCatLayers(config, typing, frame, pose);
  const { body, arms, frontPaws, laptop, raisedPaws, mode, animation, outlineVersion, laptopVersion } = layers;
  const layout = pose.typingLayout;
  const custom = pose.custom;
  const ink = custom?.ink;
  const legacyCustom = ink ? undefined : custom;
  const effort = closeEyes || hasEffortEyes(typing, frame, { ...pose, typingMode: mode });
  const sameIdle = !typing && legacyCustom?.source.action === 'sit';
  const placement = catHeadPlacement(typing, frame, layout);
  const tracking = legacyCustom !== undefined && gaze.space === 'pointer';
  const edits = (tracking || effort ? legacyCustom?.following : undefined) ?? legacyCustom?.paint;
  const headEdits = typing ? edits?.typingHead : edits?.idleHead;
  const torsoEdits = typing ? legacyCustom?.typingTorso : legacyCustom?.idleTorso;
  const fullEdits = edits?.full;
  const headOptions = {
    closeEyes, scale: placement.scale, earLayout: pose.earLayout,
    markingLayout: pose.markingLayout, legacyNoseOutline: pose.legacyNoseOutline, outlineVersion,
    hideGlints: tracking ? [true, true] as const : legacyCustom?.fixedGlints,
    typingMode: mode, typingAnimation: animation, typingEffects: pose.typingEffects,
    typingInkVersion: pose.typingInkVersion, typingMouthVersion: pose.typingMouthVersion,
  };
  const stretch = typing ? 0 : pose.stretch ?? 0;
  const fallingLetters = typing && usesFallingTyping(animation) && pose.typingEffects !== false
    && (mode !== 'fast' || animation === 'front-v6');
  const frenzyEffects = fallingLetters && mode === 'frenzy';

  // Work in actual 320px coordinates; the outer renderer uses 160 logical units.
  ctx.save();
  ctx.scale(0.5, 0.5);
  if (!typing) ctx.translate(0, placement.y);
  if (stretch) {
    ctx.translate(160, 278);
    ctx.scale(1 + Math.abs(stretch) * 0.11, 1 - Math.abs(stretch) * 0.055);
    ctx.translate(-160, -278);
  }

  if (fallingLetters) drawFallingTypingCel(ctx, mode, frame);
  if (legacyCustom && torsoEdits) {
    const { canvas, ctx: layer } = clearCustomLayer(legacyCustom);
    layer.drawImage(body, 0, 0);
    copyCatEdits(layer, torsoEdits);
    // Pose-specific arms and props stay above the stationary torso.
    layer.globalCompositeOperation = 'destination-in';
    layer.drawImage(body, 0, 0);
    ctx.drawImage(canvas, 0, 0);
  } else {
    ctx.drawImage(body, 0, 0);
  }
  if (arms && animation === 'reference-v2' && legacyCustom && torsoEdits) {
    // This atlas contains stationary forearm fur as well as the moving
    // paws. Keep body paint/erasures on that fur, then restore the complete
    // moving paws (including their outlines) above it. Historical versions
    // retain their original composition when rebuilding saved edit bases.
    const paws = referenceTypingFrame(typingGeometryPart('paws', animation, mode), frame, animation);
    const { canvas, ctx: layer } = clearCustomLayer(legacyCustom);
    layer.drawImage(arms, 0, 0);
    copyCatEdits(layer, torsoEdits);
    layer.globalCompositeOperation = 'destination-in';
    layer.drawImage(arms, 0, 0);
    layer.globalCompositeOperation = 'destination-out';
    layer.drawImage(paws, 0, 0);
    ctx.drawImage(canvas, 0, 0);

    clearCustomLayer(legacyCustom);
    layer.drawImage(arms, 0, 0);
    layer.globalCompositeOperation = 'destination-in';
    layer.drawImage(paws, 0, 0);
    ctx.drawImage(canvas, 0, 0);
  } else if (arms && !frontPaws) {
    ctx.drawImage(arms, 0, 0);
  }
  const bodyParts = frontPaws ? ['torso', 'tail'] as const : bodyInkParts;
  if (ink && bodyParts.some(part => ink.parts[part])) {
    applyCatInk(ctx, ink, catBodyInkGeometry(config, typing, frame, pose, layers), bodyParts);
  }

  ctx.save();
  const headX = typing ? placement.x : 2 * Math.round(stretch * 7);
  const headY = typing ? placement.y : 0;
  if (legacyCustom && headEdits) {
    const { canvas, ctx: layer } = clearCustomLayer(legacyCustom);
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
  if (ink && headInkParts.some(part => ink.parts[part])) {
    // A pixel erased from the visible head must remain transparent at the
    // neckline where arms overlap it. Only the head owns the saved erasure.
    ctx.save();
    if (!typing) ctx.translate(headX, 0);
    applyCatInk(ctx, ink, catHeadInkGeometry(config, typing, pose), headInkParts);
    ctx.restore();
  }
  if (laptop) {
    const drawLaptop = (target: CanvasRenderingContext2D) => {
      target.drawImage(laptop, 0, 0);
      if (frenzyEffects) {
        // A source without separate heat timing still reconstructs the old art.
        const heat = pose.frenzyHeatFrame === undefined ? frame : Math.min(pose.frenzyHeatFrame, frenzyRedFrame);
        drawFallingTypingCel(target, 'heat', heat);
      }
    };
    if (frontPaws && arms) {
      ctx.drawImage(arms, 0, 0);
      if (ink?.parts.leftPaw || ink?.parts.rightPaw) {
        applyCatInk(ctx, ink, catBodyInkGeometry(config, typing, frame, pose, layers), ['leftPaw', 'rightPaw']);
      }
    }
    if (raisedPaws) ctx.drawImage(raisedPaws, 0, 0);
    if (legacyCustom?.laptop && isFrontTyping(animation)) {
      // The old screen had a different silhouette. Clip its saved brush
      // strokes to the new screen, and keep explicit erasures transparent.
      const { canvas, ctx: layer } = clearCustomLayer(legacyCustom);
      drawLaptop(ctx);
      layer.drawImage(legacyCustom.laptop.mask, 0, 0);
      layer.globalCompositeOperation = 'destination-in';
      layer.drawImage(laptop, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
      clearCustomLayer(legacyCustom);
      layer.drawImage(legacyCustom.laptop.paint, 0, 0);
      layer.globalCompositeOperation = 'destination-in';
      layer.drawImage(laptop, 0, 0);
      ctx.drawImage(canvas, 0, 0);
    } else if (legacyCustom?.laptop) {
      const { canvas, ctx: layer } = clearCustomLayer(legacyCustom);
      drawLaptop(layer);
      copyCatEdits(layer, legacyCustom.laptop);
      ctx.drawImage(canvas, 0, 0);
    } else {
      drawLaptop(ctx);
    }
    if (ink?.parts.laptop) {
      applyCatInk(ctx, ink, catBodyInkGeometry(config, typing, frame, pose, layers), ['laptop']);
    }
    if (legacyCustom?.source.action === 'typing' && legacyCustom.source.frame === frame && legacyCustom.source.typingMode === mode
      && legacyCustom.source.typingAnimation === animation
      && legacyCustom.source.frenzyHeatFrame === pose.frenzyHeatFrame
      && legacyCustom.source.laptopVersion === laptopVersion
      && (legacyCustom.source.markingLayout === 'legacy') === (pose.markingLayout === 'legacy') && fullEdits) {
      copyCatEdits(ctx, fullEdits);
    }
    if (frenzyEffects) {
      const heat = pose.frenzyHeatFrame;
      if (heat === undefined) drawFallingTypingCel(ctx, 'air', frame);
      else {
        const steam = heat < frenzySteamLoopStart ? heat : frenzySteamLoopStart + frame % frontTyping.pawFrames;
        drawFallingTypingCel(ctx, 'steam', steam);
        drawFallingTypingCel(ctx, 'sparks', frame);
      }
    }
    if (isFrontTyping(animation) && !fallingLetters && pose.typingEffects !== false) {
      drawTypingRegion(ctx, frontTyping.path + 'letters', frontTyping.region, frame);
    }
  } else if (sameIdle && fullEdits) {
    ctx.save();
    ctx.translate(0, -catHeadPlacement(false, legacyCustom.source.frame).y);
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
  if (ink?.parts.canvas) {
    ctx.save();
    ctx.scale(0.5, 0.5);
    applyCatInk(ctx, ink, canvasInkGeometry, ['canvas']);
    ctx.restore();
  }
}

let jellyBuffers: ReturnType<typeof createJellyBuffers> | undefined;
let jellySource: {
  appearance: CatConfig; gaze: Gaze; custom?: CatCustomization; sprite: ReturnType<typeof splitJellySprite>;
} | undefined;

function createJellyBuffers() {
  const source = makeLayer(CAT_SIZE);
  const front = makeLayer(CAT_SIZE);
  const tail = makeLayer(CAT_SIZE);
  return { source, front, tail, frontPixels: front.ctx.createImageData(CAT_SIZE, CAT_SIZE),
    tailPixels: tail.ctx.createImageData(CAT_SIZE, CAT_SIZE) };
}

function drawJellyCat(ctx: CanvasRenderingContext2D, appearance: CatConfig, gaze: Gaze, jelly: JellyPose, custom?: CatCustomization) {
  const buffers = jellyBuffers ??= createJellyBuffers();
  if (jellySource?.appearance !== appearance || jellySource.gaze !== gaze || jellySource.custom !== custom) {
    const config = catRenderConfig(appearance);
    const source = buffers.source.ctx;
    source.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
    source.save();
    source.scale(CAT_SIZE / SIZE, CAT_SIZE / SIZE);
    drawCatFront(source, config, false, 0, gaze, { custom });
    source.restore();
    const geometry = catBodyInkGeometry(config, false, 0, {}, frontCatLayers(config, false, 0, {}));
    jellySource = { appearance, gaze, custom, sprite: splitJellySprite(source.getImageData(0, 0, CAT_SIZE, CAT_SIZE), geometry.tail?.mask) };
  }
  warpJellySprite(jellySource.sprite, jelly, buffers.frontPixels, buffers.tailPixels);
  buffers.tail.ctx.putImageData(buffers.tailPixels, 0, 0);
  buffers.front.ctx.putImageData(buffers.frontPixels, 0, 0);
  ctx.drawImage(buffers.tail.canvas, 0, 0);
  ctx.drawImage(buffers.front.canvas, 0, 0);
}

function drawWalkingCat(ctx: CanvasRenderingContext2D, config: CatRenderConfig, side: 'left' | 'right', frame: number, gaze: Gaze, pose: CatPose) {
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
  ctx.drawImage(walkCatEye(config, side), 0, headY, SIZE, SIZE);
  if (config.eye === 'Y01') {
    const look = side === 'right' ? { ...gaze, x: -gaze.x } : gaze;
    const { x, y } = look.space === 'pointer'
      ? pointerGlintOffset(look, 1, 2, 2, 2)
      : { x: Math.sign(look.x), y: Math.sign(look.y) };
    ctx.drawImage(imageFor(walkEyeGlints), Math.round(x), headY + Math.round(y));
  }
  const walkMouth = walkMouths[config.mouth as keyof typeof walkMouths] ?? config.mouth;
  drawFur(walkMouth === 'CN01' ? 'walk_muzzle' : `walk_muzzle_${walkMouth}`, headY);
  if (sideEar !== 'CE01') drawFur(`walk_ear_${sideEar}`, headY);
  ctx.restore();
}

const sidePeekWidth = 144;
const sidePeekTopPadding = 16;
const sidePeekHeight = 264 + sidePeekTopPadding;

function drawSideCatEdge(ctx: CanvasRenderingContext2D, config: CatRenderConfig, frame: number, gaze: Gaze, left: boolean, pose: CatPose) {
  const { width, height } = ctx.canvas;
  const angle = (left ? 1 : -1) * 34 * Math.PI / 180;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const look = gaze.space === 'pointer' ? { ...gaze, x: gaze.x * cos + gaze.y * sin, y: gaze.y * cos - gaze.x * sin } : gaze;
  const { ctx: front } = makeLayer(CAT_SIZE);
  // Compose the standard sitting pose on one surface before rotating it.
  // Remove the baked tail from the pose so the edge only shows the cat gripping it.
  front.save();
  front.scale(CAT_SIZE / SIZE, CAT_SIZE / SIZE);
  drawCatFront(front, { ...config, tail: 'CT01' }, false, frame, look, { ...pose, stretch: 0 });
  front.restore();
  front.globalCompositeOperation = 'destination-out';
  front.drawImage(tailRemoval(false), 0, catHeadPlacement(false, frame, pose.typingLayout).y);

  // Inverse sampling keeps the rotated outline on the pixel grid. The narrow
  // canvas supplies the screen-edge crop, with one transform for head and body.
  const source = new Uint32Array(front.getImageData(0, 0, CAT_SIZE, CAT_SIZE).data.buffer);
  const rotated = ctx.createImageData(width, height);
  const pixels = new Uint32Array(rotated.data.buffer);
  const pivotX = left ? -9 : width + 9;
  const pivotY = sidePeekTopPadding + 101;
  for (let y = 0; y < height; y++) {
    const dy = y + 0.5 - pivotY;
    for (let x = 0; x < width; x++) {
      const dx = x + 0.5 - pivotX;
      const sx = Math.floor(150 + dx * cos + dy * sin);
      const sy = Math.floor(120 + dy * cos - dx * sin);
      if (sx >= 0 && sx < CAT_SIZE && sy >= 0 && sy < CAT_SIZE) pixels[y * width + x] = source[sy * CAT_SIZE + sx]!;
    }
  }
  ctx.putImageData(rotated, 0, 0);
}

function drawBottomCatEdgeHead(ctx: CanvasRenderingContext2D, config: CatRenderConfig, frame: number, gaze: Gaze, pose: CatPose) {
  const custom = pose.custom;
  const ink = custom?.ink;
  const legacy = ink ? undefined : custom;
  const tracking = gaze.space === 'pointer';
  const head = makeLayer(CAT_SIZE);
  drawCatHead(head.ctx, config, false, frame, gaze, {
    ...pose, hideGlints: tracking && legacy ? [true, true] : legacy?.fixedGlints,
  });
  if (ink && headInkParts.some(part => ink.parts[part])) {
    applyCatInk(head.ctx, ink, catHeadInkGeometry(config, false, pose), headInkParts);
  } else if (legacy) {
    const edits = (tracking ? legacy.following : undefined) ?? legacy.paint;
    const headEdits = edits.idleHead ?? edits.typingHead;
    if (headEdits) copyCatEdits(head.ctx, headEdits);
    if (tracking) {
      head.ctx.globalCompositeOperation = 'source-atop';
      drawCatGlints(head.ctx, config, false, frame, gaze, 1);
    }
  }
  ctx.drawImage(head.canvas, ctx.canvas.width / 2 - 150, ctx.canvas.height - 129);
}

const peekPawTop = 168;
const peekPawWidth = 40;
const peekPawHeight = 21;
const peekPawCrops = new WeakMap<CatLayer, HTMLCanvasElement>();

function peekPawCrop(source: CatLayer, guide: HTMLCanvasElement, x: number) {
  const cached = peekPawCrops.get(source);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(peekPawWidth, peekPawHeight);
  ctx.drawImage(source, x, peekPawTop, peekPawWidth, peekPawHeight, 0, 0, peekPawWidth, peekPawHeight);
  const pixels = ctx.getImageData(0, 0, peekPawWidth, peekPawHeight);
  thickenPeekPawOutline(pixels, guide.getContext('2d')!.getImageData(x, peekPawTop, peekPawWidth, peekPawHeight));
  ctx.putImageData(pixels, 0, 0);
  // The two raised frames used here each supply exactly one paw crop.
  peekPawCrops.set(source, canvas);
  return canvas;
}

function drawCatEdge(ctx: CanvasRenderingContext2D, config: CatRenderConfig, frame: number, gaze: Gaze, edge: CatEdge, pose: CatPose) {
  const { width, height } = ctx.canvas;
  const bottom = edge === 'bottom';
  const left = edge === 'left';
  const edgeX = left ? 0 : width;
  const ink = pose.custom?.ink;
  if (bottom) drawBottomCatEdgeHead(ctx, config, frame, gaze, pose);
  else drawSideCatEdge(ctx, config, frame, gaze, left, pose);

  // Each raised typing cel already ends at the keyboard. Put the same flat
  // cut on the screen edge and rotate the two paws by a quarter turn on sides.
  const paws = [
    { part: 'leftPaw', frame: 1, x: 82, bottomX: 45, sideY: 195 },
    { part: 'rightPaw', frame: 9, x: 180, bottomX: 213, sideY: 238 },
  ] as const;
  const pawPose = { ...pose, typingMode: 'gentle', typingAnimation: currentTypingAnimation } as const;
  for (const paw of paws) {
    const layers = frontCatLayers(config, true, paw.frame, pawPose);
    if (!layers.arms || !layers.frontPaws) continue;
    let sprite = peekPawCrop(layers.arms, layers.frontPaws, paw.x);
    if (ink?.parts[paw.part]) {
      const layer = makeLayer(peekPawWidth, peekPawHeight);
      layer.ctx.drawImage(sprite, 0, 0);
      layer.ctx.translate(-paw.x, -peekPawTop);
      const geometry = catBodyInkGeometry(config, true, paw.frame, pawPose, layers);
      applyCatInk(layer.ctx, ink, geometry, [paw.part]);
      sprite = layer.canvas;
    }
    ctx.save();
    ctx.translate(bottom ? paw.bottomX : edgeX, bottom ? height : paw.sideY + sidePeekTopPadding);
    if (!bottom) ctx.rotate((left ? 1 : -1) * Math.PI / 2);
    ctx.drawImage(sprite, -peekPawWidth / 2, -peekPawHeight);
    ctx.restore();
  }
}

let listeningScratch: ReturnType<typeof makeLayer> | undefined;
let listeningOutput: ImageData | undefined;
let listeningAppearance = '';
let listeningCustom: CatCustomization | undefined;
let listeningBase: Uint32Array | undefined;

function drawListeningLayer(ctx: CanvasRenderingContext2D, part: keyof typeof catListening.regions, frame: number, darkEyes = false) {
  const path = catListening.path + part;
  const layer = part === 'closed_eyes' && darkEyes ? coloredCatIris(path, '#201B1E') : imageFor(path);
  drawAtlasRegion(ctx, layer, catListening.regions[part], frame, catListening.columns);
}

function drawCatListening(ctx: CanvasRenderingContext2D, config: CatRenderConfig, frame: number, pose: CatPose) {
  const { custom, earLayout, outlineVersion, markingLayout, tailArtVersion, legacyNoseOutline } = pose;
  const basePose = { custom, earLayout, outlineVersion, markingLayout, tailArtVersion, legacyNoseOutline };
  const appearance = JSON.stringify([config, earLayout, outlineVersion, markingLayout, tailArtVersion, legacyNoseOutline]);
  if (appearance !== listeningAppearance || listeningCustom !== custom) {
    listeningAppearance = appearance;
    listeningCustom = custom;
    listeningBase = undefined;
  }
  const scratch = listeningScratch ??= makeLayer(CAT_SIZE);
  if (!listeningBase) {
    const context = scratch.ctx;
    context.resetTransform();
    context.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
    context.scale(2, 2);
    drawCatFront(context, config, false, 0, noGaze, basePose, true);
    listeningBase = new Uint32Array(context.getImageData(0, 0, CAT_SIZE, CAT_SIZE).data.buffer);
  }
  const output = listeningOutput ??= new ImageData(CAT_SIZE, CAT_SIZE);
  warpListeningPixels(listeningBase, new Uint32Array(output.data.buffer), frame);
  scratch.ctx.putImageData(output, 0, 0);

  ctx.save();
  ctx.resetTransform();
  drawListeningLayer(ctx, 'notes', frame);
  drawListeningLayer(ctx, 'headband', frame);
  ctx.drawImage(scratch.canvas, 0, 0);
  drawListeningLayer(ctx, 'closed_eyes', frame, config.palette === 'CC02');
  drawListeningLayer(ctx, 'earcups', frame);
  ctx.restore();
}

const fileActionDrawing = new Map<string, HTMLCanvasElement>();
const fileActionInk = new WeakMap<HTMLCanvasElement, CatInkGeometry>();
const fileActionArmColors = new WeakMap<CatLayer, {
  paint: ReturnType<typeof createTypingArmPainter>;
  frames: WeakMap<HTMLCanvasElement, HTMLCanvasElement>;
}>();

function fileActionCel(kind: CatFileAction, part: 'arms' | 'paws', frame: number) {
  const key = `${kind}/${part}/${frame}`;
  const cached = fileActionDrawing.get(key);
  if (cached) return cached;
  const asset = catFileActions[kind];
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  drawAtlasRegion(ctx, imageFor(asset.path + part), asset.regions[part], frame, asset.columns);
  fileActionDrawing.set(key, canvas);
  return canvas;
}

function coloredFileActionArms(source: HTMLCanvasElement, body: CatLayer, config: CatRenderConfig, outline: OutlineVersion) {
  if (config.palette === 'CC01' && config.coat === 'native' && !usesBodyPattern(config)) return source;
  let palette = fileActionArmColors.get(body);
  if (!palette) {
    palette = { paint: createTypingArmPainter(layerPixels(imageFor(orangePath + 'body')), layerPixels(body)), frames: new WeakMap() };
    fileActionArmColors.set(body, palette);
  }
  let colored = palette.frames.get(source);
  if (!colored) {
    const { canvas, ctx } = makeLayer(CAT_SIZE);
    ctx.putImageData(palette.paint(layerPixels(source)), 0, 0);
    palette.frames.set(source, colored = canvas);
  }
  return outlinedCatLayer(colored, source, config, outline);
}

function drawCatFileAction(ctx: CanvasRenderingContext2D, config: CatRenderConfig, { kind, frame }: CatFileActionPose, pose: CatPose) {
  const asset = catFileActions[kind];
  const closed = asset.closedFrames.includes(frame);
  const appearance = closed ? { ...config, mouth: 'CN08' as const } : config;
  drawCatFront(ctx, appearance, false, 0, noGaze, pose, closed);

  const outline = pose.outlineVersion ?? 'adaptive';
  const path = config.palette === 'CC01' ? orangePath : breedPath(config.palette);
  const body = frontBodyLayer(path, 'body', config, undefined, outline);
  const frontPaws = fileActionCel(kind, 'paws', frame);
  const paws = coloredFrontPaws(frontPaws, body, config, outline);
  ctx.save();
  ctx.resetTransform();
  if (closed) drawListeningLayer(ctx, 'closed_eyes', 0, config.palette === 'CC02');
  ctx.drawImage(coloredFileActionArms(fileActionCel(kind, 'arms', frame), body, config, outline), 0, 0);
  drawAtlasRegion(ctx, imageFor(asset.path + 'props'), asset.regions.props, frame, asset.columns);
  const ink = pose.custom?.ink;
  if (ink?.parts.leftPaw || ink?.parts.rightPaw) {
    let geometry = fileActionInk.get(frontPaws);
    if (!geometry) {
      const mask = catLayerAlpha(frontPaws);
      geometry = {
        leftPaw: fittedInkSurface(mask.map((pixel, index) => index % CAT_SIZE < 150 ? pixel : 0)),
        rightPaw: fittedInkSurface(mask.map((pixel, index) => index % CAT_SIZE >= 150 ? pixel : 0)),
      };
      fileActionInk.set(frontPaws, geometry);
    }
    const { canvas, ctx: pawLayer } = makeLayer(CAT_SIZE);
    pawLayer.drawImage(paws, 0, 0);
    applyCatInk(pawLayer, ink, geometry, ['leftPaw', 'rightPaw']);
    ctx.drawImage(canvas, 0, 0);
  } else {
    ctx.drawImage(paws, 0, 0);
  }
  ctx.restore();
}

export function render(canvas: HTMLCanvasElement, config: PetConfig, action: Action = 'sit', frame = 0, gaze: Gaze = noGaze, catPose: CatPose = {}) {
  const size = config.frame === 'CAT' ? CAT_SIZE : SIZE;
  const edge = config.frame === 'CAT' ? catPose.edge : undefined;
  canvas.width = edge ? edge === 'bottom' ? 256 : sidePeekWidth : size;
  canvas.height = edge ? edge === 'bottom' ? 132 : sidePeekHeight : size;
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
    const frames = frameCount(config, action, catPose.typingAnimation);
    const pose = ((frame % frames) + frames) % frames;
    if (edge && config.frame === 'CAT') {
      ctx.resetTransform();
      drawCatEdge(ctx, catRenderConfig(config, catPose.furPatternColors), pose, gaze, edge, catPose);
    } else if (action === 'left' || action === 'right') {
      const left = makeLayer(size);
      left.ctx.scale(size / SIZE, size / SIZE);
      if (config.frame === 'CAT') drawWalkingCat(left.ctx, catRenderConfig(config), action, pose, gaze, catPose);
      else drawRun(left.ctx, config, pose);
      if (action === 'right') {
        ctx.translate(SIZE, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(left.canvas, 0, 0, SIZE, SIZE);
    } else if (config.frame === 'CAT' && action === 'sit' && catPose.fileAction) {
      drawCatFileAction(ctx, catRenderConfig(config, catPose.furPatternColors), catPose.fileAction, catPose);
    } else if (config.frame === 'CAT' && action === 'sit' && catPose.jelly) {
      ctx.resetTransform();
      drawJellyCat(ctx, config, gaze, catPose.jelly, catPose.custom);
    } else if (config.frame === 'CAT' && action === 'sit' && catPose.listeningFrame !== undefined) {
      drawCatListening(ctx, catRenderConfig(config, catPose.furPatternColors), catPose.listeningFrame, catPose);
    } else if (config.frame === 'CAT') {
      drawCatFront(ctx, catRenderConfig(config, catPose.furPatternColors), action === 'typing', pose, gaze, catPose);
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

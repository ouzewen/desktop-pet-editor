/// <reference types="vite/client" />

import { catPhotoPartFor } from './cat-photo-parts';
import type { CatPhotoEarPigment } from './cat-photo-request';

import { blackCatCoat, canChooseCatFaceBase, catEarOnSide, catFeatureColors, catHeadphoneColors, catIrisColors, catKeepsBreedPigment, catPupilStyle, catPresets, catRenderConfig, supportsCalicoFaceFinish, currentFurPatternColors, hasHoneyGoldFur, hasIndependentFur, hasShortCalicoChest, usesWhiteCatCoat,
  type CatConfig, type CatEar, type CatPupilStyle, type CatRenderConfig, type FurPatternColors, type PetConfig } from './cat';
import { connectedNeckFur, forelegFurPatches, furPatchColorAt, furPatchesFor, paintFurPatches, sittingForelegAt, sittingPawAt, type FurPatch, type FurPatchPart } from './cat-fur-patches';
import type { CatCustomization, CatPixelEdits } from './cat-custom';
import { applyCatInk, type CatInkBounds, type CatInkGeometry, type CatInkSurface } from './cat-ink';
import type { CatFileAction, CatFileActionPose } from './cat-file-action';
import { warpListeningPixels } from './cat-listening';
import { catPetLovePose, warpCatPetLoveHead, warpCatPetLoveShoulders } from './cat-pet-love';
import { splitJellySprite, warpJellySprite, type JellyPose } from './cat-jelly';
import { isEarLiningPixel, paintBreedEars, paintInnerEarColor } from './cat-ears';
import { recolorCatCoat, recolorPhotoInkBlack, type CatCoatSurface } from './cat-coat';
import { isLaptopFur, paintBodyPattern, usesBodyPattern, usesNativeBodyStripes } from './cat-body-pattern';
import { paintCatTail } from './cat-tail';
import { chestFringeSamples, clearForeheadFur, paintForeheadFur, paintGoldenTipping, paintHeadFur, paintHoneyGoldFur, paintSolidFace } from './cat-head-pattern';
import { catTypingFrameCountFor, currentTypingAnimation, frenzyRedFrame, frenzySteamLoopStart, isFrontTyping, lowTypingArms, usesFallingTyping, type TypingAnimation } from './cat-typing';
import { createTypingArmPainter, recolorFrontPaws, thickenPeekPawOutline } from './cat-typing-paint';
import { clearForeheadOutlineSpots, isOutline, pixel80CatOutline, recolorCatOutline, type OutlineVersion } from './cat-outline';
export type { OutlineVersion } from './cat-outline';
import { liHuaFur, liHuaPigments, liHuaReferenceFur, toneLiHuaFur, type LiHuaStyle } from './cat-li-hua';
import { irisColors, palettes, type Config } from './model';

import {
  assetFiles, assetsFor, atlasNoseTips, catPhotoEarSides, catPhotoPartPath, catPhotoParts, CAT_SIZE, PET_SIZE, dogArt as art, furSlots, irisPath, maskPath, runBodies,
  bodyPatternPath, calicoBodyOutlinePath, calicoCrownPath, calicoFaceFinishPath, catEarRetouchPath, breedArt, breedBodyOutlinePath, breedEyeGlints, breedLaptop, breedPath, catCalicoLayers, catBreedDetailsPath, catBreedDetailPresets, catFaceEdgesPath, catHeadCleanupPath, catFileActions, catFrontEars, catListening, catPetLove, honeyGoldPath, liHuaCoatPath, liHuaLibTVCoatPath, liHuaReferenceCheekAsset, liHuaSampledPath, liHuaFrenzyFurAsset, restingSmilePath, reviewedRestingSmilePath,
  catFurSlots, catMarkings, catMouthPath, catNosePath, catWalkBodies, catWalkFrames, earMaskPath, facePartsPath, faceTiles,
  foreheadParts, frontTyping, frontTypingEffects, frontTypingEffectsPath, headPatternPath, legacyMouthIds, legacyNoseOutlinePath, mouthSkinColumns, mouthSkinPath, mouthStems,
  orangeBodyOutlinePath, orangeForelegBodyPath, orangePath, orangePawsBodyPath, orangeSquareGlints, sharedMouthStyles, sharedNoseStyles,
  initialTailPath, referenceTailPath, sharedBreedParts, sharedTailStyles, tailPath, typingAtlases, typingEffectPath, typingGeometryPart, typingInkPatches, typingReferencePath,
  walkEyeGlints, type CatPhotoEarSide, type LegacyFrontBreed,
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
export const currentCatArtVersion = 'pixel80-v21';
export const catArtVersions = ['pixel80', 'pixel80-v2', 'pixel80-v3', 'pixel80-v4', 'pixel80-v5', 'pixel80-v6', 'pixel80-v7', 'pixel80-v8', 'pixel80-v9', 'pixel80-v10', 'pixel80-v11', 'pixel80-v12', 'pixel80-v13', 'pixel80-v14', 'pixel80-v15', 'pixel80-v16', 'pixel80-v17', 'pixel80-v18', 'pixel80-v19', 'pixel80-v20', currentCatArtVersion] as const;
export type CatArtVersion = typeof catArtVersions[number];
const liHuaCoatAssets = {
  'pixel80-v13': { head: liHuaCoatPath + 'head', body: liHuaCoatPath + 'body' },
  'pixel80-v14': { head: liHuaLibTVCoatPath + 'head', body: liHuaLibTVCoatPath + 'body' },
  'pixel80-v15': { head: liHuaReferenceCheekAsset, body: liHuaLibTVCoatPath + 'body' },
  'pixel80-v16': { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
  'pixel80-v17': { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
  'pixel80-v18': { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
  'pixel80-v19': { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
  'pixel80-v20': { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
  [currentCatArtVersion]: { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
} as const;
const hasTypingRestingNose = (version?: CatArtVersion) =>
  version === 'pixel80-v20' || version === currentCatArtVersion;
const hasFrenzyFur = (version?: CatArtVersion) => version === 'pixel80-v19' || hasTypingRestingNose(version);
const hasReviewedRestingSmile = (version?: CatArtVersion) => version === 'pixel80-v18' || hasFrenzyFur(version);
const hasSampledLiHua = (version?: CatArtVersion) =>
  version === 'pixel80-v16' || version === 'pixel80-v17' || hasReviewedRestingSmile(version);
const hasExtendedRestingSmile = (version?: CatArtVersion) =>
  (version === 'pixel80-v17' || hasReviewedRestingSmile(version)) && pixel80Keys.has(restingSmilePath);
function liHuaAssets(version?: CatArtVersion) {
  return version && Object.hasOwn(liHuaCoatAssets, version)
    ? liHuaCoatAssets[version as keyof typeof liHuaCoatAssets] : undefined;
}
const hasBreedBodyOutline = (version?: CatArtVersion) => version === 'pixel80-v12'
  || liHuaAssets(version) !== undefined;
const hasOrangeBodyOutline = (version?: CatArtVersion) => version === 'pixel80-v11' || hasBreedBodyOutline(version);
const hasSpeckCleanup = (version?: CatArtVersion) => version === 'pixel80-v10' || hasOrangeBodyOutline(version);
const hasBreedRestDetails = (version?: CatArtVersion) => version === 'pixel80-v9' || hasSpeckCleanup(version);
const hasSquareOrangeGlints = (version?: CatArtVersion) => version === 'pixel80-v8' || hasBreedRestDetails(version);
const hasNarrowNose = (version?: CatArtVersion) => version === 'pixel80-v7' || hasSquareOrangeGlints(version);
const hasRevisedEarsAndPaws = (version?: CatArtVersion) =>
  version === 'pixel80-v5' || version === 'pixel80-v6' || hasNarrowNose(version);
export const hasB3FaceEdges = (version?: CatArtVersion) =>
  version === 'pixel80-v3' || version === 'pixel80-v4' || hasRevisedEarsAndPaws(version);

export function catArtVersionForCustomization(custom?: CatCustomization): CatArtVersion {
  if (!custom) return currentCatArtVersion;
  const version = custom.source.artVersion;
  return version && hasB3FaceEdges(version) ? version : 'pixel80-v2';
}
export type CatEdge = 'left' | 'right' | 'bottom';
export type CatPose = {
  artVersion?: CatArtVersion;
  faceEdges?: boolean;
  staticPaws?: boolean;
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
  petLoveFrame?: number;
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

const pixel80Keys = new Set<string>(import.meta.env.VITE_PET_PIXEL80_KEYS);

function loadLayer(layer: string) {
  const asset = assetFiles.get(layer);
  if (!asset) throw Error(`未登记图层 · ${layer}`);
  const image = new Image();
  const directory = pixel80Keys.has(layer) ? 'assets-pixel80' : 'assets';
  image.src = `${import.meta.env.BASE_URL}${directory}/${layer}.png`;
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

const authoredCoatLayers = new WeakMap<CatLayer, { part: string; canvas: HTMLCanvasElement }>();

function withAuthoredCoatPart(source: CatLayer, part: string | undefined): CatLayer {
  if (!part) return source;
  const cached = authoredCoatLayers.get(source);
  if (cached?.part === part) return cached.canvas;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0);
  ctx.drawImage(imageFor(part), 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(source, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  authoredCoatLayers.set(source, { part, canvas });
  return canvas;
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
const unlinedOpenEyes = new WeakMap<HTMLImageElement, HTMLCanvasElement>();

function cleanOpenEye(image: HTMLImageElement, aperture: Uint8ClampedArray, unlined: boolean) {
  const cache = unlined ? unlinedOpenEyes : rimlessOpenEyes;
  const cached = cache.get(image);
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
        const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
        const white = data[i + 3] && r >= 205 && g >= 200 && b >= 196
          && (!unlined || (r - g <= 14 && r - b <= 24));
        if (white || aperture[i + 3]) {
          left = Math.min(left, x);
          right = x;
        }
      }
      data.fill(0, (row + start) * 4, (row + left) * 4);
      data.fill(0, (row + right + 1) * 4, (row + start + half) * 4);
      if (unlined) {
        // The inherited black outline sits outside the iris aperture.
        // Restore the surrounding white while keeping the eye color and pupil.
        for (let x = left; x <= right; x++) {
          const i = (row + x) * 4;
          if (data[i + 3] && !aperture[i + 3]) data.set([255, 253, 250], i);
        }
      }
    }
  }
  ctx.putImageData(pixels, 0, 0);
  cache.set(image, canvas);
  return canvas;
}

function tintCatEye(sourcePath: string, irisMask: string, color?: string, cleanRimAperture?: string,
  unlined = false, honeyGoldRim = false, rim?: readonly number[],
) {
  const image = imageFor(sourcePath);
  const source = cleanRimAperture ? cleanOpenEye(image, readBodyPixels(cleanRimAperture), unlined) : image;
  if (!color && !honeyGoldRim && !rim) return source;
  const key = `${sourcePath}/${irisMask}/${color}/${cleanRimAperture ?? ''}/${unlined}/${honeyGoldRim}/${rim}`;
  const cached = tinted.get(key);
  if (cached) return cached;
  const result = makeLayer(image.naturalWidth);
  result.ctx.drawImage(source, 0, 0);
  if (honeyGoldRim || rim) {
    const pixels = layerPixels(result.canvas);
    for (let i = 0; i < pixels.data.length; i += 4) {
      if (pixels.data[i + 3] && pixels.data[i + 2]! >= 210) pixels.data.set(rim ?? [246, 216, 169], i);
    }
    result.ctx.putImageData(pixels, 0, 0);
  }
  if (color) result.ctx.drawImage(coloredCatIris(irisMask, color), 0, 0);
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

function frontCatEye(palette: FrontBreed, eye: CatRenderConfig['eye'], { eyeColor, innerPupil }: CatPupilStyle,
  cleanRim: boolean, unlined: boolean, honeyGoldRim = false, reference = false,
) {
  const template = eye === 'Y01' ? palette : sharedBreedParts[palette];
  const path = breedPath(template);
  const alternate = eye === 'Y01' ? '' : `eye_${eye}_`;
  const source = path + (eye === 'Y01' ? 'eyes' : `eye_${eye}`);
  if (eye === 'Y02') return imageFor(source);
  const single = innerPupil === 'none' && eye !== 'Y07';
  const irisMask = path + alternate + (single ? 'aperture' : 'iris');
  const defaultColor = palette === 'CC03' ? 'green' : palette === 'CC04' ? 'blue' : 'natural';
  const color = eyeColor === 'natural' || eyeColor === defaultColor
    ? (reference ? liHuaReferenceFur.iris : (single || template !== palette ? naturalFrontIris[palette] : undefined)) : catIrisColors[eyeColor];
  const removeOutline = unlined && (eye === 'Y01' || eye === 'Y03' || eye === 'Y04' || eye === 'Y05');
  const cleanAperture = removeOutline || (eye === 'Y01' && (cleanRim || reference)) ? path + alternate + 'aperture' : undefined;
  return tintCatEye(source, irisMask, color, cleanAperture, removeOutline, honeyGoldRim && eye === 'Y01' && !removeOutline, reference ? liHuaReferenceFur.rim : undefined);
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

function inkBlackProfile(config: CatRenderConfig) {
  return catPhotoPartFor(config.photoCoatParts, 'base', config.palette, config.coat) === 'ink-black';
}

function catPatternCacheKey(config: CatRenderConfig) {
  return `${config.palette}/${config.coat}/${config.bodyBase}/${config.bodyPattern}/${config.forelegPatternSource ?? 'native'}/${config.furPatternColors ?? currentFurPatternColors}/${hasShortCalicoChest(config)}/${inkBlackProfile(config)}`;
}

function hasCleanFaceColors(config: CatRenderConfig) {
  const version = config.furPatternColors ?? currentFurPatternColors;
  return version === 'clean-face' || version === 'connected-chest' || hasIndependentFur(version);
}

function facePatternConfig(config: CatRenderConfig): CatRenderConfig {
  const faceBase = hasCleanFaceColors(config)
    && config.faceBase === 'solid' && !canChooseCatFaceBase(config.palette) ? 'native' : config.faceBase;
  return { ...config, bodyPattern: config.cheekPattern ?? config.bodyPattern, bodyBase: undefined, faceBase };
}

function facePatternCacheKey(config: CatRenderConfig) {
  return `${catPatternCacheKey(config)}/${config.faceBase}`;
}

function cleanSolidFaceEyes(config: CatRenderConfig) {
  return config.faceBase === 'solid' && hasCleanFaceColors(config);
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

function frontCoatLayer(source: CatLayer, config: CatRenderConfig, surface: CatCoatSurface = 'fur') {
  const { palette, coat } = config;
  const inkBlack = surface === 'fur' && inkBlackProfile(config);
  if (coat === 'native' && !inkBlack) return source;
  const key = `${palette}/${coat}/${surface}/${inkBlack}`;
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
  if (inkBlack) recolorPhotoInkBlack(pixels);
  else if (coat !== 'native') recolorCatCoat(pixels, palette, coat, surface, orangeEyePixels);
  ctx.putImageData(pixels, 0, 0);
  frontCoatLayers.set(source, { key, canvas });
  return canvas;
}

const outlinedLayers = new WeakMap<CatLayer, {
  coat: string; guide: CatLayer; charcoal?: CatLayer; additionalInk?: CatLayer; head: boolean; canvas: HTMLCanvasElement;
}>();
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
  charcoal?: CatLayer, additionalInk?: CatLayer,
): CatLayer {
  if (version === 'original' || config.coat === 'native') return source;
  const cached = outlinedLayers.get(source);
  if (cached?.coat === config.coat && cached.guide === guide && cached.charcoal === charcoal
    && cached.additionalInk === additionalInk && cached.head === head) return cached.canvas;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  const pixels = layerPixels(source);
  recolorCatOutline(pixels, outlineGuidePixels(guide), config, head, charcoal && outlineGuidePixels(charcoal), pixel80Keys.size > 0,
    additionalInk && outlineGuidePixels(additionalInk));
  ctx.putImageData(pixels, 0, 0);
  outlinedLayers.set(source, { coat: config.coat, guide, charcoal, additionalInk, head, canvas });
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

function cleanWhiteBody(config: CatRenderConfig) {
  return (config.furPatternColors ?? currentFurPatternColors) === currentFurPatternColors && usesWhiteCatCoat(config);
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
    const mask = config.bodyPattern === 'plain' || usesNativeBodyStripes(config) ? undefined : readBodyPixels(bodyPatternPath + part);
    const goldFur = part === 'body' && config.bodyBase !== 'solid' && config.bodyPattern === 'plain' && hasHoneyGoldFur(config);
    const cleanGold = goldFur && config.furPatternColors !== 'honey-gold';
    paintBodyPattern(pixels, guide, mask, config, typing, laptopOnly,
      config.bodyBase === 'solid' || cleanGold || cleanWhiteBody(config) ? readBodyPixels(path) : undefined);
    if (goldFur) {
      paintHoneyGoldFur(pixels, readBodyPixels(honeyGoldPath + 'body'), config);
    }
    ctx.putImageData(pixels, 0, 0);
    cached = { key, raw: canvas };
    patternedLayers.set(source, cached);
  }
  if (!typing || layout === 'legacy') return cached.raw;
  return cached.aligned ??= alignTypingLayer(cached.raw);
}

function orangeBodyRetouch(config: CatRenderConfig, pose: CatPose) {
  if (config.palette !== 'CC01' || config.coat !== 'native' || config.bodyPattern !== 'native' || config.bodyBase === 'solid') return;
  if (hasOrangeBodyOutline(pose.artVersion) && pose.staticPaws && config.tail !== 'CT01'
    && usesStockDetails(config) && pixel80Keys.has(orangeBodyOutlinePath)) return orangeBodyOutlinePath;
  if (hasRevisedEarsAndPaws(pose.artVersion) && pose.staticPaws && pixel80Keys.has(orangePawsBodyPath)) return orangePawsBodyPath;
  if ((pose.artVersion === 'pixel80-v4' || hasRevisedEarsAndPaws(pose.artVersion)) && pixel80Keys.has(orangeForelegBodyPath)) {
    return orangeForelegBodyPath;
  }
}

function frontBodyLayer(
  path: string, part: string, config: CatRenderConfig, layout?: TypingLayout, outlineVersion?: OutlineVersion, retouch?: string,
) {
  const asset = retouch ?? path + part;
  const source = usesBodyPattern(config) ? patternedBodyLayer(asset, part, config, layout)
    : frontCoatLayer(part === 'body' ? imageFor(asset) : typingLayer(asset, layout), config);
  const guide = part === 'body' ? imageFor(retouch ?? orangePath + part) : typingLayer(orangePath + part, layout);
  const charcoal = cleanWhiteBody(config) ? (part === 'body' ? imageFor(asset) : typingLayer(asset, layout)) : undefined;
  // The calico body has ink at two cells outside the shared orange contour.
  const additionalInk = part === 'body' && config.palette === 'CC03' && config.coat === 'breed:CC12'
    && pixel80Keys.has(calicoBodyOutlinePath) ? imageFor(calicoBodyOutlinePath) : undefined;
  return outlinedCatLayer(source, guide, config, outlineVersion, false, charcoal, additionalInk);
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

const frontPawColors = new WeakMap<CatLayer, Map<OutlineVersion, WeakMap<HTMLCanvasElement, HTMLCanvasElement>>>();
function coloredFrontPaws(source: HTMLCanvasElement, body: CatLayer, config: CatRenderConfig, outlineVersion: OutlineVersion, liHua: LiHuaStyle = false) {
  const ink = liHua ? liHuaPigments(liHua).ink : pixel80SharedInk(config, outlineVersion);
  const originalFur = config.palette === 'CC01' && config.coat === 'native' && !usesBodyPattern(config);
  if (!ink && originalFur) return source;
  let versions = frontPawColors.get(body);
  if (!versions) frontPawColors.set(body, versions = new Map());
  let frames = versions.get(outlineVersion);
  if (!frames) versions.set(outlineVersion, frames = new WeakMap());
  let colored = frames.get(source);
  if (!colored) {
    const { canvas, ctx } = makeLayer(CAT_SIZE);
    const outline = ink ?? (config.palette === 'CC02' ? [32, 27, 30] : undefined);
    const paws = recolorFrontPaws(layerPixels(source), originalFur ? undefined : layerPixels(body), outline);
    ctx.putImageData(paws, 0, 0);
    frames.set(source, colored = canvas);
  }
  return ink ? colored : outlinedCatLayer(colored, source, config, outlineVersion);
}

function pixel80SharedInk(config: CatRenderConfig, version: OutlineVersion) {
  return pixel80Keys.size && version === 'adaptive' ? pixel80CatOutline(config) : undefined;
}

function layerPixels(source: CatLayer) {
  const { ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0);
  return ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
}

type FurPatchPaint = Parameters<typeof paintFurPatches>[3] & { patches: readonly FurPatch[] };
const furPatchedLayers = new WeakMap<CatLayer, { paint: FurPatchPaint[]; keys: string[]; canvas: HTMLCanvasElement }>();

function furPatchedLayer(source: CatLayer, ...paint: FurPatchPaint[]): CatLayer {
  const active = paint.filter(region => region.patches.length);
  if (!active.length) return source;
  const keys = active.map(region => JSON.stringify(region.patches));
  const cached = furPatchedLayers.get(source);
  if (cached?.paint.length === active.length && active.every((region, index) => {
    const old = cached.paint[index]!;
    return keys[index] === cached.keys[index] && region.guide === old.guide && region.surface === old.surface
      && region.idle === old.idle && region.keep === old.keep && region.skin === old.skin && region.movingPaw === old.movingPaw
      && region.neck === old.neck && region.reverseY === old.reverseY;
  })) return cached.canvas;
  const pixels = layerPixels(source);
  const baseFur = pixels.data.slice();
  for (const region of active) {
    paintFurPatches(pixels, baseFur, region.patches, pixel80Keys.size ? { ...region, grid: 4 } : region);
  }
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.putImageData(pixels, 0, 0);
  furPatchedLayers.set(source, { paint: active, keys, canvas });
  return canvas;
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
  outlineVersion: OutlineVersion, version: TailArtVersion, liHua: LiHuaStyle = false) {
  const shared = Object.hasOwn(sharedTailStyles, config.tail);
  const path = shared ? tailArtPaths[version] : tailPath;
  const asset = path + (typing ? 'typing' : 'idle') + '_' + config.tail;
  const source = imageFor(asset);
  const ink = liHua ? liHuaPigments(liHua).ink : pixel80SharedInk(config, outlineVersion);
  const key = catPatternCacheKey({ ...config, bodyPattern: config.tailPattern ?? config.bodyPattern, bodyBase: undefined })
    + (ink ? '/' + ink.join(',') : '') + '/' + liHua;
  let cached = tailPaintLayers.get(source);
  if (cached?.key !== key) {
    const { canvas, ctx } = makeLayer(CAT_SIZE);
    ctx.drawImage(source, 0, 0);
    const pixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
    paintCatTail(pixels, readBodyPixels(asset + '_patterns'), config, ink, liHua);
    if (inkBlackProfile(config)) recolorPhotoInkBlack(pixels);
    const pattern = config.tailPattern ?? config.bodyPattern;
    if (asset === tailPath + 'idle_CT05' && (pattern === 'plain' || pattern === 'native') && hasHoneyGoldFur(config)) {
      paintHoneyGoldFur(pixels, readBodyPixels(honeyGoldPath + 'tail'), config);
    }
    ctx.putImageData(pixels, 0, 0);
    if (liHua === 'reference' && config.tail === 'CT05' && pattern === 'native') {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.drawImage(imageFor(liHuaSampledPath + 'tail'), 0, 0);
    }
    cached = { key, raw: canvas };
    tailPaintLayers.set(source, cached);
  }
  const needsAlignment = typing && layout !== 'legacy' && !shared;
  const result = needsAlignment ? cached.aligned ??= alignTypingLayer(cached.raw) : cached.raw;
  const guide = needsAlignment ? typingLayer(asset, layout) : source;
  return ink ? result : outlinedCatLayer(result, guide, config, outlineVersion);
}

function tailRemoval(typing: boolean, layout?: TypingLayout) {
  return typing ? typingLayer(tailPath + 'typing_remove', layout) : imageFor(tailPath + 'idle_remove');
}

function swingPetLoveTail(tail: CatLayer, style: CatRenderConfig['tail'], degrees: number, ink?: readonly number[]) {
  const { canvas, ctx } = makeLayer(80);
  const short = style === 'CT02' || style === 'CT06';
  const rootX = 58, rootY = short ? 60 : 65;
  ctx.translate(rootX, rootY);
  ctx.rotate(degrees * Math.PI / 180);
  // The zigzag tail is taller. Shorten its reach as it sweeps past the haunch.
  if (style === 'CT08') ctx.scale(1, 1 - degrees / 330);
  ctx.drawImage(tail, -rootX, -rootY, 80, 80);
  if (ink) {
    const pixels = ctx.getImageData(0, 0, 80, 80);
    const { data, width, height } = pixels;
    const stride = width * 4;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const alpha = y * stride + x * 4 + 3;
        if (data[alpha] && (!data[alpha - stride] || !data[alpha - 4]
          || !data[alpha + 4] || !data[alpha + stride])) data.set(ink, alpha - 3);
      }
    }
    ctx.putImageData(pixels, 0, 0);
  }
  return canvas;
}

function bodyWithSelectedTail(body: CatLayer, config: CatRenderConfig, typing: boolean, layout: TypingLayout | undefined,
  outlineVersion: OutlineVersion, version: TailArtVersion, swing = 0, paintTail?: (tail: CatLayer) => CatLayer,
  separateTail = false, liHua: LiHuaStyle = false,
) {
  if (config.tail === 'CT01' && !swing) return body;
  const tailCoats = { dark: { palette: 'CC02', coat: 'jetBlack' }, orange: { palette: 'CC01', coat: 'native' },
    gray: { palette: 'CC05', coat: 'native' } } as const;
  const tailConfig = config.coloredTail ? { ...config, ...tailCoats[config.coloredTail] } : config;
  const key = `${catPatternCacheKey(config)}/${config.tail}/${config.tailPattern}/${typing}/${layout}/${outlineVersion}/${version}/${config.coloredTail}/${swing}/${separateTail}/${liHua}`;
  const cached = tailBodyLayers.get(body);
  if (!paintTail && cached?.key === key) return cached.canvas;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(body, 0, 0);
  if (!separateTail) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(tailRemoval(typing, layout), 0, 0);
  }
  ctx.globalCompositeOperation = 'destination-over';
  let tail: CatLayer;
  if (config.tail === 'CT01') {
    const legacy = makeLayer(CAT_SIZE);
    legacy.ctx.drawImage(body, 0, 0);
    legacy.ctx.globalCompositeOperation = 'destination-in';
    legacy.ctx.drawImage(tailRemoval(typing, layout), 0, 0);
    tail = legacy.canvas;
  } else {
    tail = selectedTail(tailConfig, typing, layout, outlineVersion, version, liHua);
  }
  if (paintTail) tail = paintTail(tail);
  if (swing) tail = swingPetLoveTail(tail, config.tail, swing, liHua ? liHuaPigments(liHua).ink : pixel80SharedInk(tailConfig, outlineVersion));
  ctx.drawImage(tail, 0, 0, CAT_SIZE, CAT_SIZE);
  if (!paintTail) tailBodyLayers.set(body, { key, canvas });
  return canvas;
}

const composedEars = new Map<string, HTMLCanvasElement>();

function calicoCrownAsset(config: CatRenderConfig) {
  if (config.palette !== 'CC03' || !config.calicoCrown || config.faceBase === 'solid') return;
  if (config.calicoCrownLayout) return `${calicoCrownPath}${config.calicoCrownLayout}-${config.calicoCrown}-`;
  if (config.calicoCrown === 'orange-left') return calicoCrownPath;
}

// The existing ear assets share a crown and a single frontal anchor.
// Their changes are on either side of this 80-pixel-grid boundary.
const earSeam = 152;
const earCombinations = new WeakMap<CatLayer, WeakMap<CatLayer, CatLayer>>();

function joinEarSides(left: CatLayer, right: CatLayer): CatLayer {
  if (left === right) return left;
  let variants = earCombinations.get(left);
  if (!variants) earCombinations.set(left, variants = new WeakMap());
  const cached = variants.get(right);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(left, 0, 0, earSeam, CAT_SIZE, 0, 0, earSeam, CAT_SIZE);
  const span = CAT_SIZE - earSeam;
  ctx.drawImage(right, earSeam, 0, span, CAT_SIZE, earSeam, 0, span, CAT_SIZE);
  variants.set(right, canvas);
  return canvas;
}

type FrontHeadConfig = CatRenderConfig & { revisedEars?: boolean };

function earPairKey(config: FrontHeadConfig) {
  return `${catEarOnSide(config, 'left')}/${catEarOnSide(config, 'right')}/${config.revisedEars}`;
}

function stockEar(ear: CatEar, revisedEars = false) {
  const shape = catFrontEars[ear];
  const revised = catEarRetouchPath + shape;
  return imageFor(revisedEars && pixel80Keys.has(revised) ? revised : orangePath + 'ear_' + shape);
}

function stockEarPair(config: FrontHeadConfig) {
  return joinEarSides(stockEar(catEarOnSide(config, 'left'), config.revisedEars),
    stockEar(catEarOnSide(config, 'right'), config.revisedEars));
}

function earOwnership(ear: CatEar) {
  const shape = catFrontEars[ear];
  return readBodyPixels(earMaskPath + (shape === 'upright' ? 'folded' : shape));
}

function frontCatEars(config: CatRenderConfig, layout?: CatPose['earLayout']): CatLayer {
  return joinEarSides(frontEarCel(config, catEarOnSide(config, 'left'), layout),
    frontEarCel(config, catEarOnSide(config, 'right'), layout));
}

function frontEarCel(config: FrontHeadConfig, ear: CatEar, layout?: CatPose['earLayout']) {
  const { palette } = config;
  const shape = catFrontEars[ear];
  const part = `ear_${shape}`;
  if (palette === 'CC01') return stockEar(ear, config.revisedEars);
  const path = breedPath(palette);
  const crown = calicoCrownAsset(config);
  // The upright cel includes the crown and reaches the brow. The template
  // head owns the cheek and eye area, and both cels keep the same anchor.
  const top = crown && config.calicoCrownTop;
  const topLayout = top === 'dark' ? 'eye-streak' : top === 'high-cap' ? 'high-cap' : undefined;
  const upright = top === 'split' ? config.calicoCrown === 'orange-left' ? calicoCrownPath + 'ears' : path + 'ear_upright'
    : topLayout ? `${calicoCrownPath}${topLayout}-${config.calicoCrown}-ears`
    : crown ? crown + 'ears' : path + 'ear_upright';
  if (ear === 'CE01') return imageFor(upright);
  if (layout === 'legacy' && sharedBreedParts[palette] === palette && !crown) return imageFor(path + part);
  const preserveCrownPigment = !!crown && ear !== config.ear;
  const key = `${path}${part}/${upright}/${preserveCrownPigment}/${config.revisedEars}`;
  const cached = composedEars.get(key);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  const crownCel = imageFor(upright);
  paintBreedEars(ctx, stockEar(ear, config.revisedEars), imageFor(earMaskPath + shape), crownCel, palette, pixel80Keys.size > 0,
    preserveCrownPigment ? calicoEarPigment(crownCel) : undefined);
  composedEars.set(key, canvas);
  return canvas;
}

// Calico photo crowns can swap the orange and charcoal sides. Sample the
// authored upright ear, excluding the lining and the head-to-ear join.
function calicoEarPigment(crown: CatLayer): readonly [boolean, boolean] {
  const data = outlineGuidePixels(crown);
  const region = earOwnership('CE01');
  const guide = outlineGuidePixels(stockEar('CE01'));
  const dark = [0, 0], orange = [0, 0];
  for (let offset = 0; offset < data.length; offset += 4) {
    if (!data[offset + 3] || isEarLiningPixel(data, offset) || isOutline(guide, offset)) continue;
    const side = region[offset] === 255 ? 0 : region[offset + 1] === 255 ? 1 : -1;
    if (side === -1) continue;
    const r = data[offset]!, g = data[offset + 1]!, b = data[offset + 2]!;
    if (r - g > 25 && g - b > 10) orange[side]!++;
    else if (r < 125 && r - g < 26) dark[side]!++;
  }
  return [dark[0]! >= orange[0]!, dark[1]! > orange[1]!];
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

const photoEarBaseColors: Record<Exclude<CatPhotoEarPigment, 'orange'>, readonly number[]> = {
  dark: [64, 57, 66], brown: [152, 103, 76], gray: [123, 121, 134], white: [242, 233, 219],
};
const photoEarOutlineColors: Record<CatPhotoEarPigment, readonly [number, number, number]> = {
  dark: [39, 31, 36], orange: [62, 34, 29], brown: [77, 48, 34], gray: [58, 56, 69], white: [109, 107, 115],
};
const photoEarLayers = new WeakMap<CatLayer, { key: string; canvas: HTMLCanvasElement }>();

const projectedEarMarks = new Map<string, Uint8ClampedArray>();

function stockEarBounds(ear: CatEar, side: CatPhotoEarSide, revisedEars?: boolean) {
  const data = outlineGuidePixels(stockEar(ear, revisedEars)), owner = earOwnership(ear);
  const channel = side === 'left' ? 0 : 1;
  const mask = Uint8Array.from({ length: CAT_SIZE * CAT_SIZE },
    (_, i) => data[i * 4 + 3] && owner[i * 4 + channel]! >= 128 ? 1 : 0);
  return fittedInkSurface(mask);
}

function photoEarMarkPixels(path: string, side: CatPhotoEarSide, ear: CatEar, revisedEars?: boolean) {
  const art = readBodyPixels(path);
  if (ear === 'CE01') return art;
  const key = `${path}/${ear}/${revisedEars}`;
  const cached = projectedEarMarks.get(key);
  if (cached) return cached;
  const upright = stockEarBounds('CE01', side);
  const target = stockEarBounds(ear, side, revisedEars);
  const result = new Uint8ClampedArray(art.length);
  if (upright && target) {
    const from = upright.bounds, to = target.bounds;
    // Sample in each ear's own coordinates so a change of shape moves
    // the reviewed pigment with that ear and never across the crown.
    for (let y = to.y; y < to.y + to.height; y++) {
      const sy = from.y + Math.floor((y - to.y + 0.5) * from.height / to.height);
      for (let x = to.x; x < to.x + to.width; x++) {
        if (!target.mask[y * CAT_SIZE + x]) continue;
        const sx = from.x + Math.floor((x - to.x + 0.5) * from.width / to.width);
        const origin = (sy * CAT_SIZE + sx) * 4;
        result.set(art.subarray(origin, origin + 4), (y * CAT_SIZE + x) * 4);
      }
    }
  }
  projectedEarMarks.set(key, result);
  return result;
}

function withPhotoEarMarks(source: CatLayer, config: FrontHeadConfig, layout?: CatPose['earLayout']): CatLayer {
  if (!config.photoCoatParts?.length) return source;
  const parts = catPhotoEarSides.flatMap(side => {
    const part = catPhotoPartFor(config.photoCoatParts, `ear-${side}`, config.palette, config.coat);
    const ear = catEarOnSide(config, side);
    if (!part || (ear !== 'CE01' && config[side === 'left' ? 'leftEar' : 'rightEar'] === undefined)) return [];
    return [{ part, side, ear, pigment: config.photoEarColors?.[side] ?? 'orange' }];
  });
  if (!parts.length) return source;
  const key = parts.map(({ part, pigment, ear }) => `${part}/${pigment}/${ear}`).join(';');
  const cached = photoEarLayers.get(source);
  if (cached?.key === key) return cached.canvas;
  const guide = outlineGuidePixels(headOutlineGuide(config));
  const lining = layerPixels(frontCatEars(config, layout)).data;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0);
  const pixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
  for (const { part, side, ear, pigment } of parts) {
    const path = catPhotoPartPath + part;
    const art = photoEarMarkPixels(path, side, ear, config.revisedEars);
    const baseColor = pigment === 'orange' ? undefined : photoEarBaseColors[pigment];
    const outline = pixel80Keys.has(path) ? photoEarOutlineColors[pigment] : undefined;
    for (let offset = 0; offset < art.length; offset += 4) {
      if (!art[offset + 3] || !pixels.data[offset + 3]
        || isEarLiningPixel(guide, offset) || isEarLiningPixel(lining, offset)) continue;
      if (isOutline(guide, offset)) {
        // Keep the alternate shape's authored contour and fold lines.
        if (outline && ear === 'CE01') pixels.data.set(outline, offset);
        continue;
      }
      const shade = art[offset + 1]! - 104;
      for (let channel = 0; channel < 3; channel++) {
        pixels.data[offset + channel] = baseColor ? baseColor[channel]! + shade : art[offset + channel]!;
      }
    }
  }
  ctx.putImageData(pixels, 0, 0);
  photoEarLayers.set(source, { key, canvas });
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

function drawNosePart(ctx: CanvasRenderingContext2D, config: CatRenderConfig, atlas: CatLayer, reference = false) {
  const { left, top, width, height } = faceTiles;
  const { nose, noseColor, palette } = config;
  const column = noseColumns.indexOf(nose);
  const sampled = reference && noseColor === 'natural';
  if (column >= 0 && noseColor === 'natural' && !sampled) {
    ctx.drawImage(atlas, column * width, height, width, height, left, top, width, height);
    return;
  }
  // The unmodified per-breed atlas provides the natural nose pigment. The
  // new shapes are isolated from skin, mouth and eyes before recoloring.
  const natural = nativeNoseColor(palette, Math.max(0, column));
  const hex = noseColor === 'natural' ? undefined : Number.parseInt(catFeatureColors[noseColor].color.slice(1), 16);
  const color = sampled ? liHuaReferenceFur.nose : hex === undefined ? [...natural] : [hex >>> 16, (hex >>> 8) & 255, hex & 255];
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

const mouthLineLayers = new WeakMap<HTMLImageElement, Map<string, HTMLCanvasElement>>();
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

function sharedMouthLayer(config: CatRenderConfig, ink = config.palette === 'CC02' ? '#261B1C' : undefined) {
  const art = imageFor(catMouthPath + config.mouth);
  if (!ink) return art;
  const layers = mouthLineLayers.get(art) ?? new Map<string, HTMLCanvasElement>();
  const cached = layers.get(ink);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  const { left, top, width, height } = faceTiles;
  ctx.drawImage(art, 0, 0);
  const pixels = ctx.getImageData(left, top, width, height);
  const hex = Number.parseInt(ink.slice(1), 16);
  const color = [hex >>> 16, (hex >>> 8) & 255, hex & 255];
  for (let offset = 0; offset < pixels.data.length; offset += 4) {
    if (pixels.data[offset + 3] && pixels.data[offset + 1]! < 70) {
      pixels.data.set(color, offset);
    }
  }
  ctx.putImageData(pixels, left, top);
  layers.set(ink, canvas);
  mouthLineLayers.set(art, layers);
  return canvas;
}

const faceCleanupLayers = new WeakMap<CatLayer, HTMLCanvasElement>();
const honeyGoldSkinLayers = new WeakMap<CatLayer, HTMLCanvasElement>();

function honeyGoldMouthSkin(source: CatLayer, config: CatRenderConfig) {
  const cached = honeyGoldSkinLayers.get(source);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  const pixels = layerPixels(source);
  paintHoneyGoldFur(pixels, readBodyPixels(honeyGoldPath + 'cheeks'), config);
  ctx.putImageData(pixels, 0, 0);
  honeyGoldSkinLayers.set(source, canvas);
  return canvas;
}

function faceCleanupLayer(atlas: CatLayer) {
  const cached = faceCleanupLayers.get(atlas);
  if (cached) return cached;
  const { left, top, width, height } = faceTiles;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(atlas, 0, 2 * height, width, height, left, top, width, height);
  faceCleanupLayers.set(atlas, canvas);
  return canvas;
}

function drawCatFaceParts(
  ctx: CanvasRenderingContext2D, config: CatRenderConfig, markingLayout: MarkingLayout | undefined,
  transientMouth: 'smile' | 'flat' | undefined, animation: TypingAnimation, cleanMouth: boolean,
  legacyNoseOutline?: boolean, effortMouth = false, effort = false,
  patchSkin?: (skin: CatLayer) => CatLayer,
  mouthInk?: string, maskFur = false, reference = false, furUnderlay?: HTMLImageElement, restingNose?: CatLayer,
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
    if (restingNose) {
      // Copy the accepted three-grid nose plus its rightmost coat cell.
      // The crop ends above the stem so the active typing expression owns it.
      const cell = restingNose.width / 80;
      const grid = CAT_SIZE / 80;
      const columns = maskFur ? 3 : 4;
      ctx.drawImage(restingNose, 36 * cell, 30 * cell, columns * cell, 2 * cell,
        36 * grid, 30 * grid, columns * grid, 2 * grid);
      return;
    }
    if (legacyNoseOutline && hasLegacyNoseOutline(config)) {
      ctx.drawImage(imageFor(legacyNoseOutlinePath), 0, 0);
    }
    drawNosePart(ctx, config, atlas, reference);
  };
  if (!maskFur) {
    if (patchSkin) ctx.drawImage(patchSkin(faceCleanupLayer(atlas)), 0, 0);
    else draw(0, 2);
  }
  if (cleanMouth && !maskFur) {
    const patch = imageFor(referenceTypingPath('reference-v2') + typingInkPatches.mouth);
    const skin = frontCoatLayer(patch, config);
    ctx.drawImage(patchSkin ? patchSkin(skin) : skin, 0, 0);
  }
  if (customMouth && !maskFur) {
    // Restore the local fur before compositing the independent lips. Old
    // flattened saves still need the original face atlas and its exact pixels.
    const skin = mouthSkinLayer(config, markingLayout);
    ctx.drawImage(patchSkin ? patchSkin(skin) : skin, 0, 0);
  }
  if (furUnderlay) ctx.drawImage(furUnderlay, 0, 0, CAT_SIZE, CAT_SIZE);
  if (effortMouth) {
    const path = frontTypingEffectsPath + 'mouth';
    const line = coloredCatIris(path, mouthInk ?? (config.palette === 'CC02' ? '#261B1C' : '#442416'));
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
    const line = mouthInk && config.mouth !== 'CN09'
      ? coloredCatIris(catMouthPath + config.mouth, mouthInk)
      : sharedMouthLayer(config, config.mouthContrast === 'light' ? mouthInk : undefined);
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
  hidden?: HiddenGlints, artVersion?: CatArtVersion,
) {
  if (!catGlintAperture(config, typing, frame) || (hidden?.[0] && hidden[1])) return;
  const orange = config.palette === 'CC01';
  const leftEdge = orange ? horizontalGazeRange.min : -12;
  const { x, y } = gaze.space === 'pointer'
    ? pointerGlintOffset(gaze, orange ? -8 : -6, orange ? 5 : 4, 10, 9)
    : { x: Math.max(leftEdge, Math.min(horizontalGazeRange.max, Math.round(gaze.x))), y: 2 * Math.sign(gaze.y) };
  const dx = Math.round(x * scale) / scale, dy = Math.round(y * scale) / scale;
  const orangeGlints = hasSquareOrangeGlints(artVersion) && pixel80Keys.has(orangeSquareGlints)
    ? orangeSquareGlints : orangePath + 'eye_glints';
  const glintAsset = orange ? orangeGlints : breedEyeGlints;
  const glints = hasSampledLiHua(artVersion) && usesRedesignedLiHua(config, artVersion)
    ? coloredCatIris(glintAsset, liHuaReferenceFur.glint) : imageFor(glintAsset);
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
  const key = earPairKey(config);
  const cached = headOutlineGuides.get(key);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(imageFor(orangePath + 'head_base'), 0, 0);
  ctx.drawImage(stockEarPair(config), 0, 0);
  headOutlineGuides.set(key, canvas);
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
  const key = `${earPairKey(config)}/${effort}/${sharedNose}/${sharedMouth}/${solid}/${cleanSolidEyes ? config.palette : ''}`;
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
  ctx.drawImage(stockEarPair(config), 0, 0);
  const data = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE).data;
  if (cleanSolidEyes) {
    // Treat the area reserved for the orange eyes as fur before the separate
    // breed eyes go down, including the edge formerly hidden by the old coat.
    const coverage = expandedEyeMask(breedPath(config.palette) + 'eyes');
    for (let i = 0; i < coverage.length; i++) {
      if (coverage[i] && data[i * 4 + 3]) data.set([243, 174, 109], i * 4);
    }
  }
  for (const side of catPhotoEarSides) {
    const shape = catEarOnSide(config, side);
    if (shape === 'CE01' && !solid) continue;
    const ear = earOwnership(shape);
    const channel = side === 'left' ? 0 : 1;
    // Protect the ear's painted folds while keeping the soft crown join.
    for (let offset = 0; offset < data.length; offset += 4) {
      if (ear[offset + channel] === 255) data[offset + 3] = 0;
    }
  }
  sharedHeadGuides.set(key, data);
  return data;
}

const chestFringeByBreed = new Map<CatRenderConfig['palette'], ReturnType<typeof chestFringeSamples>>();
const headsWithSolidNeck = new WeakMap<CatLayer, HTMLCanvasElement>();

function headWithBodyBase(head: CatLayer, config: CatRenderConfig): CatLayer {
  const version = config.furPatternColors ?? currentFurPatternColors;
  if (config.bodyBase !== 'solid' || (version !== 'connected-chest' && !hasIndependentFur(version))) return head;
  const cached = headsWithSolidNeck.get(head);
  if (cached) return cached;
  // The uniform calico face inherits the orange guide's reserved chest edge.
  // Its original face paint has a separate white region that belongs to the head.
  const palette = hasIndependentFur(version) && config.palette === 'CC03' && config.faceBase === 'solid'
    ? 'CC01' : config.palette;
  let samples = chestFringeByBreed.get(palette);
  if (!samples) {
    const path = palette === 'CC01' ? orangePath : breedPath(palette);
    samples = chestFringeSamples(readBodyPixels(path + (palette === 'CC01' ? 'head_base' : 'head')),
      readBodyPixels(path + 'body'), CAT_SIZE);
    chestFringeByBreed.set(palette, samples);
  }
  if (!samples.length) return head;
  const pixels = layerPixels(head);
  for (const [target, fur] of samples) pixels.data.copyWithin(target, fur, fur + 3);
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.putImageData(pixels, 0, 0);
  headsWithSolidNeck.set(head, canvas);
  return canvas;
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
  const key = `${facePatternCacheKey(config)}/${config.pattern}/${earPairKey(config)}/${config.earColor}/${effort}/${earLayout}/${sharedNose}/${sharedMouth}/${cleanEyeRim}/${config.calicoCrown}/${config.calicoCrownLayout}/${config.calicoCrownTop}`;
  const cached = sharedPatternHeads.get(key);
  if (cached) return cached;
  const { palette } = config;
  const orange = palette === 'CC01';
  const path = orange ? orangePath : breedPath(palette);
  const crown = calicoCrownAsset(config);
  const original = imageFor(crown ? crown + 'head' : path + (orange ? 'head_base' : 'head'));
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
    if (hasHoneyGoldFur(config)) {
      if (config.pattern === 'P03') paintHoneyGoldFur(pixels, readBodyPixels(honeyGoldPath + 'crown'), config);
      if (config.bodyPattern === 'plain') paintHoneyGoldFur(pixels, readBodyPixels(honeyGoldPath + 'cheeks'), config);
    } else if (config.coat === 'breed:CC11') {
      paintGoldenTipping(pixels, config);
    }
    // Cleaning the forehead can restore the template's lighter charcoal.
    // Remap only those restored shades; the existing dark coat is already inked.
    if (pixel80Keys.size && inkBlackProfile(config)) recolorPhotoInkBlack(pixels, 56);
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
  // The smaller pixel80 pupil covers fewer of the aperture pixels. These
  // four breed drawings still have a full dark pupil baked into their heads.
  const coarseBakedPupil = pixel80Keys.has(breedPath(palette) + 'head')
    && ['CC05', 'CC06', 'CC07', 'CC08'].includes(palette);
  if (!eyeArea || (!hasOldSiameseFill && bakedInk / eyeArea < (coarseBakedPupil ? 0.5 : 0.8))) {
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

let bakedOrangeEyePixels: Uint8Array | undefined;

function orangeBakedEyeMask() {
  if (bakedOrangeEyePixels) return bakedOrangeEyePixels;
  const iris = readBodyPixels(orangePath + 'iris');
  const head = readBodyPixels(orangePath + 'head_base');
  const mask = new Uint8Array(CAT_SIZE * CAT_SIZE);
  for (let y = 91; y < 140; y++) {
    for (let x = 85; x < 220; x++) {
      if (x > 134 && x < 166) continue;
      const index = y * CAT_SIZE + x, offset = index * 4;
      if (iris[offset + 3] || (head[offset + 3] && head[offset + 2]! > 178)) mask[index] = 1;
    }
  }
  return bakedOrangeEyePixels = mask;
}

const headPatchGuides = new WeakMap<Uint8ClampedArray, Uint8ClampedArray>();
const headPatchMasks = new Map<string, Uint8Array>();

function headPatchGuide(config: CatRenderConfig) {
  const fur = headFurGuide(config, true);
  const cached = headPatchGuides.get(fur);
  if (cached) return cached;
  const result = fur.slice();
  const completeHead = outlineGuidePixels(headOutlineGuide(config));
  for (let i = 0; i < result.length; i += 4) {
    if (!result[i + 3] && completeHead[i + 3]) result.set(completeHead.subarray(i, i + 4), i);
  }
  headPatchGuides.set(fur, result);
  return result;
}

function protectedHeadPatchPixels(config: CatRenderConfig, keepBakedEyes: boolean) {
  const key = `${earPairKey(config)}/${keepBakedEyes}`;
  const cached = headPatchMasks.get(key);
  if (cached) return cached;
  const mask = keepBakedEyes ? orangeBakedEyeMask().slice() : new Uint8Array(inkArea);
  const pixels = outlineGuidePixels(stockEarPair(config));
  // Match the inner-ear picker: a forehead mark may cross the outer ear
  // but the lining itself retains the selected ear color.
  for (let y = 0; y < 104; y++) {
    for (let x = 0; x < CAT_SIZE; x++) {
      if (x >= 125 && x < 176) continue;
      const index = y * CAT_SIZE + x, i = index * 4;
      const r = pixels[i]!, g = pixels[i + 1]!, b = pixels[i + 2]!;
      if (pixels[i + 3] && r >= 145 && r - g >= 31 && b >= g - 5) mask[index] = 1;
    }
  }
  headPatchMasks.set(key, mask);
  return mask;
}

function inkOverDarkPatch(patches: readonly FurPatch[], x: number, y: number) {
  const pigment = furPatchColorAt(patches, x, y);
  if (!pigment) return;
  const [r, g, b] = pigment;
  const tone = (3 * r + 6 * g + b) / 10;
  if (tone >= 74) return;
  // Cool shadows respond to cool coats without burying the expression lines.
  const added = Math.round(55 * (1 - tone / 150));
  return '#' + pigment.map(value => Math.min(255, value + added).toString(16).padStart(2, '0')).join('');
}

const effortEyeCenters = [106, 198] as const;
const effortEyeFur = new WeakMap<CatLayer, readonly boolean[]>();

function darkFurBehindEffortEyes(head: CatLayer) {
  const cached = effortEyeFur.get(head);
  if (cached) return cached;
  const {data} = layerPixels(head);
  const sides = effortEyeCenters.map(x => {
    const i = (114 * CAT_SIZE + x) * 4;
    return !!data[i + 3] && 3 * data[i]! + 6 * data[i + 1]! + data[i + 2]! < 740;
  });
  effortEyeFur.set(head, sides);
  return sides;
}

const restDetailPresets: Readonly<Record<string, CatConfig>> = catPresets;
const restDetailsByCoat = new Map(Object.entries(catBreedDetailPresets).map(([id, preset]) => {
  const look = catRenderConfig(restDetailPresets[preset]!);
  return [look.palette + '/' + look.coat, { id, path: catBreedDetailsPath + id + '/', look }];
}));

function usesStockDetails(config: CatRenderConfig) {
  return !config.furPatches?.length
    && !config.photoCoatParts?.some(part => !catPhotoParts[part].slot.startsWith('ear-'))
    && !config.calicoCrown && !config.calicoCrownTop && !config.calicoFaceFinish && !config.whiteDistribution;
}

function usesRedesignedLiHua(config: CatRenderConfig, version?: CatArtVersion) {
  // The original markings and the new palettes must never meet at the neck.
  const assets = liHuaAssets(version);
  return assets !== undefined && config.palette === 'CC07' && config.coat === 'native'
    && config.bodyPattern === 'native' && config.bodyBase !== 'solid'
    && (config.forelegPatternSource ?? 'native') === 'native'
    && config.pattern === 'P00' && (config.cheekPattern ?? 'native') === 'native' && config.faceBase !== 'solid'
    && usesStockDetails(config) && pixel80Keys.has(assets.head);
}

const liHuaLayers = new WeakMap<CatLayer, Map<string, CatLayer>>();

function liHuaLayer(source: CatLayer, part: 'head' | 'body' | 'detail' | 'muzzle', config: CatRenderConfig, version?: CatArtVersion): CatLayer {
  const customEar = (side: 'left' | 'right') => config.earColor !== 'natural' || Boolean(config.photoEarColors?.[side])
    || Boolean(catPhotoPartFor(config.photoCoatParts, `ear-${side}`, config.palette, config.coat));
  const left = part === 'head' && customEar('left') ? catEarOnSide(config, 'left') : undefined;
  const right = part === 'head' && customEar('right') ? catEarOnSide(config, 'right') : undefined;
  const asset = part === 'detail' ? undefined : liHuaAssets(version)?.[part === 'body' ? 'body' : 'head'];
  const reference = hasSampledLiHua(version);
  const standing = reference && part === 'head' ? (['left', 'right'] as const).filter(side =>
    !customEar(side) && catEarOnSide(config, side) === 'CE01') : [];
  const key = `${asset}/${part}/${left}/${right}/${reference}/${standing}`;
  let variants = liHuaLayers.get(source);
  if (!variants) liHuaLayers.set(source, variants = new Map());
  const old = variants.get(key);
  if (old) return old;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0, CAT_SIZE, CAT_SIZE);
  const pixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
  const l = left && earOwnership(left), r = right && earOwnership(right);
  toneLiHuaFur(pixels, part !== 'body', l || r
    ? i => (l && l[i] === 255) || Boolean(r && r[i + 1] === 255) : undefined);
  if (reference) {
    const { data } = pixels;
    const sampled = part === 'detail' ? readBodyPixels(liHuaSampledPath + 'head') : undefined;
    for (let i = 0; i < data.length; i += 4) {
      if (!data[i + 3] || l && l[i] === 255 || r && r[i + 1] === 255) continue;
      const red = data[i]!, green = data[i + 1]!, blue = data[i + 2]!;
      if (part === 'detail' && red >= 160 && blue > green) {
        data.set(green >= 135 ? liHuaReferenceFur.nose : liHuaReferenceFur.noseShadow, i);
      } else if (red < 105 && green < 80) {
        data.set(liHuaReferenceFur.ink, i);
      } else if (sampled?.[i + 3] && green < 205) {
        data.set(sampled.subarray(i, i + 3), i);
      } else if (red === liHuaFur.base[0] && green === liHuaFur.base[1] && blue === liHuaFur.base[2]) {
        data.set(liHuaReferenceFur.base, i);
      }
    }
  }
  ctx.putImageData(pixels, 0, 0);
  if (asset) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.drawImage(imageFor(asset), 0, 0);
    for (const side of standing) {
      const x = side === 'left' ? 0 : CAT_SIZE / 2;
      const half = CAT_SIZE / 2;
      ctx.drawImage(imageFor(liHuaSampledPath + 'ears'), x, 0, half, CAT_SIZE, x, 0, half, CAT_SIZE);
    }
  }
  variants.set(key, canvas);
  return canvas;
}

function catRestDetails(config: CatRenderConfig, artVersion?: CatArtVersion) {
  if (!hasBreedRestDetails(artVersion) || !usesStockDetails(config)) return;
  return restDetailsByCoat.get(config.palette + '/' + config.coat);
}

function withoutLegacyHeadSpecks(
  head: CatLayer, config: CatRenderConfig, face: CatRenderConfig, artVersion?: CatArtVersion,
) {
  if (!hasSpeckCleanup(artVersion) || !usesStockDetails(config) || config.bodyBase === 'solid') return head;
  const stock = config.palette === 'CC01' && config.coat === 'native'
    ? { id: 'orange', look: restDetailPresets.preset_cat_orange! }
    : restDetailsByCoat.get(config.palette + '/' + config.coat);
  if (!stock || config.pattern !== stock.look.pattern || (face.faceBase ?? 'native') !== (stock.look.faceBase ?? 'native')
    || face.bodyPattern !== (stock.look.cheekPattern ?? stock.look.bodyPattern)) return head;
  const path = catHeadCleanupPath + stock.id + '/';
  const repaired = pixel80Keys.has(path + 'head') ? withAuthoredCoatPart(head, path + 'head') : head;
  const eraseOldEarInk = pixel80Keys.has(path + 'left-standing-ear') && catEarOnSide(config, 'left') === 'CE01'
    && config.earColor === stock.look.earColor && !config.photoEarColors?.left
    && !catPhotoPartFor(config.photoCoatParts, 'ear-left', config.palette, config.coat);
  return eraseOldEarInk ? withAuthoredCoatPart(repaired, path + 'left-standing-ear') : repaired;
}

// Keep the stock body silhouette. One retouch belongs to the body/tail seam,
// and the other belongs to the new static paw overlay.
function diluteCalicoCleanup(body: CatLayer, part: 'tail-seam' | 'rear-paw') {
  const asset = catHeadCleanupPath + 'dilute-calico/' + part;
  return pixel80Keys.has(asset) ? withAuthoredCoatPart(body, asset) : body;
}

const smileFurCells = new Map<string, readonly number[]>();
const restingSmileInkColors = new WeakMap<CatLayer, string>();

function restoreRestingSmileFur(ctx: CanvasRenderingContext2D, asset: string, donor: (x: number, y: number) => number) {
  let cells = smileFurCells.get(asset);
  if (!cells) {
    const mask = makeLayer(80);
    mask.ctx.drawImage(imageFor(asset), 0, 0);
    const data = mask.ctx.getImageData(0, 0, 80, 80).data;
    cells = Array.from({ length: 80 * 80 }, (_, i) => i).filter(i => data[i * 4 + 3]);
    smileFurCells.set(asset, cells);
  }
  // Read the adjacent fur through the current placement transform.
  const matrix = ctx.getTransform();
  const cell = CAT_SIZE / 80;
  for (const pixel of cells) {
    const x = pixel % 80, y = Math.floor(pixel / 80);
    const point = matrix.transformPoint(new DOMPoint(donor(x, y) * cell, y * cell));
    ctx.drawImage(ctx.canvas, point.x, point.y, matrix.a * cell, matrix.d * cell,
      x * cell, y * cell, cell, cell);
  }
}

function drawRestingSmile(ctx: CanvasRenderingContext2D, stock: CatLayer, maskFur: boolean,
  artVersion?: CatArtVersion, exactReviewedColors = false,
) {
  if (!hasExtendedRestingSmile(artVersion)) return;
  const reviewed = hasReviewedRestingSmile(artVersion) && pixel80Keys.has(reviewedRestingSmilePath);
  if (maskFur) {
    // Protect the new ink while preserving the previous protection zones.
    ctx.drawImage(imageFor(restingSmilePath), 0, 0, CAT_SIZE, CAT_SIZE);
    if (reviewed) ctx.drawImage(imageFor(reviewedRestingSmilePath), 0, 0, CAT_SIZE, CAT_SIZE);
    return;
  }
  let ink = restingSmileInkColors.get(stock);
  if (!ink) {
    const { ctx: swatch } = makeLayer(1);
    const cell = stock.width / 80;
    swatch.drawImage(stock, 35 * cell, 35 * cell, cell, cell, 0, 0, 1, 1);
    const [red, green, blue, alpha] = swatch.getImageData(0, 0, 1, 1).data;
    if (!alpha) return;
    ink = `rgb(${red}, ${green}, ${blue})`;
    restingSmileInkColors.set(stock, ink);
  }
  restoreRestingSmileFur(ctx, restingSmilePath + '-restore', x => x < 37 ? 35 : 39);
  ctx.drawImage(coloredCatIris(restingSmilePath, ink), 0, 0, CAT_SIZE, CAT_SIZE);
  if (!reviewed) return;
  if (exactReviewedColors) {
    ctx.drawImage(imageFor(reviewedRestingSmilePath + '-fur'), 0, 0, CAT_SIZE, CAT_SIZE);
    ctx.drawImage(imageFor(reviewedRestingSmilePath), 0, 0, CAT_SIZE, CAT_SIZE);
  } else {
    restoreRestingSmileFur(ctx, reviewedRestingSmilePath + '-fur', (x, y) =>
      y === 34 ? (x < 37 ? 35 : 39) : y === 35 ? (x < 37 ? 33 : 41) : (x < 37 ? 32 : 43));
    ctx.drawImage(coloredCatIris(reviewedRestingSmilePath, ink), 0, 0, CAT_SIZE, CAT_SIZE);
  }
}

function breedRestFace(config: CatRenderConfig, face: CatRenderConfig, artVersion?: CatArtVersion) {
  const details = catRestDetails(config, artVersion);
  if (details && pixel80Keys.has(details.path + 'whiskers') && config.pattern === details.look.pattern
    && (face.faceBase ?? 'native') === (details.look.faceBase ?? 'native')
    && face.bodyPattern === (details.look.cheekPattern ?? details.look.bodyPattern)) return details;
}

function breedRestNose(config: CatRenderConfig, details: NonNullable<ReturnType<typeof breedRestFace>>,
  maskFur: boolean, artVersion?: CatArtVersion,
) {
  const { look, path } = details;
  if (config.nose !== look.nose || config.noseColor !== look.noseColor
    || config.mouth !== look.mouth || config.mouthContrast !== look.mouthContrast) return;
  const nose = imageFor(path + 'nose');
  return usesRedesignedLiHua(config, artVersion) && !maskFur ? liHuaLayer(nose, 'detail', config, artVersion) : nose;
}

function drawBreedRestFaceDetails(
  ctx: CanvasRenderingContext2D, config: CatRenderConfig, face: CatRenderConfig, maskFur: boolean, artVersion?: CatArtVersion,
) {
  const details = breedRestFace(config, face, artVersion);
  if (!details) return;
  const { path, look } = details;
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (config.earColor === look.earColor) {
    const tips = imageFor(path + 'standing-ears');
    for (const [side, column] of [['left', 22], ['right', 52]] as const) {
      if (catEarOnSide(config, side) !== 'CE01' || config.photoEarColors?.[side]
        || catPhotoPartFor(config.photoCoatParts, `ear-${side}`, config.palette, config.coat)) continue;
      ctx.clearRect(column * 4, 5 * 4, 4, 4);
      if (!maskFur) ctx.drawImage(tips, column, 6, 1, 1, column * 4, 6 * 4, 4, 4);
    }
  }

  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(imageFor(path + 'whiskers-erase'), 0, 0, CAT_SIZE, CAT_SIZE);
  ctx.globalCompositeOperation = maskFur ? 'destination-out' : 'source-over';
  const whiskers = imageFor(path + 'whiskers');
  ctx.drawImage(usesRedesignedLiHua(config, artVersion) && !maskFur ? liHuaLayer(whiskers, 'detail', config, artVersion) : whiskers, 0, 0, CAT_SIZE, CAT_SIZE);
  const nose = breedRestNose(config, details, maskFur, artVersion);
  if (nose) {
    ctx.drawImage(nose, 0, 0, CAT_SIZE, CAT_SIZE);
    drawRestingSmile(ctx, nose, maskFur, artVersion, usesRedesignedLiHua(config, artVersion));
  }
  ctx.restore();
}

const breedRestingBodies = new WeakMap<CatLayer, Map<string, CatLayer>>();

function withBreedRestingPaws(body: CatLayer, config: CatRenderConfig, pose: CatPose) {
  const details = catRestDetails(config, pose.artVersion);
  if (!details || !pose.staticPaws || !pixel80Keys.has(details.path + 'paws')
    || config.bodyBase === 'solid' || config.bodyPattern !== details.look.bodyPattern
    || (config.forelegPatternSource ?? 'native') !== 'native') return body;
  const { path } = details;
  let variants = breedRestingBodies.get(body);
  if (!variants) breedRestingBodies.set(body, variants = new Map());
  const existing = variants.get(path);
  if (existing) return existing;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(body, 0, 0);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(imageFor(path + 'paws-erase'), 0, 0, CAT_SIZE, CAT_SIZE);
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(imageFor(path + 'paws'), 0, 0, CAT_SIZE, CAT_SIZE);
  variants.set(path, canvas);
  return canvas;
}

function catRestFaceEdgeBreed(config: CatRenderConfig, face: CatRenderConfig) {
  const breed = config.palette === 'CC01' && config.coat === 'native' ? 'orange'
    : config.palette === 'CC03' && config.coat === 'breed:CC12' ? 'calico' : undefined;
  if (!breed || config.pattern !== 'P00' || (face.faceBase ?? 'native') !== 'native' || face.bodyPattern !== 'native'
    || config.furPatches?.length || config.photoCoatParts?.length || config.photoEarColors
    || config.calicoCrown || config.calicoCrownTop || config.calicoFaceFinish || config.whiteDistribution) return;
  const path = catFaceEdgesPath + breed + '/';
  return pixel80Keys.has(path + 'whiskers') ? breed : undefined;
}

function catRestFaceEdgeNose(config: CatRenderConfig, breed: 'orange' | 'calico', artVersion?: CatArtVersion) {
  if (config.mouth === 'CN08' && !config.mouthContrast && config.nose === 'NO05'
    && config.noseColor === (breed === 'orange' ? 'natural' : 'lightPink')) {
    return hasNarrowNose(artVersion) ? 'nose-mouth-x37'
      : artVersion === 'pixel80-v6' ? 'mouth-b' : 'mouth';
  }
}

function catTypingRestingNose(config: CatRenderConfig, face: CatRenderConfig, maskFur: boolean, version: CatArtVersion) {
  const breed = catRestFaceEdgeBreed(config, face);
  const part = breed && catRestFaceEdgeNose(config, breed, version);
  if (part) return imageFor(catFaceEdgesPath + breed + '/' + part);
  const details = breedRestFace(config, face, version);
  return details && breedRestNose(config, details, maskFur, version);
}

function drawCatFaceEdges(
  ctx: CanvasRenderingContext2D, config: CatRenderConfig, face: CatRenderConfig, maskFur: boolean, artVersion?: CatArtVersion,
) {
  drawBreedRestFaceDetails(ctx, config, face, maskFur, artVersion);
  const breed = catRestFaceEdgeBreed(config, face);
  if (!breed) return;
  const path = catFaceEdgesPath + breed + '/';
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const draw = (part: string, erase: boolean) => {
    if (erase) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(imageFor(path + part + '-erase'), 0, 0, CAT_SIZE, CAT_SIZE);
    }
    // The photo brush only receives fur. Protect the authored edge and linework.
    ctx.globalCompositeOperation = maskFur ? 'destination-out' : 'source-over';
    ctx.drawImage(imageFor(path + part), 0, 0, CAT_SIZE, CAT_SIZE);
  };
  if (config.earColor === 'natural') {
    if (catEarOnSide(config, 'left') === 'CE01') draw('ear-left', true);
    if (catEarOnSide(config, 'right') === 'CE01') draw('ear-right', true);
  }
  draw('whiskers', true);
  const part = catRestFaceEdgeNose(config, breed, artVersion);
  if (part) {
    draw(part, false);
    if (part === 'nose-mouth-x37') drawRestingSmile(ctx, imageFor(path + part), maskFur, artVersion);
  }
  ctx.restore();
}

export function drawCatHead(
  ctx: CanvasRenderingContext2D, appearance: CatConfig | CatRenderConfig, typing: boolean, frame: number, gaze: Gaze,
  { scale = 1, earLayout, hideGlints, markingLayout, legacyNoseOutline, outlineVersion = 'adaptive',
    closeEyes = false, maskFur = false, petLoveEyes = false, faceEdges = false, artVersion, ...typingPose }:
    TypingEffects & Pick<CatPose, 'earLayout' | 'markingLayout' | 'outlineVersion' | 'legacyNoseOutline' | 'faceEdges' | 'artVersion'>
      & { scale?: number; hideGlints?: HiddenGlints; closeEyes?: boolean; maskFur?: boolean; petLoveEyes?: boolean } = {},
) {
  const animation = typingPose.typingAnimation ?? currentTypingAnimation;
  const mode = typingPose.typingMode ?? 'gentle';
  const effectsAnimation = isFrontTyping(animation) ? 'reference-v2' : animation;
  const referenceEffects = typing && isReferenceTyping(effectsAnimation) && typingPose.typingEffects !== false;
  const frenzyEffects = referenceEffects && usesFallingTyping(animation) && mode === 'frenzy';
  const transitionalFace = frenzyEffects && animation === 'front-v4';
  const sharedTypingMouth = referenceEffects && effectsAnimation === 'reference-v2' && typingPose.typingMouthVersion !== 'legacy';
  const selected = { ...catRenderConfig(appearance), revisedEars: hasRevisedEarsAndPaws(artVersion) };
  const config = sharedTypingMouth ? { ...selected, mouth: transitionalFace ? typingMouths.gentle : typingMouths[mode] } : selected;
  const { palette } = config;
  const orange = palette === 'CC01';
  const faceConfig = facePatternConfig(config);
  const liHua = !maskFur && usesRedesignedLiHua(config, artVersion);
  const reference = liHua && hasSampledLiHua(artVersion);
  const path = orange ? orangePath : breedPath(palette);
  const accessory = config.accessory === 'A07' ? 'A06' : config.accessory;
  const eye = catHeadEye(config, typing, frame);
  const effort = hasEffortEyes(typing, frame, typingPose);
  const blinkPath = !orange && eye === 'Y02' && !effort && !closeEyes
    ? breedPath(sharedBreedParts[palette]) + 'eye_Y02' : undefined;
  const blink = blinkPath !== undefined && pixel80Keys.has(blinkPath);
  const eyesClosed = effort || closeEyes || blink;
  const cleanEyeRim = !orange && (closeEyes || blink || (effort && effectsAnimation === 'reference-v2'
    && (typingPose.typingInkVersion ?? currentTypingInkVersion) === currentTypingInkVersion));
  const leftPupil = catPupilStyle(config, 'left');
  const rightPupil = catPupilStyle(config, 'right');
  const cycleFrames = catTypingFrameCountFor(animation);
  const firstHalf = ((frame % cycleFrames) + cycleFrames) % cycleFrames < cycleFrames / 2;
  const transientMouth = referenceEffects && !sharedTypingMouth && (config.mouth === 'CN01' || config.mouth === 'CN05')
    ? mode === 'frenzy' ? 'smile' : mode === 'fast' ? firstHalf ? 'smile' : 'flat' : undefined
    : undefined;
  const patches = furPatchesFor(config.furPatches, 'head');
  const lightMouth = config.mouthContrast === 'light';
  const blackCoat = config.coat === 'jetBlack' || config.coat === 'blackSmoke' || config.coat === 'blackWarm'
    || (config.palette === 'CC02' && config.coat === 'native');
  const tortieCoat = config.coat === 'breed:CC10' || config.coat === 'tortieAmber' || config.coat === 'tortieWalnut';
  const expressionInk = blackCoat && lightMouth ? '#ADA4B0'
    : config.coat === 'jetBlack' ? '#5A5053'
    : tortieCoat ? (lightMouth ? '#C89D8F' : '#74554D') : undefined;
  const patchGuide = patches.length ? headPatchGuide(faceConfig) : undefined;
  const neck = connectedNeckFur(config.furPatches);
  const headPart = catPhotoPartFor(config.photoCoatParts, 'head', config.palette, config.coat);
  const compatibleHeadPart = headPart && (headPart !== 'asymmetric-dark-crown' || config.ear === 'CE01');
  const authoredHeadPart = config.calicoFaceFinish === 'h3r3' && supportsCalicoFaceFinish(config) ? calicoFaceFinishPath
    : compatibleHeadPart ? catPhotoPartPath + headPart : undefined;
  const patchHead = (head: CatLayer) => {
    const painted = withAuthoredCoatPart(head, authoredHeadPart);
    return patchGuide ? furPatchedLayer(painted, {
      patches, guide: patchGuide, keep: protectedHeadPatchPixels(config, orange && !eyesClosed), neck,
    }) : painted;
  };
  const goldenCheeks = hasHoneyGoldFur(faceConfig) && faceConfig.bodyPattern === 'plain';
  const patchSkin = patchGuide || goldenCheeks || liHua ? (skin: CatLayer) => {
    const painted = liHua ? liHuaLayer(skin, 'muzzle', config, artVersion)
      : goldenCheeks ? honeyGoldMouthSkin(skin, faceConfig) : skin;
    return patchGuide ? furPatchedLayer(painted, { patches, guide: patchGuide, skin: true }) : painted;
  } : undefined;
  let effortFur: CatLayer | undefined;
  if (markingLayout === 'legacy' && !patches.length && !authoredHeadPart && !calicoCrownAsset(config)) {
    const head = imageFor(path + (orange ? 'head_base' : 'head'));
    const base = eyesClosed && !orange ? headWithoutBakedEyes(head, palette, cleanEyeRim) : head;
    const painted = outlinedCatLayer(frontCoatLayer(base, config, orange ? 'orange-head' : 'fur'),
      imageFor(orangePath + 'head_base'), config, outlineVersion, true);
    effortFur = headWithBodyBase(painted, { ...config, faceBase: 'native' });
    ctx.drawImage(effortFur, 0, 0);
    if (eyesClosed && orange) ctx.drawImage(frontCoatLayer(imageFor(typingEffectPath + 'orange_eye_patch'), config), 0, 0);
    ctx.drawImage(outlinedCatLayer(coloredFrontCatEars(config, earLayout),
      stockEarPair(config), config, outlineVersion, true), 0, 0);
    if (['P01', 'P02', 'P06'].includes(config.pattern)) {
      const template = config.palette === 'CC01' ? config.palette : sharedBreedParts[config.palette];
      const face = imageFor((orange ? orangePath : breedPath(template)) + `face_${config.pattern}`);
      ctx.drawImage(frontCoatLayer(face, template === config.palette ? config : { ...config, palette: template }), 0, 0);
    }
  } else {
    const guide = headOutlineGuide(config);
    const head = outlinedCatLayer(sharedPatternHead(faceConfig, eyesClosed, earLayout, cleanEyeRim), guide, config, outlineVersion, true);
    const bareForehead = config.pattern === 'P03' && markingLayout !== 'shared';
    const paintedHead = patchHead(headWithBodyBase(bareForehead ? bareForeheadHead(head, guide) : head, config));
    const cleanHead = withoutLegacyHeadSpecks(paintedHead, config, faceConfig, artVersion);
    effortFur = withPhotoEarMarks(liHua ? liHuaLayer(cleanHead, 'head', config, artVersion) : cleanHead, config, earLayout);
    ctx.drawImage(effortFur, 0, 0);
  }
  if (maskFur) {
    // Use stock, unpainted art for the outline and ear lining. The independent
    // face, effects and accessory layers below cut their exact shapes out.
    const ear = outlineGuidePixels(frontCatEars(config, earLayout));
    const keep = protectedHeadPatchPixels(config, orange && !eyesClosed);
    const guide = headPatchGuide(config);
    const native = readBodyPixels(path + (orange ? 'head_base' : 'head'));
    const image = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
    const alpha = opaqueFurMask(image.data, guide, native, config, index =>
      keep[index] || (Math.floor(index / CAT_SIZE) < 104
        && (index % CAT_SIZE < 125 || index % CAT_SIZE >= 176) && isEarLiningPixel(ear, index * 4)));
    for (let i = 0; i < alpha.length; i++) image.data[i * 4 + 3] = alpha[i] ? 255 : 0;
    ctx.putImageData(image, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
  }
  if (blink && blinkPath) {
    const darkFur = effortFur && darkFurBehindEffortEyes(effortFur);
    const blinkInk = (side: 0 | 1) => {
      const color = inkOverDarkPatch(patches, effortEyeCenters[side], 114)
        ?? (darkFur?.[side] || blackCoat ? '#A49AA4' : undefined);
      return color ? coloredCatIris(blinkPath, color) : imageFor(blinkPath);
    };
    drawEyePair(ctx, blinkInk(0), blinkInk(1));
  } else if (!eyesClosed && !orange) {
    const cleanRim = markingLayout !== 'legacy' && cleanSolidFaceEyes(faceConfig);
    const unlined = config.eyeRim === 'none';
    const honeyGoldRim = hasHoneyGoldFur(config);
    drawEyePair(ctx, frontCatEye(palette, eye, leftPupil, cleanRim, unlined, honeyGoldRim, reference),
      frontCatEye(palette, eye, rightPupil, cleanRim, unlined, honeyGoldRim, reference));
  }
  const cleanMouth = orange && typing && animation === 'reference-v2' && typingPose.typingInkVersion !== 'original';
  const effortMouth = transitionalFace && effort && sharedTypingMouth;
  const orangeMouth = effortMouth && orange && faceConfig.faceBase !== 'solid' && config.coat === 'native' && faceConfig.bodyPattern === 'native'
    && config.nose === 'NO05' && markingLayout !== 'legacy';
  // The sampled head still contains two old smile-tip cells beneath CN07.
  const frenzyFur = hasFrenzyFur(artVersion) && reference && frenzyEffects && sharedTypingMouth
    && isFrontTyping(animation) && config.mouth === 'CN07' && selected.mouth === 'CN08'
    && selected.nose === 'NO05' && selected.noseColor === 'natural' && !selected.mouthContrast
    && pixel80Keys.has(liHuaFrenzyFurAsset) ? imageFor(liHuaFrenzyFurAsset) : undefined;
  const mouthInk = inkOverDarkPatch(patches, 151, 139)
    ?? (reference && !config.mouthContrast ? liHuaReferenceFur.line : expressionInk);
  const restingNose = hasTypingRestingNose(artVersion) && typing && isFrontTyping(animation)
    && earLayout !== 'legacy' && markingLayout !== 'legacy' && outlineVersion === 'adaptive' && !legacyNoseOutline
    ? catTypingRestingNose(selected, faceConfig, maskFur, artVersion) : undefined;
  drawCatFaceParts(ctx, faceConfig, markingLayout, transientMouth, effectsAnimation, cleanMouth,
    legacyNoseOutline, effortMouth && !orangeMouth, effort, patchSkin, mouthInk, maskFur, reference, frenzyFur, restingNose);
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
    const pixel80 = pixel80Keys.has(path);
    const darkFur = pixel80 && effortFur ? darkFurBehindEffortEyes(effortFur) : undefined;
    const expression = (side: 0 | 1) => {
      const x = pixel80 ? effortEyeCenters[side] : side === 0 ? 109 : 192;
      const defaultInk = pixel80 ? (darkFur?.[side] || blackCoat ? '#A49AA4' : undefined)
        : config.palette === 'CC02' ? '#201B1E' : undefined;
      const color = inkOverDarkPatch(patches, x, pixel80 ? 114 : 116) ?? defaultInk;
      return color ? coloredCatIris(path, color) : imageFor(path);
    };
    drawEyePair(ctx, expression(0), expression(1));
  } else if (!closeEyes) {
    drawCatGlints(ctx, config, typing, frame, gaze, scale, hideGlints, artVersion);
  }
  if (petLoveEyes) {
    const darkFur = effortFur && darkFurBehindEffortEyes(effortFur);
    const outline = pixel80SharedInk(config, outlineVersion) ?? [75, 46, 34];
    const ink = '#' + outline.map(channel => channel.toString(16).padStart(2, '0')).join('');
    const eyes = catPetLove.path + 'eyes';
    drawEyePair(ctx, coloredCatIris(eyes, darkFur?.[0] ? '#AEA2B0' : ink),
      coloredCatIris(eyes, darkFur?.[1] ? '#AEA2B0' : ink));
  }
  // New sweat belongs on the forehead, beneath hats and hair clips. Preserve
  // the old shared order when reconstructing older pixel-editor saves.
  if (frenzyEffects) {
    drawFallingTypingCel(ctx, 'sweat', frame);
  } else if (referenceEffects && mode !== 'gentle') {
    ctx.drawImage(referenceTypingFrame(`sweat_${mode}`, frame, effectsAnimation), 0, 0);
  }
  if (faceEdges && !typing && !closeEyes && earLayout !== 'legacy' && markingLayout !== 'legacy'
    && outlineVersion === 'adaptive' && !legacyNoseOutline) drawCatFaceEdges(ctx, config, faceConfig, maskFur, artVersion);
  if (accessory !== 'A00') ctx.drawImage(imageFor(`${orangePath}accessory_${accessory}`), 0, 0);
  if (effort && !referenceEffects) {
    const sweat = Math.floor((frame % catTypingFrameCountFor('shared')) / 3) - 1;
    if (sweat >= 0) ctx.drawImage(imageFor(typingEffectPath + `sweat_${sweat}`), 0, 0);
  }
  if (maskFur) ctx.globalCompositeOperation = 'source-over';
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

function breedBodyOutline(config: CatRenderConfig, pose: CatPose) {
  if (!hasBreedBodyOutline(pose.artVersion) || !pose.staticPaws || config.tail === 'CT01'
    || config.bodyBase === 'solid' || (config.forelegPatternSource ?? 'native') !== 'native'
    || (pose.outlineVersion ?? 'adaptive') !== 'adaptive') return;
  const details = catRestDetails(config, pose.artVersion);
  if (!details || config.bodyPattern !== details.look.bodyPattern
    || (details.id !== 'li-hua' && pose.artVersion !== currentCatArtVersion)) return;
  const asset = breedBodyOutlinePath + details.id;
  if (pixel80Keys.has(asset)) return asset;
}

const breedBodyOutlineLayers = new WeakMap<CatLayer, Map<string, CatLayer>>();

function withBreedBodyOutline(body: CatLayer, asset: string, layout?: TypingLayout): CatLayer {
  const key = asset + '/' + (layout ?? 'aligned');
  let cached = breedBodyOutlineLayers.get(body);
  if (!cached) breedBodyOutlineLayers.set(body, cached = new Map());
  const existing = cached.get(key);
  if (existing) return existing;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(body, 0, 0);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(tailRemoval(false, layout), 0, 0);
  ctx.drawImage(imageFor(asset + '-erase'), 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(imageFor(asset), 0, 0);
  cached.set(key, canvas);
  return canvas;
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
  const separatedBreedBody = typing ? undefined : breedBodyOutline(config, pose);
  const retouch = historicalBody ? undefined : orangeBodyRetouch(config, pose);
  const stockBody = frontBodyLayer(path, historicalBody ? 'typing_body' : 'body', config, layout, outlineVersion, retouch);
  const calicoCleanup = !historicalBody && hasSpeckCleanup(pose.artVersion) && usesStockDetails(config)
    && config.palette === 'CC03' && config.coat === 'breed:CC12' && config.bodyPattern === 'native'
    && config.bodyBase !== 'solid';
  const cleanBody = calicoCleanup ? diluteCalicoCleanup(stockBody, 'tail-seam') : stockBody;
  const restingBody = typing ? cleanBody : withBreedRestingPaws(cleanBody, config, pose);
  const preOutlineBody = calicoCleanup && restingBody !== cleanBody
    ? diluteCalicoCleanup(restingBody, 'rear-paw') : restingBody;
  const outlinedBody = separatedBreedBody ? withBreedBodyOutline(preOutlineBody, separatedBreedBody, layout) : preOutlineBody;
  const liHua: LiHuaStyle = !historicalBody && usesRedesignedLiHua(config, pose.artVersion)
    && (hasSampledLiHua(pose.artVersion) ? 'reference' : true);
  const liHuaTail = !config.coloredTail && liHua;
  const separated = Boolean(separatedBreedBody) || retouch === orangeBodyOutlinePath;
  const bodyBase = liHua ? liHuaLayer(outlinedBody, 'body', config, pose.artVersion) : outlinedBody;
  const selectedBody = bodyWithSelectedTail(bodyBase, config, historicalBody, layout, outlineVersion, tailArtVersion,
    0, undefined, separated, liHuaTail);
  const body = historicalBody ? bodyWithTypingConnector(selectedBody, config, layout, laptopVersion) : selectedBody;
  const frenzyPaws = usesFallingTyping(animation) && mode === 'frenzy';
  const frontPaws = typing && isFrontTyping(animation) ? frontTypingPaws(frame, frenzyPaws) : undefined;
  const pawPigment = frontPaws && catKeepsBreedPigment(config) && usesBodyPattern(config)
    ? frontBodyLayer(path, 'body', { ...config, bodyPattern: 'native' }, layout, outlineVersion) : bodyBase;
  const arms = !typing ? undefined : frontPaws
    ? coloredFrontPaws(frontPaws, pawPigment, config, outlineVersion, liHua)
    : animation === 'legacy'
    ? frontBodyLayer(path, `typing_arms_${mode}_${frame}`, config, layout, outlineVersion)
    : animation === 'shared' ? sharedTypingArms(path, config, frame, layout, outlineVersion)
      : isReferenceTyping(animation) ? referenceTypingArms(path, config, mode, frame, animation, outlineVersion, pose.typingInkVersion) : undefined;
  const raisedPaws = typing && animation === 'legacy' && mode === 'fast' && frame < 3
    ? frontBodyLayer(path, `typing_front_${frame}`, config, layout, outlineVersion) : undefined;
  const laptop = typing ? catTypingLaptop(config, layout, laptopVersion, animation) : undefined;
  return { body, bodyBase, arms, frontPaws, frenzyPaws, historicalBody, raisedPaws, laptop, mode, animation, outlineVersion, laptopVersion, tailArtVersion, retouch, liHuaTail, separated };
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

function catHeadInkGeometry(appearance: CatRenderConfig, typing: boolean, pose: CatPose): CatInkGeometry {
  const config = { ...appearance, revisedEars: hasRevisedEarsAndPaws(pose.artVersion) };
  const layout = typing ? pose.typingLayout : undefined;
  const key = `${config.palette}/${earPairKey(config)}/${config.accessory}/${pose.earLayout}/${layout}/${config.calicoCrown}/${config.calicoCrownLayout}/${config.calicoCrownTop}/${config.faceBase}`;
  const cached = headInkCache.get(key);
  if (cached) return cached;
  const base = catLayerAlpha(imageFor(config.palette === 'CC01' ? `${orangePath}head_base` : `${breedPath(config.palette)}head`));
  const ears = catLayerAlpha(frontCatEars(config, pose.earLayout));
  const leftRegion = earOwnership(catEarOnSide(config, 'left'));
  const rightRegion = earOwnership(catEarOnSide(config, 'right'));
  const accessory = config.accessory === 'A07' ? 'A06' : config.accessory;
  const worn = accessory !== 'A00' ? catLayerAlpha(imageFor(`${orangePath}accessory_${accessory}`)) : undefined;
  const leftEar = new Uint8Array(inkArea), rightEar = new Uint8Array(inkArea), head = new Uint8Array(inkArea);
  for (let index = 0; index < inkArea; index++) {
    const offset = index * 4;
    if (worn?.[index]) head[index] = 1;
    else if (ears[index] && leftRegion[offset] === 255) leftEar[index] = 1;
    else if (ears[index] && rightRegion[offset + 1] === 255) rightEar[index] = 1;
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
  const key = `${config.palette}/${config.tail}/${tailArtVersion}/${poseKey}/${layers.retouch}`;
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
    if (!typing) paw = sittingPawAt(x, y);
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

const patchLimbParts = [
  ['leftForeleg', 'leftPaw'],
  ['rightForeleg', 'rightPaw'],
] as const;
type FrontPaw = typeof patchLimbParts[number][1];
type FurPatchGeometry = Partial<Record<FurPatchPart, CatInkSurface>>;
const furPatchBodyGeometry = new WeakMap<CatInkGeometry, FurPatchGeometry>();

function separatedFurPatchBody(idle: CatInkGeometry): FurPatchGeometry {
  const cached = furPatchBodyGeometry.get(idle);
  if (cached) return cached;
  const trunk = idle.torso?.mask?.slice();
  if (!trunk) return idle;
  const left = idle.leftPaw?.mask?.slice() ?? new Uint8Array(inkArea);
  const right = idle.rightPaw?.mask?.slice() ?? new Uint8Array(inkArea);
  // The sitting art bakes the forelimbs into the same cel as the breast
  // and haunches. Assign the fur above each paw along the drawn legs so
  // torso patterns cannot spill forward over the arms.
  for (let y = 201; y < 252; y++) {
    for (let x = 95; x <= 207; x++) {
      const index = y * CAT_SIZE + x;
      if (!trunk[index]) continue;
      const side = sittingForelegAt(x, y);
      if (!side) continue;
      trunk[index] = 0;
      (side === 'leftForeleg' ? left : right)[index] = 1;
    }
  }
  const geometry: FurPatchGeometry = { ...idle, torso: fittedInkSurface(trunk, inkBounds),
    leftForeleg: fittedInkSurface(left, inkBounds), rightForeleg: fittedInkSurface(right, inkBounds) };
  furPatchBodyGeometry.set(idle, geometry);
  return geometry;
}

function furPatchPaintForPart(
  config: CatRenderConfig, part: FurPatchPart, guide: Uint8ClampedArray, geometry: FurPatchGeometry,
): FurPatchPaint {
  const surface = geometry[part];
  const patches = part === 'leftForeleg' || part === 'rightForeleg'
    ? forelegFurPatches(config.furPatches, part) : furPatchesFor(config.furPatches, part);
  return { patches: surface ? patches : [], guide, surface };
}

function hasMovingFurPatches(config: CatRenderConfig) {
  return patchLimbParts.some(([limb, paw]) => forelegFurPatches(config.furPatches, limb).length
    || furPatchesFor(config.furPatches, paw).length);
}

function furPatchedMovingPaws(
  source: CatLayer, guide: CatLayer, config: CatRenderConfig, geometry: CatInkGeometry, pose: CatPose, reverseForeleg = false,
) {
  if (!hasMovingFurPatches(config)) return source;
  const idle = catBodyInkGeometry(config, false, 0, pose, frontCatLayers(config, false, 0, pose));
  const pixels = outlineGuidePixels(guide);
  // Raised cels only show the distal paw. Sample that part of the longer
  // foreleg pattern before the independent sock goes down.
  return furPatchedLayer(source, ...patchLimbParts.flatMap(([limb, paw]): FurPatchPaint[] => {
    const surface = geometry[paw];
    if (!surface) return [];
    const paint = { guide: pixels, surface, idle: idle[paw]?.bounds, movingPaw: true };
    const limbPatches = forelegFurPatches(config.furPatches, limb), socks = furPatchesFor(config.furPatches, paw);
    if (reverseForeleg) return [
      { ...paint, patches: limbPatches, reverseY: true },
      { ...paint, patches: socks },
    ];
    return [{ ...paint, patches: [...limbPatches, ...socks] }];
  }));
}


export function catInkGeometry(appearance: CatConfig, typing: boolean, frame: number, pose: CatPose = {}): CatInkGeometry {
  const config = catRenderConfig(appearance, pose.furPatternColors);
  const count = frameCount(appearance, typing ? 'typing' : 'sit', pose.typingAnimation);
  const index = ((frame % count) + count) % count;
  const layers = frontCatLayers(config, typing, index, { ...pose, staticPaws: !typing });
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

// A surface owns opaque fur only. Its outline evidence comes from the
// original component art, so black fur and custom colors remain independent.
function opaqueFurMask(
  pixels: Uint8ClampedArray, guide: Uint8ClampedArray, native: Uint8ClampedArray,
  config: CatRenderConfig, keep?: (index: number) => unknown,
) {
  const result = new Uint8Array(inkArea);
  const nativeInk = pixel80CatOutline({ palette: config.palette, coat: 'native' });
  const adaptiveInk = pixel80CatOutline(config);
  const rgbEquals = (data: Uint8ClampedArray, i: number, ink: readonly number[]) =>
    data[i] === ink[0] && data[i + 1] === ink[1] && data[i + 2] === ink[2];
  for (let index = 0; index < inkArea; index++) {
    const i = index * 4;
    if (pixels[i + 3] !== 255 || keep?.(index) || isOutline(guide, i)
      || (native[i + 3] && rgbEquals(native, i, nativeInk)) || rgbEquals(pixels, i, adaptiveInk)) continue;
    // The source's very edge is locked even where a breed has its own
    // silhouette and the shared outline guide has no corresponding pixel.
    if (index % CAT_SIZE === 0 || index % CAT_SIZE === CAT_SIZE - 1
      || !pixels[i - 4 + 3] || !pixels[i + 4 + 3]
      || !pixels[i - CAT_SIZE * 4 + 3] || !pixels[i + CAT_SIZE * 4 + 3]) continue;
    result[index] = 1;
  }
  return result;
}

function restrictFurParts(
  geometry: CatInkGeometry, parts: readonly (keyof CatInkGeometry)[], allowed: Uint8Array,
  hidden?: Uint8Array,
): CatInkGeometry {
  const result: CatInkGeometry = {};
  for (const part of parts) {
    const surface = geometry[part];
    if (surface?.mask) result[part] = { bounds: surface.bounds,
      mask: surface.mask.map((pixel, i) => pixel && allowed[i] && !hidden?.[i] ? 1 : 0) };
  }
  return result;
}

const photoHeadGeometry = new Map<string, CatInkGeometry>();

function photoHeadFur(
  config: CatRenderConfig, typing: boolean, frame: number, gaze: Gaze, pose: CatPose, closeEyes = false, petLoveEyes = false,
) {
  const placement = catHeadPlacement(typing, frame, pose.typingLayout);
  const key = JSON.stringify([config, typing, typing ? frame : catHeadEye(config, false, frame), gaze, closeEyes, petLoveEyes,
    pose.earLayout, pose.typingLayout, pose.markingLayout, pose.outlineVersion, pose.legacyNoseOutline, pose.faceEdges, pose.artVersion,
    pose.typingAnimation, pose.typingMode, pose.typingEffects, pose.typingInkVersion, pose.typingMouthVersion]);
  const cached = photoHeadGeometry.get(key);
  if (cached) return cached;
  const { ctx } = makeLayer(CAT_SIZE);
  drawCatHead(ctx, config, typing, frame, gaze, { ...pose, closeEyes, petLoveEyes, scale: placement.scale, maskFur: true });
  const { data } = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
  const allowed = new Uint8Array(inkArea);
  for (let i = 0; i < inkArea; i++) allowed[i] = data[i * 4 + 3] === 255 ? 1 : 0;
  const geometry = restrictFurParts(catHeadInkGeometry(config, typing, pose), headInkParts, placedHeadMask(allowed, placement));
  if (photoHeadGeometry.size >= 80) photoHeadGeometry.delete(photoHeadGeometry.keys().next().value!);
  photoHeadGeometry.set(key, geometry);
  return geometry;
}

const photoBodyMasks = new WeakMap<CatLayer, Uint8Array>();
const photoBodyGeometry = new WeakMap<CatLayer, WeakMap<CatInkGeometry, CatInkGeometry>>();

function photoBodyFur(
  config: CatRenderConfig, typing: boolean, frame: number, pose: CatPose, layers: ReturnType<typeof frontCatLayers>,
) {
  const { body, frontPaws, historicalBody } = layers;
  // New photo results use the front-facing body and the separate moving
  // paws. Historical typing cels mix fur and props and have no such contract.
  if (historicalBody) return {};
  const geometry = catBodyInkGeometry(config, typing, frame, pose, layers);
  let cache = photoBodyGeometry.get(body);
  if (!cache) photoBodyGeometry.set(body, cache = new WeakMap());
  const cached = cache.get(geometry);
  if (cached) return cached;
  let allowed = photoBodyMasks.get(body);
  if (!allowed) {
    const { retouch } = layers;
    const native = readBodyPixels(retouch ?? (config.palette === 'CC01' ? orangePath : breedPath(config.palette)) + 'body');
    const stock = retouch ? native : bodyGuide('body');
    const data = outlineGuidePixels(body);
    allowed = opaqueFurMask(data, stock, native, config);
    if (config.tail !== 'CT01' && geometry.tail?.mask) {
      const path = (Object.hasOwn(sharedTailStyles, config.tail) ? tailArtPaths[layers.tailArtVersion] : tailPath)
        + 'idle_' + config.tail;
      const raw = readBodyPixels(path);
      const tail = opaqueFurMask(data, raw, raw, config);
      for (let i = 0; i < inkArea; i++) if (geometry.tail.mask[i]) allowed[i] = tail[i]!;
    }
    photoBodyMasks.set(body, allowed);
  }
  const stationary = restrictFurParts(geometry, frontPaws ? ['torso', 'tail'] : bodyInkParts, allowed);
  const result = frontPaws ? { ...stationary, ...photoMovingPawFur(geometry, frontPaws, config) } : stationary;
  cache.set(geometry, result);
  return result;
}

const photoPawMasks = new WeakMap<CatLayer, Uint8Array>();

function photoMovingPawFur(geometry: CatInkGeometry, raw: CatLayer, config: CatRenderConfig) {
  let allowed = photoPawMasks.get(raw);
  if (!allowed) {
    const data = outlineGuidePixels(raw);
    const stock = { ...config, palette: 'CC01' as const, coat: 'native' as const };
    allowed = opaqueFurMask(data, data, data, stock);
    photoPawMasks.set(raw, allowed);
  }
  return restrictFurParts(geometry, ['leftPaw', 'rightPaw'], allowed);
}

// Use the same part masks as playback, subtracting what is above each
// surface in the captured pose. Bounds remain stable under occlusion.
export function visiblePhotoFur(
  appearance: CatConfig, typing: boolean, frame: number, gaze: Gaze, pose: CatPose,
): CatInkGeometry {
  pose = { ...pose, faceEdges: hasB3FaceEdges(pose.artVersion), staticPaws: !typing };
  const config = catRenderConfig(appearance, pose.furPatternColors);
  const layers = frontCatLayers(config, typing, frame, pose);
  const placement = catHeadPlacement(typing, frame, pose.typingLayout);
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  if (typing) {
    ctx.translate(placement.x, placement.y);
    ctx.scale(placement.scale, placement.scale);
  }
  drawCatHead(ctx, config, typing, frame, gaze, { ...pose, scale: placement.scale });
  const headCover = catLayerAlpha(canvas);
  const head = photoHeadFur(config, typing, frame, gaze, pose);
  const body = photoBodyFur(config, typing, frame, pose, layers);
  const pawCover = layers.frontPaws && catLayerAlpha(layers.frontPaws);
  const upper = makeLayer(CAT_SIZE);
  if (layers.laptop) upper.ctx.drawImage(layers.laptop, 0, 0);
  if (typing && usesFallingTyping(layers.animation) && layers.mode === 'frenzy' && pose.typingEffects !== false) {
    const heat = pose.frenzyHeatFrame;
    if (heat === undefined) drawFallingTypingCel(upper.ctx, 'air', frame);
    else {
      const steam = heat < frenzySteamLoopStart ? heat : frenzySteamLoopStart + frame % frontTyping.pawFrames;
      drawFallingTypingCel(upper.ctx, 'steam', steam);
      drawFallingTypingCel(upper.ctx, 'sparks', frame);
    }
  }
  const upperCover = catLayerAlpha(upper.canvas);
  const hidden = {
    head: upperCover.map((pixel, i) => pixel || pawCover?.[i] ? 1 : 0),
    body: upperCover.map((pixel, i) => pixel || pawCover?.[i] || headCover[i] ? 1 : 0),
    paws: pawCover ? upperCover : upperCover.map((pixel, i) => pixel || headCover[i] ? 1 : 0),
  };
  const all = new Uint8Array(inkArea).fill(1);
  return {
    ...restrictFurParts(body, ['torso', 'tail'], all, hidden.body),
    ...restrictFurParts(body, ['leftPaw', 'rightPaw'], all, hidden.paws),
    ...restrictFurParts(head, headInkParts, all, hidden.head),
  };
}

function drawPetLoveWarp(ctx: CanvasRenderingContext2D, layer: CatLayer,
  warp: (source: ImageData, target: ImageData) => void,
) {
  const source = makeLayer(80);
  source.ctx.drawImage(layer, 0, 0, 80, 80);
  const { canvas, ctx: target } = makeLayer(80);
  const pixels = target.createImageData(80, 80);
  warp(source.ctx.getImageData(0, 0, 80, 80), pixels);
  target.putImageData(pixels, 0, 0);
  ctx.drawImage(canvas, 0, 0, CAT_SIZE, CAT_SIZE);
}

function drawCatFront(ctx: CanvasRenderingContext2D, config: CatRenderConfig, typing: boolean, frame: number, gaze: Gaze, pose: CatPose,
  closeEyes = false, liftedPaws: readonly FrontPaw[] = [],
) {
  const layers = frontCatLayers(config, typing, frame, pose);
  const { body, arms, frontPaws, laptop, raisedPaws, mode, animation, outlineVersion, laptopVersion } = layers;
  const layout = pose.typingLayout;
  const custom = pose.custom;
  const ink = custom?.ink;
  const furOnly = ink?.scope === 'photo-fur';
  const legacyCustom = ink ? undefined : custom;
  const petLove = typing ? undefined : catPetLovePose(pose.petLoveFrame);
  const movingHead = Boolean(petLove?.drop || petLove?.squint);
  const shoulders = petLove?.shoulders ?? 0;
  closeEyes ||= Boolean(petLove?.squint);
  const effort = closeEyes || hasEffortEyes(typing, frame, { ...pose, typingMode: mode });
  const sameIdle = !typing && legacyCustom?.source.action === 'sit';
  const placement = catHeadPlacement(typing, frame, layout);
  const tracking = legacyCustom !== undefined && gaze.space === 'pointer';
  const edits = (tracking || effort ? legacyCustom?.following : undefined) ?? legacyCustom?.paint;
  const headEdits = typing ? edits?.typingHead : edits?.idleHead ?? (movingHead && sameIdle ? edits?.typingHead : undefined);
  const torsoEdits = typing ? legacyCustom?.typingTorso
    : legacyCustom?.idleTorso ?? (movingHead && sameIdle ? legacyCustom?.typingTorso : undefined);
  const fullEdits = edits?.full;
  const headOptions = {
    closeEyes, petLoveEyes: petLove?.squint, scale: placement.scale, earLayout: pose.earLayout, faceEdges: pose.faceEdges, artVersion: pose.artVersion,
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

  const authoredTorsoPart = !layers.historicalBody && config.bodyBase === 'native'
    ? catPhotoPartFor(config.photoCoatParts, 'torso', config.palette, config.coat) : undefined;
  const furBody = furOnly && bodyInkParts.some(part => ink.parts[part])
    ? photoBodyFur(config, typing, frame, pose, layers) : undefined;
  const swing = legacyCustom?.idleTorso || (sameIdle && fullEdits) ? 0 : petLove?.sweep ?? 0;
  const paintTail = swing && ink?.parts.tail ? (tail: CatLayer) => {
    const edited = makeLayer(CAT_SIZE);
    edited.ctx.drawImage(tail, 0, 0);
    applyCatInk(edited.ctx, ink, furBody ?? catBodyInkGeometry(config, typing, frame, pose, layers), ['tail']);
    return edited.canvas;
  } : undefined;
  const movingBody = swing ? bodyWithSelectedTail(layers.bodyBase, config, false, layout, outlineVersion,
    layers.tailArtVersion, swing, paintTail, layers.liHuaTail && layers.separated, layers.liHuaTail) : body;
  const paintedBody = withAuthoredCoatPart(movingBody, authoredTorsoPart ? catPhotoPartPath + authoredTorsoPart : undefined);
  const patchedBody = config.furPatches?.length ? (() => {
    const idle = catBodyInkGeometry(config, false, 0, pose, frontCatLayers(config, false, 0, pose));
    const geometry = separatedFurPatchBody(idle);
    const { retouch } = layers;
    const guide = retouch ? readBodyPixels(retouch) : bodyGuide(layers.historicalBody ? 'typing_body' : 'body');
    const torso = furPatchPaintForPart(config, 'torso', guide, geometry);
    return furPatchedLayer(paintedBody, { ...torso, neck: connectedNeckFur(config.furPatches) },
      ...patchLimbParts.flatMap(parts => liftedPaws.includes(parts[1]) ? []
        : parts.map(part => furPatchPaintForPart(config, part, guide, geometry))));
  })() : paintedBody;

  if (fallingLetters) drawFallingTypingCel(ctx, mode, frame);
  const bentBody = shoulders ? makeLayer(CAT_SIZE) : undefined;
  const bodyTarget = bentBody?.ctx ?? ctx;
  if (legacyCustom && torsoEdits) {
    const { canvas, ctx: layer } = clearCustomLayer(legacyCustom);
    layer.drawImage(patchedBody, 0, 0);
    copyCatEdits(layer, torsoEdits);
    // Pose-specific arms and props stay above the stationary torso.
    layer.globalCompositeOperation = 'destination-in';
    layer.drawImage(body, 0, 0);
    bodyTarget.drawImage(canvas, 0, 0);
  } else {
    bodyTarget.drawImage(patchedBody, 0, 0);
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
    bodyTarget.drawImage(canvas, 0, 0);

    clearCustomLayer(legacyCustom);
    layer.drawImage(arms, 0, 0);
    layer.globalCompositeOperation = 'destination-in';
    layer.drawImage(paws, 0, 0);
    bodyTarget.drawImage(canvas, 0, 0);
  } else if (arms && !frontPaws) {
    bodyTarget.drawImage(arms, 0, 0);
  }
  const bodyParts = swing ? ['torso', 'leftPaw', 'rightPaw'] as const
    : frontPaws ? ['torso', 'tail'] as const : bodyInkParts;
  if (ink && bodyParts.some(part => ink.parts[part])) {
    const parts = furOnly ? bodyParts.filter(part => part !== 'leftPaw' && part !== 'rightPaw' || !liftedPaws.includes(part)) : bodyParts;
    applyCatInk(bodyTarget, ink, furBody ?? catBodyInkGeometry(config, typing, frame, pose, layers), parts);
  }

  if (bentBody) {
    drawPetLoveWarp(ctx, bentBody.canvas, (source, target) => warpCatPetLoveShoulders(source, target, shoulders));
  }

  ctx.save();
  const headX = typing ? placement.x : 2 * Math.round(stretch * 7);
  const headY = typing ? placement.y : 0;
  if (petLove && movingHead) {
    const { canvas, ctx: head } = makeLayer(CAT_SIZE);
    drawCatHead(head, config, false, frame, gaze, headOptions);
    if (headEdits) copyCatEdits(head, headEdits);
    if (ink && headInkParts.some(part => ink.parts[part])) {
      const geometry = furOnly ? photoHeadFur(config, false, frame, gaze, pose, closeEyes, petLove.squint)
        : catHeadInkGeometry(config, false, pose);
      applyCatInk(head, ink, geometry, headInkParts);
    }
    drawPetLoveWarp(ctx, canvas, (source, target) => warpCatPetLoveHead(source, target, petLove.drop, petLove.crease));
  } else if (legacyCustom && headEdits) {
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
  if (!movingHead && ink && headInkParts.some(part => ink.parts[part])) {
    // A pixel erased from the visible head must remain transparent at the
    // neckline where arms overlap it. Only the head owns the saved erasure.
    ctx.save();
    if (!typing) ctx.translate(headX, 0);
    const geometry = furOnly ? photoHeadFur(config, typing, frame, gaze, pose, closeEyes)
      : catHeadInkGeometry(config, typing, pose);
    applyCatInk(ctx, ink, geometry, headInkParts);
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
      const pawLayer = config.furPatches?.length
        ? furPatchedMovingPaws(arms, frontPaws, config, catBodyInkGeometry(config, typing, frame, pose, layers), pose) : arms;
      ctx.drawImage(pawLayer, 0, 0);
      if (ink?.parts.leftPaw || ink?.parts.rightPaw) {
        applyCatInk(ctx, ink, furBody ?? catBodyInkGeometry(config, typing, frame, pose, layers), ['leftPaw', 'rightPaw']);
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
  } else if (sameIdle && fullEdits && !movingHead) {
    ctx.save();
    ctx.translate(0, -catHeadPlacement(false, legacyCustom.source.frame).y);
    copyCatEdits(ctx, fullEdits);
    ctx.restore();
  }
  if (petLove) {
    drawAtlasRegion(ctx, imageFor(catPetLove.path + 'hearts'), catPetLove.hearts, petLove.frame, catPetLove.columns);
  }
  if (tracking && !effort && !movingHead) {
    ctx.translate(headX, headY);
    ctx.scale(placement.scale, placement.scale);
    // Paint the moving reflection above the custom iris while respecting erasures.
    ctx.globalCompositeOperation = 'source-atop';
    drawCatGlints(ctx, config, typing, frame, gaze, placement.scale, undefined, pose.artVersion);
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
  appearance: CatConfig; gaze: Gaze; custom?: CatCustomization; artVersion?: CatArtVersion; sprite: ReturnType<typeof splitJellySprite>;
} | undefined;

function createJellyBuffers() {
  const source = makeLayer(CAT_SIZE);
  const front = makeLayer(CAT_SIZE);
  const tail = makeLayer(CAT_SIZE);
  return { source, front, tail, frontPixels: front.ctx.createImageData(CAT_SIZE, CAT_SIZE),
    tailPixels: tail.ctx.createImageData(CAT_SIZE, CAT_SIZE) };
}

function drawJellyCat(ctx: CanvasRenderingContext2D, appearance: CatConfig, gaze: Gaze, jelly: JellyPose, pose: CatPose) {
  const { custom, artVersion } = pose;
  const buffers = jellyBuffers ??= createJellyBuffers();
  if (jellySource?.appearance !== appearance || jellySource.gaze !== gaze || jellySource.custom !== custom || jellySource.artVersion !== artVersion) {
    const config = catRenderConfig(appearance);
    const source = buffers.source.ctx;
    source.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
    source.save();
    source.scale(CAT_SIZE / SIZE, CAT_SIZE / SIZE);
    drawCatFront(source, config, false, 0, gaze, { custom, artVersion });
    source.restore();
    const geometry = catBodyInkGeometry(config, false, 0, {}, frontCatLayers(config, false, 0, { artVersion }));
    jellySource = { appearance, gaze, custom, artVersion, sprite: splitJellySprite(source.getImageData(0, 0, CAT_SIZE, CAT_SIZE), geometry.tail?.mask) };
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
    const geometry = ink.scope === 'photo-fur' ? photoHeadFur(config, false, frame, gaze, pose)
      : catHeadInkGeometry(config, false, pose);
    applyCatInk(head.ctx, ink, geometry, headInkParts);
  } else if (legacy) {
    const edits = (tracking ? legacy.following : undefined) ?? legacy.paint;
    const headEdits = edits.idleHead ?? edits.typingHead;
    if (headEdits) copyCatEdits(head.ctx, headEdits);
    if (tracking) {
      head.ctx.globalCompositeOperation = 'source-atop';
      drawCatGlints(head.ctx, config, false, frame, gaze, 1, undefined, pose.artVersion);
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
    const arm = config.furPatches?.length
      ? furPatchedMovingPaws(layers.arms, layers.frontPaws, config, catBodyInkGeometry(config, true, paw.frame, pawPose, layers), pawPose)
      : layers.arms;
    let sprite = peekPawCrop(arm, layers.frontPaws, paw.x);
    if (ink?.parts[paw.part]) {
      const layer = makeLayer(peekPawWidth, peekPawHeight);
      layer.ctx.drawImage(sprite, 0, 0);
      layer.ctx.translate(-paw.x, -peekPawTop);
      const geometry = catBodyInkGeometry(config, true, paw.frame, pawPose, layers);
      applyCatInk(layer.ctx, ink, ink.scope === 'photo-fur' ? photoMovingPawFur(geometry, layers.frontPaws, config) : geometry, [paw.part]);
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
let listeningAppearance = '';
let listeningCustom: CatCustomization | undefined;
let listeningBase: Uint32Array | undefined;
const listeningFrames = new Map<number, {canvas: HTMLCanvasElement; fur: Uint8ClampedArray}>();

const headphonePaintShades = {
  headband: [null, 0x4b79aa, 0x71a0cf, 0xa6c9e6],
  earcups: [0x395d87, 0x4b79aa, 0x719dcf, 0xa0c4e2],
} as const;

function coloredHeadphoneAtlas(part: keyof typeof headphonePaintShades, color: CatConfig['headphoneColor']) {
  const path = catListening.path + part;
  const source = imageFor(path);
  if (color === 'natural') return source;
  const key = `${path}/${color}`;
  const cached = tinted.get(key);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(source.naturalWidth, source.naturalHeight);
  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const replacements = catHeadphoneColors[color].shades.map(hex => Number.parseInt(hex.slice(1), 16));
  const shades: readonly (number | null)[] = headphonePaintShades[part];
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const original = (data[i]! << 16) | (data[i + 1]! << 8) | data[i + 2]!;
    const replacement = replacements[shades.indexOf(original)];
    if (replacement === undefined) continue;
    data[i] = replacement >>> 16;
    data[i + 1] = (replacement >>> 8) & 255;
    data[i + 2] = replacement & 255;
  }
  ctx.putImageData(image, 0, 0);
  tinted.set(key, canvas);
  return canvas;
}

function drawListeningLayer(ctx: CanvasRenderingContext2D, part: keyof typeof catListening.regions, frame: number, config: CatRenderConfig) {
  const path = catListening.path + part;
  const layer = part === 'earcups' || part === 'headband' ? coloredHeadphoneAtlas(part, config.headphoneColor)
    : part === 'closed_eyes' && config.palette === 'CC02' ? coloredCatIris(path, '#201B1E') : imageFor(path);
  drawAtlasRegion(ctx, layer, catListening.regions[part], frame, catListening.columns);
}

const listeningEyePixels = new Map<number, [number[], number[]]>();

function drawPixel80ListeningEyes(ctx: CanvasRenderingContext2D, frame: number, fur: Uint8ClampedArray) {
  const path = catListening.path + 'closed_eyes';
  const source = imageFor(path);
  const {x, y, width, height} = catListening.regions.closed_eyes;
  const sx = frame % catListening.columns * width;
  const sy = Math.floor(frame / catListening.columns) * height;
  const half = width / 2;
  let eyes = listeningEyePixels.get(frame);
  if (!eyes) {
    const {ctx: mask} = makeLayer(width, height);
    mask.drawImage(source, sx, sy, width, height, 0, 0, width, height);
    const {data} = mask.getImageData(0, 0, width, height);
    eyes = [[], []];
    for (let row = 0; row < height; row++) {
      for (let column = 0; column < width; column++) {
        if (data[(row * width + column) * 4 + 3]) {
          eyes[column < half ? 0 : 1].push(((row + y) * CAT_SIZE + column + x) * 4);
        }
      }
    }
    listeningEyePixels.set(frame, eyes);
  }
  for (const [side, pixels] of eyes.entries()) {
    const dark = pixels.filter(i => fur[i + 3] && 3 * fur[i]! + 6 * fur[i + 1]! + fur[i + 2]! < 740).length;
    const layer = dark > pixels.length / 3 ? coloredCatIris(path, '#AA9DA8') : source;
    const offset = side * half;
    ctx.drawImage(layer, sx + offset, sy, half, height, x + offset, y, half, height);
  }
}

function drawCatListening(ctx: CanvasRenderingContext2D, config: CatRenderConfig, frame: number, pose: CatPose) {
  const { custom, earLayout, outlineVersion, markingLayout, tailArtVersion, legacyNoseOutline, artVersion } = pose;
  const basePose = { custom, earLayout, outlineVersion, markingLayout, tailArtVersion, legacyNoseOutline, artVersion };
  const appearance = JSON.stringify([config, earLayout, outlineVersion, markingLayout, tailArtVersion, legacyNoseOutline, artVersion]);
  if (appearance !== listeningAppearance || listeningCustom !== custom) {
    listeningAppearance = appearance;
    listeningCustom = custom;
    listeningBase = undefined;
    listeningFrames.clear();
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
  const pixel80 = pixel80Keys.has(catListening.path + 'closed_eyes');
  let painted = listeningFrames.get(frame);
  if (!painted) {
    const layer = makeLayer(CAT_SIZE);
    const output = layer.ctx.createImageData(CAT_SIZE, CAT_SIZE);
    warpListeningPixels(listeningBase, new Uint32Array(output.data.buffer), frame, pixel80);
    layer.ctx.putImageData(output, 0, 0);
    painted = {canvas: layer.canvas, fur: output.data};
    listeningFrames.set(frame, painted);
  }

  ctx.save();
  ctx.resetTransform();
  drawListeningLayer(ctx, 'notes', frame, config);
  drawListeningLayer(ctx, 'headband', frame, config);
  ctx.drawImage(painted.canvas, 0, 0);
  if (pixel80) drawPixel80ListeningEyes(ctx, frame, painted.fur);
  else drawListeningLayer(ctx, 'closed_eyes', frame, config);
  drawListeningLayer(ctx, 'earcups', frame, config);
  ctx.restore();
}

const fileActionDrawing = new Map<string, HTMLCanvasElement>();
const fileActionInk = new WeakMap<HTMLCanvasElement, CatInkGeometry>();
const fileActionSleeves = new WeakMap<HTMLCanvasElement, CatInkGeometry>();
const sittingSleeves = new WeakMap<CatInkSurface, CatInkBounds>();
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

function coloredFileActionArms(source: HTMLCanvasElement, body: CatLayer, config: CatRenderConfig, outline: OutlineVersion, liHua: LiHuaStyle = false) {
  if (config.palette === 'CC01' && config.coat === 'native' && !usesBodyPattern(config)) return source;
  let palette = fileActionArmColors.get(body);
  if (!palette) {
    palette = { paint: createTypingArmPainter(layerPixels(imageFor(orangePath + 'body')), layerPixels(body)), frames: new WeakMap() };
    fileActionArmColors.set(body, palette);
  }
  let colored = palette.frames.get(source);
  if (!colored) {
    const { canvas, ctx } = makeLayer(CAT_SIZE);
    const raw = layerPixels(source);
    const pixels = palette.paint(liHua ? new ImageData(raw.data.slice(), raw.width, raw.height) : raw);
    if (liHua) {
      for (let i = 0; i < raw.data.length; i += 4) {
        if (isOutline(raw.data, i)) pixels.data.set(liHuaPigments(liHua).ink, i);
      }
    }
    ctx.putImageData(pixels, 0, 0);
    palette.frames.set(source, colored = canvas);
  }
  return liHua ? colored : outlinedCatLayer(colored, source, config, outline);
}

function fileActionPartGeometry(source: HTMLCanvasElement) {
  const cached = fileActionInk.get(source);
  if (cached) return cached;
  const mask = catLayerAlpha(source);
  const geometry = {
    leftPaw: fittedInkSurface(mask.map((pixel, index) => index % CAT_SIZE < 150 ? pixel : 0)),
    rightPaw: fittedInkSurface(mask.map((pixel, index) => index % CAT_SIZE >= 150 ? pixel : 0)),
  };
  fileActionInk.set(source, geometry);
  return geometry;
}

function fileActionSleeveGeometry(source: HTMLCanvasElement, paws: CatInkGeometry, raised: boolean) {
  const cached = fileActionSleeves.get(source);
  if (cached) return cached;
  const arms = fileActionPartGeometry(source);
  const geometry: CatInkGeometry = {};
  for (const [, side] of patchLimbParts) {
    const arm = arms[side], paw = paws[side]?.bounds;
    if (!arm) continue;
    const { x, y, width, height } = arm.bounds;
    // The overlap between the two cels is hidden by the paw. Project the
    // sleeve up to that joint, measuring from the shoulder in either pose.
    const joint = paw && (raised ? paw.y + paw.height * 0.75 : paw.y + paw.height * 0.25);
    const shoulder = raised ? y + height : y;
    const reach = Math.max(4, joint === undefined ? height : raised ? shoulder - joint : joint - shoulder);
    geometry[side] = { mask: arm.mask, bounds: { x, y: raised ? shoulder - reach : shoulder, width, height: reach } };
  }
  fileActionSleeves.set(source, geometry);
  return geometry;
}

function furPatchedFileActionArms(
  source: CatLayer, guide: HTMLCanvasElement, config: CatRenderConfig, paws: CatInkGeometry, pose: CatPose, raised: boolean,
) {
  const idle = catBodyInkGeometry(config, false, 0, pose, frontCatLayers(config, false, 0, pose));
  const sleeves = fileActionSleeveGeometry(guide, paws, raised);
  const pixels = outlineGuidePixels(guide);
  return furPatchedLayer(source, ...patchLimbParts.flatMap(([limb, side]): FurPatchPaint[] => {
    const surface = sleeves[side], base = idle[side];
    const patches = forelegFurPatches(config.furPatches, limb);
    if (!surface || !base || !patches.length) return [];
    let sleeve = sittingSleeves.get(base);
    if (!sleeve) {
      const { x, y, width } = base.bounds;
      sleeve = { x, y: 201, width, height: y - 201 };
      sittingSleeves.set(base, sleeve);
    }
    return [{ patches, guide: pixels, surface, idle: sleeve, reverseY: raised }];
  }));
}

function drawCatFileAction(ctx: CanvasRenderingContext2D, config: CatRenderConfig, { kind, frame }: CatFileActionPose, pose: CatPose) {
  const asset = catFileActions[kind];
  const closed = asset.closedFrames.includes(frame);
  const appearance = closed ? { ...config, mouth: 'CN08' as const } : config;
  const frontPaws = fileActionCel(kind, 'paws', frame);
  const rawArms = fileActionCel(kind, 'arms', frame);
  const ink = pose.custom?.ink;
  const hasPawPatches = hasMovingFurPatches(config);
  const geometry = ink?.parts.leftPaw || ink?.parts.rightPaw || hasPawPatches
    ? fileActionPartGeometry(frontPaws) : undefined;
  // Remove the resting projection of a lifted limb so the same patch
  // doesn't show twice along the sides of the prop.
  const liftedPaws = geometry && (hasPawPatches || ink?.scope === 'photo-fur') ? patchLimbParts.flatMap(([, side]) =>
    geometry[side] || fileActionPartGeometry(rawArms)[side] ? [side] : []) : [];
  drawCatFront(ctx, appearance, false, 0, noGaze, pose, closed, liftedPaws);

  const outline = pose.outlineVersion ?? 'adaptive';
  const path = config.palette === 'CC01' ? orangePath : breedPath(config.palette);
  const liHua: LiHuaStyle = usesRedesignedLiHua(config, pose.artVersion)
    && (hasSampledLiHua(pose.artVersion) ? 'reference' : true);
  const body = liHua ? frontCatLayers(config, false, 0, { ...pose, staticPaws: true }).bodyBase
    : frontBodyLayer(path, 'body', config, undefined, outline, orangeBodyRetouch(config, pose));
  const paws = coloredFrontPaws(frontPaws, body, config, outline, liHua);
  const arms = coloredFileActionArms(rawArms, body, config, outline, liHua);
  const raised = kind === 'shredder';
  const propsPath = asset.path + 'props';
  const coarseProps = pixel80Keys.has(propsPath);
  const props = imageFor(propsPath);
  ctx.save();
  ctx.resetTransform();
  if (closed) {
    if (coarseProps) drawPixel80ListeningEyes(ctx, 0, ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE).data);
    else drawListeningLayer(ctx, 'closed_eyes', 0, config);
  }
  ctx.drawImage(geometry && hasPawPatches ? furPatchedFileActionArms(arms, rawArms, config, geometry, pose, raised) : arms, 0, 0);
  drawAtlasRegion(ctx, props, asset.regions.props, frame, asset.columns);
  if (geometry) {
    const { canvas, ctx: pawLayer } = makeLayer(CAT_SIZE);
    pawLayer.drawImage(hasPawPatches ? furPatchedMovingPaws(paws, frontPaws, config, geometry, pose, raised) : paws, 0, 0);
    if (ink) {
      const paint = ink.scope === 'photo-fur' ? photoMovingPawFur(geometry, frontPaws, config) : geometry;
      applyCatInk(pawLayer, ink, paint, ['leftPaw', 'rightPaw']);
    }
    ctx.drawImage(canvas, 0, 0);
  } else {
    ctx.drawImage(paws, 0, 0);
  }
  const inFront = kind === 'shredder' || (kind === 'zip' && frame >= 3 && frame <= 10)
    || (kind === 'convert' && ((frame >= 2 && frame <= 6) || frame === 14));
  if (coarseProps && inFront) {
    // Paws overlap the sheet, while the near edge of the prop conceals
    // their lowest pixels as they press down, including custom paw ink.
    ctx.beginPath();
    if (kind === 'shredder') ctx.rect(84, 208, 132, 52);
    else if (kind === 'zip') ctx.rect(84, 240, 136, 16);
    else ctx.rect(84, 220, 136, 20);
    ctx.clip();
    drawAtlasRegion(ctx, props, asset.regions.props, frame, asset.columns);
  }
  ctx.restore();
}

export function render(canvas: HTMLCanvasElement, config: PetConfig, action: Action = 'sit', frame = 0, gaze: Gaze = noGaze, catPose: CatPose = {}) {
  const artVersion = catPose.artVersion ?? catArtVersionForCustomization(catPose.custom);
  catPose = { ...catPose, artVersion };
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
    } else if (config.frame === 'CAT' && action === 'sit' && catPetLovePose(catPose.petLoveFrame)) {
      drawCatFront(ctx, catRenderConfig(config, catPose.furPatternColors), false, 0, gaze, { ...catPose, stretch: undefined });
    } else if (config.frame === 'CAT' && action === 'sit' && catPose.fileAction) {
      drawCatFileAction(ctx, catRenderConfig(config, catPose.furPatternColors), catPose.fileAction, catPose);
    } else if (config.frame === 'CAT' && action === 'sit' && catPose.jelly) {
      ctx.resetTransform();
      drawJellyCat(ctx, config, gaze, catPose.jelly, catPose);
    } else if (config.frame === 'CAT' && action === 'sit' && catPose.listeningFrame !== undefined) {
      drawCatListening(ctx, catRenderConfig(config, catPose.furPatternColors), catPose.listeningFrame, catPose);
    } else if (config.frame === 'CAT') {
      const faceEdges = action === 'sit' && hasB3FaceEdges(artVersion);
      const staticPaws = action === 'sit' && !catPose.stretch;
      // Keep the previous face during drag stretch. The new nose is resting artwork.
      const frontArtVersion = catPose.stretch && hasNarrowNose(artVersion) ? 'pixel80-v6' : artVersion;
      drawCatFront(ctx, catRenderConfig(config, catPose.furPatternColors), action === 'typing', pose, gaze,
        { ...catPose, artVersion: frontArtVersion, faceEdges, staticPaws });
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

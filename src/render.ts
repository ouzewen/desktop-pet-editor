/// <reference types="vite/client" />

import { catPhotoPartFor } from './cat-photo-parts';
import type { CatPhotoEarPigment } from './cat-photo-request';

import { blackCatCoat, canChooseCatFaceBase, catEarOnSide, catCoatCards, catFeatureColors, catHeadphoneColors, catIrisColors, catKeepsBreedPigment, catPupilStyle, catPresets, catRenderConfig, readPetConfig, supportsCalicoFaceFinish, currentFurPatternColors, hasHoneyGoldFur, hasIndependentFur, hasShortCalicoChest, usesWhiteCatCoat,
  type CatConfig, type CatEar, type CatPupilStyle, type CatRenderConfig, type FurPatternColors, type PetConfig } from './cat';
import { connectedNeckFur, forelegFurPatches, furPatchColorAt, furPatchesFor, paintFurPatches, sittingForelegAt, sittingPawAt, type FurPatch, type FurPatchPart } from './cat-fur-patches';
import type { CatCustomization, CatPixelEdits } from './cat-custom';
import { applyCatInk, projectCatInk, type CatInkBounds, type CatInkGeometry, type CatInkSurface } from './cat-ink';
import type { CatFileAction, CatFileActionPose } from './cat-file-action';
import { listeningCell, warpListeningPixels } from './cat-listening';
import { catPetLovePose, drawPetLoveTail, petLoveClear, petLoveGrid, protectPetLoveTailOpenings, warpPetLove } from './cat-pet-love';
import { splitJellySprite, warpJellySprite, warpStretchSprite, type JellyPose } from './cat-jelly';
import { standingEarPlan } from './cat-standing-ear-plan';
import { isEarLiningPixel, paintBreedEars, paintInnerEarColor } from './cat-ears';
import { coatPart, paintRecipeCoat, type CatCoatRecipeId, type RecipeCoat } from './cat-coat-recipe';
import { recolorCatCoat, recolorPhotoInkBlack, type CatCoatSurface } from './cat-coat';
import { isLaptopFur, paintBodyPattern, usesBodyPattern, usesNativeBodyStripes } from './cat-body-pattern';
import { chinCoat, paintCatChin } from './cat-chin';
import { hasNativeFrontGloves, paintFrontGloves } from './cat-front-glove';
import { paintCatTail } from './cat-tail';
import { chestFringeSamples, clearForeheadFur, paintForeheadFur, paintGoldenTipping, paintHeadFur, paintHoneyGoldFur, paintSolidFace } from './cat-head-pattern';
import { catTypingFrameCountFor, currentTypingAnimation, frenzyRedFrame, frenzySteamLoopStart, isFrontTyping, lowTypingArms, usesFallingTyping, type TypingAnimation } from './cat-typing';
import { recolorCalicoBody, recolorCalicoBodyPaws, calicoBodyPalette } from './cat-calico-body';
import { createTypingArmPainter, recolorFrontPaws, thickenPeekPawOutline } from './cat-typing-paint';
import { clearForeheadOutlineSpots, isOutline, pixel80CatOutline, pixel80WarmOutline, recolorCatOutline, type OutlineVersion } from './cat-outline';
import { paintFrontPawSoles, paintGoldenCheekSeam, paintRearPawSpurs, paintRestingOutline, restingOutlinePainter } from './cat-resting-outline';
export type { OutlineVersion } from './cat-outline';
import { liHuaFur, liHuaPigments, liHuaReferenceFur, toneLiHuaFur, type LiHuaStyle } from './cat-li-hua';
import { irisColors, palettes, type Config } from './model';

import {
  calicoBodyIndex, approvedRestingCatIds, approvedRestingCatPath, standingEarPath, siameseCleanBodyPath, catComponentRecipePath, catChestWhitePath, catForeheadLockPath, assetFiles, assetsFor, atlasNoseTips, catPhotoEarSides, catPhotoPartPath, catPhotoParts, CAT_SIZE, PET_SIZE, dogArt as art, furSlots, irisPath, maskPath, runBodies,
  sharedTabbyCheekPath, orangeForeheadPatch, liHuaCrownTone, goldenFlankTone, goldenChinTone,
  catHoodieLayers, catHoodiePath, vanGoghHat, vanGoghHatParts, vanGoghJacket, vanGoghJacketLayers, vanGoghJacketPath,
  bodyPatternPath, calicoBodyOutlinePath, calicoCrownPath, calicoCrownContinuityPath, calicoFaceFinishPath, catEarRetouchPath, breedArt, breedBodyOutlinePath, breedEyeGlints, breedLaptop, breedPath, catCalicoLayers, catBreedDetailsPath, catBreedDetailPresets, catFaceEdgesPath, catHeadCleanupPath, catPixelAccessoryPath, isPixelCatAccessory, isForegroundCatHat, catHatEarStowPath, catFileActions, catFrontEars, catListening, catPetLove, honeyGoldPath, liHuaCoatPath, liHuaLibTVCoatPath, liHuaReferenceCheekAsset, liHuaSampledPath, liHuaFrenzyFurAsset, restingSmilePath, reviewedRestingSmilePath, frontPawSoleGuide, frontPawSolesPath, combinedRestingCatPath, updatedRestingCatPath, orangeStripeRestingAsset, frontGloveGuide, chinShadeMask, diluteEarMarkPatch, diluteEarMarkStock, sharedRestingOutlinePath,
  catFurSlots, catMarkings, catMouthPath, historicalConvexMouthPath, historicalConvexLiHuaBacking, catNosePath, centeredNosePath, centeredNoseTips, catWalkBodies, catWalkFrames, earMaskPath, facePartsPath, faceTiles,
  foreheadParts, frontTyping, frontTypingEffects, frontTypingEffectsPath, headPatternPath, legacyMouthIds, legacyNoseOutlinePath, mouthSkinColumns, mouthSkinPath, mouthStems,
  orangeBodyOutlinePath, orangeForelegBodyPath, orangePath, orangePawsBodyPath, orangeSquareGlints, sharedMouthStyles, sharedNoseStyles,
  initialTailPath, referenceTailPath, sharedBreedParts, sharedTailStyles, tailPath, typingAtlases, typingEffectPath, typingGeometryPart, typingInkPatches, typingReferencePath,
  walkEyeGlints, catAccessoryOriginalSide, type CatAccessorySide, type CatPhotoEarSide, type LegacyFrontBreed,
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
// The two independent candidates forked from v22. v28 belongs to the
// unmerged orange forehead artwork.
const coatSmileArtVersion = 'pixel80-v23';
const rearPawArtVersion = 'pixel80-v24';
const standingEarArtVersion = 'pixel80-v25';
const frontPawArtVersion = 'pixel80-v26';
const diluteEarMarkArtVersion = 'pixel80-v27';
const combinedRestingArtVersion = 'pixel80-v29';
const refinedRestingArtVersion = 'pixel80-v30';
const orangeStripeArtVersion = 'pixel80-v31';
const alignedTypingArtVersion = 'pixel80-v32';
const frontGloveArtVersion = 'pixel80-v33';
const sharedCheekArtVersion = 'pixel80-v34';
const orangeForeheadArtVersion = 'pixel80-v35';
const liHuaCrownArtVersion = 'pixel80-v36';
const goldenFlankArtVersion = 'pixel80-v37';
const goldenChinArtVersion = 'pixel80-v38';
export const build84CatArtVersion = 'pixel80-v39';
export const componentCatArtVersion = 'pixel80-v40';
export const coatRecipeArtVersion = 'pixel80-v41';
const whiteChestArtVersion = 'pixel80-v42';
const independentEarArtVersion = 'pixel80-v43';
const centeredNoseArtVersion = 'pixel80-v44';
const historicalConvexMouthArtVersion = 'pixel80-v45';
// v42–v45 are independent earlier candidates; v46 combines their features.
const combinedFeatureArtVersion = 'pixel80-v46';
const siameseCleanBodyArtVersion = 'pixel80-v47';
const continuousHeadFurArtVersion = 'pixel80-v48';
export const currentCatArtVersion = continuousHeadFurArtVersion;
export const catArtVersions = ['pixel80', 'pixel80-v2', 'pixel80-v3', 'pixel80-v4', 'pixel80-v5', 'pixel80-v6', 'pixel80-v7', 'pixel80-v8', 'pixel80-v9', 'pixel80-v10', 'pixel80-v11', 'pixel80-v12', 'pixel80-v13', 'pixel80-v14', 'pixel80-v15', 'pixel80-v16', 'pixel80-v17', 'pixel80-v18', 'pixel80-v19', 'pixel80-v20', 'pixel80-v21', 'pixel80-v22', coatSmileArtVersion, rearPawArtVersion, standingEarArtVersion, frontPawArtVersion, diluteEarMarkArtVersion, combinedRestingArtVersion, refinedRestingArtVersion, orangeStripeArtVersion, alignedTypingArtVersion, frontGloveArtVersion, sharedCheekArtVersion, orangeForeheadArtVersion, liHuaCrownArtVersion, goldenFlankArtVersion, goldenChinArtVersion, build84CatArtVersion, componentCatArtVersion, coatRecipeArtVersion, whiteChestArtVersion, independentEarArtVersion, centeredNoseArtVersion, historicalConvexMouthArtVersion, combinedFeatureArtVersion, siameseCleanBodyArtVersion, currentCatArtVersion] as const;
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
  'pixel80-v21': { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
  'pixel80-v22': { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
  [coatSmileArtVersion]: { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
  [rearPawArtVersion]: { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
  [standingEarArtVersion]: { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
  [frontPawArtVersion]: { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
  [diluteEarMarkArtVersion]: { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
  [combinedRestingArtVersion]: { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
  [refinedRestingArtVersion]: { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
  [orangeStripeArtVersion]: { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
  [alignedTypingArtVersion]: { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
  [frontGloveArtVersion]: { head: liHuaSampledPath + 'head', body: liHuaSampledPath + 'body' },
} as const;
// v34–v38 were independent candidate bases. Only v39 combines their art.
const candidateArtVersions = [sharedCheekArtVersion, orangeForeheadArtVersion, liHuaCrownArtVersion, goldenFlankArtVersion, goldenChinArtVersion] as const;
type CandidateArtVersion = typeof candidateArtVersions[number];
const hasArtRevision = (version: CatArtVersion | undefined, revision: CandidateArtVersion) =>
  version === revision || version === build84CatArtVersion || version === componentCatArtVersion || hasCuratedCoatRecipes(version);
const hasFrontGloves = (version?: CatArtVersion) =>
  version === frontGloveArtVersion || candidateArtVersions.some(revision => hasArtRevision(version, revision));
const hasRestoredOrangeBody = (version?: CatArtVersion) =>
  version === orangeStripeArtVersion || version === alignedTypingArtVersion || hasFrontGloves(version);
const hasRefinedResting = (version?: CatArtVersion) =>
  version === refinedRestingArtVersion || hasRestoredOrangeBody(version);
const hasCoatSmile = (version?: CatArtVersion) =>
  version === coatSmileArtVersion || version === combinedRestingArtVersion || hasRefinedResting(version);
const hasCleanRearPawSpurs = (version?: CatArtVersion) =>
  version === rearPawArtVersion || version === combinedRestingArtVersion || hasRefinedResting(version);
const hasDiluteEarMark = (version?: CatArtVersion) =>
  version === diluteEarMarkArtVersion || version === combinedRestingArtVersion || hasRefinedResting(version);
const hasThinFrontPawSoles = (version?: CatArtVersion) =>
  version === frontPawArtVersion || hasDiluteEarMark(version);
const hasSharedRestingOutline = (version?: CatArtVersion) =>
  version === 'pixel80-v22' || version === standingEarArtVersion || hasThinFrontPawSoles(version)
  || hasCoatSmile(version) || hasCleanRearPawSpurs(version);
const hasUnifiedBreedBody = (version?: CatArtVersion) =>
  version === 'pixel80-v21' || hasSharedRestingOutline(version);
const hasTypingRestingNose = (version?: CatArtVersion) =>
  version === 'pixel80-v20' || hasUnifiedBreedBody(version);
const hasFrenzyFur = (version?: CatArtVersion) => version === 'pixel80-v19' || hasTypingRestingNose(version);
const hasReviewedRestingSmile = (version?: CatArtVersion) => version === 'pixel80-v18' || hasFrenzyFur(version);
const hasSampledLiHua = (version?: CatArtVersion) =>
  version === 'pixel80-v16' || version === 'pixel80-v17' || hasReviewedRestingSmile(version);
const hasExtendedRestingSmile = (version?: CatArtVersion) =>
  (version === 'pixel80-v17' || hasReviewedRestingSmile(version)) && pixel80Keys.has(restingSmilePath);
function liHuaAssets(version?: CatArtVersion) {
  if (hasFrontGloves(version)) return liHuaCoatAssets[frontGloveArtVersion];
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
  approvedStockIdle?: boolean;
  faceEdges?: boolean;
  legacyConvexMouth?: boolean;
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
  ctx.drawImage(imageFor(part), 0, 0, CAT_SIZE, CAT_SIZE);
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

const clothingFrames = new Map<string, HTMLCanvasElement>();
const clothingPawLifts = new WeakMap<HTMLCanvasElement, readonly [number, number]>();

function typingSleeveLifts(paws: HTMLCanvasElement | undefined): readonly [number, number] {
  if (!paws) return [0, 0];
  const cached = clothingPawLifts.get(paws);
  if (cached) return cached;
  const alpha = catLayerAlpha(paws);
  const center = 38 * 4;
  const lift = (left: number, right: number) => {
    // Only fingers rising above the laptop's standing paw line tug a cuff.
    for (let row = frontTyping.region.y; row < 44 * 4; row += 4) {
      for (let x = left; x < right; x += 4) {
        if (alpha[(row + 2) * CAT_SIZE + x + 2]) return Math.min(2, 44 - row / 4);
      }
    }
    return 0;
  };
  const result = [lift(0, center), lift(center, CAT_SIZE)] as const;
  clothingPawLifts.set(paws, result);
  return result;
}

function clothingFrame(clothing: NonNullable<CatConfig['clothing']>, paws?: HTMLCanvasElement) {
  const jacket = clothing === vanGoghJacket;
  const parts = jacket ? vanGoghJacketLayers : catHoodieLayers;
  const path = jacket ? vanGoghJacketPath : catHoodiePath;
  const [left, right] = typingSleeveLifts(paws);
  const key = clothing + '/' + left + '/' + right;
  const cached = clothingFrames.get(key);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  for (const part of parts) {
    const image = imageFor(path + part);
    const lift = part === 'left-sleeve' ? left : part === 'right-sleeve' ? right : 0;
    if (lift === 0) {
      ctx.drawImage(image, 0, 0, CAT_SIZE, CAT_SIZE);
      continue;
    }
    // Anchor each garment at its authored shoulder. Re-sample single rows so
    // compression towards the lifted paw stays on the authored pixel grid.
    const shoulder = jacket ? 44 : 47;
    const span = 63 - shoulder;
    for (let row = 0; row < span - lift; row++) {
      const source = shoulder + Math.round(row * (span - 1) / (span - lift - 1));
      ctx.drawImage(image, 0, source, 80, 1, 0, (shoulder + row) * 4, CAT_SIZE, 4);
    }
  }
  clothingFrames.set(key, canvas);
  return canvas;
}

function drawCatClothing(ctx: CanvasRenderingContext2D, clothing: CatConfig['clothing'], pose: CatPose, paws?: HTMLCanvasElement) {
  if (!clothing) return;
  const frame = clothingFrame(clothing, paws);
  const ink = pose.custom?.ink;
  if (ink?.parts.clothing) {
    const { canvas, ctx: edited } = makeLayer(CAT_SIZE);
    edited.drawImage(frame, 0, 0);
    applyCatInk(edited, ink, { clothing: clothingInkSurface(frame) }, ['clothing']);
    ctx.drawImage(canvas, 0, 0);
  } else {
    ctx.drawImage(frame, 0, 0);
  }
}

const clothingInkSurfaces = new WeakMap<CatLayer, CatInkSurface>();
function clothingInkSurface(frame: HTMLCanvasElement): CatInkSurface {
  let surface = clothingInkSurfaces.get(frame);
  if (!surface) {
    surface = { bounds: inkBounds, mask: catLayerAlpha(frame) };
    clothingInkSurfaces.set(frame, surface);
  }
  return surface;
}

function withoutCatClothing<T extends Pick<CatConfig, 'clothing'>>(appearance: T): T {
  if (appearance.clothing === undefined) return appearance;
  const bare = { ...appearance };
  delete bare.clothing;
  return bare;
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

function selectedTailConfig(config: CatRenderConfig) {
  const tailCoats = { dark: { palette: 'CC02', coat: 'jetBlack' }, orange: { palette: 'CC01', coat: 'native' },
    gray: { palette: 'CC05', coat: 'native' } } as const;
  return config.coloredTail ? { ...config, ...tailCoats[config.coloredTail] } : config;
}

function bodyWithSelectedTail(body: CatLayer, config: CatRenderConfig, typing: boolean, layout: TypingLayout | undefined,
  outlineVersion: OutlineVersion, version: TailArtVersion,
  separateTail = false, liHua: LiHuaStyle = false,
) {
  if (config.tail === 'CT01') return body;
  const tailConfig = selectedTailConfig(config);
  const key = `${catPatternCacheKey(config)}/${config.tail}/${config.tailPattern}/${typing}/${layout}/${outlineVersion}/${version}/${config.coloredTail}/${separateTail}/${liHua}`;
  const cached = tailBodyLayers.get(body);
  if (cached?.key === key) return cached.canvas;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(body, 0, 0);
  if (!separateTail) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(tailRemoval(typing, layout), 0, 0);
  }
  ctx.globalCompositeOperation = 'destination-over';
  ctx.drawImage(selectedTail(tailConfig, typing, layout, outlineVersion, version, liHua), 0, 0, CAT_SIZE, CAT_SIZE);
  tailBodyLayers.set(body, { key, canvas });
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

function hasIndependentCrown(config: Pick<CatConfig, 'ear' | 'leftEar' | 'rightEar'>, version?: CatArtVersion) {
  return usesArtFeature(version, independentEarArtVersion) && pixel80Keys.has(catForeheadLockPath + approvedRestingCatIds[0])
    && standingEarSides.some(side => catEarOnSide(config, side) !== 'CE01');
}

const earReplacementMasks = new Map<string, Uint8Array>();
function earReplacementMask(ear: CatEar, side: CatPhotoEarSide) {
  const key = ear + '/' + side;
  const saved = earReplacementMasks.get(key);
  if (saved) return saved;
  const owner = earOwnership(ear);
  const pixels = layerPixels(stockEar(ear, true)).data;
  const channel = side === 'left' ? 0 : 1;
  const mask = new Uint8Array(CAT_SIZE * CAT_SIZE);
  for (let i = 0; i < mask.length; i++) {
    const offset = i * 4;
    mask[i] = owner[offset + 3] && owner[offset + channel] === 255 && pixels[offset + 3] ? 1 : 0;
  }
  earReplacementMasks.set(key, mask);
  return mask;
}

function withUprightEars<T extends CatConfig | CatRenderConfig>(config: T): T {
  const {leftEar: _left, rightEar: _right, ...rest} = config;
  return { ...rest, ear: 'CE01' } as T;
}

type CatAccessories = Pick<CatConfig, 'accessory' | 'accessorySide' | 'eyeAccessory' | 'eyeAccessorySide'>;

function wearsEarStowingHat(look: CatAccessories) {
  return catHatEarStowPath(look.accessory) !== undefined;
}

function coveredEye(look: CatAccessories): CatAccessorySide | undefined {
  if (look.eyeAccessory === 'A11') return look.eyeAccessorySide ?? catAccessoryOriginalSide(look.eyeAccessory);
}

function catAccessoryKey(look: CatAccessories) {
  return `${look.accessory}/${look.accessorySide ?? ''}/${look.eyeAccessory}/${look.eyeAccessorySide ?? ''}`;
}

function drawAccessorySide(ctx: CanvasRenderingContext2D, image: CatLayer, mirrored: boolean) {
  ctx.save();
  if (mirrored) {
    // The cat is centered on the boundary after column 37 of the 80px cel.
    ctx.translate(CAT_SIZE * 76 / 80, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(image, 0, 0, CAT_SIZE, CAT_SIZE);
  ctx.restore();
}

const composedCatAccessories = new Map<string, HTMLCanvasElement>();

function catAccessoryLayer(look: CatAccessories) {
  const { accessory, accessorySide, eyeAccessory, eyeAccessorySide } = look;
  const pixelHeadwear = isPixelCatAccessory(accessory);
  const eyeWear = eyeAccessory !== 'A00';
  const originalHeadSide = catAccessoryOriginalSide(accessory);
  const mirrorHead = Boolean(originalHeadSide && accessorySide && accessorySide !== originalHeadSide);
  const hat = pixelHeadwear && accessory !== vanGoghHat ? imageFor(catPixelAccessoryPath + accessory)
    : !pixelHeadwear && accessory !== 'A00' ? imageFor(`${orangePath}accessory_${accessory === 'A07' ? 'A06' : accessory}`) : undefined;
  if (!pixelHeadwear && !eyeWear && !mirrorHead) return hat;

  const key = catAccessoryKey(look);
  const saved = composedCatAccessories.get(key);
  if (saved) return saved;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  if (eyeWear) {
    const originalEyeSide = catAccessoryOriginalSide(eyeAccessory);
    drawAccessorySide(ctx, imageFor(catPixelAccessoryPath + eyeAccessory),
      Boolean(originalEyeSide && eyeAccessorySide && eyeAccessorySide !== originalEyeSide));
  }
  if (accessory === vanGoghHat) {
    for (const part of vanGoghHatParts) drawAccessorySide(ctx, imageFor(catPixelAccessoryPath + vanGoghHat + '-' + part), false);
  } else if (hat) drawAccessorySide(ctx, hat, mirrorHead);
  composedCatAccessories.set(key, canvas);
  return canvas;
}

function glassesLayer(look: CatAccessories) {
  if (look.eyeAccessory === 'A00' || coveredEye(look)) return;
  return catAccessoryLayer({ accessory: 'A00', eyeAccessory: look.eyeAccessory });
}

const earStowMasks = new Map<string, HTMLCanvasElement>();

function hatEarStow(look: CatAccessories) {
  const path = catHatEarStowPath(look.accessory);
  if (!path) return;
  let mask = earStowMasks.get(path);
  if (!mask) {
    const { canvas, ctx } = makeLayer(CAT_SIZE);
    ctx.drawImage(imageFor(path), 0, 0, CAT_SIZE, CAT_SIZE);
    earStowMasks.set(path, mask = canvas);
  }
  return mask;
}

function stowEarsUnderHat(ctx: CanvasRenderingContext2D, look: CatAccessories) {
  const mask = hatEarStow(look);
  if (!mask) return;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(mask, 0, 0);
  ctx.restore();
}

// The hat stays in front of action overlays, such as closed eyes and eyewear.
function foregroundHatLayer(look: CatAccessories) {
  return isForegroundCatHat(look.accessory)
    ? catAccessoryLayer({ accessory: look.accessory, eyeAccessory: 'A00' }) : undefined;
}

function drawBehindForegroundHat(ctx: CanvasRenderingContext2D, hat: CatLayer | undefined,
  draw: (target: CanvasRenderingContext2D) => void) {
  if (!hat) return draw(ctx);
  const { canvas, ctx: foreground } = makeLayer(CAT_SIZE);
  draw(foreground);
  foreground.globalCompositeOperation = 'destination-out';
  foreground.drawImage(hat, 0, 0);
  ctx.drawImage(canvas, 0, 0);
}

function earEditsFor(config: Pick<CatConfig, 'ear' | 'leftEar' | 'rightEar'>) {
  return standingEarSides.flatMap(side => {
    const selected = catEarOnSide(config, side);
    return selected === 'CE01' ? [] : [{side, removed: earReplacementMask('CE01', side), added: earReplacementMask(selected, side)}];
  });
}

const independentCrowns = new WeakMap<CatLayer, WeakMap<CatLayer, CatLayer>>();
function withIndependentCrown(upright: CatLayer, mixed: CatLayer, config: CatRenderConfig) {
  let variants = independentCrowns.get(upright);
  if (!variants) independentCrowns.set(upright, variants = new WeakMap());
  const saved = variants.get(mixed);
  if (saved) return saved;
  const patches = earEditsFor(config);
  const forehead = foreheadParts.includes(config.pattern) ? readBodyPixels(headPatternPath + `forehead_${config.pattern}`) : undefined;
  const {canvas,ctx} = makeLayer(CAT_SIZE);
  ctx.drawImage(upright, 0, 0);
  const image = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
  const after = layerPixels(mixed).data;
  for (let i = 0; i < image.data.length; i += 4) {
    const cell = i / 4;
    if (!patches.some(patch => patch.removed[cell] || patch.added[cell])) continue;
    if (forehead?.[i + 3] && image.data[i + 3]) continue;
    image.data.set(after.subarray(i, i + 4), i);
  }
  ctx.putImageData(image, 0, 0);
  variants.set(mixed, canvas);
  return canvas;
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

const standingEarStock: Readonly<Record<string, CatConfig>> = catPresets;
const standingEarPresets = new Map(approvedRestingCatIds.map(id => {
  const look = catRenderConfig(standingEarStock[`preset_cat_${id}`]);
  return [look.palette + '/' + look.coat, id] as const;
}));
const standingEarTemplate = {
  CC01: 'orange', CC02: 'black', CC03: 'calico', CC04: 'siamese',
  CC05: 'british_blue', CC06: 'american_shorthair', CC07: 'li_hua', CC08: 'ragdoll',
} as const;
const standingEarSides = ['left', 'right'] as const;
const standingEarLayers = new WeakMap<CatLayer, { key: string; canvas: HTMLCanvasElement }>();
const standingEarMasks = new Map<string, Uint8ClampedArray>();
const standingEarSwatches = new Map<string, readonly number[]>();
const componentStockColors = new Map<string, Uint8ClampedArray>();

function usesArtFeature(version: CatArtVersion | undefined, feature: CatArtVersion) {
  return version === feature || version === combinedFeatureArtVersion || version === siameseCleanBodyArtVersion || version === currentCatArtVersion;
}

export function hasCuratedCoatRecipes(version?: CatArtVersion) {
  return version === coatRecipeArtVersion || version === whiteChestArtVersion || version === independentEarArtVersion || version === centeredNoseArtVersion || usesArtFeature(version, historicalConvexMouthArtVersion);
}

function componentRecipeArt(version?: CatArtVersion) {
  return (version === componentCatArtVersion || hasCuratedCoatRecipes(version))
    && pixel80Keys.has(catComponentRecipePath + 'CE01-left-mask');
}

const whiteChestLayers = new WeakMap<CatLayer, { id: string; canvas: HTMLCanvasElement }>();
function withWhiteChest(source: CatLayer, id: string | undefined, version?: CatArtVersion) {
  if (!usesArtFeature(version, whiteChestArtVersion) || !id || !pixel80Keys.has(catChestWhitePath + id)) return source;
  const cached = whiteChestLayers.get(source);
  if (cached?.id === id) return cached.canvas;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0, CAT_SIZE, CAT_SIZE);
  ctx.drawImage(imageFor(catChestWhitePath + id), 0, 0, CAT_SIZE, CAT_SIZE);
  // At the seam, keep any independent silhouette supplied by the selected parts.
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(source, 0, 0, CAT_SIZE, CAT_SIZE);
  whiteChestLayers.set(source, { id, canvas });
  return canvas;
}

const siameseCleanBodyLayers = new WeakMap<CatLayer, Map<string, CatLayer>>();
const siameseCleanBodyCoats = new Map<string, CatLayer>();

function withSiameseCleanBody(source: CatLayer, coat: 'native' | 'siameseWarm' | 'siameseCool', version?: CatArtVersion) {
  if ((version !== siameseCleanBodyArtVersion && version !== continuousHeadFurArtVersion)
    || !pixel80Keys.has(siameseCleanBodyPath)) return source;
  let versions = siameseCleanBodyLayers.get(source);
  if (!versions) siameseCleanBodyLayers.set(source, versions = new Map());
  const cached = versions.get(coat);
  if (cached) return cached;
  const asset = imageFor(siameseCleanBodyPath);
  let patch: CatLayer = asset;
  if (coat !== 'native') {
    let colored = siameseCleanBodyCoats.get(coat);
    if (!colored) {
      const pixels = restingOutlinePixels(asset);
      paintRecipeCoat(pixels, undefined, 'siamese', coat);
      const tile = makeLayer(80);
      tile.ctx.putImageData(pixels, 0, 0);
      siameseCleanBodyCoats.set(coat, colored = tile.canvas);
    }
    patch = colored;
  }
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0, CAT_SIZE, CAT_SIZE);
  ctx.drawImage(patch, 0, 0, CAT_SIZE, CAT_SIZE);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(source, 0, 0, CAT_SIZE, CAT_SIZE);
  versions.set(coat, canvas);
  return canvas;
}

function componentRecipeStock(id: string, version?: CatArtVersion) {
  const source = withWhiteChest(imageFor(catComponentRecipePath + id + '-stock'), id, version);
  return id === 'siamese' ? withSiameseCleanBody(source, 'native', version) : source;
}

function standingEarMask(side: CatPhotoEarSide, recipe: boolean) {
  const key = (recipe ? catComponentRecipePath : standingEarPath) + 'CE01-' + side + '-mask';
  const cached = standingEarMasks.get(key);
  if (cached) return cached;
  const { ctx } = makeLayer(80);
  ctx.drawImage(imageFor(key), 0, 0);
  // Alpha means lining; red identifies its main and shadow tones.
  const mask = ctx.getImageData(0, 0, 80, 80).data;
  standingEarMasks.set(key, mask);
  return mask;
}

function standingEarRecipeSwatches(id: string) {
  const cached = standingEarSwatches.get(id);
  if (cached) return cached;
  const { ctx } = makeLayer(4);
  ctx.drawImage(imageFor(catComponentRecipePath + id + '-ear-swatches'), 0, 0);
  const pixels = ctx.getImageData(0, 0, 4, 1).data;
  const colors = Array.from({ length: 4 }, (_, i) => pixels[i * 4]! * 65536 + pixels[i * 4 + 1]! * 256 + pixels[i * 4 + 2]!);
  standingEarSwatches.set(id, colors);
  return colors;
}

function componentStockPixels(id: string) {
  const cached = componentStockColors.get(id);
  if (cached) return cached;
  const pixels = restingOutlinePixels(imageFor(catComponentRecipePath + id + '-stock')).data;
  componentStockColors.set(id, pixels);
  return pixels;
}

function hasStandingEarMask(version?: CatArtVersion) {
  return (version === standingEarArtVersion || hasThinFrontPawSoles(version)) && pixel80Keys.has(standingEarPath + 'CE01-left-mask');
}

function withStandingEarLining(source: CatLayer, config: CatRenderConfig, version?: CatArtVersion): CatLayer {
  const left = catEarOnSide(config, 'left') === 'CE01';
  const right = catEarOnSide(config, 'right') === 'CE01';
  if (!left && !right) return source;
  const presetId = standingEarPresets.get(config.palette + '/' + config.coat);
  const id = presetId ?? standingEarTemplate[config.palette];
  const { lining, donors = [] } = standingEarPlan[id]!;
  const recipe = componentRecipeArt(version);
  const marked = (side: CatPhotoEarSide) => Boolean(config.photoEarColors?.[side]
    || catPhotoPartFor(config.photoCoatParts, `ear-${side}`, config.palette, config.coat));
  const keepLeft = marked('left');
  const keepRight = marked('right');
  const authoredCrown = Boolean(config.calicoCrown || config.calicoCrownTop);
  const key = `${id}/${recipe}/${left}/${right}/${config.earColor}/${keepLeft}/${keepRight}/${authoredCrown}`;
  const cached = standingEarLayers.get(source);
  if (cached?.key === key) return cached.canvas;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
  const original = image.data.slice();
  const cell = CAT_SIZE / 80;
  const offset = (x: number, y: number) => (y * CAT_SIZE + x) * 4;
  const active = (x: number) => x < 38 ? left : right;
  for (const [x, y, sourceX, sourceY] of donors) {
    // Photo marks and authored calico crowns already own the outer-ear fur.
    if (!active(x) || (x < 38 ? keepLeft : keepRight) || authoredCrown) continue;
    for (let dy = 0; dy < cell; dy++) {
      for (let dx = 0; dx < cell; dx++) {
        const from = offset(sourceX * cell + dx, sourceY * cell + dy);
        const to = offset(x * cell + dx, y * cell + dy);
        if (original[from + 3] && original[to + 3]) image.data.set(original.subarray(from, from + 3), to);
      }
    }
  }
  const chosen = config.earColor === 'natural' ? undefined
    : Number.parseInt(catFeatureColors[config.earColor].color.slice(1), 16);
  const channels = (color: number) => [color >>> 16, (color >>> 8) & 255, color & 255];
  const swatches = recipe ? standingEarRecipeSwatches(id) : undefined;
  const furAtRetiredLining = (x: number, y: number, i: number, mask: Uint8ClampedArray, historical: Uint8ClampedArray) => {
    const keepPaint = x < 38 ? keepLeft : keepRight;
    if (keepPaint || authoredCrown) return undefined;
    if (presetId) {
      const stock = componentStockPixels(presetId);
      if (stock[i + 3]) return stock.subarray(i, i + 3);
    }
    // A different coat needs a swatch from the same live outer ear.
    for (let radius = 1; radius <= 4; radius++) {
      for (const [dx, dy] of [[0, -radius], [0, radius], [-radius, 0], [radius, 0]]) {
        const sx = x + dx!, sy = y + dy!;
        if (sx < 0 || sx >= 80 || sy < 0 || sy >= 80 || (sx < 38) !== (x < 38)) continue;
        const sample = (sy * 80 + sx) * 4;
        if (mask[sample + 3] || historical[sample + 3]) continue;
        const from = offset(sx * cell, sy * cell);
        if (original[from + 3] && !isEarLiningPixel(original, from)) return original.subarray(from, from + 3);
      }
    }
  };
  for (const side of standingEarSides) {
    if (catEarOnSide(config, side) !== 'CE01') continue;
    const swatchOffset = side === 'left' ? 0 : 2;
    const naturalMain = channels(swatches?.[swatchOffset] ?? lining[0]);
    const naturalShadow = channels(swatches?.[swatchOffset + 1] ?? lining[1]);
    const base = chosen === undefined ? naturalMain : channels(chosen);
    const shadow = chosen === undefined ? naturalShadow
      : base.map((value, index) => value + naturalShadow[index]! - naturalMain[index]!);
    const mask = standingEarMask(side, recipe);
    const historical = recipe ? standingEarMask(side, false) : undefined;
    for (let y = 0; y < 80; y++) {
      for (let x = 0; x < 80; x++) {
        const i = (y * 80 + x) * 4;
        const tone = mask[i + 3] ? (mask[i] === 255 ? base : shadow)
          : historical?.[i + 3] ? furAtRetiredLining(x, y, i, mask, historical) : undefined;
        if (!tone) continue;
        for (let dy = 0; dy < cell; dy++) {
          for (let dx = 0; dx < cell; dx++) {
            const to = offset(x * cell + dx, y * cell + dy);
            if (original[to + 3]) image.data.set(tone, to);
          }
        }
      }
    }
  }
  ctx.putImageData(image, 0, 0);
  standingEarLayers.set(source, { key, canvas });
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

function centeredNoseTip(nose: CatRenderConfig['nose'], version?: CatArtVersion) {
  if (!usesArtFeature(version, centeredNoseArtVersion) || !Object.hasOwn(centeredNoseTips, nose)
    || !pixel80Keys.has(centeredNosePath + nose)) return undefined;
  return (centeredNoseTips[nose as keyof typeof centeredNoseTips] + 1) * (CAT_SIZE / 80) - 1;
}

function drawNosePart(ctx: CanvasRenderingContext2D, config: CatRenderConfig, atlas: CatLayer,
  reference = false, centered = false,
) {
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
  const key = `nose/${centered ? 'centered/' : ''}${nose}/${color.join(',')}`;
  if (column < 0) {
    const art = imageFor((centered ? centeredNosePath : catNosePath) + nose);
    let recolored = tinted.get(key);
    if (!recolored) {
      const layer = makeLayer(CAT_SIZE);
      layer.ctx.drawImage(art, 0, 0, CAT_SIZE, CAT_SIZE);
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

function sharedMouthLayer(config: CatRenderConfig, ink = config.palette === 'CC02' ? '#261B1C' : undefined,
  asset = catMouthPath + config.mouth,
) {
  const art = imageFor(asset);
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
  mouthInk?: string, maskFur = false, reference = false, furUnderlay?: HTMLImageElement, restingNose?: CatLayer, reviewedSmile = false, narrowDefaultNose = false, omitMouth = false, centeredTip?: number, useHistoricalConvexMouth = false,
) {
  // The Aseprite exporter packs the original face coordinates into three rows.
  const { left, top, width, height } = faceTiles;
  const atlas = catFaceAtlas(config, markingLayout, effort);
  const customMouth = Object.hasOwn(sharedMouthStyles, config.mouth);
  const tip = centeredTip ?? atlasNoseTips[config.nose as keyof typeof atlasNoseTips]
    ?? sharedNoseStyles[config.nose as keyof typeof sharedNoseStyles][1];
  const draw = (column: number, row: number) =>
    ctx.drawImage(atlas, column * width, row * height, width, height, left, top, width, height);
  const drawNose = () => {
    if (centeredTip !== undefined) {
      if (maskFur) drawNosePart(ctx, config, atlas, reference);
      if (!restingNose || maskFur) {
        drawNosePart(ctx, config, atlas, reference, true);
        return;
      }
    }
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
    if (!narrowDefaultNose || maskFur || config.nose !== 'NO05') {
      drawNosePart(ctx, config, atlas, reference);
      return;
    }
    // Keep the selected pigment and two shade rows. The default nose ends
    // at x38 so its middle column meets the user-reviewed x37 smile.
    const grid = CAT_SIZE / 80;
    ctx.save();
    ctx.beginPath();
    ctx.rect(36 * grid, 30 * grid, 3 * grid, 2 * grid);
    ctx.clip();
    drawNosePart(ctx, config, atlas, reference);
    ctx.restore();
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
  if (omitMouth) {
    drawNose();
    return;
  }
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
  if (reviewedSmile && !maskFur) {
    drawCoatRestingSmile(ctx, config, tip, mouthInk);
    drawNose();
    return;
  }
  if (customMouth) {
    const useConvexMouth = useHistoricalConvexMouth && config.mouth === 'CN05';
    const asset = useConvexMouth ? historicalConvexMouthPath : catMouthPath + config.mouth;
    if (useConvexMouth && reference && !maskFur) ctx.drawImage(imageFor(historicalConvexLiHuaBacking), 0, 0);
    const line = mouthInk && config.mouth !== 'CN09'
      ? coloredCatIris(asset, mouthInk)
      : sharedMouthLayer(config, config.mouthContrast === 'light' ? mouthInk : undefined, asset);
    ctx.drawImage(line, 0, 0);
    const stemX = 149, stemY = 131, stemWidth = 4;
    const gap = stemY - tip - 1;
    // The historical double curve now has its complete grid-aligned stem.
    if (!useConvexMouth && centeredTip === undefined && gap > 0) ctx.drawImage(line, stemX, stemY, stemWidth, 1, stemX, tip + 1, stemWidth, gap);
    if (useConvexMouth && maskFur) ctx.drawImage(imageFor(catMouthPath + config.mouth), 0, 0);
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
  // Fur-only editing protects both the previous nose/mouth footprint and
  // the reviewed smile. That keeps previously locked pixels locked.
  if (reviewedSmile) drawCoatRestingSmile(ctx, config, tip, undefined, true);
}

function drawCoatRestingSmile(ctx: CanvasRenderingContext2D, config: CatRenderConfig, tip: number, ink?: string,
  maskFur = false,
) {
  const grid = CAT_SIZE / 80;
  const rgb = pixel80CatOutline(config);
  let color = ink ?? `rgb(${rgb.join(', ')})`;
  if (!ink && !maskFur) {
    // Cross-palette presets can put dark ink over charcoal muzzle fur.
    // Preserve the selected pigment's hue while restoring line contrast.
    const point = ctx.getTransform().transformPoint(new DOMPoint(32.5 * grid, 36.5 * grid));
    const fur = ctx.getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1).data;
    const luminance = (r: number, g: number, b: number) => (r * 3 + g * 6 + b) / 10;
    const furLight = luminance(fur[0]!, fur[1]!, fur[2]!);
    const inkLight = luminance(...rgb);
    if (fur[3] === 255 && Math.abs(inkLight - furLight) < 42) {
      const adjustment = furLight < 110 ? furLight + 62 - inkLight : furLight - 62 - inkLight;
      const channels = rgb.map(channel => Math.max(0, Math.min(255, Math.round(channel + adjustment))));
      color = `rgb(${channels.join(', ')})`;
    }
  }
  const stemTop = Math.min(32 * grid, tip + 1);
  ctx.save();
  ctx.fillStyle = color;
  // Reuse the approved one-column stem and the three-cell junction that
  // sits underneath the nine user-painted lip cells.
  if (!maskFur) ctx.globalAlpha = 0.78;
  ctx.fillRect(37 * grid, stemTop, grid, 34 * grid - stemTop);
  ctx.globalAlpha = 1;
  ctx.fillRect(37 * grid, 34 * grid, grid, grid);
  ctx.fillRect(36 * grid, 35 * grid, 3 * grid, grid);
  ctx.drawImage(coloredCatIris(reviewedRestingSmilePath, color), 0, 0, CAT_SIZE, CAT_SIZE);
  ctx.restore();
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

const layeredEyeBacking = {
  CC04: 'siamese', CC05: 'british_blue', CC06: 'american_shorthair', CC08: 'ragdoll',
} as const;

function authoredEyeBacking(config: CatRenderConfig, version?: CatArtVersion) {
  if (version !== continuousHeadFurArtVersion || config.faceBase === 'solid'
    || !Object.hasOwn(layeredEyeBacking, config.palette)) return;
  const id = layeredEyeBacking[config.palette as keyof typeof layeredEyeBacking];
  const asset = catComponentRecipePath + id + '-eyes-backing';
  return pixel80Keys.has(asset) ? asset : undefined;
}

function sharedPatternHead(config: CatRenderConfig, effort: boolean, earLayout?: CatPose['earLayout'], cleanEyeRim = false, artVersion?: CatArtVersion) {
  const sharedNose = Object.hasOwn(sharedNoseStyles, config.nose);
  const sharedMouth = Object.hasOwn(sharedMouthStyles, config.mouth);
  const key = `${facePatternCacheKey(config)}/${config.pattern}/${earPairKey(config)}/${config.earColor}/${effort}/${earLayout}/${sharedNose}/${sharedMouth}/${cleanEyeRim}/${config.calicoCrown}/${config.calicoCrownLayout}/${config.calicoCrownTop}/${artVersion === continuousHeadFurArtVersion}`;
  const cached = sharedPatternHeads.get(key);
  if (cached) return cached;
  const { palette } = config;
  const orange = palette === 'CC01';
  const path = orange ? orangePath : breedPath(palette);
  const crown = calicoCrownAsset(config);
  const original = imageFor(crown ? crown + 'head' : path + (orange ? 'head_base' : 'head'));
  const coatBacking = authoredEyeBacking(config, artVersion);
  const crownBacking = artVersion === continuousHeadFurArtVersion && crown && config.calicoCrownLayout === 'high-cap'
    ? calicoCrownContinuityPath + config.calicoCrown : undefined;
  const backing = crownBacking ?? coatBacking;
  const base = backing && pixel80Keys.has(backing)
    ? withAuthoredCoatPart(original, backing)
    : effort && !orange ? headWithoutBakedEyes(original, palette, cleanEyeRim) : original;
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

type SharedCheekCoat = 'orange' | 'li-hua';
const sharedCheekLayers = new WeakMap<CatLayer, Map<SharedCheekCoat, CatLayer>>();
let sharedOrangeCheekInk: HTMLCanvasElement | undefined;

function sharedTabbyCheekCoat(config: CatRenderConfig, version?: CatArtVersion): SharedCheekCoat | undefined {
  if (!hasArtRevision(version, sharedCheekArtVersion) || !pixel80Keys.has(sharedTabbyCheekPath + 'stripes')
    || (config.cheekPattern ?? 'native') !== 'native' || config.faceBase === 'solid' || !usesStockDetails(config)) return;
  if (config.palette === 'CC01' && config.coat === 'native') return 'orange';
  if (usesRedesignedLiHua(config, version)) return 'li-hua';
}

function orangeTabbyCheekInk(stripes: HTMLImageElement) {
  if (sharedOrangeCheekInk) return sharedOrangeCheekInk;
  const { canvas, ctx } = makeLayer(80);
  ctx.drawImage(stripes, 0, 0, 80, 80);
  const pixels = ctx.getImageData(0, 0, 80, 80);
  const dark = [208, 118, 69], mid = [221, 134, 81], soft = [226, 142, 86];
  for (let i = 0; i < pixels.data.length; i += 4) {
    if (pixels.data[i + 3]) {
      const tone = pixels.data[i + 1]!;
      pixels.data.set(tone < 79 ? dark : tone < 105 ? mid : soft, i);
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return sharedOrangeCheekInk = canvas;
}

function withSharedTabbyCheeks(source: CatLayer, config: CatRenderConfig, version?: CatArtVersion): CatLayer {
  const coat = sharedTabbyCheekCoat(config, version);
  if (!coat) return source;
  let layers = sharedCheekLayers.get(source);
  if (!layers) sharedCheekLayers.set(source, layers = new Map());
  const cached = layers.get(coat);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0, CAT_SIZE, CAT_SIZE);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.drawImage(imageFor(sharedTabbyCheekPath + coat + '-restore'), 0, 0, CAT_SIZE, CAT_SIZE);
  const stripes = imageFor(sharedTabbyCheekPath + 'stripes');
  ctx.drawImage(coat === 'orange' ? orangeTabbyCheekInk(stripes) : stripes, 0, 0, CAT_SIZE, CAT_SIZE);
  layers.set(coat, canvas);
  return canvas;
}

const liHuaCrownLayers = new WeakMap<CatLayer, CatLayer>();

function withLiHuaCrownTone(source: CatLayer, config: CatRenderConfig, version?: CatArtVersion): CatLayer {
  if (!hasArtRevision(version, liHuaCrownArtVersion) || !pixel80Keys.has(liHuaCrownTone)
    || !usesRedesignedLiHua(config, version)) return source;
  const cached = liHuaCrownLayers.get(source);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0, CAT_SIZE, CAT_SIZE);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.drawImage(imageFor(liHuaCrownTone), 0, 0, CAT_SIZE, CAT_SIZE);
  liHuaCrownLayers.set(source, canvas);
  return canvas;
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
  omitMouth = false,
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
  const nose = !omitMouth && breedRestNose(config, details, maskFur, artVersion);
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

function authoredRestingNose(config: CatRenderConfig, face: CatRenderConfig, maskFur: boolean, version?: CatArtVersion) {
  const breed = catRestFaceEdgeBreed(config, face);
  const part = breed && catRestFaceEdgeNose(config, breed, version);
  if (part) return imageFor(catFaceEdgesPath + breed + '/' + part);
  const details = breedRestFace(config, face, version);
  return details && breedRestNose(config, details, maskFur, version);
}

function drawCatFaceEdges(
  ctx: CanvasRenderingContext2D, config: CatRenderConfig, face: CatRenderConfig, maskFur: boolean, artVersion?: CatArtVersion,
  omitMouth = false,
) {
  drawBreedRestFaceDetails(ctx, config, face, maskFur, artVersion, omitMouth);
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
  const part = !omitMouth && catRestFaceEdgeNose(config, breed, artVersion);
  if (part) {
    draw(part, false);
    if (part === 'nose-mouth-x37') drawRestingSmile(ctx, imageFor(path + part), maskFur, artVersion);
  }
  ctx.restore();
}

const orangeForeheadLayers = new WeakMap<CatLayer, CatLayer>();
let orangeForeheadPixels: ImageData | undefined;

function withOrangeForehead(source: CatLayer, config: CatRenderConfig, artVersion?: CatArtVersion): CatLayer {
  if (!hasArtRevision(artVersion, orangeForeheadArtVersion) || config.palette !== 'CC01' || config.coat !== 'native'
    || config.pattern !== 'P00' || config.faceBase === 'solid' || !usesStockDetails(config)
    || !pixel80Keys.has(orangeForeheadPatch)) return source;
  const cached = orangeForeheadLayers.get(source);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0, CAT_SIZE, CAT_SIZE);
  orangeForeheadPixels ??= restingOutlinePixels(imageFor(orangeForeheadPatch));
  const guide = orangeForeheadPixels.data;
  const sourcePixels = restingOutlinePixels(source).data;
  const paint = restingOutlinePainter(ctx);
  for (let i = 0; i < guide.length; i += 4) {
    if (!guide[i + 3] || sourcePixels[i + 3] !== 255) continue;
    const r = sourcePixels[i]!, g = sourcePixels[i + 1]!, b = sourcePixels[i + 2]!;
    // Mixed ears may cover the crown. Only authored warm fur owns this patch.
    if (r < 145 || r - g < 24 || g <= b) continue;
    paint(i / 4 % 80, Math.floor(i / 320), guide.subarray(i, i + 4));
  }
  orangeForeheadLayers.set(source, canvas);
  return canvas;
}

const independentDiluteCrowns = new WeakMap<CatLayer, HTMLCanvasElement>();
function withDiluteCrownMark(source: CatLayer) {
  const cached = independentDiluteCrowns.get(source);
  if (cached) return cached;
  const {canvas,ctx} = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0);
  ctx.drawImage(imageFor(diluteEarMarkPatch), 0, 0, CAT_SIZE, CAT_SIZE);
  independentDiluteCrowns.set(source, canvas);
  return canvas;
}

export function drawCatHead(
  ctx: CanvasRenderingContext2D, appearance: CatConfig | CatRenderConfig, typing: boolean, frame: number, gaze: Gaze,
  { scale = 1, earLayout, hideGlints, markingLayout, legacyNoseOutline, outlineVersion = 'adaptive',
    closeEyes = false, maskFur = false, petLoveEyes = false, faceEdges = false, artVersion, legacyConvexMouth, mouthOnly = false, omitMouth = false, ...typingPose }:
    TypingEffects & Pick<CatPose, 'earLayout' | 'markingLayout' | 'outlineVersion' | 'legacyNoseOutline' | 'faceEdges' | 'artVersion' | 'legacyConvexMouth'>
      & { scale?: number; hideGlints?: HiddenGlints; closeEyes?: boolean; maskFur?: boolean; petLoveEyes?: boolean; mouthOnly?: boolean; omitMouth?: boolean } = {},
) {
  const animation = typingPose.typingAnimation ?? currentTypingAnimation;
  const mode = typingPose.typingMode ?? 'gentle';
  const effectsAnimation = isFrontTyping(animation) ? 'reference-v2' : animation;
  const referenceEffects = (typing || mouthOnly) && isReferenceTyping(effectsAnimation) && typingPose.typingEffects !== false;
  const frenzyEffects = referenceEffects && usesFallingTyping(animation) && mode === 'frenzy';
  const transitionalFace = frenzyEffects && animation === 'front-v4';
  const sharedTypingMouth = referenceEffects && effectsAnimation === 'reference-v2' && typingPose.typingMouthVersion !== 'legacy';
  const look = catRenderConfig(appearance);
  const selected = {
    ...(wearsEarStowingHat(look) ? withUprightEars(look) : look),
    revisedEars: hasRevisedEarsAndPaws(artVersion),
  };
  const config = sharedTypingMouth ? { ...selected, mouth: transitionalFace ? typingMouths.gentle : typingMouths[mode] } : selected;
  const { palette } = config;
  const orange = palette === 'CC01';
  const faceConfig = facePatternConfig(config);
  const liHua = !maskFur && usesRedesignedLiHua(config, artVersion);
  const reference = liHua && hasSampledLiHua(artVersion);
  const path = orange ? orangePath : breedPath(palette);
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
  const independentCrown = markingLayout !== 'legacy' && !maskFur && hasIndependentCrown(config, artVersion) && usesStockDetails(config)
    && !config.photoEarColors && !config.photoCoatParts?.length;
  const diluteMark = (look: CatRenderConfig) => !maskFur && hasDiluteEarMark(artVersion)
    && look.palette === 'CC03' && look.coat === 'breed:CC12' && look.faceBase !== 'solid' && look.pattern === 'P00'
    && usesStockDetails(look) && catEarOnSide(look, 'left') === 'CE01' && !look.photoEarColors?.left
    && !catPhotoPartFor(look.photoCoatParts, 'ear-left', look.palette, look.coat) && pixel80Keys.has(diluteEarMarkPatch);
  let effortFur: CatLayer | undefined;
  if (markingLayout === 'legacy' && !patches.length && !authoredHeadPart && !calicoCrownAsset(config)) {
    const head = imageFor(path + (orange ? 'head_base' : 'head'));
    const base = eyesClosed && !orange ? headWithoutBakedEyes(head, palette, cleanEyeRim) : head;
    const painted = outlinedCatLayer(frontCoatLayer(base, config, orange ? 'orange-head' : 'fur'),
      imageFor(orangePath + 'head_base'), config, outlineVersion, true);
    effortFur = headWithBodyBase(painted, { ...config, faceBase: 'native' });
    ctx.drawImage(effortFur, 0, 0);
    if (eyesClosed && orange) ctx.drawImage(frontCoatLayer(imageFor(typingEffectPath + 'orange_eye_patch'), config), 0, 0);
    const ears = outlinedCatLayer(coloredFrontCatEars(config, earLayout),
      stockEarPair(config), config, outlineVersion, true);
    ctx.drawImage(!maskFur && hasStandingEarMask(artVersion) ? withStandingEarLining(ears, config, artVersion) : ears, 0, 0);
    if (['P01', 'P02', 'P06'].includes(config.pattern)) {
      const template = config.palette === 'CC01' ? config.palette : sharedBreedParts[config.palette];
      const face = imageFor((orange ? orangePath : breedPath(template)) + `face_${config.pattern}`);
      ctx.drawImage(frontCoatLayer(face, template === config.palette ? config : { ...config, palette: template }), 0, 0);
    }
  } else {
    const paintHead = (look: CatRenderConfig, face: CatRenderConfig) => {
      const guide = headOutlineGuide(look);
      const head = outlinedCatLayer(sharedPatternHead(face, eyesClosed, earLayout, cleanEyeRim, artVersion), guide, look, outlineVersion, true);
      const bareForehead = look.pattern === 'P03' && markingLayout !== 'shared';
      const paintedHead = patchHead(headWithBodyBase(bareForehead ? bareForeheadHead(head, guide) : head, look));
      const cleaned = withoutLegacyHeadSpecks(paintedHead, look, face, artVersion);
      const cleanHead = !typing && hasSharedRestingOutline(artVersion) && hasHoneyGoldFur(look) && pixel80Keys.has(sharedRestingOutlinePath + 'cheek-fur')
        ? withGoldenCheekSeam(cleaned, pixel80CatOutline(look)) : cleaned;
      let headFur = withPhotoEarMarks(liHua ? liHuaLayer(cleanHead, 'head', look, artVersion) : cleanHead, look, earLayout);
      if (!maskFur && hasStandingEarMask(artVersion)) headFur = withStandingEarLining(headFur, look, artVersion);
      if (!maskFur) {
        if (hasRefinedResting(artVersion) && pixel80Keys.has(chinShadeMask)) {
          const goldenChin = withGoldenChin(headFur, look, artVersion);
          headFur = goldenChin === headFur ? withChinShading(headFur, look) : goldenChin;
        }
        headFur = withSharedTabbyCheeks(headFur, look, artVersion);
        headFur = withOrangeForehead(headFur, look, artVersion);
        headFur = withLiHuaCrownTone(headFur, look, artVersion);
      }
      return independentCrown && diluteMark(look) ? withDiluteCrownMark(headFur) : headFur;
    };
    const mixed = paintHead(config, faceConfig);
    if (independentCrown) {
      const upright = withUprightEars(config);
      effortFur = withIndependentCrown(paintHead(upright, facePatternConfig(upright)), mixed, config);
    } else {
      effortFur = mixed;
    }
    ctx.drawImage(effortFur, 0, 0);
  }
  if (!independentCrown && diluteMark(config)) {
    ctx.drawImage(imageFor(diluteEarMarkPatch), 0, 0, CAT_SIZE, CAT_SIZE);
  }
  if (maskFur) {
    // Use stock, unpainted art for the outline and ear lining. The independent
    // face, effects and accessory layers below cut their exact shapes out.
    const ear = outlineGuidePixels(frontCatEars(config, earLayout));
    const keep = protectedHeadPatchPixels(config, orange && !eyesClosed);
    const guide = headPatchGuide(config);
    const native = readBodyPixels(path + (orange ? 'head_base' : 'head'));
    const image = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
    // The old protection stays active even where a former liner cell is
    // now fur. The added mask cells must also be excluded from photo painting.
    const liningSides = hasStandingEarMask(artVersion)
      ? standingEarSides.filter(side => catEarOnSide(config, side) === 'CE01').map(side => standingEarMask(side, componentRecipeArt(artVersion))) : [];
    const newLining = (index: number) => {
      const cell = CAT_SIZE / 80;
      const x = Math.floor((index % CAT_SIZE) / cell);
      const y = Math.floor(index / CAT_SIZE / cell);
      return liningSides.some(mask => mask[(y * 80 + x) * 4 + 3]);
    };
    const alpha = opaqueFurMask(image.data, guide, native, config, index =>
      keep[index] || newLining(index) || (Math.floor(index / CAT_SIZE) < 104
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
  const modernFace = earLayout !== 'legacy' && markingLayout !== 'legacy' && outlineVersion === 'adaptive' && !legacyNoseOutline;
  const typingNose = (typing || mouthOnly) && isFrontTyping(animation) && hasTypingRestingNose(artVersion);
  const sharedSmile = hasCoatSmile(artVersion) && selected.mouth === 'CN08'
    && pixel80Keys.has(reviewedRestingSmilePath) && (typing ? typingNose : faceEdges && !closeEyes);
  const stockNose = modernFace && (typingNose || sharedSmile)
    ? authoredRestingNose(selected, faceConfig, maskFur, artVersion) : undefined;
  // Exact stock retouches take precedence. All other modern coats share
  // the reviewed smile and keep its narrow NO05 aligned in typing too.
  const coatSmile = modernFace && sharedSmile && !stockNose;
  drawCatFaceParts(ctx, faceConfig, markingLayout, transientMouth, effectsAnimation, cleanMouth,
    legacyNoseOutline, effortMouth && !orangeMouth, effort, patchSkin, mouthInk, maskFur, reference, frenzyFur,
    typingNose || omitMouth ? stockNose : undefined, coatSmile && !typing && !mouthOnly, coatSmile, omitMouth,
    modernFace ? centeredNoseTip(faceConfig.nose, artVersion) : undefined,
    !typing && !mouthOnly && !legacyConvexMouth
      && usesArtFeature(artVersion, historicalConvexMouthArtVersion) && pixel80Keys.has(historicalConvexMouthPath));
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
  stowEarsUnderHat(ctx, config);
  // New sweat belongs on the forehead, beneath hats and hair clips. Preserve
  // the old shared order when reconstructing older pixel-editor saves.
  if (typing && frenzyEffects) {
    drawFallingTypingCel(ctx, 'sweat', frame);
  } else if (typing && referenceEffects && mode !== 'gentle') {
    ctx.drawImage(referenceTypingFrame(`sweat_${mode}`, frame, effectsAnimation), 0, 0);
  }
  if (faceEdges && !typing && !closeEyes && earLayout !== 'legacy' && markingLayout !== 'legacy'
    && outlineVersion === 'adaptive' && !legacyNoseOutline) drawCatFaceEdges(ctx, selected, facePatternConfig(selected), maskFur, artVersion, mouthOnly || omitMouth);
  const accessory = catAccessoryLayer(config);
  if (accessory) ctx.drawImage(accessory, 0, 0);
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
    || (details.id !== 'li-hua' && !hasUnifiedBreedBody(pose.artVersion))) return;
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

function sharedOutlineBreed(config: CatRenderConfig) {
  return config.palette === 'CC01' && config.coat === 'native'
    || restDetailsByCoat.has(config.palette + '/' + config.coat);
}

function restingOutlinePixels(source: CatLayer) {
  const { ctx } = makeLayer(80);
  ctx.drawImage(source, 0, 0, 80, 80);
  return ctx.getImageData(0, 0, 80, 80);
}

const sharedRestingBodies = new WeakMap<CatLayer, { separated: boolean; canvas: HTMLCanvasElement }>();
const goldenCheekSeams = new WeakMap<CatLayer, HTMLCanvasElement>();
let sharedRestingMasks: Parameters<typeof paintRestingOutline>[1] | undefined;
let goldenCheekMask: ImageData | undefined;

function withSharedRestingOutline(body: CatLayer, separated: boolean, config: CatRenderConfig) {
  const saved = sharedRestingBodies.get(body);
  if (saved?.separated === separated) return saved.canvas;
  sharedRestingMasks ??= {
    body: restingOutlinePixels(imageFor(sharedRestingOutlinePath + 'body')),
    legs: restingOutlinePixels(imageFor(sharedRestingOutlinePath + 'legs')),
    legFur: restingOutlinePixels(imageFor(sharedRestingOutlinePath + 'leg-fur')),
  };
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(body, 0, 0);
  paintRestingOutline(restingOutlinePixels(body), sharedRestingMasks, separated, pixel80WarmOutline(config.coat), restingOutlinePainter(ctx));
  sharedRestingBodies.set(body, { separated, canvas });
  return canvas;
}

function withGoldenCheekSeam(head: CatLayer, ink: ArrayLike<number>) {
  const saved = goldenCheekSeams.get(head);
  if (saved) return saved;
  goldenCheekMask ??= restingOutlinePixels(imageFor(sharedRestingOutlinePath + 'cheek-fur'));
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(head, 0, 0);
  paintGoldenCheekSeam(restingOutlinePixels(head), goldenCheekMask, ink, restingOutlinePainter(ctx));
  goldenCheekSeams.set(head, canvas);
  return canvas;
}

const rearPawSeams = new WeakMap<CatLayer, CatLayer>();

function withCleanRearPawSpurs(body: CatLayer) {
  const cached = rearPawSeams.get(body);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(body, 0, 0);
  const changed = paintRearPawSpurs(restingOutlinePixels(body), restingOutlinePainter(ctx));
  const result = changed ? canvas : body;
  rearPawSeams.set(body, result);
  return result;
}

const frontPawSoleLayers = new WeakMap<CatLayer, CatLayer>();
let frontPawSoleMask: ImageData | undefined;

function withThinFrontPawSoles(body: CatLayer) {
  const saved = frontPawSoleLayers.get(body);
  if (saved) return saved;
  frontPawSoleMask ??= restingOutlinePixels(imageFor(frontPawSoleGuide));
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(body, 0, 0);
  const changed = paintFrontPawSoles(restingOutlinePixels(body), frontPawSoleMask, restingOutlinePainter(ctx));
  const result = changed ? canvas : body;
  frontPawSoleLayers.set(body, result);
  return result;
}

type CalicoBodyPalette = NonNullable<ReturnType<typeof calicoBodyPalette>>;
const calicoTorsoLayers = new WeakMap<CalicoBodyPalette, HTMLCanvasElement>();
const calicoBodyLayers = new WeakMap<CatLayer, WeakMap<CalicoBodyPalette, CatLayer>>();
const calicoBodyPawLayers = new WeakMap<HTMLCanvasElement, WeakMap<CalicoBodyPalette, HTMLCanvasElement>>();

function calicoBodyLayer(palette: CalicoBodyPalette) {
  let saved = calicoTorsoLayers.get(palette);
  if (!saved) {
    const index = restingOutlinePixels(imageFor(calicoBodyIndex));
    const { canvas, ctx } = makeLayer(80);
    ctx.putImageData(recolorCalicoBody(index, palette), 0, 0);
    calicoTorsoLayers.set(palette, saved = canvas);
  }
  return saved;
}

function withCalicoBody(body: CatLayer, palette: CalicoBodyPalette) {
  let versions = calicoBodyLayers.get(body);
  if (!versions) calicoBodyLayers.set(body, versions = new WeakMap());
  let saved = versions.get(palette);
  if (saved) return saved;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(body, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.drawImage(calicoBodyLayer(palette), 0, 0, CAT_SIZE, CAT_SIZE);
  versions.set(palette, saved = canvas);
  return saved;
}

function withCalicoBodyPaws(painted: HTMLCanvasElement, raw: HTMLCanvasElement, palette: CalicoBodyPalette) {
  let versions = calicoBodyPawLayers.get(painted);
  if (!versions) calicoBodyPawLayers.set(painted, versions = new WeakMap());
  let saved = versions.get(palette);
  if (saved) return saved;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.putImageData(recolorCalicoBodyPaws(layerPixels(painted), layerPixels(raw), palette), 0, 0);
  versions.set(palette, saved = canvas);
  return saved;
}

function activeCalicoBodyPalette(config: CatRenderConfig, pose: CatPose) {
  if (hasRefinedResting(pose.artVersion) && pixel80Keys.has(calicoBodyIndex)) {
    // V30 still reconstructs with the earlier orange calico overlay.
    if (pose.artVersion !== refinedRestingArtVersion && config.palette === 'CC01' && config.coat === 'native') return;
    return calicoBodyPalette(config);
  }
}

const goldenChinLayers = new WeakMap<CatLayer, Map<CatRenderConfig['coat'], HTMLCanvasElement>>();
const goldenChinPigments = new Map<CatRenderConfig['coat'], CatLayer>();

function withGoldenChin(source: CatLayer, config: CatRenderConfig, version?: CatArtVersion): CatLayer {
  // Both the stock sprite and alternate eyes/ears use the P03/plain gold profile.
  if (!hasArtRevision(version, goldenChinArtVersion) || !pixel80Keys.has(goldenChinTone) || !hasHoneyGoldFur(config)
    || config.pattern !== 'P03' || config.bodyPattern !== 'plain' || config.bodyBase === 'solid'
    || config.faceBase === 'solid' || (config.cheekPattern ?? 'plain') !== 'plain'
    || !chinCoat(config, false)) return source;

  let variants = goldenChinLayers.get(source);
  if (!variants) goldenChinLayers.set(source, variants = new Map());
  const cached = variants.get(config.coat);
  if (cached) return cached;

  let pigment = goldenChinPigments.get(config.coat);
  if (!pigment) {
    const stock = imageFor(goldenChinTone);
    if (config.coat === 'breed:CC11') pigment = stock;
    else {
      const { canvas, ctx } = makeLayer(80);
      ctx.drawImage(stock, 0, 0);
      const pixels = ctx.getImageData(0, 0, 80, 80);
      paintHoneyGoldFur(pixels, pixels.data.slice(), config);
      ctx.putImageData(pixels, 0, 0);
      pigment = canvas;
    }
    goldenChinPigments.set(config.coat, pigment);
  }
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0, CAT_SIZE, CAT_SIZE);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.drawImage(pigment, 0, 0, CAT_SIZE, CAT_SIZE);
  variants.set(config.coat, canvas);
  return canvas;
}

const chinLayers = new WeakMap<CatLayer, Map<string, CatLayer>>();
let chinGuide: ImageData | undefined;

function withChinShading(source: CatLayer, config: CatRenderConfig, body = false): CatLayer {
  if (body && config.palette !== 'CC07') return source;
  const coat = chinCoat(config, body);
  if (!coat) return source;
  const key = `${coat.id}/${coat.stock}/${body}`;
  let versions = chinLayers.get(source);
  if (!versions) chinLayers.set(source, versions = new Map());
  const saved = versions.get(key);
  if (saved) return saved;
  chinGuide ??= restingOutlinePixels(imageFor(chinShadeMask));
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0);
  paintCatChin(restingOutlinePixels(source), chinGuide, coat, body, restingOutlinePainter(ctx));
  versions.set(key, canvas);
  return canvas;
}

const correctedForelegs = new WeakMap<CatLayer, CatLayer>();

function withCleanForeleg(source: CatLayer, config: CatRenderConfig): CatLayer {
  if ((config.palette !== 'CC05' && config.palette !== 'CC06') || config.bodyBase === 'solid'
    || furPatchesFor(config.furPatches, 'torso').length || furPatchesFor(config.furPatches, 'leftForeleg').length
    || config.photoCoatParts?.some(part => ['torso', 'base'].includes(catPhotoParts[part].slot))
    || (config.forelegPatternSource ?? 'native') !== 'native') return source;
  const cached = correctedForelegs.get(source);
  if (cached) return cached;
  const x = config.palette === 'CC05' ? 24 : 25;
  const donor = config.palette === 'CC05' ? [x + 1, 55] : [x, 54];
  const pixels = restingOutlinePixels(source).data;
  const start = (dx: number, y: number) => (y * 80 + dx) * 4;
  const target = start(x, 55);
  const reference = start(donor[0]!, donor[1]!);
  const light = (i: number) => pixels[i]! + pixels[i + 1]! + pixels[i + 2]!;
  if (pixels[target + 3] !== 255 || pixels[reference + 3] !== 255 || light(reference) - light(target) < 42) {
    correctedForelegs.set(source, source);
    return source;
  }
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0);
  restingOutlinePainter(ctx)(x, 55, pixels.subarray(reference, reference + 4));
  correctedForelegs.set(source, canvas);
  return canvas;
}

const frontGloveLayers = new WeakMap<CatLayer, CatLayer>();
let frontGlovePixels: ImageData | undefined;

function withFrontGloves(source: CatLayer, config: CatRenderConfig, pose: CatPose): CatLayer {
  if (!hasFrontGloves(pose.artVersion) || !pixel80Keys.has(frontGloveGuide) || !hasNativeFrontGloves(config)) return source;
  const cached = frontGloveLayers.get(source);
  if (cached) return cached;
  frontGlovePixels ??= restingOutlinePixels(imageFor(frontGloveGuide));
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(source, 0, 0, CAT_SIZE, CAT_SIZE);
  paintFrontGloves(restingOutlinePixels(source), frontGlovePixels, config, restingOutlinePainter(ctx));
  frontGloveLayers.set(source, canvas);
  return canvas;
}

const goldenFlankLayers = new WeakMap<CatLayer, Map<CatRenderConfig['coat'], HTMLCanvasElement>>();
let goldenFlankPixels: Uint8ClampedArray | undefined;

function withGoldenFlank(source: CatLayer, config: CatRenderConfig, pose: CatPose): CatLayer {
  if (!hasArtRevision(pose.artVersion, goldenFlankArtVersion) || !pixel80Keys.has(goldenFlankTone)
    || config.bodyBase === 'solid' || config.bodyPattern !== 'plain' || !hasHoneyGoldFur(config)
    || !usesStockDetails(config)) return source;
  let versions = goldenFlankLayers.get(source);
  if (!versions) goldenFlankLayers.set(source, versions = new Map());
  const cached = versions.get(config.coat);
  if (cached) return cached;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  if (!goldenFlankPixels) {
    ctx.drawImage(imageFor(goldenFlankTone), 0, 0, CAT_SIZE, CAT_SIZE);
    goldenFlankPixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE).data;
    ctx.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
  }
  ctx.drawImage(source, 0, 0, CAT_SIZE, CAT_SIZE);
  const pixels = ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
  paintHoneyGoldFur(pixels, goldenFlankPixels, config);
  ctx.putImageData(pixels, 0, 0);
  versions.set(config.coat, canvas);
  return canvas;
}

function usesRestingTyping(pose: CatPose) {
  return pixel80Keys.size > 0 && (pose.artVersion === alignedTypingArtVersion || hasFrontGloves(pose.artVersion))
    && (pose.typingAnimation ?? currentTypingAnimation) === currentTypingAnimation
    && pose.typingLayout !== 'legacy' && pose.typingMouthVersion !== 'legacy';
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
  const sharedBody = typing && usesRestingTyping(pose);
  const seated = !typing || sharedBody;
  const bodyPose = sharedBody ? { ...pose, staticPaws: true } : pose;
  const separatedBreedBody = seated ? breedBodyOutline(config, bodyPose) : undefined;
  const retouch = historicalBody ? undefined : orangeBodyRetouch(config, bodyPose);
  const stockBody = frontBodyLayer(path, historicalBody ? 'typing_body' : 'body', config, layout, outlineVersion, retouch);
  const calicoCleanup = !historicalBody && hasSpeckCleanup(pose.artVersion) && usesStockDetails(config)
    && config.palette === 'CC03' && config.coat === 'breed:CC12' && config.bodyPattern === 'native'
    && config.bodyBase !== 'solid';
  const cleanBody = calicoCleanup ? diluteCalicoCleanup(stockBody, 'tail-seam') : stockBody;
  const restingBody = seated ? withBreedRestingPaws(cleanBody, config, bodyPose) : cleanBody;
  const preOutlineBody = calicoCleanup && restingBody !== cleanBody
    ? diluteCalicoCleanup(restingBody, 'rear-paw') : restingBody;
  const outlinedBody = separatedBreedBody ? withBreedBodyOutline(preOutlineBody, separatedBreedBody, layout) : preOutlineBody;
  const liHua: LiHuaStyle = !historicalBody && usesRedesignedLiHua(config, pose.artVersion)
    && (hasSampledLiHua(pose.artVersion) ? 'reference' : true);
  const liHuaTail = !config.coloredTail && liHua;
  const separated = Boolean(separatedBreedBody) || retouch === orangeBodyOutlinePath;
  const pigmentedBody = liHua ? liHuaLayer(outlinedBody, 'body', config, pose.artVersion) : outlinedBody;
  const sharedRestingOutline = seated && bodyPose.staticPaws && hasSharedRestingOutline(pose.artVersion)
    && outlineVersion === 'adaptive' && sharedOutlineBreed(config) && pixel80Keys.has(sharedRestingOutlinePath + 'legs');
  const fittedBody = sharedRestingOutline ? withSharedRestingOutline(pigmentedBody, separated, config) : pigmentedBody;
  const bodyBase = seated && hasCleanRearPawSpurs(pose.artVersion) && outlineVersion === 'adaptive'
    ? withCleanRearPawSpurs(fittedBody) : fittedBody;
  const rearPawSpurs = bodyBase !== fittedBody;
  const calicoPalette = (seated ? bodyPose.staticPaws : animation === currentTypingAnimation)
    ? activeCalicoBodyPalette(config, pose) : undefined;
  // Draw the movable tail from its own asset after the typing torso has been recolored.
  const activeBody = seated ? withGoldenFlank(bodyBase, config, pose)
    : calicoPalette ? withCalicoBody(bodyBase, calicoPalette) : bodyBase;
  const selectedBody = bodyWithSelectedTail(activeBody, config, historicalBody, layout, outlineVersion, tailArtVersion,
    separated, liHuaTail);
  const bodyBeforeSoles = historicalBody ? bodyWithTypingConnector(selectedBody, config, layout, laptopVersion) : selectedBody;
  const originalBody = seated && !pose.stretch && hasThinFrontPawSoles(pose.artVersion) && pixel80Keys.has(frontPawSoleGuide)
    ? withThinFrontPawSoles(bodyBeforeSoles) : bodyBeforeSoles;
  const composedBody = calicoPalette && seated ? withCalicoBody(originalBody, calicoPalette) : originalBody;
  const chinBody = hasRefinedResting(pose.artVersion) && pixel80Keys.has(chinShadeMask)
    ? withChinShading(composedBody, config, true) : composedBody;
  const patchedForeleg = seated && hasRefinedResting(pose.artVersion) && pixel80Keys.size > 0
    ? withCleanForeleg(chinBody, config) : chinBody;
  const gloves = seated ? withFrontGloves(patchedForeleg, config, pose) : patchedForeleg;
  const chestId = seated && config.bodyPattern === 'native' && config.bodyBase !== 'solid' && hasNativeFrontGloves(config)
    ? standingEarPresets.get(config.palette + '/' + config.coat) : undefined;
  const chest = withWhiteChest(gloves, chestId, pose.artVersion);
  const siameseCoat = config.coat === 'native' || config.coat === 'siameseWarm' || config.coat === 'siameseCool' ? config.coat : undefined;
  const body = seated && config.palette === 'CC04' && siameseCoat && config.bodyPattern === 'native' && config.bodyBase !== 'solid'
    ? withSiameseCleanBody(chest, siameseCoat, pose.artVersion) : chest;
  const frenzyPaws = usesFallingTyping(animation) && mode === 'frenzy';
  const frontPaws = typing && isFrontTyping(animation) ? frontTypingPaws(frame, frenzyPaws) : undefined;
  const pawPigment = frontPaws && catKeepsBreedPigment(config) && usesBodyPattern(config)
    ? frontBodyLayer(path, 'body', { ...config, bodyPattern: 'native' }, layout, outlineVersion) : bodyBase;
  const originalArms = !typing || sharedBody ? undefined : frontPaws
    ? coloredFrontPaws(frontPaws, pawPigment, config, outlineVersion, liHua)
    : animation === 'legacy'
    ? frontBodyLayer(path, `typing_arms_${mode}_${frame}`, config, layout, outlineVersion)
    : animation === 'shared' ? sharedTypingArms(path, config, frame, layout, outlineVersion)
      : isReferenceTyping(animation) ? referenceTypingArms(path, config, mode, frame, animation, outlineVersion, pose.typingInkVersion) : undefined;
  const arms = calicoPalette && frontPaws && originalArms instanceof HTMLCanvasElement
    ? withCalicoBodyPaws(originalArms, frontPaws, calicoPalette) : originalArms;
  const raisedPaws = typing && animation === 'legacy' && mode === 'fast' && frame < 3
    ? frontBodyLayer(path, `typing_front_${frame}`, config, layout, outlineVersion) : undefined;
  const laptop = typing ? catTypingLaptop(config, layout, laptopVersion, animation) : undefined;
  return { body, bodyBeforeSoles, bodyBase, arms, frontPaws, frenzyPaws, historicalBody, raisedPaws, laptop, mode, animation, outlineVersion, laptopVersion, tailArtVersion, retouch, liHuaTail, separated, sharedRestingOutline, rearPawSpurs };
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
  const config = {
    ...(wearsEarStowingHat(appearance) ? withUprightEars(appearance) : appearance),
    revisedEars: hasRevisedEarsAndPaws(pose.artVersion),
  };
  const layout = typing ? pose.typingLayout : undefined;
  const key = `${config.palette}/${earPairKey(config)}/${catAccessoryKey(config)}/${pose.earLayout}/${layout}/${config.calicoCrown}/${config.calicoCrownLayout}/${config.calicoCrownTop}/${config.faceBase}`;
  const cached = headInkCache.get(key);
  if (cached) return cached;
  const base = catLayerAlpha(imageFor(config.palette === 'CC01' ? `${orangePath}head_base` : `${breedPath(config.palette)}head`));
  const ears = catLayerAlpha(frontCatEars(config, pose.earLayout));
  const leftRegion = earOwnership(catEarOnSide(config, 'left'));
  const rightRegion = earOwnership(catEarOnSide(config, 'right'));
  const accessory = catAccessoryLayer(config);
  const worn = accessory && catLayerAlpha(accessory);
  const mask = hatEarStow(config);
  const stowed = mask && catLayerAlpha(mask);
  const leftEar = new Uint8Array(inkArea), rightEar = new Uint8Array(inkArea), head = new Uint8Array(inkArea);
  for (let index = 0; index < inkArea; index++) {
    const offset = index * 4;
    if (stowed?.[index]) continue;
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
  const clothing: CatInkGeometry = {};
  if (config.clothing) {
    const surface = clothingInkSurface(clothingFrame(config.clothing, layers.frontPaws));
    const laptop = layers.laptop && catLayerAlpha(layers.laptop);
    const paws = layers.frontPaws && catLayerAlpha(layers.frontPaws);
    clothing.clothing = laptop || paws ? { bounds: surface.bounds,
      mask: surface.mask!.map((pixel, i) => laptop?.[i] || paws?.[i] ? 0 : pixel) } : surface;
  }
  if (layers.frontPaws && head.head?.mask) {
    const paws = catLayerAlpha(layers.frontPaws);
    const mask = head.head.mask.map((pixel, index) => paws[index] ? 0 : pixel);
    return { ...canvasInkGeometry, ...catBodyInkGeometry(config, typing, index, pose, layers),
      ...head, ...clothing, head: { ...head.head, mask } };
  }
  // The idle bob moves all authored surfaces together. The pixel editor
  // accounts for that translation in its cursor coordinates.
  return { ...canvasInkGeometry, ...catBodyInkGeometry(config, typing, index, pose, layers), ...head, ...clothing };
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
  config: CatRenderConfig, typing: boolean, frame: number, gaze: Gaze, pose: CatPose, closeEyes = false,
) {
  const placement = catHeadPlacement(typing, frame, pose.typingLayout);
  const key = JSON.stringify([config, typing, typing ? frame : catHeadEye(config, false, frame), gaze, closeEyes,
    pose.earLayout, pose.typingLayout, pose.markingLayout, pose.outlineVersion, pose.legacyNoseOutline, pose.faceEdges, pose.artVersion,
    pose.typingAnimation, pose.typingMode, pose.typingEffects, pose.typingInkVersion, pose.typingMouthVersion]);
  const cached = photoHeadGeometry.get(key);
  if (cached) return cached;
  const { ctx } = makeLayer(CAT_SIZE);
  drawCatHead(ctx, config, typing, frame, gaze, { ...pose, closeEyes, scale: placement.scale, maskFur: true });
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

function photoBodyMask(
  config: CatRenderConfig, layers: ReturnType<typeof frontCatLayers>, geometry: CatInkGeometry,
) {
  const { body, retouch } = layers;
  const cached = photoBodyMasks.get(body);
  if (cached) return cached;
  const native = readBodyPixels(retouch ?? (config.palette === 'CC01' ? orangePath : breedPath(config.palette)) + 'body');
  const stock = retouch ? native : bodyGuide('body');
  const data = outlineGuidePixels(body);
  const allowed = opaqueFurMask(data, stock, native, config);
  if (config.tail !== 'CT01' && geometry.tail?.mask) {
    const path = (Object.hasOwn(sharedTailStyles, config.tail) ? tailArtPaths[layers.tailArtVersion] : tailPath)
      + 'idle_' + config.tail;
    const raw = readBodyPixels(path);
    const tail = opaqueFurMask(data, raw, raw, config);
    for (let i = 0; i < inkArea; i++) if (geometry.tail.mask[i]) allowed[i] = tail[i]!;
  }
  photoBodyMasks.set(body, allowed);
  return allowed;
}

function photoBodyFur(
  config: CatRenderConfig, typing: boolean, frame: number, pose: CatPose, layers: ReturnType<typeof frontCatLayers>,
) {
  const { body, frontPaws, historicalBody, sharedRestingOutline, rearPawSpurs } = layers;
  // New photo results use the front-facing body and the separate moving
  // paws. Historical typing cels mix fur and props and have no such contract.
  if (historicalBody) return {};
  const geometry = catBodyInkGeometry(config, typing, frame, pose, layers);
  let cache = photoBodyGeometry.get(body);
  if (!cache) photoBodyGeometry.set(body, cache = new WeakMap());
  const cached = cache.get(geometry);
  if (cached) return cached;
  // A thinner sole should retain the same photo brush protection as v25.
  let allowed = photoBodyMask(config, { ...layers, body: layers.bodyBeforeSoles }, geometry);
  // Restoring fur must retain the protection of each affected older outline.
  const priorVersions = [
    ...(sharedRestingOutline ? ['pixel80-v21' as const] : []),
    ...(rearPawSpurs ? ['pixel80-v22' as const] : []),
    ...(rearPawSpurs && (pose.artVersion === combinedRestingArtVersion || hasRefinedResting(pose.artVersion)) ? ['pixel80-v26' as const] : []),
    ...(rearPawSpurs && (pose.artVersion === combinedRestingArtVersion || hasRefinedResting(pose.artVersion)) && sharedOutlineBreed(config)
      ? ['pixel80-v16' as const, 'pixel80-v17' as const] : []),
  ];
  for (const artVersion of priorVersions) {
    const previousPose: CatPose = { ...pose, artVersion };
    const previousLayers = frontCatLayers(config, false, frame, previousPose);
    const previousGeometry = catBodyInkGeometry(config, false, frame, previousPose, previousLayers);
    const previousMask = photoBodyMask(config, previousLayers, previousGeometry);
    allowed = allowed.map((pixel, i) => pixel && previousMask[i] ? 1 : 0);
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
  const restingHead = typing && usesRestingTyping(pose);
  const headTyping = typing && !restingHead;
  const headFrame = restingHead ? 0 : frame;
  const placement = catHeadPlacement(headTyping, headFrame, pose.typingLayout);
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  if (typing) {
    ctx.translate(placement.x, placement.y);
    ctx.scale(placement.scale, placement.scale);
  }
  drawCatHead(ctx, config, headTyping, headFrame, gaze, { ...pose, scale: placement.scale });
  const headCover = catLayerAlpha(canvas);
  const head = photoHeadFur(config, headTyping, headFrame, gaze, pose);
  const mouth = restingHead ? restingTypingMouth(config, pose) : undefined;
  const mouthCover = mouth && catLayerAlpha(mouth);
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
  const clothing = config.clothing ? catLayerAlpha(clothingFrame(config.clothing, layers.frontPaws)) : undefined;
  const hidden = {
    head: upperCover.map((pixel, i) => pixel || pawCover?.[i] || mouthCover?.[i] ? 1 : 0),
    body: upperCover.map((pixel, i) => pixel || pawCover?.[i] || headCover[i] || clothing?.[i] ? 1 : 0),
    paws: pawCover ? upperCover : upperCover.map((pixel, i) => pixel || headCover[i] || clothing?.[i] ? 1 : 0),
  };
  const all = new Uint8Array(inkArea).fill(1);
  return {
    ...restrictFurParts(body, ['torso', 'tail'], all, hidden.body),
    ...restrictFurParts(body, ['leftPaw', 'rightPaw'], all, hidden.paws),
    ...restrictFurParts(head, headInkParts, all, hidden.head),
  };
}

function drawCatFront(ctx: CanvasRenderingContext2D, config: CatRenderConfig, typing: boolean, frame: number, gaze: Gaze, pose: CatPose,
  closeEyes = false, liftedPaws: readonly FrontPaw[] = [], restingAppearance?: CatConfig,
) {
  const layers = frontCatLayers(config, typing, frame, pose);
  const { body, frontPaws, laptop, raisedPaws, mode, animation, outlineVersion, laptopVersion } = layers;
  const recipe = restingAppearance && coatRecipeFor(restingAppearance, pose);
  const stock = recipe ? recipe.art.canvas : restingAppearance && approvedStockIdle(restingAppearance, pose);
  const arms = restingAppearance && frontPaws ? pawsFromRestingArt(frontPaws, stock || body) : layers.arms;
  const layout = pose.typingLayout;
  const custom = pose.custom;
  const ink = custom?.ink;
  const furOnly = ink?.scope === 'photo-fur';
  const legacyCustom = ink ? undefined : custom;
  const effort = closeEyes || hasEffortEyes(typing, frame, { ...pose, typingMode: mode });
  const sameIdle = !typing && legacyCustom?.source.action === 'sit';
  const placement = catHeadPlacement(typing, frame, layout);
  const tracking = legacyCustom !== undefined && gaze.space === 'pointer';
  const edits = (tracking || effort ? legacyCustom?.following : undefined) ?? legacyCustom?.paint;
  const headEdits = typing ? edits?.typingHead : edits?.idleHead;
  const torsoEdits = typing ? legacyCustom?.typingTorso
    : legacyCustom?.idleTorso;
  const fullEdits = edits?.full;
  const headOptions = {
    closeEyes, legacyConvexMouth: pose.legacyConvexMouth, scale: placement.scale, earLayout: pose.earLayout, faceEdges: pose.faceEdges, artVersion: pose.artVersion,
    markingLayout: pose.markingLayout, legacyNoseOutline: pose.legacyNoseOutline, outlineVersion,
    hideGlints: tracking ? [true, true] as const : legacyCustom?.fixedGlints,
    typingMode: mode, typingAnimation: animation, typingEffects: pose.typingEffects,
    typingInkVersion: pose.typingInkVersion, typingMouthVersion: pose.typingMouthVersion,
  };
  const fallingLetters = typing && usesFallingTyping(animation) && pose.typingEffects !== false
    && (mode !== 'fast' || animation === 'front-v6');
  const frenzyEffects = fallingLetters && mode === 'frenzy';

  // Work in actual 320px coordinates; the outer renderer uses 160 logical units.
  ctx.save();
  ctx.scale(0.5, 0.5);
  if (!typing) ctx.translate(0, placement.y);
  const headX = typing ? placement.x : 0;
  const headY = typing ? placement.y : 0;
  if (fallingLetters) drawFallingTypingCel(ctx, mode, frame);
  const movingInk = furOnly && (ink.parts.leftPaw || ink.parts.rightPaw) && restingAppearance
    ? photoMovingPawFur(catBodyInkGeometry(config, typing, frame, pose, layers), layers.frontPaws!, config) : undefined;
  let furBody = movingInk;
  if (restingAppearance) {
    drawTypingRestingCat(ctx, withoutCatClothing(restingAppearance), withoutCatClothing(config), gaze, pose);
    drawCatClothing(ctx, config.clothing, pose, frontPaws);
  } else {
    const authoredTorsoPart = !layers.historicalBody && config.bodyBase === 'native'
      ? catPhotoPartFor(config.photoCoatParts, 'torso', config.palette, config.coat) : undefined;
    furBody = furOnly && bodyInkParts.some(part => ink.parts[part])
      ? photoBodyFur(config, typing, frame, pose, layers) : undefined;
    const paintedBody = withAuthoredCoatPart(body, authoredTorsoPart ? catPhotoPartPath + authoredTorsoPart : undefined);
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

    if (legacyCustom && torsoEdits) {
      const { canvas, ctx: layer } = clearCustomLayer(legacyCustom);
      layer.drawImage(patchedBody, 0, 0);
      copyCatEdits(layer, torsoEdits);
      // Pose-specific arms and props stay above the stationary torso.
      layer.globalCompositeOperation = 'destination-in';
      layer.drawImage(body, 0, 0);
      ctx.drawImage(canvas, 0, 0);
    } else {
      ctx.drawImage(patchedBody, 0, 0);
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
      const parts = furOnly ? bodyParts.filter(part => part !== 'leftPaw' && part !== 'rightPaw' || !liftedPaws.includes(part)) : bodyParts;
      applyCatInk(ctx, ink, furBody ?? catBodyInkGeometry(config, typing, frame, pose, layers), parts);
    }

    drawCatClothing(ctx, config.clothing, pose, frontPaws);
    ctx.save();
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
      const geometry = furOnly ? photoHeadFur(config, typing, frame, gaze, pose, closeEyes)
        : catHeadInkGeometry(config, typing, pose);
      applyCatInk(ctx, ink, geometry, headInkParts);
      ctx.restore();
    }
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
  } else if (sameIdle && fullEdits) {
    ctx.save();
    ctx.translate(0, -catHeadPlacement(false, legacyCustom.source.frame).y);
    copyCatEdits(ctx, fullEdits);
    ctx.restore();
  }
  if (!restingAppearance && tracking && !effort) {
    ctx.translate(headX, headY);
    ctx.scale(placement.scale, placement.scale);
    // Paint the moving reflection above the custom iris while respecting erasures.
    ctx.globalCompositeOperation = 'source-atop';
    drawCatGlints(ctx, config, typing, frame, gaze, placement.scale, undefined, pose.artVersion);
  }
  ctx.restore();
  if (!restingAppearance && ink?.parts.canvas) {
    ctx.save();
    ctx.scale(0.5, 0.5);
    applyCatInk(ctx, ink, canvasInkGeometry, ['canvas']);
    ctx.restore();
  }
}

function createCatDragBuffers() {
  const source = makeLayer(CAT_SIZE);
  const front = makeLayer(CAT_SIZE);
  const tail = makeLayer(CAT_SIZE);
  return { source, front, tail, frontPixels: front.ctx.createImageData(CAT_SIZE, CAT_SIZE),
    tailPixels: tail.ctx.createImageData(CAT_SIZE, CAT_SIZE) };
}

let dragBuffers: ReturnType<typeof createCatDragBuffers> | undefined;
let dragSource: {
  appearance: CatConfig; gaze: Gaze; frame: number; pose: CatPose;
  pixels: Uint32Array; jelly?: ReturnType<typeof splitJellySprite>;
} | undefined;

function sameRestingPose(previous: CatPose, next: CatPose) {
  const keys = Object.keys(next) as (keyof CatPose)[];
  return keys.length === Object.keys(previous).length && keys.every(key => next[key] === previous[key]);
}

function drawDraggingCat(ctx: CanvasRenderingContext2D, appearance: CatConfig, config: CatRenderConfig,
  frame: number, gaze: Gaze, pose: CatPose, jelly: JellyPose | undefined, stretch: number,
) {
  const buffers = dragBuffers ??= createCatDragBuffers();
  const source = buffers.source.ctx;
  if (dragSource?.appearance !== appearance || dragSource.gaze !== gaze || dragSource.frame !== frame
    || !sameRestingPose(dragSource.pose, pose)) {
    source.resetTransform();
    source.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
    source.scale(CAT_SIZE / SIZE, CAT_SIZE / SIZE);
    drawRestingCat(source, appearance, config, frame, gaze, pose);
    const image = source.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
    dragSource = { appearance, gaze, frame, pose, pixels: new Uint32Array(image.data.buffer) };
  }

  if (jelly) {
    if (!dragSource.jelly) {
      const layers = frontCatLayers(config, false, frame, pose);
      const tailMask = catBodyInkGeometry(config, false, frame, pose, layers).tail?.mask;
      const offset = catHeadPlacement(false, frame).y * CAT_SIZE / SIZE / 2;
      const placedTail = offset && tailMask ? tailMask.map((_, index) => tailMask[index - offset * CAT_SIZE] ?? 0) : tailMask;
      dragSource.jelly = splitJellySprite(dragSource.pixels, placedTail);
    }
    warpJellySprite(dragSource.jelly, jelly, buffers.frontPixels, buffers.tailPixels);
    buffers.tail.ctx.putImageData(buffers.tailPixels, 0, 0);
    ctx.drawImage(buffers.tail.canvas, 0, 0);
  } else {
    warpStretchSprite(dragSource.pixels, stretch, buffers.frontPixels);
  }
  buffers.front.ctx.putImageData(buffers.frontPixels, 0, 0);
  ctx.drawImage(buffers.front.canvas, 0, 0);
}

function petLoveClosedEyes(open: Uint32Array, closedFace: Uint32Array,
  roles?: Uint8ClampedArray, openFace?: Uint32Array, unpainted?: Uint32Array, hat?: Uint8Array,
) {
  const size = petLoveGrid;
  const closed = open.slice();
  const eyes = new Uint8Array(open.length);
  const lids = catLayerAlpha(imageFor(catPetLove.path + 'eyes'));
  const step = CAT_SIZE / size;
  for (let y = 22; y <= 34; y++) {
    for (let x = 18; x <= 57; x++) {
      if (x > 34 && x < 42) continue;
      const i = y * size + x;
      const role = roles?.[i * 4 + 1];
      const sample = (y * step + step / 2) * CAT_SIZE + x * step + step / 2;
      if (hat?.[sample]) continue;
      const lid = lids[sample];
      if (lid || role === coatPart.leftEye || role === coatPart.rightEye || (openFace && openFace[i] !== closedFace[i])) eyes[i] = 1;
    }
  }
  // Match the layered squint's fur and ink to the neighboring colors
  // in the actual seated recipe. The rest of the head is copied verbatim.
  for (const [left, right] of [[18, 34], [42, 57]] as const) {
    const colors = new Set<number>();
    for (let y = 20; y <= 36; y++) {
      for (let x = left - 4; x <= right + 4; x++) {
        // Nose ink is not a fur swatch for either eye.
        if (x >= 34 && x <= 41 && y >= 27) continue;
        const i = y * size + x;
        if (open[i] && !eyes[i]) colors.add(open[i]!);
      }
    }
    for (let y = 22; y <= 34; y++) {
      for (let x = left; x <= right; x++) {
        const i = y * size + x;
        if (!eyes[i] || !open[i] || !closedFace[i] || (unpainted && open[i] !== unpainted[i])) continue;
        const pixel = closedFace[i]!;
        let nearest = Infinity;
        for (const color of colors) {
          const dr = (color & 255) - (pixel & 255);
          const dg = ((color >>> 8) & 255) - ((pixel >>> 8) & 255);
          const db = ((color >>> 16) & 255) - ((pixel >>> 16) & 255);
          const d = dr * dr + 2 * dg * dg + db * db;
          if (d < nearest) {
            nearest = d;
            closed[i] = color;
          }
        }
      }
    }
  }
  return closed;
}

function matchPetLoveBacking(color: number, colors: ReadonlySet<number>) {
  if (!color || colors.has(color)) return color;
  let best = color, distance = Infinity;
  for (const swatch of colors) {
    const dr = (swatch & 255) - (color & 255);
    const dg = ((swatch >>> 8) & 255) - ((color >>> 8) & 255);
    const db = ((swatch >>> 16) & 255) - ((color >>> 16) & 255);
    const error = dr * dr + 2 * dg * dg + db * db;
    if (error < distance) {
      best = swatch;
      distance = error;
    }
  }
  return best;
}

function createPetLoveBuffers() {
  const idle = makeLayer(CAT_SIZE);
  const face = makeLayer(CAT_SIZE);
  const grid = makeLayer(petLoveGrid);
  const output = grid.ctx.createImageData(petLoveGrid, petLoveGrid);
  return { idle, face, grid, output, pixels: new Uint32Array(output.data.buffer) };
}

let petLoveBuffers: ReturnType<typeof createPetLoveBuffers> | undefined;
let petLoveSource: {
  appearance: CatConfig; gaze: Gaze; pose: CatPose;
  open: Uint32Array; closed: Uint32Array; body: Uint32Array; closedBody: Uint32Array; tail: Uint32Array; tailEdits: ReadonlySet<number>;
} | undefined;

function drawPetLoveCat(ctx: CanvasRenderingContext2D, appearance: CatConfig, config: CatRenderConfig,
  gaze: Gaze, pose: CatPose, frame: number, motion: NonNullable<ReturnType<typeof catPetLovePose>>,
) {
  // Let the click draw the exact resting pose immediately. During the
  // initial still frames the same loop can prepare the small motion buffer.
  if (frame === 0) {
    drawRestingCat(ctx, appearance, config, 0, gaze, pose);
    return;
  }
  const { idle, face, grid, output, pixels } = petLoveBuffers ??= createPetLoveBuffers();
  const size = petLoveGrid;
  const step = CAT_SIZE / size;
  if (petLoveSource?.appearance !== appearance || petLoveSource.gaze !== gaze || !sameRestingPose(petLoveSource.pose, pose)) {
    const capture = (canvas: HTMLCanvasElement) => {
      grid.ctx.clearRect(0, 0, size, size);
      grid.ctx.drawImage(canvas, 0, 0, size, size);
      return new Uint32Array(grid.ctx.getImageData(0, 0, size, size).data.buffer);
    };
    idle.ctx.resetTransform();
    idle.ctx.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
    idle.ctx.scale(CAT_SIZE / SIZE, CAT_SIZE / SIZE);
    drawRestingCat(idle.ctx, appearance, config, 0, gaze, pose);
    const open = capture(idle.canvas);

    const drawFace = (closeEyes: boolean) => {
      face.ctx.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
      drawCatHead(face.ctx, config, false, 0, gaze, { ...pose, closeEyes, petLoveEyes: closeEyes });
      return capture(face.canvas);
    };
    const preset = approvedIdleByPalette.get(appearance.palette);
    const coat = coatRecipeFor(appearance, pose);
    const roles = coat?.art.roles ?? (preset && approvedStockIdle(appearance, pose) && componentRecipeArt(pose.artVersion)
      ? restingOutlinePixels(imageFor(catComponentRecipePath + preset.id + '-coat-roles')).data : undefined);
    const nativeEye = roles && preset && appearance.eye === preset.config.eye && appearance.eyeRim === preset.config.eyeRim;
    const openFace = nativeEye ? undefined : drawFace(false);
    const closedFace = drawFace(true);
    const protectedInk = pose.custom?.ink?.parts.head || pose.custom?.ink?.parts.canvas;
    let unpainted: Uint32Array | undefined;
    if (protectedInk) {
      face.ctx.resetTransform();
      face.ctx.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
      face.ctx.scale(CAT_SIZE / SIZE, CAT_SIZE / SIZE);
      drawRestingCat(face.ctx, appearance, config, 0, gaze, { ...pose, custom: undefined, approvedStockIdle: false });
      unpainted = capture(face.canvas);
      face.ctx.resetTransform();
    }
    const hat = foregroundHatLayer(config);
    const closed = petLoveClosedEyes(open, closedFace, roles, openFace, unpainted, hat && catLayerAlpha(hat));
    const layers = frontCatLayers(config, false, 0, pose);
    const tailCells = new Uint8Array(size * size);
    const tailInk = pose.custom?.ink?.parts.tail;
    const tailSurface = tailInk || !roles || preset?.config.tail !== appearance.tail
      ? catBodyInkGeometry(config, false, 0, pose, layers).tail : undefined;
    if (roles && preset?.config.tail === appearance.tail) {
      for (let i = 0; i < tailCells.length; i++) tailCells[i] = Number(roles[i * 4 + 1] === coatPart.tail);
    } else {
      const mask = tailSurface?.mask;
      if (mask) {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            tailCells[y * size + x] = mask[(y * step + step / 2) * CAT_SIZE + x * step + step / 2] ?? 0;
          }
        }
      }
    }

    // Keep the unoccluded root from the real tail layer and its visible
    // texels (including edits and erasures) from the current seated recipe.
    const layer = face.ctx;
    layer.resetTransform();
    layer.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
    if (config.tail === 'CT01') {
      layer.drawImage(layers.bodyBase, 0, 0);
      layer.globalCompositeOperation = 'destination-in';
      layer.drawImage(tailRemoval(false, pose.typingLayout), 0, 0);
      layer.globalCompositeOperation = 'source-over';
    } else {
      layer.drawImage(selectedTail(selectedTailConfig(config), false, pose.typingLayout,
        layers.outlineVersion, layers.tailArtVersion, layers.liHuaTail), 0, 0);
    }
    const tail = capture(face.canvas);
    layer.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
    layer.drawImage(layers.bodyBase, 0, 0);
    if (!layers.separated) {
      layer.globalCompositeOperation = 'destination-out';
      layer.drawImage(tailRemoval(false, pose.typingLayout), 0, 0);
      layer.globalCompositeOperation = 'source-over';
    }
    const backing = capture(face.canvas);
    const body = open.slice(), closedBody = closed.slice();
    const furColors = new Set<number>(), tailColors = new Set<number>();
    for (let i = 42 * size; i < open.length; i++) {
      if (open[i]) (tailCells[i] ? tailColors : furColors).add(open[i]!);
    }
    for (let i = 0; i < tailCells.length; i++) {
      if (!tailCells[i]) {
        tail[i] = matchPetLoveBacking(tail[i]!, tailColors);
        if (pose.custom && !open[i] && backing[i]) body[i] = closedBody[i] = petLoveClear;
        continue;
      }
      tail[i] = open[i] || (pose.custom ? petLoveClear : 0);
      body[i] = closedBody[i] = matchPetLoveBacking(backing[i]!, furColors);
    }
    protectPetLoveTailOpenings(tail);
    const tailEdits = new Set<number>();
    if (tailInk && tailSurface) {
      for (const [point, ink] of projectCatInk(tailInk, tailSurface)) {
        const x = Math.floor((point % CAT_SIZE) / step);
        const y = Math.floor(point / CAT_SIZE / step);
        const i = y * size + x;
        if (tailCells[i] && (ink ? Boolean(open[i]) : tail[i] === petLoveClear)) tailEdits.add(i);
      }
    }
    petLoveSource = { appearance, gaze, pose, open, closed, body, closedBody, tail, tailEdits };
  }
  ctx.save();
  ctx.resetTransform();
  if (!motion.squint && motion.bow < .01 && motion.shoulders < .01 && motion.tail < .01) {
    ctx.drawImage(idle.canvas, 0, 0);
  } else {
    const { open, closed, body, closedBody, tail, tailEdits } = petLoveSource;
    if (motion.tail > 0) {
      warpPetLove(motion.squint ? closedBody : body, pixels, motion);
      drawPetLoveTail(tail, pixels, motion.tail, config.tail === 'CT02' || config.tail === 'CT06' ? 60 : 65, config.tail === 'CT08', tailEdits);
    } else {
      warpPetLove(motion.squint ? closed : open, pixels, motion);
    }
    grid.ctx.putImageData(output, 0, 0);
    ctx.drawImage(grid.canvas, 0, 0, CAT_SIZE, CAT_SIZE);
  }
  drawAtlasRegion(ctx, imageFor(catPetLove.path + 'hearts'), catPetLove.hearts, motion.heartFrame, catPetLove.columns);
  ctx.restore();
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
let listeningEdits: ReadonlySet<number> | undefined;
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

function drawPixel80ListeningEyes(ctx: CanvasRenderingContext2D, frame: number, fur: Uint8ClampedArray, covered?: CatAccessorySide) {
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
    if (covered === (side === 0 ? 'left' : 'right')) continue;
    const dark = pixels.filter(i => fur[i + 3] && 3 * fur[i]! + 6 * fur[i + 1]! + fur[i + 2]! < 740).length;
    const layer = dark > pixels.length / 3 ? coloredCatIris(path, '#AA9DA8') : source;
    const offset = side * half;
    ctx.drawImage(layer, sx + offset, sy, half, height, x + offset, y, half, height);
  }
}

function seatedListeningPixels(appearance: CatConfig, config: CatRenderConfig, pose: CatPose,
  scratch: ReturnType<typeof makeLayer>,
) {
  const prepare = () => {
    const layer = scratch.ctx;
    layer.resetTransform();
    layer.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
    return layer;
  };
  const read = () => new Uint32Array(scratch.ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE).data.buffer);
  prepare().scale(2, 2);
  drawRestingCat(scratch.ctx, appearance, config, 0, noGaze, pose);
  const seated = read();
  // Derive the eyelid backing from the same coat underneath the accessory.
  const covered = coveredEye(config);
  const uncovered = withoutPixelAccessory(appearance);
  const faceConfig = withoutPixelAccessory(config);
  const hat = foregroundHatLayer(config);
  const hatCover = hat && catLayerAlpha(hat);
  const variant = coatRecipeFor(uncovered, pose);
  const stock = approvedStockIdle(uncovered, pose);
  const preset = approvedIdleByPalette.get(appearance.palette);
  const id = preset?.id as CatCoatRecipeId | undefined;
  const path = catComponentRecipePath + id + '-eyes-backing';
  const useBacking = id && (variant || stock && componentRecipeArt(pose.artVersion)) && pixel80Keys.has(path);
  let backing: Uint32Array | undefined;
  if (useBacking) {
    const layer = prepare();
    if (variant) {
      const coarse = restingOutlinePixels(imageFor(path));
      paintRecipeCoat(coarse, undefined, id, config.coat as RecipeCoat);
      const tile = makeLayer(80);
      tile.ctx.putImageData(coarse, 0, 0);
      layer.drawImage(tile.canvas, 0, 0, CAT_SIZE, CAT_SIZE);
    } else {
      layer.drawImage(imageFor(path), 0, 0, CAT_SIZE, CAT_SIZE);
    }
    backing = read();
  }

  const sameEye = backing && preset?.config.eye === config.eye && preset.config.eyeRim === config.eyeRim;
  const optionalEyeOverlay = faceConfig.accessory !== 'A00';
  let face: Uint32Array | undefined, closed: Uint32Array | undefined;
  if (!sameEye || optionalEyeOverlay) {
    drawCatHead(prepare(), faceConfig, false, 0, noGaze, pose);
    face = read();
    drawCatHead(prepare(), faceConfig, false, 0, noGaze, { ...pose, closeEyes: true });
    closed = read();
  }
  let unpainted: Uint32Array | undefined;
  if (pose.custom) {
    const base = { ...pose, custom: undefined };
    prepare().scale(2, 2);
    if (variant) drawCoatedRecipe(scratch.ctx, variant, config, appearance, 0, noGaze, base);
    else drawCatFront(scratch.ctx, config, false, 0, noGaze, base);
    unpainted = read();
  }

  // Only replace the occupied eye pixels. The authored iris-free coat
  // stays beneath the eyelid atlas, including markings that cross the eye.
  for (let y = 22 * 4; y < 35 * 4; y++) {
    for (let x = 17 * 4; x < 59 * 4; x++) {
      const side = x < 35 * 4 ? 'left' : x >= 41 * 4 ? 'right' : undefined;
      if (!side || side === covered) continue;
      const i = y * CAT_SIZE + x;
      if (!seated[i] || hatCover?.[i] || (unpainted && seated[i] !== unpainted[i])) continue;
      const authored = backing?.[i] ?? 0;
      if (face && closed) {
        if (face[i] !== closed[i] && closed[i]) seated[i] = authored || closed[i]!;
      } else if (authored) {
        seated[i] = authored;
      }
    }
  }
  return seated;
}

// Warp lenses with the same head map, then draw them over the closed eyes.
const listeningGlasses = new WeakMap<CatLayer, { source: Uint32Array; frames: Map<number, HTMLCanvasElement> }>();
function listeningGlassesFrame(layer: CatLayer, frame: number) {
  let cache = listeningGlasses.get(layer);
  if (!cache) {
    cache = { source: new Uint32Array(layerPixels(layer).data.buffer), frames: new Map() };
    listeningGlasses.set(layer, cache);
  }
  const saved = cache.frames.get(frame);
  if (saved) return saved;
  const { canvas, ctx } = makeLayer(CAT_SIZE);
  const pixels = ctx.createImageData(CAT_SIZE, CAT_SIZE);
  warpListeningPixels(cache.source, new Uint32Array(pixels.data.buffer), frame, true);
  ctx.putImageData(pixels, 0, 0);
  cache.frames.set(frame, canvas);
  return canvas;
}

function drawCatListening(ctx: CanvasRenderingContext2D, appearance: CatConfig, config: CatRenderConfig, frame: number, pose: CatPose) {
  const { custom, earLayout, outlineVersion, markingLayout, tailArtVersion, legacyNoseOutline, artVersion, approvedStockIdle } = pose;
  const basePose = { custom, earLayout, outlineVersion, markingLayout, tailArtVersion, legacyNoseOutline, artVersion,
    approvedStockIdle, staticPaws: true, faceEdges: hasB3FaceEdges(artVersion) };
  const key = JSON.stringify([appearance, config, earLayout, outlineVersion, markingLayout, tailArtVersion,
    legacyNoseOutline, artVersion, approvedStockIdle]);
  const pixel80 = pixel80Keys.has(catListening.path + 'closed_eyes');
  if (key !== listeningAppearance || listeningCustom !== custom) {
    listeningAppearance = key;
    listeningCustom = custom;
    listeningBase = undefined;
    listeningEdits = undefined;
    listeningFrames.clear();
  }
  const scratch = listeningScratch ??= makeLayer(CAT_SIZE);
  const glasses = pixel80 ? glassesLayer(config) : undefined;
  if (!listeningBase && pixel80) {
    listeningBase = glasses
      ? seatedListeningPixels({ ...appearance, eyeAccessory: 'A00' }, { ...config, eyeAccessory: 'A00' }, basePose, scratch)
      : seatedListeningPixels(appearance, config, basePose, scratch);
    const ink = custom?.ink;
    if (ink) {
      const edits = new Set<number>();
      const geometry = catHeadInkGeometry(config, false, basePose);
      for (const part of headInkParts) {
        const layer = ink.parts[part], surface = geometry[part];
        if (!layer || !surface) continue;
        for (const index of projectCatInk(layer, surface).keys()) edits.add(listeningCell(index));
      }
      listeningEdits = edits;
    }
  }
  if (!listeningBase) {
    const context = scratch.ctx;
    context.resetTransform();
    context.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
    context.scale(2, 2);
    drawCatFront(context, config, false, 0, noGaze, { custom, earLayout, outlineVersion, markingLayout, tailArtVersion, legacyNoseOutline, artVersion }, true);
    listeningBase = new Uint32Array(context.getImageData(0, 0, CAT_SIZE, CAT_SIZE).data.buffer);
  }
  let painted = listeningFrames.get(frame);
  if (!painted) {
    const layer = makeLayer(CAT_SIZE);
    const output = layer.ctx.createImageData(CAT_SIZE, CAT_SIZE);
    warpListeningPixels(listeningBase, new Uint32Array(output.data.buffer), frame, pixel80, listeningEdits);
    layer.ctx.putImageData(output, 0, 0);
    painted = {canvas: layer.canvas, fur: output.data};
    listeningFrames.set(frame, painted);
  }

  ctx.save();
  ctx.resetTransform();
  drawListeningLayer(ctx, 'notes', frame, config);
  drawListeningLayer(ctx, 'headband', frame, config);
  ctx.drawImage(painted.canvas, 0, 0);
  const hat = pixel80 && foregroundHatLayer(config);
  drawBehindForegroundHat(ctx, hat ? listeningGlassesFrame(hat, frame) : undefined, target => {
    if (pixel80) drawPixel80ListeningEyes(target, frame, painted.fur, coveredEye(config));
    else drawListeningLayer(target, 'closed_eyes', frame, config);
    if (glasses) target.drawImage(listeningGlassesFrame(glasses, frame), 0, 0);
  });
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
  const glasses = closed ? glassesLayer(config) : undefined;
  const appearance = closed ? { ...config, mouth: 'CN08' as const, eyeAccessory: glasses ? 'A00' as const : config.eyeAccessory } : config;
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
    drawBehindForegroundHat(ctx, foregroundHatLayer(config), target => {
      if (coarseProps) drawPixel80ListeningEyes(target, 0, ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE).data, coveredEye(config));
      else drawListeningLayer(target, 'closed_eyes', 0, config);
      if (glasses) target.drawImage(glasses, 0, 0);
    });
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

const approvedIdleByPalette = new Map(approvedRestingCatIds.map(id => {
  const config = readPetConfig(restDetailPresets[`preset_cat_${id}`]);
  if (config.frame !== 'CAT') throw Error(`Invalid approved resting preset: ${id}`);
  return [config.palette, { config, id }] as const;
}));

function approvedStockIdle(appearance: CatConfig, pose: CatPose) {
  const config = withoutCatClothing(appearance);
  if (!pose.approvedStockIdle || pose.custom || !hasSharedRestingOutline(pose.artVersion)) return;
  const preset = approvedIdleByPalette.get(config.palette);
  if (!preset) return;
  const refined = hasDiluteEarMark(pose.artVersion) && preset.id === 'CC12' && pixel80Keys.has(diluteEarMarkStock)
    ? diluteEarMarkStock : frontPawSolesPath + preset.id;
  // The v23/v24 development snapshots did not use the later stock lineup.
  // Their saved edit sources always reconstruct from the original layers.
  if (pose.artVersion === coatSmileArtVersion || pose.artVersion === rearPawArtVersion) return;
  const combined = combinedRestingCatPath + preset.id;
  const restoredOrange = hasRestoredOrangeBody(pose.artVersion) && preset.id === 'orange' && pixel80Keys.has(orangeStripeRestingAsset);
  const final = restoredOrange ? orangeStripeRestingAsset : updatedRestingCatPath + preset.id;
  const asset = hasRefinedResting(pose.artVersion) && pixel80Keys.has(final) ? final
    : (pose.artVersion === combinedRestingArtVersion || hasRefinedResting(pose.artVersion)) && pixel80Keys.has(combined) ? combined
    : hasThinFrontPawSoles(pose.artVersion) && pixel80Keys.has(refined) ? refined
      : (hasStandingEarMask(pose.artVersion) ? standingEarPath : approvedRestingCatPath) + preset.id;
  if (!pixel80Keys.has(asset)) return;
  // Unknown or newly added appearance options must fall back to the layered renderer.
  const keys = new Set<keyof CatConfig>([
    ...Object.keys(config) as (keyof CatConfig)[], ...Object.keys(preset.config) as (keyof CatConfig)[],
  ]);
  keys.delete('name');
  if (usesArtFeature(pose.artVersion, independentEarArtVersion)
    && standingEarSides.every(side => catEarOnSide(config, side) === catEarOnSide(preset.config, side))) {
    // The two pickers can explicitly set CE01 again when returning from a
    // swap. The effective shape is the stock shape, even with overrides.
    keys.delete('ear');
    keys.delete('leftEar');
    keys.delete('rightEar');
  }
  if ([...keys].every(key => config[key] === preset.config[key])) {
    if (componentRecipeArt(pose.artVersion)) return componentRecipeStock(preset.id, pose.artVersion);
    const appearance = catRenderConfig(config);
    let stock = withFrontGloves(imageFor(asset), appearance, pose);
    stock = withSharedTabbyCheeks(stock, appearance, pose.artVersion);
    stock = withOrangeForehead(stock, appearance, pose.artVersion);
    stock = withLiHuaCrownTone(stock, appearance, pose.artVersion);
    stock = withGoldenFlank(stock, appearance, pose);
    return withGoldenChin(stock, appearance, pose.artVersion);
  }
}

type IdleExpression = ReturnType<typeof makeLayer> & { baseline: Uint8ClampedArray; key?: string };
const approvedIdleExpressions = new WeakMap<CatLayer, IdleExpression>();

function drawApprovedIdle(ctx: CanvasRenderingContext2D, image: CatLayer, config: CatRenderConfig,
  frame: number, gaze: Gaze, pose: CatPose,
) {
  const blink = catHeadEye(config, false, frame) !== config.eye;
  let cel: CanvasImageSource = image;
  if (blink || gaze.x || gaze.y) {
    // Keep the existing blink and moving reflections over the approved still.
    // Only pixels changed by the live expression are taken from the layers.
    let expression = approvedIdleExpressions.get(image);
    // Both expression samples use the same unretouched body. The v26 stock
    // image already carries the new soles at its own frame alignment.
    const expressionPose: CatPose = hasThinFrontPawSoles(pose.artVersion) ? { ...pose, artVersion: standingEarArtVersion } : pose;
    const drawLayered = (layer: CanvasRenderingContext2D, eyeFrame: number, look: Gaze) => {
      layer.resetTransform();
      layer.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
      layer.setTransform(2, 0, 0, 2, 0, -catHeadPlacement(false, eyeFrame).y);
      drawCatFront(layer, config, false, eyeFrame, look, expressionPose);
      layer.resetTransform();
    };
    if (!expression) {
      const layer = makeLayer(CAT_SIZE);
      drawLayered(layer.ctx, 0, noGaze);
      expression = { ...layer, baseline: layer.ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE).data };
      approvedIdleExpressions.set(image, expression);
    }
    const key = blink ? 'blink' : `${gaze.space}/${gaze.x}/${gaze.y}`;
    const layer = expression.ctx;
    if (expression.key !== key) {
      drawLayered(layer, blink ? 25 : 0, gaze);
      const live = layer.getImageData(0, 0, CAT_SIZE, CAT_SIZE).data;
      layer.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
      layer.drawImage(image, 0, 0, CAT_SIZE, CAT_SIZE);
      const approved = layer.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
      const original = expression.baseline;
      for (let i = 0; i < live.length; i += 4) {
        if (live[i] === original[i] && live[i + 1] === original[i + 1]
          && live[i + 2] === original[i + 2] && live[i + 3] === original[i + 3]) continue;
        approved.data.set(live.subarray(i, i + 4), i);
      }
      layer.putImageData(approved, 0, 0);
      expression.key = key;
    }
    cel = expression.canvas;
  }
  ctx.save();
  ctx.scale(.5, .5);
  ctx.translate(0, catHeadPlacement(false, frame).y);
  ctx.drawImage(cel, 0, 0, CAT_SIZE, CAT_SIZE);
  ctx.restore();
}

// The layered renderer still owns replacements, pupil tracking and blinking.
// For independently selected features on the native coat, transfer only
// authored stock edits that are outside the features the user replaced.
const independentSeatedFeatures = new Set<keyof CatConfig>([
  'name', 'ear', 'leftEar', 'rightEar', 'earColor', 'eye', 'eyeRim', 'eyeColor',
  'innerPupil', 'innerEyeColor', 'leftEyeColor', 'rightEyeColor', 'leftInnerPupil',
  'rightInnerPupil', 'leftInnerEyeColor', 'rightInnerEyeColor', 'nose', 'noseColor',
  'mouth', 'mouthContrast',
]);
type SeatedRecipeEdit = { x: number; y: number; color: string | undefined };
const seatedRecipeEdits = new Map<string, readonly SeatedRecipeEdit[]>();

function nativeSeatedRecipeEdits(id: string) {
  const cached = seatedRecipeEdits.get(id);
  if (cached) return cached;
  const mask = restingOutlinePixels(imageFor(catComponentRecipePath + id + '-native-edit-mask')).data;
  const rgb = componentStockPixels(id);
  const edits: SeatedRecipeEdit[] = [];
  for (let i = 0; i < mask.length; i += 4) {
    if (mask[i + 3]) edits.push({
      x: i / 4 % 80, y: Math.floor(i / 320),
      color: rgb[i + 3] ? `rgb(${rgb[i]},${rgb[i + 1]},${rgb[i + 2]})` : undefined,
    });
  }
  seatedRecipeEdits.set(id, edits);
  return edits;
}

function drawSeatedRecipeEdits(ctx: CanvasRenderingContext2D, appearance: CatConfig,
  config: CatRenderConfig, frame: number, gaze: Gaze, pose: CatPose) {
  if (pose.custom || !componentRecipeArt(pose.artVersion)) return false;
  const entry = approvedIdleByPalette.get(appearance.palette);
  if (!entry) return false;
  const edits = nativeSeatedRecipeEdits(entry.id);
  if (!edits.length) return false;
  const native = entry.config;
  const keys = new Set<keyof CatConfig>([...Object.keys(appearance), ...Object.keys(native)] as (keyof CatConfig)[]);
  if ([...keys].some(key => !independentSeatedFeatures.has(key) && appearance[key] !== native[key])) return false;

  const blinkOrGaze = catHeadEye(config, false, frame) !== config.eye || Boolean(gaze.x || gaze.y);
  const sameEyes = native.eye === appearance.eye && native.eyeRim === appearance.eyeRim && !blinkOrGaze;
  const matchPupil = (side: CatPhotoEarSide) => {
    const a = catPupilStyle(appearance, side), b = catPupilStyle(native, side);
    return sameEyes && a.eyeColor === b.eyeColor && a.innerPupil === b.innerPupil && a.innerEyeColor === b.innerEyeColor;
  };
  const leftEye = matchPupil('left'), rightEye = matchPupil('right');
  const leftEar = catEarOnSide(appearance, 'left') === 'CE01' && appearance.earColor === native.earColor;
  const rightEar = catEarOnSide(appearance, 'right') === 'CE01' && appearance.earColor === native.earColor;
  const nose = appearance.nose === native.nose && appearance.noseColor === native.noseColor;
  const mouth = appearance.mouth === native.mouth && appearance.mouthContrast === native.mouthContrast;
  const active = edits.filter(({x, y}) => {
    // Reserve the reach of replacement pieces, including the backing
    // they expose beyond the smaller default silhouette.
    if (y < 23 && (x < 30 && !leftEar || x >= 46 && !rightEar)) return false;
    if (y >= 23 && y <= 33 && (x >= 19 && x <= 34 && !leftEye || x >= 41 && x <= 55 && !rightEye)) return false;
    return !(x >= 31 && x <= 43 && (y >= 28 && y <= 34 && !nose || y >= 32 && y <= 38 && !mouth));
  });
  if (!active.length) return false;
  const background = active.some(edit => !edit.color) ? ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE) : undefined;
  drawCatFront(ctx, config, false, frame, gaze, pose);
  ctx.save();
  ctx.scale(.5, .5);
  ctx.translate(0, catHeadPlacement(false, frame).y);
  for (const {x, y, color} of active) {
    if (color) {
      ctx.fillStyle = color;
      ctx.fillRect(x * 4, y * 4, 4, 4);
    } else if (background) {
      const transform = ctx.getTransform();
      const top = transform.transformPoint({ x: x * 4, y: y * 4 });
      const bottom = transform.transformPoint({ x: x * 4 + 4, y: y * 4 + 4 });
      // Restore the action effect behind a removed silhouette cell.
      ctx.putImageData(background, 0, 0, top.x, top.y, bottom.x - top.x, bottom.y - top.y);
    }
  }
  ctx.restore();
  return true;
}

type CoatedRecipeArt = {
  canvas: HTMLCanvasElement;
  roles: Uint8ClampedArray;
  mouthBacking?: Uint8ClampedArray;
  forehead?: Uint8ClampedArray;
  earSwatches?: readonly [readonly number[], readonly number[]];
};
type CoatedRecipe = {
  art: CoatedRecipeArt;
  baseline: CatConfig;
};
const coatedRecipeArt = new Map<string, CoatedRecipeArt>();
const coatOptionsWithOwnParts = new Set<keyof CatConfig>(['coat', 'tail', 'accessory', 'accessorySide', 'eyeAccessory', 'eyeAccessorySide', 'headphoneColor']);
const coatRecipeFeatures = [...independentSeatedFeatures, ...coatOptionsWithOwnParts].filter(key => key !== 'name' && key !== 'coat');

function recipeEarSwatches(pixels: Uint8ClampedArray, roles: Uint8ClampedArray,
  forehead: Uint8ClampedArray): readonly [readonly number[], readonly number[]] {
  const left = new Set<number>(), right = new Set<number>();
  for (let i = 0; i < pixels.length; i += 4) {
    if (!pixels[i + 3]) continue;
    const part = roles[i + 1];
    const rgb = pixels[i]! << 16 | pixels[i + 1]! << 8 | pixels[i + 2]!;
    if (part === coatPart.leftEar) left.add(rgb);
    else if (part === coatPart.rightEar) right.add(rgb);
    else if (forehead[i + 3]) (i / 4 % 80 < 38 ? left : right).add(rgb);
  }
  return [[...left], [...right]];
}

function nearestEarSwatch(r: number, g: number, b: number, swatches: readonly number[]) {
  let result = r << 16 | g << 8 | b;
  let best = Infinity;
  for (const rgb of swatches) {
    const difference = 2 * ((rgb >>> 16) - r) ** 2 + 3 * ((rgb >>> 8 & 255) - g) ** 2 + ((rgb & 255) - b) ** 2;
    if (difference < best) {
      result = rgb;
      best = difference;
    }
  }
  return result;
}

function coatRecipeFor(appearance: CatConfig, pose: CatPose): CoatedRecipe | undefined {
  const config = withoutCatClothing(appearance);
  if (!hasCuratedCoatRecipes(pose.artVersion) || !componentRecipeArt(pose.artVersion)
    || (pose.custom && (!pose.custom.ink || pose.custom.ink.scope === 'photo-fur'))) return;
  const preset = approvedIdleByPalette.get(config.palette);
  if (!preset) return;
  const native = preset.config;
  const paintedCoat = catCoatCards[config.palette]?.slice(1).some(card => card.id === config.coat);
  const swappedStock = config.coat === native.coat && hasIndependentCrown(config, pose.artVersion);
  if (!paintedCoat && !swappedStock) return;
  const keys = new Set<keyof CatConfig>([...Object.keys(config), ...Object.keys(native)] as (keyof CatConfig)[]);
  if ([...keys].some(key => !independentSeatedFeatures.has(key) && !coatOptionsWithOwnParts.has(key)
    && config[key] !== native[key])) return;
  const id = preset.id as CatCoatRecipeId;
  const independent = usesArtFeature(pose.artVersion, independentEarArtVersion);
  const key = id + '/' + config.coat + '/' + pose.artVersion;
  let art = coatedRecipeArt.get(key);
  if (!art) {
    const { canvas, ctx } = makeLayer(80);
    ctx.drawImage(componentRecipeStock(id, pose.artVersion), 0, 0, 80, 80);
    const pixels = ctx.getImageData(0, 0, 80, 80);
    const roles = restingOutlinePixels(imageFor(catComponentRecipePath + id + '-coat-roles')).data;
    const forehead = independent ? restingOutlinePixels(imageFor(catForeheadLockPath + id)).data : undefined;
    if (paintedCoat) {
      paintRecipeCoat(pixels, roles, id, config.coat as RecipeCoat);
      ctx.putImageData(pixels, 0, 0);
      const backing = restingOutlinePixels(imageFor(catComponentRecipePath + id + '-mouth-backing'));
      paintRecipeCoat(backing, undefined, id, config.coat as RecipeCoat);
      art = { canvas, roles, mouthBacking: backing.data, forehead };
    } else {
      art = { canvas, roles, forehead };
    }
    if (forehead) art.earSwatches = recipeEarSwatches(pixels.data, roles, forehead);
    coatedRecipeArt.set(key, art);
  }
  return { art, baseline: { ...native, coat: config.coat } };
}

type RecipeDetails = ReturnType<typeof makeLayer> & { baseline: ImageData; key?: string };
const recipeDetails = new WeakMap<CoatedRecipeArt, RecipeDetails>();

function drawCoatedRecipe(ctx: CanvasRenderingContext2D, recipe: CoatedRecipe, config: CatRenderConfig,
  appearance: CatConfig, frame: number, gaze: Gaze, pose: CatPose,
) {
  const { art, baseline } = recipe;
  const original = catRenderConfig(baseline);
  const blink = catHeadEye(config, false, frame) !== config.eye;
  const hasOptions = coatRecipeFeatures.some(k => config[k] !== original[k]);
  const ink = pose.custom?.ink;
  let cel: CanvasImageSource = art.canvas;
  if (hasOptions || blink || gaze.x || gaze.y || ink) {
    const detailPose = { ...pose, custom: undefined, staticPaws: true, faceEdges: true };
    const layerFrame = blink ? 25 : 0;
    const renderParts = (target: CanvasRenderingContext2D, selected: CatRenderConfig, f: number, look: Gaze) => {
      target.resetTransform();
      target.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
      target.setTransform(2, 0, 0, 2, 0, -catHeadPlacement(false, f).y);
      drawCatFront(target, selected, false, f, look, detailPose);
      target.resetTransform();
    };
    // The reference comparison selects actual changes produced by the part
    // renderer. The stock recipe supplies all pixels those options leave alone.
    let detail = recipeDetails.get(art);
    if (!detail) {
      const layer = makeLayer(CAT_SIZE);
      renderParts(layer.ctx, original, 0, noGaze);
      detail = { ...layer, baseline: layer.ctx.getImageData(0, 0, CAT_SIZE, CAT_SIZE) };
      recipeDetails.set(art, detail);
    }
    const key = ink ? undefined : JSON.stringify([coatRecipeFeatures.map(k => config[k]), blink, gaze, pose.legacyConvexMouth]);
    if (!key || detail.key !== key) {
      const layer = detail.ctx;
      renderParts(layer, config, layerFrame, gaze);
      const selected = layer.getImageData(0, 0, CAT_SIZE, CAT_SIZE).data;
      layer.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
      layer.drawImage(art.canvas, 0, 0, CAT_SIZE, CAT_SIZE);
      const result = layer.getImageData(0, 0, CAT_SIZE, CAT_SIZE);
      const replace = new Set<number>();
      const earChanges = hasIndependentCrown(config, pose.artVersion) ? earEditsFor(config) : [];
      if (!earChanges.length) {
        if (catEarOnSide(config, 'left') !== catEarOnSide(original, 'left')) replace.add(coatPart.leftEar);
        if (catEarOnSide(config, 'right') !== catEarOnSide(original, 'right')) replace.add(coatPart.rightEar);
      }
      if (config.eye !== original.eye || blink) {
        replace.add(coatPart.leftEye);
        replace.add(coatPart.rightEye);
      }
      if (config.nose !== original.nose) replace.add(coatPart.nose);
      if (config.mouth !== original.mouth) replace.add(coatPart.mouth);
      if (config.tail !== original.tail) replace.add(coatPart.tail);
      const sameNose = config.nose === original.nose;
      const coloredNose = config.noseColor !== original.noseColor;
      for (let i = 0; i < selected.length; i += 4) {
        const x = Math.floor((i / 4 % CAT_SIZE) / 4), y = Math.floor(i / 4 / CAT_SIZE / 4);
        const coarse = (y * 80 + x) * 4;
        const part = art.roles[coarse + 1]!;
        if (earChanges.length && art.forehead?.[coarse + 3] && config.accessory === original.accessory) continue;
        // Sample the live ear once on the same 80×80 grid as the stock
        // recipe, then use that side's approved pigments for the new cel.
        const sample = earChanges.length ? ((y * 4 + 2) * CAT_SIZE + x * 4 + 2) * 4 : i;
        const swappedEar = earChanges.find(change => change.removed[sample / 4] || change.added[sample / 4]);
        // Changing the mouth should not replace NO05 with the wider nose
        // sometimes present in the legacy expression cel.
        if (sameNose && y >= 29 && y <= 31 && x >= 34 && x <= 41
          && !(coloredNose && part === coatPart.nose)) continue;
        if (swappedEar && art.earSwatches) {
          if (!selected[sample + 3]) {
            result.data.fill(0, i, i + 4);
          } else if (config.earColor === original.earColor) {
            const palette = art.earSwatches[swappedEar.side === 'left' ? 0 : 1];
            const rgb = nearestEarSwatch(selected[sample]!, selected[sample + 1]!, selected[sample + 2]!, palette);
            result.data.set([rgb >>> 16, rgb >>> 8 & 255, rgb & 255, 255], i);
          } else {
            result.data.set(selected.subarray(sample, sample + 4), i);
          }
        } else if (pixelDiffers(detail.baseline.data, selected, i) || replace.has(part)) {
          result.data.set(selected.subarray(i, i + 4), i);
        }
      }
      layer.putImageData(result, 0, 0);
      if (ink) {
        const geometry = catInkGeometry(appearance, false, 0, pose);
        applyCatInk(layer, ink, geometry, [...bodyInkParts, ...headInkParts, 'canvas']);
      }
      detail.key = key;
    }
    cel = detail.canvas;
  }
  ctx.save();
  ctx.scale(.5, .5);
  ctx.translate(0, catHeadPlacement(false, frame).y);
  ctx.drawImage(cel, 0, 0, CAT_SIZE, CAT_SIZE);
  ctx.restore();
}

function withoutPixelAccessory<T extends CatConfig | CatRenderConfig>(look: T): T {
  const accessory = isPixelCatAccessory(look.accessory) ? 'A00' : look.accessory;
  if (accessory === look.accessory && look.eyeAccessory === 'A00') return look;
  const bare = { ...look, accessory, eyeAccessory: 'A00' as const };
  if (accessory === 'A00') delete bare.accessorySide;
  delete bare.eyeAccessorySide;
  return wearsEarStowingHat(look) ? withUprightEars(bare) : bare;
}

function drawRestingCat(ctx: CanvasRenderingContext2D, appearance: CatConfig, config: CatRenderConfig,
  frame: number, gaze: Gaze, pose: CatPose,
): boolean {
  // Render the selected coat and features before placing the accessory on top.
  if (isPixelCatAccessory(config.accessory) || config.eyeAccessory !== 'A00') {
    const accessory = catAccessoryLayer(config)!;
    const base = drawRestingCat(ctx, withoutPixelAccessory(appearance),
      withoutPixelAccessory(config), frame, gaze, pose);
    ctx.save();
    ctx.scale(.5, .5);
    ctx.translate(0, catHeadPlacement(false, frame).y);
    stowEarsUnderHat(ctx, config);
    ctx.drawImage(accessory, 0, 0);
    ctx.restore();
    return base;
  }
  if (config.clothing) {
    const base = drawRestingCat(ctx, withoutCatClothing(appearance), withoutCatClothing(config), frame, gaze, pose);
    ctx.save();
    ctx.scale(.5, .5);
    ctx.translate(0, catHeadPlacement(false, frame).y);
    drawCatClothing(ctx, config.clothing, pose);
    ctx.restore();
    return base;
  }
  const variant = coatRecipeFor(appearance, pose);
  if (variant) {
    drawCoatedRecipe(ctx, variant, config, appearance, frame, gaze, pose);
    return true;
  }
  const approved = approvedStockIdle(appearance, pose);
  if (approved) drawApprovedIdle(ctx, approved, config, frame, gaze, pose);
  else if (!drawSeatedRecipeEdits(ctx, appearance, config, frame, gaze, pose)) {
    drawCatFront(ctx, config, false, frame, gaze, pose);
  }
  return Boolean(approved);
}

const restingPawFrames = new WeakMap<CatLayer, WeakMap<HTMLCanvasElement, HTMLCanvasElement>>();

function pawsFromRestingArt(geometry: HTMLCanvasElement, resting: CatLayer) {
  let frames = restingPawFrames.get(resting);
  if (!frames) restingPawFrames.set(resting, frames = new WeakMap());
  const cached = frames.get(geometry);
  if (cached) return cached;

  const { canvas, ctx } = makeLayer(CAT_SIZE);
  ctx.drawImage(resting, 0, 0, CAT_SIZE, CAT_SIZE);
  const sample = (x: number, y: number) => ctx.getImageData(x * 4 + 2, y * 4 + 2, 1, 1).data;
  // The paired forward toe cells hold the actual coat, underside and ink
  // colors from the seated art, including different colors on each side.
  const swatches = [30, 45].map((x, side) => {
    const fur = sample(x, 67);
    const shadow = sample(x, 70);
    const ink = sample(x + (side === 0 ? -1 : 1), 70);
    return [ink, shadow, fur];
  });
  const pixels = layerPixels(geometry);
  for (let i = 0; i < pixels.data.length; i += 4) {
    if (!pixels.data[i + 3]) continue;
    const side = i / 4 % CAT_SIZE < CAT_SIZE / 2 ? 0 : 1;
    const pigment = pixels.data[i]! < 140 ? 0 : pixels.data[i + 1]! < 245 ? 1 : 2;
    const color = swatches[side]![pigment]!;
    if (color[3]) pixels.data.set(color.subarray(0, 3), i);
  }
  ctx.putImageData(pixels, 0, 0);
  frames.set(geometry, canvas);
  return canvas;
}

function pixelDiffers(a: Uint8ClampedArray, b: Uint8ClampedArray, i: number) {
  return a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3];
}

const typingMouthPatches = new Map<string, HTMLCanvasElement>();

function restingTypingMouth(config: CatRenderConfig, pose: CatPose, backing?: Uint8ClampedArray) {
  const { artVersion, earLayout, markingLayout, legacyNoseOutline, outlineVersion, typingMode, typingAnimation, typingEffects, typingMouthVersion, legacyConvexMouth } = pose;
  const options = { artVersion, earLayout, markingLayout, legacyNoseOutline, outlineVersion, typingMode, typingAnimation, typingEffects, typingMouthVersion, legacyConvexMouth, faceEdges: true };
  const mode = typingMode ?? 'gentle';
  // The selected mouth needs no replacement when it already matches the mode.
  if (config.mouth === typingMouths[mode] || typingEffects === false) return undefined;
  const key = JSON.stringify([config, options, Boolean(backing)]);
  const saved = typingMouthPatches.get(key);
  if (saved) return saved;

  const { canvas, ctx } = makeLayer(CAT_SIZE);
  const tip = centeredNoseTip(config.nose, artVersion) ?? atlasNoseTips[config.nose as keyof typeof atlasNoseTips]
    ?? sharedNoseStyles[config.nose as keyof typeof sharedNoseStyles][1];
  // Reserve both rows of the accepted small nose. Other noses keep their
  // authored tip. The box covers the independent lips and human-edited smile.
  const x = 31 * 4, y = Math.max(config.nose === 'NO05' ? 32 * 4 : 0, tip + 1);
  const width = 13 * 4, height = 38 * 4 - y;
  const capture = (variant: { omitMouth?: boolean; mouthOnly?: boolean }) => {
    ctx.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
    drawCatHead(ctx, config, false, 0, noGaze, { ...options, ...variant });
    return ctx.getImageData(x, y, width, height).data;
  };
  const idle = capture({});
  const clean = capture({ omitMouth: true });
  const expression = capture({ mouthOnly: true });
  ctx.clearRect(0, 0, CAT_SIZE, CAT_SIZE);
  const patch = ctx.createImageData(width, height);
  for (let i = 0; i < idle.length; i += 4) {
    const restingInk = pixelDiffers(clean, idle, i);
    const actionInk = pixelDiffers(clean, expression, i);
    if (backing) {
      const coarseX = Math.floor((x + i / 4 % width) / 4);
      const coarseY = Math.floor((y + Math.floor(i / 4 / width)) / 4);
      const offset = (coarseY * 80 + coarseX) * 4;
      if (actionInk) patch.data.set(expression.subarray(i, i + 4), i);
      else if (backing[offset + 3]) patch.data.set(backing.subarray(offset, offset + 4), i);
    } else if ((restingInk || actionInk) && pixelDiffers(idle, expression, i)) {
      patch.data.set(expression.subarray(i, i + 4), i);
    }
  }
  ctx.putImageData(patch, x, y);
  if (typingMouthPatches.size >= 64) typingMouthPatches.delete(typingMouthPatches.keys().next().value!);
  typingMouthPatches.set(key, canvas);
  return canvas;
}

function drawTypingRestingCat(ctx: CanvasRenderingContext2D, appearance: CatConfig, config: CatRenderConfig,
  gaze: Gaze, pose: CatPose,
) {
  // Typing keeps its existing mouth and the corresponding fur backing.
  const expressionPose = config.mouth === 'CN05' ? { ...pose, legacyConvexMouth: true } : pose;
  ctx.save();
  ctx.scale(2, 2);
  drawRestingCat(ctx, appearance, config, 0, gaze, { ...expressionPose, staticPaws: true, faceEdges: true });
  ctx.restore();
  const variant = coatRecipeFor(appearance, pose);
  const backing = variant && appearance.mouth === variant.baseline.mouth
    && appearance.mouthContrast === variant.baseline.mouthContrast ? variant.art.mouthBacking : undefined;
  const mouth = restingTypingMouth(config, expressionPose, backing);
  if (mouth) ctx.drawImage(mouth, 0, 0);
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
    const petLove = action === 'sit' && config.frame === 'CAT' ? catPetLovePose(catPose.petLoveFrame) : undefined;
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
    } else if (config.frame === 'CAT' && petLove) {
      const { petLoveFrame, jelly, stretch, ...restingPose } = catPose;
      restingPose.staticPaws = true;
      restingPose.faceEdges = hasB3FaceEdges(artVersion);
      drawPetLoveCat(ctx, config, catRenderConfig(config, catPose.furPatternColors), gaze, restingPose, petLoveFrame!, petLove);
    } else if (config.frame === 'CAT' && action === 'sit' && catPose.fileAction) {
      drawCatFileAction(ctx, catRenderConfig(config, catPose.furPatternColors), catPose.fileAction, catPose);
    } else if (config.frame === 'CAT' && action === 'sit' && catPose.listeningFrame !== undefined) {
      drawCatListening(ctx, config, catRenderConfig(config, catPose.furPatternColors), catPose.listeningFrame, catPose);
    } else if (config.frame === 'CAT') {
      const front = catRenderConfig(config, catPose.furPatternColors);
      if (action === 'sit') {
        const { jelly, stretch = 0, ...restingPose } = catPose;
        restingPose.staticPaws = true;
        restingPose.faceEdges = hasB3FaceEdges(artVersion);
        if (stretch || jelly && (jelly.head || jelly.body || jelly.tail)) {
          ctx.resetTransform();
          drawDraggingCat(ctx, config, front, pose, gaze, restingPose, jelly, stretch);
        } else {
          return drawRestingCat(ctx, config, front, pose, gaze, restingPose);
        }
      } else {
        const alignedTyping = usesRestingTyping(catPose);
        drawCatFront(ctx, front, true, pose, gaze, { ...catPose, faceEdges: false, staticPaws: false }, false, [],
          alignedTyping ? config : undefined);
      }
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
  return false;
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

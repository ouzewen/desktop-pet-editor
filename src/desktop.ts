import { checkPhotoFurEditing, checkPhotoSplitEars } from './desktop-photo-fur-check';
import { checkDragArtwork, checkPixel80Review } from './desktop-pixel80-check';
import { catPhotoEarPigments } from './cat-photo-request';
import { vanGoghHat, vanGoghJacket, catAccessoryOriginalSide, catHeadAccessories, catPhotoEarSides, catPhotoParts } from './pet-assets';
import { appearanceFromCatPhoto, appearanceFromCatPhotoViews } from './cat-photo';
import { furPatchBounds, furPatchDimensions, furPatchLimit, furPatchPresets } from './cat-fur-patches';
import { prepareCatAssets as prepareLegacyCatAssets } from './cat-legacy-render';
import { prepareCatAssets as prepareFirstPixel80Assets } from './cat-pixel80-v1-render';
import { checkCatActions, checkDragHold } from './desktop-check';
import { catFileActionFrameAt, type CatFileAction } from './cat-file-action';
import { catListeningFrameAt } from './cat-listening';
import { Motion } from './motion';
import { options, presets } from './model';
import { canChooseCatFaceBase, catCoatCards, catCoatColors, catCoatSchemes, catFeatureColors, catHeadphoneColors, catIrisColors, catMarkingOptions, catOptions, catPaletteColors, catPresets, currentFurPatternColors,
  orangeCatOptions, readPetConfig, type CatCoatScheme, type CatConfig, type CatIrisColor, type PetConfig } from './cat';
import { catEditorImage, catEditorSide, photoFurEditorData, prepareCatCustomization, prepareStructuredCatCustomization, readCatEditSource, saveCatInk, seedCatInkForEditor,
  type CatCustomization, type CatEditSource, type CatInkSource } from './cat-custom';
import { catTypingFrameDuration, currentTypingAnimation, frenzyHeatFrameAt } from './cat-typing';
import { actions, assetsReady, catMarkingLayout, catNaturalSwatches, catArtVersionForCustomization, build84CatArtVersion, componentCatArtVersion, hasCuratedCoatRecipes, currentTypingInkVersion, frameCount, horizontalGazeRange, pointerGazeLimit, prepareCatAssets, render, type Action, type CatEdge, type Gaze, type TypingMode } from './render';

const canvas = document.querySelector('canvas')!;
let preview: { freeze: boolean; config: PetConfig; action: Action; listening: boolean; fileAction?: CatFileAction;
  typingMode: TypingMode; started: number; frenzyStarted?: number } | undefined;
let visibleSource: CatEditSource | undefined;
let visibleCustom: CatCustomization | undefined;
let visibleTransientPose = false;
let visibleApprovedIdle = false;
let custom: CatCustomization | undefined;
let customRequest = 0;
let gaze: Gaze = { x: 0, y: 0 };
const allPresets = { ...catPresets, ...presets };
let configured: PetConfig = catPresets.preset_cat_orange;
const motion = new Motion(canvas, configured, true);
const desktopReady = Promise.all([assetsReady, prepareCatAssets()]);
const pixel80Art = Boolean(import.meta.env.VITE_PET_PIXEL80_KEYS);
let paintDesktopFrame: ((now: number) => void) | undefined;

// The canvas fills the pet panel, including the transparent pixels around its silhouette.
function hasVisiblePixelAt([x, y]: [number, number]) {
  if (!(x >= 0 && x < 1 && y >= 0 && y < 1)) return false;
  const context = canvas.getContext('2d');
  return Boolean(context?.getImageData(Math.floor(x * canvas.width), Math.floor(y * canvas.height), 1, 1).data[3]);
}

function canPlayPetLoveAt(first: [number, number], second: [number, number]) {
  return !preview && motion.canPlayPetLove() && hasVisiblePixelAt(first) && hasVisiblePixelAt(second);
}

function checkPetLoveMotion() {
  const cat = readPetConfig(catPresets.preset_cat_orange);
  const dog = readPetConfig(presets.preset_m1_12);
  const sprite = document.createElement('canvas');
  const test = new Motion(sprite, cat);
  const now = Math.ceil(performance.now());
  const duration = test.playPetLove(now);
  if (duration <= 0 || test.playPetLove(now + 100) !== 0) throw Error('双击动作没有正确启动，或播放期间被重复启动');
  test.tick(now + duration - 1);
  if (test.canPlayPetLove()) throw Error('双击动作提前结束');
  test.tick(now + duration);
  const idle = document.createElement('canvas');
  render(idle, cat, 'sit', 0);
  if (!test.canPlayPetLove() || sprite.toDataURL() !== idle.toDataURL()) throw Error('双击动作结束后没有恢复待机');

  test.beginDrag(now + duration);
  if (test.playPetLove(now + duration + 1) <= 0) throw Error('后一次按下吞掉了已确认的双击动作');
  test.beginDrag(now + duration + 10);
  test.drag(0, 16, now + duration + 26);
  if (test.playPetLove(now + duration + 27) !== 0) throw Error('拖动时启动了双击动作');
  test.release(now + duration + 30);
  if (!test.canPlayPetLove()) throw Error('拖动没有取消双击动作');
  test.playPetLove(now + duration + 40);
  test.playFileAction('shredder', now + duration + 50);
  if (test.playPetLove(now + duration + 60) !== 0) throw Error('双击动作覆盖了文件动作');

  const switched = new Motion(sprite, cat);
  switched.playPetLove(now);
  switched.setConfig(dog);
  if (switched.playPetLove(now + 10) !== 0) throw Error('非猫宠物触发了双击动作');
  switched.setConfig(cat);
  if (switched.playPetLove(now + 20) <= 0) throw Error('切换宠物没有清理旧的双击动作');
  switched.cancelPetLove(now + 30);
  if (!switched.canPlayPetLove()) throw Error('隐藏宠物没有清理双击动作');
}

function readDesktopAppearance(input: unknown): PetConfig {
  const config = readPetConfig(input);
  if (config.frame === 'CAT' && config.palette === 'CC02' && !config.mouthContrast
    && (config.coat === 'jetBlack' || (config.coat === 'native' && !config.furPatches?.length))) {
    return { ...config, mouthContrast: 'light' };
  }
  return config;
}

// Show existing general coat schemes below the breed's authored variants without changing the render recipes.
type AdditionalWorkbenchCoat = Exclude<CatCoatScheme, (typeof catCoatCards)[string][number]['id']>;
const additionalWorkbenchCoats = {
  CC01: ['honey', 'cocoa', 'ivory'],
  CC02: ['darkTabby', 'deepSea', 'cocoa'],
  CC03: ['cream', 'cocoa', 'rose'],
  CC04: ['cream', 'cocoa', 'silver'],
  CC05: ['silver', 'blue', 'deepSea'],
  CC06: ['silver', 'darkTabby', 'cocoa'],
  CC07: ['honey', 'darkTabby', 'cocoa'],
  CC08: ['ivory', 'cream', 'lavender'],
  CC09: ['ivory', 'cream', 'silver'],
  CC10: ['cocoa', 'darkTabby', 'rose'],
  CC11: ['honey', 'cream', 'cocoa'],
  CC12: ['ivory', 'silver', 'lavender'],
} as const satisfies Record<CatConfig['palette'], readonly [AdditionalWorkbenchCoat, AdditionalWorkbenchCoat, AdditionalWorkbenchCoat]>;

const workbenchCoatCards = Object.fromEntries(
  Object.entries(additionalWorkbenchCoats).map(([palette, coats]) => {
    const authored = catCoatCards[palette] ?? [];
    const suggestions = coats.map(id => ({ id, name: catCoatSchemes[id].name }));
    return [palette, [...authored, ...suggestions]];
  }),
);

const portraitCrop = [16, 2, 288, 288] as const;
// The detail cards frame the matching part on the existing sitting sprite.
const partCrops = {
  ear: [52, 11, 198, 85],
  nose: [129, 111, 44, 45],
  mouth: [127, 125, 48, 39],
  tail: [188, 159, 112, 131],
} as const;

function thumbnailRenderer() {
  const sprite = document.createElement('canvas');
  const tile = document.createElement('canvas');
  const ctx = tile.getContext('2d')!;
  return (config: PetConfig, crop: readonly [number, number, number, number], overlay?: CatCustomization, approvedStockIdle = false) => {
    render(sprite, config, 'sit', 0, undefined, { custom: overlay, approvedStockIdle });
    if (sprite.title) throw Error(sprite.title);
    const [, , width, height] = crop;
    const scale = Math.min(1, 96 / width, 112 / height);
    tile.width = Math.round(width * scale);
    tile.height = Math.round(height * scale);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, ...crop, 0, 0, tile.width, tile.height);
    return tile.toDataURL('image/png').slice('data:image/png;base64,'.length);
  };
}

function renderAppearanceThumbnails() {
  const thumbnail = thumbnailRenderer();
  const orange = catPresets.preset_cat_orange;
  return {
    breeds: Object.fromEntries(Object.entries(catPresets).map(([id, config]) => [id, thumbnail(readPetConfig(config), portraitCrop)])),
    parts: Object.fromEntries((Object.keys(partCrops) as (keyof typeof partCrops)[]).map(part => [
      part, Object.fromEntries(Object.keys(catOptions[part]).map(id => [id, thumbnail(readPetConfig({ ...orange, [part]: id }), partCrops[part])])),
    ])),
  };
}

let appearanceThumbnails: ReturnType<typeof renderAppearanceThumbnails> | undefined;
function renderAccessoryThumbnails() {
  const thumbnail = thumbnailRenderer();
  const orange = catPresets.preset_cat_orange;
  const slots = ['accessory', 'eyeAccessory', 'clothing'] as const;
  return Object.fromEntries(slots.flatMap(slot => Object.keys(orangeCatOptions[slot])
    .filter(id => id !== 'A00')
    .map(id => {
      const accessory = slot === 'clothing' && id === vanGoghJacket ? vanGoghHat : orange.accessory;
      return [id, thumbnail(readDesktopAppearance({ ...orange, accessory, [slot]: id }), portraitCrop, undefined, true)];
    })));
}

let accessoryThumbnails: ReturnType<typeof renderAccessoryThumbnails> | undefined;


function setGaze(next: Gaze) {
  if (gaze.x === next.x && gaze.y === next.y && gaze.space === next.space) return;
  gaze = next;
  motion.setGaze(next);
}

const fields = (choices: typeof options | typeof catOptions | typeof orangeCatOptions | typeof catMarkingOptions) =>
  Object.fromEntries(Object.entries(choices).map(([key, values]) => [key,
    key === 'coat'
      ? Object.entries(catCoatSchemes).map(([id, { name, colors }]) => ({ id, name, colors }))
      : key === 'noseColor' || key === 'earColor'
        ? Object.entries(catFeatureColors).map(([id, option]) => ({ id, name: option.name,
          ...('color' in option ? { colors: [option.color] } : {}) }))
      : key === 'headphoneColor'
        ? Object.entries(catHeadphoneColors).map(([id, { name, shades }]) => ({ id, name, colors: [shades[2]] }))
      : Object.entries(values).map(([id, name]) => {
        if (key === 'accessory' && Object.hasOwn(catHeadAccessories, id)) {
          return { id, name, accessoryCategory: catHeadAccessories[id as keyof typeof catHeadAccessories][1],
            accessorySide: catAccessoryOriginalSide(id) };
        }
        if (key === 'eyeAccessory') return { id, name, accessorySide: catAccessoryOriginalSide(id) };
        if (choices !== options && key === 'palette') return { id, name, colors: catPaletteColors(id as CatConfig['palette']) };
        if (choices !== options && key === 'eyeColor' && Object.hasOwn(catIrisColors, id)) {
          return { id, name, colors: [catIrisColors[id as CatIrisColor]] };
        }
        return { id, name };
      }),
  ]));

Object.assign(window, {
  pet: {
    ...(pixel80Art ? {
      checkPixel80Review,
      checkDragArtwork: async () => { await desktopReady; return checkDragArtwork(); },
      checkPhotoFurEditing,
      checkPhotoSplitEars,
      checkPixel80PreviewFrame: (elapsed: number) => {
        if (!preview || !paintDesktopFrame) throw Error('工作台预览尚未就绪');
        paintDesktopFrame(preview.started + elapsed);
        if (canvas.title) throw Error(canvas.title);
        const {data} = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
        let hash = 0;
        for (let i = 0; i < data.length; i += 16) {
          hash = Math.imul(hash ^ (data[i]! | data[i + 1]! << 8 | data[i + 2]! << 16 | data[i + 3]! << 24), 16777619);
        }
        return {hash, source: visibleSource};
      },
      checkPixel80Key: async () => {
        await desktopReady;
        motion.tick();
        const reference = document.createElement('canvas');
        render(reference, configured, 'typing', 0, undefined, { typingMode: 'gentle' });
        const panelPixels = (frame: HTMLCanvasElement) => frame.getContext('2d')!
          .getImageData(102, 215, 83, 45).data;
        const live = panelPixels(canvas);
        const typing = panelPixels(reference);
        return live.every((value, offset) => value === typing[offset]);
      },
    } : {}),
    checkCat: async () => {
      await desktopReady;
      checkDragHold();
      if (!pixel80Art) return checkCatActions();
      await checkPhotoFurEditing();
      await checkPhotoSplitEars();
      await checkPixel80Review();
      checkPetLoveMotion();
      return 'cat actions ready';
    },
    check: async () => { await desktopReady; motion.tick(); if (canvas.title) throw Error(canvas.title); return 'ready'; },
    appearanceThumbnails: async () => {
      await desktopReady;
      return appearanceThumbnails ??= renderAppearanceThumbnails();
    },
    accessoryThumbnails: async () => {
      await desktopReady;
      return accessoryThumbnails ??= renderAccessoryThumbnails();
    },
    coatThumbnails: async (config: unknown) => {
      await desktopReady;
      const draft = readDesktopAppearance(config);
      if (draft.frame !== 'CAT') return {};
      const thumbnail = thumbnailRenderer();
      return Object.fromEntries((workbenchCoatCards[draft.palette] ?? []).map(({ id }) => [
        id, thumbnail(readDesktopAppearance({ ...draft, coat: id }), portraitCrop, custom, true),
      ]));
    },
    catalog: () => ({
      coatCards: catCoatCards,
      workbenchCoatCards,
      photoEarMarks: Object.fromEntries(catPhotoEarSides.map(side => [side,
        Object.entries(catPhotoParts).flatMap(([id, part]) => 'side' in part && part.side === side ? [{
          id, name: (part.placement === 'crown' ? '靠头顶' : '靠外缘') + ' · '
            + { tip: '耳尖', middle: '半耳', root: '到耳根' }[part.coverage],
        }] : []),
      ])),
      photoEarPigments: catPhotoEarPigments.map(id => ({
        id, name: { dark: '深色', orange: '橘色', brown: '棕色', gray: '灰色', white: '白色' }[id],
      })),
      furPatchPresets: furPatchPresets.map(({ shapes, ...preset }) => ({ ...preset, shapes: shapes.map(({ id, name }) => ({ id, name })) })),
      furPatchBounds, furPatchDimensions, furPatchLimit,
      faceBasePalettes: (Object.keys(catOptions.palette) as CatConfig['palette'][]).filter(canChooseCatFaceBase),
      fieldsByFrame: {
        M1: fields(options), CAT: fields(catOptions), CAT_ORANGE: fields(orangeCatOptions), CAT_MARKINGS: fields(catMarkingOptions),
      },
      presets: Object.entries(allPresets).map(([id, config]) => ({
        id, name: config.name, frame: config.frame,
        ...(config.frame === 'CAT' ? {
          palette: config.palette,
          colors: config.coat === 'native' ? catPaletteColors(config.palette) : catCoatColors(config.coat),
          naturalSwatches: catNaturalSwatches(config),
        } : {}),
      })),
    }),
    preset: (id: keyof typeof allPresets) => {
      const preset = allPresets[id];
      return preset?.frame === 'CAT' ? readPetConfig(preset) : preset;
    },
    normalize: readDesktopAppearance,
    appearanceFromPhoto: appearanceFromCatPhoto,
    appearanceFromPhotos: appearanceFromCatPhotoViews,
    gaze: (x: number, y: number) => setGaze({
      x: Math.max(horizontalGazeRange.min, Math.min(horizontalGazeRange.max, Math.round(x))),
      y: Math.max(-2, Math.min(1, Math.round(y))),
    }),
    trackPointer: (x: number, y: number) => setGaze({
      x: Math.max(-pointerGazeLimit, Math.min(pointerGazeLimit, Math.round(x))),
      y: Math.max(-pointerGazeLimit, Math.min(pointerGazeLimit, Math.round(y))),
      space: 'pointer',
    }),
    preview: (config: unknown, requested: Action | 'typing-gentle' | 'typing-fast' | 'listening' | CatFileAction, freeze = false) => {
      const fileAction = requested === 'shredder' || requested === 'zip' || requested === 'convert' ? requested : undefined;
      const action = requested === 'typing-gentle' || requested === 'typing-fast' ? 'typing'
        : requested === 'listening' || requested === 'shredder' || requested === 'zip' || requested === 'convert' ? 'sit' : requested;
      if (!Object.hasOwn(actions, action)) throw Error('未知动作');
      const appearance = readDesktopAppearance(config);
      const typingMode = requested === 'typing' ? 'frenzy' : requested === 'typing-fast' ? 'fast' : 'gentle';
      const started = performance.now();
      const frenzyStarted = appearance.frame === 'CAT' && typingMode === 'frenzy' ? preview?.frenzyStarted ?? started : undefined;
      const listening = appearance.frame === 'CAT' && requested === 'listening';
      preview = { config: appearance, action, listening, fileAction: appearance.frame === 'CAT' ? fileAction : undefined,
        typingMode, started, frenzyStarted, freeze: requested === 'sit' && freeze };
    },
    previewSnapshot: async (photoResult = false, forEditor = false) => {
      await desktopReady;
      // Read the frame after the preview loop has drawn any pending appearance changes.
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      if (canvas.title) throw Error(canvas.title);
      // Transient props and expressions are excluded from the editable sitting pose.
      const layeredTyping = visibleSource?.action === 'typing' && !visibleCustom
        && (visibleSource.artVersion === build84CatArtVersion || visibleSource.artVersion === componentCatArtVersion
          || hasCuratedCoatRecipes(visibleSource.artVersion));
      const snapshot = (visibleTransientPose || visibleApprovedIdle || layeredTyping) && visibleSource ? document.createElement('canvas') : canvas;
      if (snapshot !== canvas && visibleSource) {
        const { config, gaze, frame } = visibleSource;
        // Keep the source pixel editor and custom-preset reconstruction on the authored layers.
        render(snapshot, config, layeredTyping ? 'typing' : 'sit', visibleTransientPose ? 0 : frame, gaze,
          visibleApprovedIdle || layeredTyping ? { ...visibleSource, custom: visibleCustom } : { custom: visibleCustom });
      }
      if (photoResult && visibleCustom && visibleCustom.ink?.scope !== 'photo-fur') {
        throw Error('照片结果仍在加载，请重新打开编辑器');
      }
      let source: CatEditSource | CatInkSource | undefined = visibleSource;
      if (visibleSource && visibleCustom) {
        source = { ...visibleSource, pixelEdits: seedCatInkForEditor(snapshot, visibleSource, visibleCustom) };
      } else if (visibleSource && photoResult) {
        source = { ...visibleSource, pixelEdits: { version: 1, scope: 'photo-fur', parts: {} } };
      }
      const restricted = source && 'pixelEdits' in source && source.pixelEdits.scope === 'photo-fur' ? source : undefined;
      const side = catEditorSide(source);
      const image = source ? catEditorImage(snapshot, side) : snapshot;
      return { png: image.toDataURL('image/png'), source: source ?? null,
        ...(forEditor && restricted ? photoFurEditorData(restricted, side) : {}) };
    },
    exportPreviewPNG: async () => {
      await desktopReady;
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      if (canvas.title) throw Error(canvas.title);
      return catEditorImage(canvas, catEditorSide(visibleSource)).toDataURL('image/png');
    },
    savePixelEdits: saveCatInk,
    setCustom: async (png: string | null, reference: unknown = null) => {
      const request = ++customRequest;
      const structured = prepareStructuredCatCustomization(reference);
      if (structured?.ink) {
        custom = structured;
        motion.setCustom(custom);
        return { ...custom.source, pixelEdits: structured.ink };
      }
      if (png === null) {
        custom = undefined;
        motion.setCustom(undefined);
        return;
      }
      const artVersion = readCatEditSource(reference)?.artVersion;
      const prepareSource = artVersion === 'pixel80' ? prepareFirstPixel80Assets
        : artVersion ? prepareCatAssets : prepareLegacyCatAssets;
      await Promise.all([desktopReady, prepareSource()]);
      const image = new Image();
      image.src = png;
      await image.decode();
      if (request !== customRequest) return;
      custom = prepareCatCustomization(image, reference, preview?.config ?? configured);
      motion.setCustom(custom);
      return custom.source;
    },
    configure: (config: unknown) => {
      configured = readDesktopAppearance(config);
      motion.setConfig(configured);
    },
    beginDrag: () => motion.beginDrag(),
    drag: (dx: number, elapsed?: number) => motion.drag(dx, elapsed),
    release: () => motion.release(),
    setListening: (active: boolean) => motion.setListening(active),
    canPlayPetLoveAt,
    hasVisiblePixelAt,
    playPetLoveAt: (first: [number, number], second: [number, number]) =>
      canPlayPetLoveAt(first, second) ? motion.playPetLove() : 0,
    playPetLove: () => preview ? 0 : motion.playPetLove(),
    cancelPetLove: () => motion.cancelPetLove(),
    playFileAction: async (kind: CatFileAction) => {
      await desktopReady;
      return motion.playFileAction(kind);
    },
    setEdge: (edge: CatEdge | null) => motion.setEdge(edge),
    key: () => motion.key(),
    stopTyping: () => motion.stopTyping(),
  },
});

void desktopReady.then(() => {
  let previous = -1;
  let previousHeat: number | undefined;
  let previousPreview = preview;
  let previousGaze = gaze;
  let previousCustom = custom;
  paintDesktopFrame = (now: number) => {
    if (preview) {
      const config = preview.config;
      const isCatWalk = config.frame === 'CAT' && (preview.action === 'left' || preview.action === 'right');
      const interval = isCatWalk ? 165 : preview.action === 'typing'
        ? (config.frame === 'CAT' ? catTypingFrameDuration(preview.typingMode) : 145) : 90;
      const elapsed = Math.max(0, now - preview.started);
      const fileActionFrame = preview.fileAction ? catFileActionFrameAt(preview.fileAction, elapsed) : undefined;
      const frame = preview.fileAction ? (fileActionFrame ?? -1) : preview.freeze ? 0 : preview.listening ? catListeningFrameAt(elapsed)
        : Math.floor(elapsed / interval) % frameCount(config, preview.action);
      const frenzyHeatFrame = preview.frenzyStarted === undefined ? undefined : frenzyHeatFrameAt(now - preview.frenzyStarted);
      if (frame !== previous || frenzyHeatFrame !== previousHeat || previousPreview !== preview || previousGaze !== gaze || previousCustom !== custom) {
        const stretch = isCatWalk ? Math.sin(frame * Math.PI / 2) * (preview.action === 'left' ? -1 : 1) : 0;
        const action = isCatWalk ? 'sit' : preview.action;
        const renderedFrame = isCatWalk || preview.listening || preview.fileAction ? 0 : frame;
        const artVersion = pixel80Art ? catArtVersionForCustomization(custom) : undefined;
        visibleApprovedIdle = render(canvas, config, action, renderedFrame, gaze, {
          approvedStockIdle: !isCatWalk, artVersion,
          typingMode: preview.typingMode, typingAnimation: currentTypingAnimation, frenzyHeatFrame, laptopVersion: 'clean', outlineVersion: 'adaptive', stretch, custom,
          listeningFrame: preview.listening ? frame : undefined,
          fileAction: preview.fileAction && fileActionFrame !== undefined ? {kind: preview.fileAction, frame: fileActionFrame} : undefined,
        });
        visibleSource = config.frame === 'CAT' && (action === 'sit' || action === 'typing')
          ? { config, action, frame: renderedFrame, gaze,
            artVersion, typingMode: preview.typingMode, frenzyHeatFrame,
            typingAnimation: currentTypingAnimation, laptopVersion: 'clean', outlineVersion: 'adaptive', typingInkVersion: currentTypingInkVersion, typingMouthVersion: 'shared',
            typingLayout: 'aligned', tailArtVersion: 'clean', earLayout: 'shared', markingLayout: catMarkingLayout(config.pattern),
            furPatternColors: currentFurPatternColors, legacyNoseOutline: false }
          : undefined;
        visibleCustom = custom;
        visibleTransientPose = preview.listening || fileActionFrame !== undefined;
        previous = frame;
        previousHeat = frenzyHeatFrame;
        previousPreview = preview;
        previousGaze = gaze;
        previousCustom = custom;
      }
    } else {
      motion.tick(now);
    }
  };
  function tick(now: number) {
    paintDesktopFrame?.(now);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
});

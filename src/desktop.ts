import { checkCatActions } from './desktop-check';
import { Motion } from './motion';
import { options, presets } from './model';
import { canChooseCatFaceBase, catCoatSchemes, catFeatureColors, catIrisColors, catMarkingOptions, catOptions, catPaletteColors, catPresets, currentFurPatternColors,
  orangeCatOptions, readPetConfig, type CatConfig, type CatIrisColor, type PetConfig } from './cat';
import { prepareCatCustomization, prepareStructuredCatCustomization, saveCatInk, seedCatInkForEditor,
  type CatCustomization, type CatEditSource } from './cat-custom';
import { catTypingFrameDuration, currentTypingAnimation, frenzyHeatFrameAt } from './cat-typing';
import { actions, assetsReady, catMarkingLayout, catNaturalSwatches, currentTypingInkVersion, frameCount, horizontalGazeRange, pointerGazeLimit, prepareCatAssets, render, type Action, type CatEdge, type Gaze, type TypingMode } from './render';

const canvas = document.querySelector('canvas')!;
let preview: { config: PetConfig; action: Action; typingMode: TypingMode; started: number; frenzyStarted?: number } | undefined;
let visibleSource: CatEditSource | undefined;
let visibleCustom: CatCustomization | undefined;
let custom: CatCustomization | undefined;
let customRequest = 0;
let gaze: Gaze = { x: 0, y: 0 };
const allPresets = { ...catPresets, ...presets };
let configured: PetConfig = catPresets.preset_cat_orange;
const motion = new Motion(canvas, configured);
const desktopReady = Promise.all([assetsReady, prepareCatAssets()]);

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
      : Object.entries(values).map(([id, name]) => {
        if (choices !== options && key === 'palette') return { id, name, colors: catPaletteColors(id as CatConfig['palette']) };
        if (choices !== options && key === 'eyeColor' && Object.hasOwn(catIrisColors, id)) {
          return { id, name, colors: [catIrisColors[id as CatIrisColor]] };
        }
        return { id, name };
      }),
  ]));

Object.assign(window, {
  pet: {
    checkCat: async () => { await desktopReady; return checkCatActions(); },
    check: async () => { await desktopReady; motion.tick(); if (canvas.title) throw Error(canvas.title); return 'ready'; },
    catalog: () => ({
      faceBasePalettes: (Object.keys(catOptions.palette) as CatConfig['palette'][]).filter(canChooseCatFaceBase),
      fieldsByFrame: {
        M1: fields(options), CAT: fields(catOptions), CAT_ORANGE: fields(orangeCatOptions), CAT_MARKINGS: fields(catMarkingOptions),
      },
      presets: Object.entries(allPresets).map(([id, config]) => ({
        id, name: config.name, frame: config.frame,
        ...(config.frame === 'CAT' ? {
          palette: config.palette, colors: catPaletteColors(config.palette), naturalSwatches: catNaturalSwatches(config),
        } : {}),
      })),
    }),
    preset: (id: keyof typeof allPresets) => {
      const preset = allPresets[id];
      return preset?.frame === 'CAT' ? readPetConfig(preset) : preset;
    },
    normalize: (config: unknown) => readPetConfig(config),
    gaze: (x: number, y: number) => setGaze({
      x: Math.max(horizontalGazeRange.min, Math.min(horizontalGazeRange.max, Math.round(x))),
      y: Math.max(-2, Math.min(1, Math.round(y))),
    }),
    trackPointer: (x: number, y: number) => setGaze({
      x: Math.max(-pointerGazeLimit, Math.min(pointerGazeLimit, Math.round(x))),
      y: Math.max(-pointerGazeLimit, Math.min(pointerGazeLimit, Math.round(y))),
      space: 'pointer',
    }),
    preview: (config: unknown, requested: Action | 'typing-gentle' | 'typing-fast') => {
      const action = requested === 'typing-gentle' || requested === 'typing-fast' ? 'typing' : requested;
      if (!Object.hasOwn(actions, action)) throw Error('未知动作');
      const appearance = readPetConfig(config);
      const typingMode = requested === 'typing' ? 'frenzy' : requested === 'typing-fast' ? 'fast' : 'gentle';
      const started = performance.now();
      const frenzyStarted = appearance.frame === 'CAT' && typingMode === 'frenzy' ? preview?.frenzyStarted ?? started : undefined;
      preview = { config: appearance, action, typingMode, started, frenzyStarted };
    },
    previewSnapshot: async () => {
      await desktopReady;
      // Read the frame after the preview loop has drawn any pending appearance changes.
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      if (canvas.title) throw Error(canvas.title);
      const source = visibleSource && visibleCustom
        ? { ...visibleSource, pixelEdits: seedCatInkForEditor(canvas, visibleSource, visibleCustom) }
        : visibleSource;
      return { png: canvas.toDataURL('image/png'), source: source ?? null };
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
      await desktopReady;
      const image = new Image();
      image.src = png;
      await image.decode();
      if (request !== customRequest) return;
      custom = prepareCatCustomization(image, reference, preview?.config ?? configured);
      motion.setCustom(custom);
      return custom.source;
    },
    configure: (config: unknown) => {
      configured = readPetConfig(config);
      motion.setConfig(configured);
    },
    beginDrag: () => motion.beginDrag(),
    drag: (dx: number, elapsed?: number) => motion.drag(dx, elapsed),
    release: () => motion.release(),
    setEdge: (edge: CatEdge | null) => motion.setEdge(edge),
    key: () => motion.key(),
  },
});

void desktopReady.then(() => {
  let previous = -1;
  let previousHeat: number | undefined;
  let previousPreview = preview;
  let previousGaze = gaze;
  let previousCustom = custom;
  function tick(now: number) {
    if (preview) {
      const config = preview.config;
      const isCatWalk = config.frame === 'CAT' && (preview.action === 'left' || preview.action === 'right');
      const interval = isCatWalk ? 165 : preview.action === 'typing'
        ? (config.frame === 'CAT' ? catTypingFrameDuration(preview.typingMode) : 145) : 90;
      const frame = Math.floor(Math.max(0, now - preview.started) / interval) % frameCount(config, preview.action);
      const frenzyHeatFrame = preview.frenzyStarted === undefined ? undefined : frenzyHeatFrameAt(now - preview.frenzyStarted);
      if (frame !== previous || frenzyHeatFrame !== previousHeat || previousPreview !== preview || previousGaze !== gaze || previousCustom !== custom) {
        const stretch = isCatWalk ? Math.sin(frame * Math.PI / 2) * (preview.action === 'left' ? -1 : 1) : 0;
        const action = isCatWalk ? 'sit' : preview.action;
        const renderedFrame = isCatWalk ? 0 : frame;
        render(canvas, config, action, renderedFrame, gaze, {
          typingMode: preview.typingMode, typingAnimation: currentTypingAnimation, frenzyHeatFrame, laptopVersion: 'clean', outlineVersion: 'adaptive', stretch, custom,
        });
        visibleSource = config.frame === 'CAT' && (action === 'sit' || action === 'typing')
          ? { config, action, frame: renderedFrame, gaze, typingMode: preview.typingMode, frenzyHeatFrame,
            typingAnimation: currentTypingAnimation, laptopVersion: 'clean', outlineVersion: 'adaptive', typingInkVersion: currentTypingInkVersion, typingMouthVersion: 'shared',
            typingLayout: 'aligned', tailArtVersion: 'clean', earLayout: 'shared', markingLayout: catMarkingLayout(config.pattern),
            furPatternColors: currentFurPatternColors, legacyNoseOutline: false }
          : undefined;
        visibleCustom = custom;
        previous = frame;
        previousHeat = frenzyHeatFrame;
        previousPreview = preview;
        previousGaze = gaze;
        previousCustom = custom;
      }
    } else {
      motion.tick(now);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
});

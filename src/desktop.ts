import { checkCatActions } from './desktop-check';
import { Motion } from './motion';
import { options, presets } from './model';
import { catOptions, catPresets, readPetConfig, type PetConfig } from './cat';
import { actions, assetsReady, frameCount, prepareCatAssets, render, type Action, type Gaze } from './render';

const canvas = document.querySelector('canvas')!;
let preview: { config: PetConfig; action: Action; started: number } | undefined;
let gaze: Gaze = { x: 0, y: 0 };
const allPresets = { ...catPresets, ...presets };
const motion = new Motion(canvas, catPresets.preset_cat_orange);
const desktopReady = Promise.all([assetsReady, prepareCatAssets()]);
const fields = (choices: typeof options | typeof catOptions) =>
  Object.fromEntries(Object.entries(choices).map(([key, values]) => [
    key, Object.entries(values).map(([id, name]) => ({ id, name })),
  ]));

Object.assign(window, {
  pet: {
    checkCat: async () => { await desktopReady; return checkCatActions(); },
    check: async () => { await desktopReady; motion.tick(); if (canvas.title) throw Error(canvas.title); return 'ready'; },
    catalog: () => ({
      fieldsByFrame: { M1: fields(options), CAT: fields(catOptions) },
      presets: Object.entries(allPresets).map(([id, config]) => ({ id, name: config.name, frame: config.frame })),
    }),
    preset: (id: keyof typeof allPresets) => allPresets[id],
    normalize: (config: unknown) => readPetConfig(config),
    gaze: (x: number, y: number) => {
      gaze = {
        x: Math.max(-2, Math.min(2, Math.round(x))),
        y: Math.max(-2, Math.min(1, Math.round(y))),
      };
      motion.setGaze(gaze.x, gaze.y);
    },
    preview: (config: unknown, action: Action) => {
      if (!Object.hasOwn(actions, action)) throw Error('未知动作');
      preview = { config: readPetConfig(config), action, started: performance.now() };
    },
    configure: (config: unknown) => motion.setConfig(readPetConfig(config)),
    beginDrag: () => motion.beginDrag(),
    drag: (dx: number) => motion.drag(dx),
    release: () => motion.release(),
    key: () => motion.key(),
  },
});

void desktopReady.then(() => {
  let previous = -1;
  let previousPreview = preview;
  let previousGaze = gaze;
  function tick(now: number) {
    if (preview) {
      const isCatWalk = preview.config.frame === 'CAT' && (preview.action === 'left' || preview.action === 'right');
      const interval = isCatWalk ? 165 : preview.action === 'typing' ? (preview.config.frame === 'CAT' ? 90 : 145) : 90;
      const frame = Math.floor((now - preview.started) / interval) % frameCount(preview.config, preview.action);
      if (frame !== previous || previousPreview !== preview || previousGaze !== gaze) {
        const stretch = isCatWalk ? Math.sin(frame * Math.PI / 2) * (preview.action === 'left' ? -1 : 1) : 0;
        render(canvas, preview.config, isCatWalk ? 'sit' : preview.action, isCatWalk ? 0 : frame, gaze,
          { typingMode: 'fast', stretch });
        previous = frame;
        previousPreview = preview;
        previousGaze = gaze;
      }
    } else {
      motion.tick(now);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
});

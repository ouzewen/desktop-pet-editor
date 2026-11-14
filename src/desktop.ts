import { Motion } from './motion';
import { presets, readConfig } from './model';
import { assetsReady } from './render';

const canvas = document.querySelector('canvas')!;
const motion = new Motion(canvas, presets.preset_m1_12);

Object.assign(window, {
  pet: {
    check: async () => { await assetsReady; motion.tick(); if (canvas.title) throw Error(canvas.title); return 'ready'; },
    configure: (config: unknown) => motion.setConfig(readConfig(config)),
    beginDrag: () => motion.beginDrag(),
    drag: (dx: number) => motion.drag(dx),
    release: () => motion.release(),
    key: () => motion.key(),
  },
});

void assetsReady.then(() => {
  function tick(now: number) {
    motion.tick(now);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
});

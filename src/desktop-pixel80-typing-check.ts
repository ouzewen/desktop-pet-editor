import { catPresets, type CatConfig } from './cat';
import { catTypingFrameCount, catTypingFrameDuration, frenzyHeatFrameAt } from './cat-typing';
import { Motion } from './motion';
import { catGlintAperture, makeLayer, render, type TypingMode } from './render';

const representative = ['preset_cat_orange', 'preset_cat_black', 'preset_cat_calico'] as const;
const modes = ['fast', 'frenzy'] as const;
const size = 320;

export function checkPixel80FastTyping(ids: readonly string[]) {
  const { canvas, ctx } = makeLayer(size);
  const { canvas: live, ctx: liveCtx } = makeLayer(size);
  const pixels = (target: CanvasRenderingContext2D) =>
    new Uint32Array(target.getImageData(0, 0, size, size).data.buffer);
  const presets: Readonly<Record<string, CatConfig>> = catPresets;
  const cycles = modes.map(mode => {
    const duration = catTypingFrameDuration(mode);
    const previews = ids.flatMap(id => {
      const key = 'preset_cat_' + id;
      const config = presets[key];
      if (!config) throw Error('缺少快打预设 · ' + id);
      const signatures = new Set<number>();
      const paws = new Set<number>();
      const frames: string[] = [];
      const show = representative.some(preset => preset === key);
      for (let frame = 0; frame < catTypingFrameCount; frame++) {
        if (mode === 'frenzy' && catGlintAperture(config, true, frame, {typingMode: mode})) {
          throw Error('快打闭眼时仍使用睁眼高光 · ' + config.name);
        }
        render(canvas, config, 'typing', frame, undefined, {
          typingMode: mode, frenzyHeatFrame: mode === 'frenzy' ? frenzyHeatFrameAt(frame * duration) : undefined,
        });
        if (canvas.title) throw Error(canvas.title);
        const hash = (value: number, next: number) => Math.imul(value ^ next, 16777619);
        signatures.add(pixels(ctx).reduce(hash, 0));
        paws.add(ctx.getImageData(64, 144, 185, 41).data.reduce(hash, 0));
        if (show) frames.push(canvas.toDataURL('image/png'));
      }
      if (signatures.size < 32 || paws.size < 4) {
        throw Error(`快打动作缺帧 · ${config.name}/${mode}/${signatures.size} 整帧/${paws.size} 爪部帧`);
      }
      return show ? [{id, name: config.name, frames}] : [];
    });
    return {mode, duration, previews, frames: ids.length * catTypingFrameCount};
  });

  const modeSteps = [
    {time: 1000, keys: 1, mode: 'gentle', frame: 0},
    {time: 1070, keys: 0, mode: 'gentle', frame: 1},
    {time: 1070, keys: 4, mode: 'fast', frame: 1},
    {time: 1110, keys: 0, mode: 'fast', frame: 2},
    {time: 1110, keys: 4, mode: 'frenzy', frame: 2, elapsed: 0},
    {time: 1130, keys: 0, mode: 'frenzy', frame: 3, elapsed: 20},
    {time: 2070, keys: 0, mode: 'fast', frame: 50},
    {time: 2110, keys: 0, mode: 'gentle', frame: 51},
  ] as const satisfies readonly {time: number; keys: number; mode: TypingMode; frame: number; elapsed?: number}[];
  for (const key of representative) {
    const config = catPresets[key];
    const motion = new Motion(live, config);
    for (const step of modeSteps) {
      for (let index = 0; index < step.keys; index++) motion.key(step.time);
      motion.tick(step.time);
      render(canvas, config, 'typing', step.frame, undefined, {
        typingMode: step.mode, frenzyHeatFrame: 'elapsed' in step ? frenzyHeatFrameAt(step.elapsed) : undefined,
      });
      const actual = pixels(liveCtx);
      if (!pixels(ctx).every((pixel, index) => pixel === actual[index])) {
        throw Error(`档位切换后的画面错误 · ${config.name}/${step.mode}/${step.frame}`);
      }
    }
  }
  return {cycles, switchChecks: representative.length * modeSteps.length};
}

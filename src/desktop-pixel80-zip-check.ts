import { catPresets, catRenderConfig, type CatConfig } from './cat';
import { catFileActionDuration, catFileActionFrameAt } from './cat-file-action';
import { pixel80CatOutline } from './cat-outline';
import { Motion } from './motion';
import { catFileActions } from './pet-assets';
import { makeLayer, render } from './render';

const examples = new Set(['orange', 'black', 'calico', 'british_blue']);
const rim = [88, 55, 41, 255];

export function checkPixel80Zip(ids: readonly string[]) {
  const {canvas, ctx} = makeLayer(320);
  const {canvas: live, ctx: liveCtx} = makeLayer(320);
  const presets: Readonly<Record<string, CatConfig>> = catPresets;
  const {durations} = catFileActions.zip;
  const duration = catFileActionDuration('zip');
  const previews = ids.flatMap(id => {
    const config = presets['preset_cat_' + id];
    if (!config) throw Error('缺少压缩预设 · ' + id);
    const frames: string[] = [];
    const motion = new Motion(live, config);
    const ink = pixel80CatOutline(catRenderConfig(config));
    if (motion.playFileAction('zip', 1000) !== duration) throw Error('压缩动作播放时长错误');
    let elapsed = 0;
    for (const [frame, interval] of durations.entries()) {
      if (catFileActionFrameAt('zip', elapsed) !== frame
        || catFileActionFrameAt('zip', elapsed + interval - 1) !== frame) throw Error('压缩动作帧序错误');
      render(canvas, config, 'sit', 0, undefined, {fileAction: {kind: 'zip', frame}});
      if (canvas.title) throw Error(canvas.title);
      if (frame >= 3 && frame <= 10) {
        const front = ctx.getImageData(84, 240, 136, 4).data;
        if (!front.every((channel, i) => channel === rim[i % 4])) {
          throw Error(`前爪盖住了压缩盒前沿 · ${config.name}/${frame}`);
        }
      }
      if (frame <= 10) {
        const palms = ctx.getImageData(88, 168, 128, 72).data;
        if (!palms.some((channel, i) => i % 4 === 0 && channel === ink[0] && palms[i + 1] === ink[1]
          && palms[i + 2] === ink[2] && palms[i + 3] === 255)) throw Error('压缩时前爪失去毛色描边 · ' + config.name);
      }
      motion.tick(1000 + elapsed);
      const expected = new Uint32Array(ctx.getImageData(0, 0, 320, 320).data.buffer);
      const actual = new Uint32Array(liveCtx.getImageData(0, 0, 320, 320).data.buffer);
      if (!expected.every((pixel, index) => pixel === actual[index])) throw Error('压缩实际播放画面错误 · ' + config.name);
      if (examples.has(id)) frames.push(canvas.toDataURL('image/png'));
      elapsed += interval;
    }
    const zipper = ctx.getImageData(148, 69 * 4, 1, 1).data;
    if (zipper.join(',') !== '84,62,61,255') throw Error('压缩结束时拉链未扣到位');
    motion.tick(1000 + duration);
    if (catFileActionFrameAt('zip', elapsed) !== undefined
      || liveCtx.getImageData(148, 69 * 4, 1, 1).data.join(',') === zipper.join(',')) {
      throw Error('压缩结束后没有恢复待机 · ' + config.name);
    }
    return frames.length ? [{id, name: config.name, frames, idle: live.toDataURL('image/png')}] : [];
  });
  return {previews, frames: ids.length * durations.length, intervals: durations, duration};
}

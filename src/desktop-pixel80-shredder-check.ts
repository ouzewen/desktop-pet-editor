import { catPresets, catRenderConfig, type CatConfig } from './cat';
import { catFileActionDuration, catFileActionFrameAt } from './cat-file-action';
import { pixel80CatOutline } from './cat-outline';
import { Motion } from './motion';
import { catShredder } from './pet-assets';
import { makeLayer, render } from './render';

const examples = new Set(['orange', 'black', 'calico', 'british_blue']);

export function checkPixel80Shredder(ids: readonly string[]) {
  const { canvas, ctx } = makeLayer(320);
  const { canvas: live, ctx: liveCtx } = makeLayer(320);
  const presets: Readonly<Record<string, CatConfig>> = catPresets;
  const duration = catFileActionDuration('shredder');
  const previews = ids.flatMap(id => {
    const config = presets['preset_cat_' + id];
    if (!config) throw Error('缺少碎纸机预设 · ' + id);
    const frames: string[] = [];
    const motion = new Motion(live, config);
    if (motion.playFileAction('shredder', 1000) !== duration) throw Error('碎纸机播放时长错误');
    const ink = pixel80CatOutline(catRenderConfig(config));
    let elapsed = 0;
    for (const [frame, interval] of catShredder.durations.entries()) {
      if (catFileActionFrameAt('shredder', elapsed) !== frame
        || catFileActionFrameAt('shredder', elapsed + interval - 1) !== frame) throw Error('碎纸机动作帧序错误');
      render(canvas, config, 'sit', 0, undefined, {fileAction: {kind: 'shredder', frame}});
      if (canvas.title) throw Error(canvas.title);

      // The full lip covers both paws all the way across the intake, even
      // when the upper parts of the paws overlap the paper and slot.
      const lip = ctx.getImageData(88, 208, 124, 4).data;
      if (!lip.every((channel, index) => channel === [54, 50, 60, 255][index % 4])) {
        throw Error(`前爪穿过碎纸机进纸口前沿 · ${config.name}/${frame}`);
      }
      const leftPaw = ctx.getImageData(80, 164, 56, 44).data;
      if (!leftPaw.some((channel, i) => i % 4 === 0 && channel === ink[0] && leftPaw[i + 1] === ink[1]
        && leftPaw[i + 2] === ink[2] && leftPaw[i + 3] === 255)) throw Error('抬爪失去毛色描边 · ' + config.name);

      motion.tick(1000 + elapsed);
      const expected = new Uint32Array(ctx.getImageData(0, 0, 320, 320).data.buffer);
      const actual = new Uint32Array(liveCtx.getImageData(0, 0, 320, 320).data.buffer);
      if (!expected.every((pixel, index) => pixel === actual[index])) throw Error('碎纸机实际播放画面错误 · ' + config.name);
      if (examples.has(id)) frames.push(canvas.toDataURL('image/png'));
      elapsed += interval;
    }
    motion.tick(1000 + duration);
    if (!ctx.getImageData(180, 239, 1, 1).data[3]
      || liveCtx.getImageData(208, 284, 1, 1).data[3]) throw Error('碎纸动作结束后未恢复待机 · ' + config.name);
    return frames.length ? [{id, name: config.name, frames, idle: live.toDataURL('image/png')}] : [];
  });
  return {previews, frames: ids.length * catShredder.durations.length, intervals: catShredder.durations, duration};
}

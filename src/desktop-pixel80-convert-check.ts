import { catPresets, catRenderConfig, type CatConfig } from './cat';
import { catFileActionDuration, catFileActionFrameAt } from './cat-file-action';
import { pixel80CatOutline } from './cat-outline';
import { Motion } from './motion';
import { catFileActions } from './pet-assets';
import { makeLayer, render } from './render';

const examples = new Set(['orange', 'black', 'calico', 'british_blue']);
const edge = [54, 50, 60, 255];
const blush = '242,202,213,255';

export function checkPixel80Convert(ids: readonly string[]) {
  const {canvas, ctx} = makeLayer(320);
  const {canvas: live, ctx: liveCtx} = makeLayer(320);
  const presets: Readonly<Record<string, CatConfig>> = catPresets;
  const {durations} = catFileActions.convert;
  const duration = catFileActionDuration('convert');
  const previews = ids.flatMap(id => {
    const config = presets['preset_cat_' + id];
    if (!config) throw Error('缺少格式转换预设 · ' + id);
    const frames: string[] = [];
    const motion = new Motion(live, config);
    const ink = pixel80CatOutline(catRenderConfig(config));
    if (motion.playFileAction('convert', 1000) !== duration) throw Error('格式转换播放时长错误');
    let elapsed = 0;
    for (const [frame, interval] of durations.entries()) {
      if (catFileActionFrameAt('convert', elapsed) !== frame
        || catFileActionFrameAt('convert', elapsed + interval - 1) !== frame) throw Error('格式转换帧序错误');
      render(canvas, config, 'sit', 0, undefined, {fileAction: {kind: 'convert', frame}});
      if (canvas.title) throw Error(canvas.title);
      if ((frame >= 2 && frame <= 6) || frame === 14) {
        const rim = ctx.getImageData(92, 220, 120, 4).data;
        if (!rim.every((value, i) => value === edge[i % 4])) {
          throw Error(`爪尖穿过转换机上沿 · ${config.name}/${frame}`);
        }
      }
      if (frame >= 12 && frame <= 14) {
        const lip = ctx.getImageData(104, 240, 96, 4).data;
        if (!lip.every((value, i) => value === edge[i % 4])
          || ctx.getImageData(144, 248, 1, 1).data.join(',') !== blush) {
          throw Error(`转换后的文件穿过出件口或未露出 · ${config.name}/${frame}`);
        }
      }
      if (frame === 15) {
        const paw = ctx.getImageData(112, 208, 1, 1).data;
        const paper = ctx.getImageData(144, 220, 1, 1).data;
        if (paper.join(',') !== blush || paw.join(',') === '113,102,116,255') {
          throw Error('取件时爪子与文件层序错误 · ' + config.name);
        }
      }
      if (frame === 0 || frame === 6 || frame === 16) {
        const paw = ctx.getImageData(88, 184, 36, 40).data;
        if (!paw.some((value, i) => i % 4 === 0 && value === ink[0] && paw[i + 1] === ink[1]
          && paw[i + 2] === ink[2] && paw[i + 3] === 255)) throw Error('前爪失去毛色描边 · ' + config.name);
      }
      motion.tick(1000 + elapsed);
      const expected = new Uint32Array(ctx.getImageData(0, 0, 320, 320).data.buffer);
      const actual = new Uint32Array(liveCtx.getImageData(0, 0, 320, 320).data.buffer);
      if (!expected.every((pixel, index) => pixel === actual[index])) throw Error('格式转换实际播放画面错误 · ' + config.name);
      if (examples.has(id)) frames.push(canvas.toDataURL('image/png'));
      elapsed += interval;
    }
    motion.tick(1000 + duration);
    if (catFileActionFrameAt('convert', elapsed) !== undefined
      || liveCtx.getImageData(144, 296, 1, 1).data.join(',') === blush) {
      throw Error('格式转换结束后没有恢复待机 · ' + config.name);
    }
    return frames.length ? [{id, name: config.name, frames, idle: live.toDataURL('image/png')}] : [];
  });
  return {previews, frames: ids.length * durations.length, intervals: durations, duration};
}

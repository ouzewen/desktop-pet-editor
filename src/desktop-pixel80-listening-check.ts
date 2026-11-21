import { catHeadphoneColors, catPresets, type CatConfig } from './cat';
import { catListeningFrameAt } from './cat-listening';
import { catListening } from './pet-assets';
import { makeLayer, render } from './render';

const examples = new Set(['orange', 'black', 'calico', 'british_blue']);

export function checkPixel80Listening(ids: readonly string[]) {
  const {canvas, ctx} = makeLayer(320);
  const presets: Readonly<Record<string, CatConfig>> = catPresets;
  const previews = ids.flatMap(id => {
    const config = presets['preset_cat_' + id];
    if (!config) throw Error('缺少听歌预设 · ' + id);
    const frames: string[] = [];
    const unique = new Set<number>();
    let feet: Uint32Array | undefined;
    for (let frame = 0; frame <= catListening.frames; frame++) {
      const index = catListeningFrameAt(frame * catListening.frameDuration);
      if (index !== frame % catListening.frames) throw Error('听歌循环的帧序不连续');
      render(canvas, config, 'sit', 0, undefined, {listeningFrame: index});
      if (canvas.title) throw Error(canvas.title);
      const pixels = new Uint32Array(ctx.getImageData(0, 0, 320, 320).data.buffer);
      for (let y = 0; y < 208; y += 4) {
        for (let x = 0; x < 320; x += 4) {
          const pixel = pixels[y * 320 + x];
          for (let row = 0; row < 4; row++) {
            for (let column = 0; column < 4; column++) {
              if (pixels[(y + row) * 320 + x + column] !== pixel) {
                throw Error(`听歌动作脱离 80×80 网格 · ${config.name}/${frame}/${x},${y}`);
              }
            }
          }
        }
      }
      const lowerBody = pixels.subarray(208 * 320);
      feet ??= lowerBody;
      if (!lowerBody.every((pixel, i) => pixel === feet![i])) throw Error('听歌时下身或尾巴抖动 · ' + config.name);
      const signature = pixels.reduce((hash, pixel) => Math.imul(hash ^ pixel, 16777619), 0);
      if (frame === catListening.frames) {
        if (signature !== unique.values().next().value) throw Error('听歌动作未回到首帧');
      } else {
        unique.add(signature);
        if (examples.has(id)) frames.push(canvas.toDataURL('image/png'));
      }
    }
    if (unique.size < 18) throw Error('听歌动画缺帧 · ' + config.name);
    return frames.length ? [{id, name: config.name, frames}] : [];
  });
  for (const [color, {shades}] of Object.entries(catHeadphoneColors)) {
    const config = { ...catPresets.preset_cat_calico, ear: 'CE02', tail: 'CT07', accessory: 'A03',
      headphoneColor: color } as CatConfig;
    render(canvas, config, 'sit', 0, undefined, {listeningFrame: 6});
    const {data} = ctx.getImageData(34, 55, 234, 89);
    const pigment = parseInt(shades[2].slice(1), 16);
    if (!data.some((r, i) => i % 4 === 0 && data[i + 3] === 255
      && (r << 16 | data[i + 1]! << 8 | data[i + 2]!) === pigment)) {
      throw Error('听歌动作的耳机颜色没有应用 · ' + color);
    }
  }
  return {previews, frames: ids.length * catListening.frames, interval: catListening.frameDuration, headphoneColors: 6};
}

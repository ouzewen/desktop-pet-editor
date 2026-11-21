import { checkPixel80Parts } from './desktop-pixel80-parts-check';
import { checkPixel80FastTyping } from './desktop-pixel80-typing-check';
import { checkPixel80Listening } from './desktop-pixel80-listening-check';
import { checkPixel80Shredder } from './desktop-pixel80-shredder-check';
import { checkPixel80Zip } from './desktop-pixel80-zip-check';
import { checkPixel80Convert } from './desktop-pixel80-convert-check';
import { pixel80CatOutline, pixel80WarmOutline } from './cat-outline';
import { catPresets, catRenderConfig, currentFurPatternColors, legacyCatPresets, type CatConfig } from './cat';
import { prepareCatCustomization } from './cat-custom';
import * as original from './cat-legacy-render';
import * as firstPixel80 from './cat-pixel80-v1-render';
import { catMarkingLayout, currentTypingInkVersion, frameCount, makeLayer, prepareCatAssets, render } from './render';
import { currentTypingAnimation } from './cat-typing';
import { catFileActionDuration, type CatFileAction } from './cat-file-action';
import { Motion } from './motion';
import type { CatPose } from './render';

function checkActionTransitions() {
  const live = makeLayer(320), reference = makeLayer(320);
  const pixels = (layer: typeof live) => new Uint32Array(layer.ctx.getImageData(0, 0, 320, 320).data.buffer);
  let checks = 0;
  const examples = [catPresets.preset_cat_orange, catPresets.preset_cat_black,
    { ...catPresets.preset_cat_calico, ear: 'CE04', tail: 'CT07', accessory: 'A03' }] as const;
  for (const config of examples) {
    const motion = new Motion(live.canvas, config);
    let now = Math.ceil(performance.now());
    const verify = (label: string, pose: CatPose = {}, action: 'sit' | 'typing' = 'sit') => {
      motion.tick(now);
      render(reference.canvas, config, action, 0, undefined, pose);
      const displayed = pixels(live);
      const expected = pixels(reference);
      const diff = expected.findIndex((pixel, i) => pixel !== displayed[i]);
      if (diff >= 0) {
        throw Error(`切换后的素材画面不同 · ${config.name}/${label}/${diff % 320},${Math.floor(diff / 320)} · ${expected[diff]?.toString(16)} → ${displayed[diff]?.toString(16)}`);
      }
      checks++;
    };
    verify('待机');
    motion.setListening(true);
    verify('进入听歌', {listeningFrame: 0});
    now += 1;
    motion.key(now);
    verify('听歌切打字', {typingMode: 'gentle'}, 'typing');
    now += 1001;
    verify('停打字回听歌', {listeningFrame: 0});
    for (const kind of ['shredder', 'zip', 'convert'] satisfies CatFileAction[]) {
      now += 1;
      motion.playFileAction(kind, now);
      verify(kind, {fileAction: {kind, frame: 0}});
      now += catFileActionDuration(kind);
      verify(kind + ' → 听歌', {listeningFrame: 0});
    }
  }
  return checks;
}

export async function checkPixel80Review() {
  await Promise.all([prepareCatAssets(), original.prepareCatAssets(), firstPixel80.prepareCatAssets()]);
  const { canvas, ctx } = makeLayer(320);
  const capture = () => canvas.toDataURL('image/png');
  const matchingInk = (ink: readonly number[], x: number, y: number, width: number, height: number) => {
    const {data} = ctx.getImageData(x, y, width, height);
    let count = 0;
    for (let offset = 0; offset < data.length; offset += 4) {
      if (data[offset + 3] === 255 && ink.every((value, index) => data[offset + index] === value)) count++;
    }
    return count;
  };
  const ids = ['orange', 'black', 'calico', 'siamese', 'british_blue', 'american_shorthair', 'li_hua', 'ragdoll', 'CC09', 'CC10', 'CC11', 'CC12'] as const;
  const currentPresets: Readonly<Record<string, CatConfig>> = catPresets;
  const previousPresets: Readonly<Record<string, CatConfig>> = legacyCatPresets;
  const images = ids.map(id => {
    const key = `preset_cat_${id}`;
    const previous = previousPresets[key], current = currentPresets[key];
    if (!previous || !current) throw Error('缺少品种预设 · ' + key);
    if (current.innerPupil !== 'none') throw Error(current.name + ' 未应用单瞳');
    original.render(canvas, previous, 'sit', 0);
    const before = capture();
    render(canvas, current, 'sit', 0);
    const after = capture();
    const coat = catRenderConfig(current);
    const ink = pixel80CatOutline(coat);
    const warmInk = pixel80WarmOutline(coat.coat);
    if (warmInk && !matchingInk(warmInk, 40, 20, 242, 266)) {
      throw Error(current.name + ' 暖色分区没有使用对应描边');
    }
    const tailInk = matchingInk(ink, 244, 193, 41, 89);
    if (!tailInk) throw Error(current.name + ' 尾巴没有使用品种描边');
    if (before === after) throw Error(current.name + ' 未加载新素材');
    const frames = Array.from({length: frameCount(current, 'typing')}, (_, frame) => {
      render(canvas, current, 'typing', frame, undefined, {typingMode: 'gentle'});
      if (canvas.title) throw Error(canvas.title);
      return frame === 3 || frame === 11 ? capture() : undefined;
    });
    return {name: current.name, ink, tailInk, before, after, right: frames[3], left: frames[11], frames: frames.length};
  });

  const config = legacyCatPresets.preset_cat_orange;
  const source = {
    config, action: 'sit', frame: 0, gaze: {x: 0, y: 0}, typingMode: 'gentle',
    typingAnimation: currentTypingAnimation, laptopVersion: 'clean', outlineVersion: 'adaptive',
    typingInkVersion: currentTypingInkVersion, typingMouthVersion: 'shared', typingLayout: 'aligned',
    tailArtVersion: 'clean', earLayout: 'shared', markingLayout: catMarkingLayout(config.pattern),
    furPatternColors: currentFurPatternColors, legacyNoseOutline: false,
  } as const;
  const painted = [101, 194] as const;
  const erased = [103, 195] as const;
  const firstPixelSource = { ...source, config: { ...config, mouth: 'CN09', nose: 'NO07' }, artVersion: 'pixel80' } as const;
  const edited = makeLayer(320);
  for (const reference of [source, null, firstPixelSource]) {
    const baseline = reference ?? source;
    const baselineRenderer = reference === firstPixelSource ? firstPixel80 : original;
    baselineRenderer.render(canvas, baseline.config, 'sit', 0, baseline.gaze, baseline);
    if (!ctx.getImageData(...painted, 1, 1).data[3] || !ctx.getImageData(...erased, 1, 1).data[3]) {
      throw Error('旧档测试点离开身体');
    }
    ctx.resetTransform();
    ctx.fillStyle = '#E711D9';
    ctx.fillRect(...painted, 1, 1);
    ctx.clearRect(...erased, 1, 1);
    edited.ctx.clearRect(0, 0, 320, 320);
    edited.ctx.drawImage(canvas, 0, 0);
    const custom = prepareCatCustomization(edited.canvas, reference, config);
    const mask = custom.paint.full?.mask.getContext('2d')?.getImageData(0, 0, 320, 320).data;
    const changes = mask?.filter((value, index) => index % 4 === 3 && value > 0).length ?? 0;
    if (changes !== 2) {
      throw Error(`旧档恢复应提取两处改动 · ${reference ? '带元数据' : '纯 PNG'}实际得到 ${changes}`);
    }
    render(canvas, catPresets.preset_cat_orange, 'sit', 0, undefined, {custom});
    if (ctx.getImageData(...painted, 1, 1).data.join(',') !== '231,17,217,255'
      || ctx.getImageData(...erased, 1, 1).data[3] !== 0) throw Error('旧笔迹或擦除没有迁移到新素材');
  }
  const expressions = ['orange', 'black', 'calico', 'british_blue'].map(id => {
    const config = currentPresets['preset_cat_' + id]!;
    const noses = (['NO02', 'NO05', 'NO06', 'NO07', 'NO08'] as const).map(nose => {
      render(canvas, { ...config, nose }, 'sit', 0);
      return capture();
    });
    const mouths = (['CN08', 'CN09', 'CN05', 'CN06', 'CN07'] as const).map(mouth => {
      render(canvas, { ...config, mouth }, 'sit', 0);
      return capture();
    });
    if (new Set(noses).size !== noses.length || new Set(mouths).size !== mouths.length) {
      throw Error(config.name + ' 有鼻型或嘴型预览重复');
    }
    render(canvas, config, 'sit', 25);
    if (canvas.title) throw Error(canvas.title);
    return { id, noses, mouths, blink: capture() };
  });
  const badges: Record<string, string> = {};
  let badgePixels: string | undefined;
  for (const typingMode of ['gentle', 'fast', 'frenzy'] as const) {
    render(canvas, catPresets.preset_cat_orange, 'typing', 3, undefined, {
      typingMode, typingEffects: true, frenzyHeatFrame: typingMode === 'frenzy' ? 40 : undefined,
    });
    const mask = [];
    const colors = ctx.getImageData(132, 212, 44, 36).data;
    for (let offset = 0; offset < colors.length; offset += 4) {
      mask.push(colors[offset] === 250 && colors[offset + 1] === 249
        && colors[offset + 2] === 246 && colors[offset + 3] === 255);
    }
    const signature = mask.join(',');
    if (mask.filter(Boolean).length !== 576 || (badgePixels && badgePixels !== signature)) {
      throw Error('爪印在打字模式间不一致 · ' + typingMode);
    }
    badgePixels = signature;
    badges[typingMode] = capture();
  }
  return {images, badges, expressions, parts: checkPixel80Parts(), typing: checkPixel80FastTyping(ids),
    listening: checkPixel80Listening(ids), shredder: checkPixel80Shredder(ids), zip: checkPixel80Zip(ids),
    convert: checkPixel80Convert(ids), actionTransitions: checkActionTransitions(), legacyChecks: 3};
}

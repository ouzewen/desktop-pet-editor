import { catPresets, currentFurPatternColors, type CatConfig } from './cat';
import { photoFurEditorData, prepareStructuredCatCustomization, saveCatInk, type CatInkSource } from './cat-custom';
import { catInkParts, readCatInk, type CatInkChange } from './cat-ink';
import { appearanceFromCatPhoto } from './cat-photo';
import { currentTypingAnimation } from './cat-typing';
import { CAT_SIZE } from './pet-assets';
import { catMarkingLayout, catTypingLaptop, currentTypingInkVersion, makeLayer, prepareCatAssets, render, type TypingMode } from './render';

export async function checkPhotoFurEditing() {
  await prepareCatAssets();
  const size = CAT_SIZE;
  const layer = makeLayer(size);
  const colors = { first: 0xffff00a9, second: 0xff34aafa };
  const gaze = { x: 0, y: 0 };
  const recognized = appearanceFromCatPhoto({ cat: true, set: 'calico', tone: 'orange' }).config;
  if (recognized.frame !== 'CAT') throw Error('照片素材验收底板无效');
  const examples = [
    { ...recognized, accessory: 'A03' as const },
    { ...catPresets.preset_cat_black, ear: 'CE05' as const, tail: 'CT08' as const, accessory: 'A02' as const },
    { ...catPresets.preset_cat_british_blue, coat: 'breed:CC09' as const, ear: 'CE02' as const, tail: 'CT07' as const },
  ];
  const readPixels = () => new Uint32Array(layer.ctx.getImageData(0, 0, size, size).data.buffer);
  const pixels = (source: CatInkSource, custom = false, petLoveFrame?: number) => {
    render(layer.canvas, source.config, source.action, source.frame, source.gaze, {
      ...source, petLoveFrame, custom: custom ? prepareStructuredCatCustomization(source) : undefined,
    });
    if (layer.canvas.title) throw Error(layer.canvas.title);
    return readPixels();
  };
  const check = (condition: unknown, message: string) => {
    if (!condition) throw Error(message);
  };
  const mustThrow = (fn: () => unknown, message: string) => {
    try { fn(); } catch { return; }
    throw Error(message);
  };
  function verifyFrame(source: CatInkSource) {
    const before = pixels(source), after = pixels(source, true);
    const mask = atob(photoFurEditorData(source).furMask);
    let changed = 0;
    for (let i = 0; i < before.length; i++) {
      check((before[i]! >>> 24) === (after[i]! >>> 24), '照片笔迹改变了透明度');
      if (after[i] === before[i]) continue;
      check(mask.charCodeAt(i) === 1,
        `照片笔迹改变了锁定像素 · ${source.config.palette}/${source.action}/${source.frame}/${i % size},${Math.floor(i / size)}`);
      changed++;
    }
    check(changed > 0, '切换动作后没有显示照片笔迹');
    return { after, mask };
  }

  for (const config of examples) {
    const initial: CatInkSource = {
      config, action: 'sit', frame: 0, gaze, artVersion: 'pixel80-v2',
      typingMode: 'gentle', typingAnimation: currentTypingAnimation, laptopVersion: 'clean',
      outlineVersion: 'adaptive', typingLayout: 'aligned', earLayout: 'shared', tailArtVersion: 'clean',
      furPatternColors: currentFurPatternColors, typingInkVersion: currentTypingInkVersion, typingMouthVersion: 'shared',
      markingLayout: catMarkingLayout(config.pattern), legacyNoseOutline: false,
      pixelEdits: { version: 1, scope: 'photo-fur', parts: {} },
    };
    const untouched = pixels(initial);
    const input: CatInkChange[] = Array.from({ length: size * size }, (_, i) => [i, colors.first]);
    const saved = saveCatInk(initial, input);
    const coveredParts = Object.keys(saved.pixelEdits.parts);
    check(catInkParts.slice(1, -1).every(part => coveredParts.includes(part)),
      `整张画布落笔后毛发部位不完整 · ${config.palette}/${coveredParts}`);
    check(!saved.pixelEdits.parts.canvas && !saved.pixelEdits.parts.laptop, '写入了画布或电脑笔迹');
    const { after, mask } = verifyFrame(saved);
    for (let i = 0; i < untouched.length; i++) {
      if (mask.charCodeAt(i)) check(after[i] !== untouched[i], '当前动作下保存的毛色偏离笔迹');
    }

    if (config.accessory !== 'A00') {
      const without = pixels({ ...initial, config: { ...config, accessory: 'A00' } });
      check(without.some((value, i) => value !== untouched[i]), '配饰对照没有像素变化');
      check(without.every((value, i) => value === untouched[i] || !mask.charCodeAt(i)), '可编辑蒙版覆盖配饰');
    }
    for (const [label, alternative] of [
      ['鼻子', { ...config, noseColor: 'plum' }],
      ['内耳', { ...config, earColor: 'charcoal' }],
      ['眼睛', { ...config, leftEyeColor: 'sapphire' }],
    ] as const) {
      const without = pixels({ ...initial, config: alternative });
      if (config.ear === 'CE01' || label !== '内耳') {
        check(without.some((value, i) => value !== untouched[i]), label + '对照没有像素变化');
      }
      check(without.every((value, i) => value === untouched[i] || !mask.charCodeAt(i)), '可编辑蒙版覆盖' + label);
    }

    // The saved paint must follow the shoulders, head and rotating tail
    // through the double-click pose, while the outline remains intact.
    for (const frame of [1, 10, 15]) {
      const unpaintedLove = pixels(saved, false, frame);
      const paintedLove = pixels(saved, true, frame);
      check(unpaintedLove.every((pixel, i) => (pixel >>> 24) === (paintedLove[i]! >>> 24)),
        '双击动作中的照片笔迹改变了透明度');
      check(paintedLove.some((pixel, i) => pixel !== unpaintedLove[i]), '双击动作丢失了照片笔迹');
      const alternateNose = pixels({ ...saved, config: { ...config, noseColor: 'plum' } }, false, frame);
      check(alternateNose.some((pixel, i) => pixel !== unpaintedLove[i]), '双击动作中的鼻色对照没有变化');
      check(alternateNose.every((pixel, i) => pixel === unpaintedLove[i] || paintedLove[i] === unpaintedLove[i]),
        '双击动作中的照片笔迹覆盖了鼻子');
    }

    const bobbed = { ...saved, frame: 17 };
    verifyFrame(bobbed);
    for (const typingMode of ['gentle', 'fast', 'frenzy'] as const) {
      for (const frame of [0, 1, 3, 9, 11, 27, 63]) {
        const typed = { ...saved, action: 'typing' as const, typingMode, frame,
          frenzyHeatFrame: typingMode === 'frenzy' ? frame : undefined };
        const { mask: typingMask } = verifyFrame(typed);
        layer.ctx.resetTransform();
        layer.ctx.clearRect(0, 0, size, size);
        layer.ctx.drawImage(catTypingLaptop(config, 'aligned', 'clean', currentTypingAnimation), 0, 0);
        check(readPixels().every((pixel, i) => !(pixel >>> 24) || !typingMask.charCodeAt(i)), '可编辑蒙版覆盖电脑');
      }
    }
    const opened = JSON.parse(JSON.stringify(saved)) as CatInkSource;
    check(pixels(opened, true).every((pixel, i) => pixel === after[i]), '重开后照片笔迹改变');
    const restored = saveCatInk(opened, input.map(([index]) => [index, 0]));
    check(!Object.keys(restored.pixelEdits.parts).length, '恢复原毛色仍有残留笔迹');
    check(pixels(restored, true).every((pixel, i) => pixel === untouched[i]), '恢复后未还原原毛色');

    const fromTyping = { ...initial, action: 'typing' as const, frame: 3 };
    const typingInk = saveCatInk(fromTyping, input.map(([index]) => [index, colors.second]));
    verifyFrame(typingInk);
    verifyFrame({ ...typingInk, action: 'sit', frame: 0 });
  }
  const bounds = { x: 0, y: 0, width: size, height: size };
  mustThrow(() => readCatInk({ version: 1, scope: 'photo-fur', parts: { head: { bounds, paint: [], erase: [1] } } }),
    '照片笔迹存档接受透明擦除');
  mustThrow(() => readCatInk({ version: 1, scope: 'photo-fur', parts: { laptop: { bounds, paint: [], erase: [] } } }),
    '照片笔迹存档接受电脑图层');
  check(readCatInk({ version: 1, parts: { canvas: { bounds, paint: [[1, 0x80000001]], erase: [] } } }).parts.canvas,
    '旧自由画布笔迹无法载入');
  return '照片毛色检查通过';
}

export async function checkPhotoSplitEars() {
  await prepareCatAssets();
  const recognized = appearanceFromCatPhoto({
    cat: true, set: 'calico', ears: 'upright', leftEarShape: 'round', rightEarShape: 'droopy',
    leftEarZone: 'crown', leftEarReach: 'root', leftEarPigment: 'gray',
    rightEarZone: 'perimeter', rightEarReach: 'root', rightEarPigment: 'white',
  }).config;
  if (recognized.frame !== 'CAT' || recognized.leftEar !== 'CE03' || recognized.rightEar !== 'CE04'
    || recognized.photoEarColors?.left !== 'gray' || recognized.photoEarColors.right !== 'white') {
    throw Error('照片结果没有保留分侧的识别耳形和耳斑');
  }
  const size = CAT_SIZE;
  const frame = makeLayer(size);
  const gaze = { x: 0, y: 0 };
  const leftPart = 'ear-left-crown-root';
  const rightPart = 'ear-right-perimeter-root';
  const sealPoint = catPresets.preset_cat_siamese;
  const bases: CatConfig[] = [
    { ...catPresets.preset_cat_orange, ear: 'CE01', accessory: 'A01' },
    { ...recognized, ear: 'CE01', leftEar: undefined, rightEar: undefined, accessory: 'A03',
      calicoCrown: 'orange-left', calicoCrownLayout: 'high-cap', photoCoatParts: undefined, photoEarColors: undefined },
    { ...sealPoint, ear: 'CE01' },
  ];
  const snap = (config: CatConfig, action: 'sit' | 'typing', index: number, typingMode: TypingMode) => {
    render(frame.canvas, config, action, index, gaze, { typingMode });
    if (frame.canvas.title) throw Error(frame.canvas.title);
    return new Uint32Array(frame.ctx.getImageData(0, 0, size, size).data.buffer);
  };
  function checkSide(before: Uint32Array, after: Uint32Array, side: 'left' | 'right', label: string) {
    let changed = 0;
    for (let i = 0; i < before.length; i++) {
      if (after[i] === before[i]) continue;
      const x = i % size, y = Math.floor(i / size);
      if (y > 108 || (side === 'left' ? x >= 152 : x < 152)) {
        throw Error(`改变单侧耳形影响了另一侧或脸身 · ${label}/${side}/${x},${y}`);
      }
      changed++;
    }
    if (!changed) throw Error(`改变单侧耳形或耳斑没有像素变化 · ${label}/${side}`);
  }

  for (const base of bases) {
    for (const [action, index, mode] of [
      ['sit', 0, 'gentle'], ['sit', 17, 'gentle'], ['typing', 3, 'gentle'],
      ['typing', 11, 'fast'], ['typing', 27, 'frenzy'],
    ] as const) {
      const original = snap(base, action, index, mode);
      const left: CatConfig = { ...base, leftEar: 'CE02' };
      const right: CatConfig = { ...left, rightEar: 'CE05' };
      const leftFrame = snap(left, action, index, mode);
      checkSide(original, leftFrame, 'left', `${base.palette}/${action}/${mode}`);
      checkSide(leftFrame, snap(right, action, index, mode), 'right', `${base.palette}/${action}/${mode}`);
      const paired = snap({ ...base, leftEar: base.ear, rightEar: base.ear }, action, index, mode);
      if (!original.every((pixel, i) => pixel === paired[i])) throw Error('继承旧的成对设置改变了原画面');
    }

    const typing = { ...base, leftEar: 'CE03', rightEar: 'CE04' } as const;
    const source: CatInkSource = {
      config: typing, action: 'typing', frame: 3, gaze, artVersion: 'pixel80-v2', typingMode: 'gentle',
      typingAnimation: currentTypingAnimation, laptopVersion: 'clean', outlineVersion: 'adaptive',
      typingLayout: 'aligned', earLayout: 'shared', markingLayout: catMarkingLayout(base.pattern), legacyNoseOutline: false,
      pixelEdits: { version: 1, scope: 'photo-fur', parts: {} },
    };
    const mask = atob(photoFurEditorData(source).furMask);
    const plain = snap(typing, 'typing', 3, 'gentle');
    const tinted = snap({ ...typing, earColor: 'charcoal' }, 'typing', 3, 'gentle');
    const exposed = tinted.findIndex((pixel, i) => pixel !== plain[i] && mask.charCodeAt(i) === 1);
    if (exposed !== -1) throw Error(`分侧耳形的内耳没有锁定 · ${base.palette}/${exposed}`);
  }

  for (const ear of ['CE01', 'CE02', 'CE03', 'CE04', 'CE05'] as const) {
    const shape = { ...bases[2]!, leftEar: ear, rightEar: ear };
    const original = snap(shape, 'sit', 0, 'gentle');
    const left: CatConfig = { ...shape, photoCoatParts: [leftPart], photoEarColors: { left: 'white' } };
    const both: CatConfig = { ...left, photoCoatParts: [leftPart, rightPart],
      photoEarColors: { left: 'white', right: 'gray' } };
    const leftFrame = snap(left, 'sit', 0, 'gentle');
    checkSide(original, leftFrame, 'left', `${ear}/耳斑`);
    checkSide(leftFrame, snap(both, 'sit', 0, 'gentle'), 'right', `${ear}/耳斑`);
  }
  return '分侧耳形检查通过';
}

import { catIrisColors, catOptions, catPresets, catRenderConfig, nativeCatFur, orangeCatOptions, readPetConfig, usesOrangeCatArt,
  type CatConfig, type CatIrisColor } from './cat';
import { colorCatBreed } from './cat-breeds';
import { catAssetOptions, frontTyping } from './pet-assets';
import { prepareCatCustomization, prepareStructuredCatCustomization, saveCatInk, seedCatInkForEditor } from './cat-custom';
import { projectCatInk, type CatInkDocument, type CatInkPart } from './cat-ink';
import { Motion } from './motion';
import { catTypingFrameCount, catTypingFrameCountFor, catTypingFrameDuration, currentTypingAnimation, frenzyHeatFrameAt, frenzySteamLoopStart } from './cat-typing';
import { catGlintAperture, catHeadPlacement, catInkGeometry, catTypingLaptop, drawCatHead, horizontalGazeRange, makeLayer, pointerGazeLimit, render, type Action, type CatPose, type Gaze, type TypingMode } from './render';

const visibleTails = Object.keys(catOptions.tail) as (keyof typeof catOptions.tail)[];

function historicalTail(preset: CatConfig, tail: 'CT01' | 'CT02' | 'CT03' | 'CT04') {
  const config = readPetConfig({ ...preset, tail }, { preserveLegacyTail: true, preserveLegacyNose: true });
  if (config.frame !== 'CAT' || config.tail !== tail) throw Error(`Historical tail ${tail} was replaced before reading its save`);
  return config;
}

export function checkStructuredCatInk() {
  const size = 320;
  const canvas = document.createElement('canvas');
  const { preset_cat_orange: orange, preset_cat_calico: calico } = catPresets;
  const sourceFrame = 0;
  const sourceOptions = { typingMode: 'gentle', typingEffects: true } as const;
  const pixels = (config: CatConfig, typing: boolean, frame: number, pose: CatPose) => {
    render(canvas, config, typing ? 'typing' : 'sit', frame, undefined, pose);
    const { data } = canvas.getContext('2d')!.getImageData(0, 0, size, size);
    return new Uint32Array(data.buffer);
  };
  // Canvas ImageData packs RGBA bytes in memory. The save format is ARGB.
  const imagePixel = (argb: number) => ((argb & 0xff00ff00)
    | ((argb & 0xff) << 16) | ((argb >>> 16) & 0xff)) >>> 0;
  const source = pixels(orange, true, sourceFrame, sourceOptions);
  const geometry = catInkGeometry(orange, true, sourceFrame, sourceOptions);
  const subjects = [
    { part: 'leftEar', at: [74, 39], color: 0xffe711d9 },
    { part: 'rightEar', at: [230, 39], color: 0xff15d3e7 },
    { part: 'head', at: [150, 76], color: 0xffe70a76 },
    { part: 'torso', at: [77, 183], color: 0xff1349ff },
    { part: 'tail', at: [254, 205], color: 0xff32e91f },
    { part: 'leftPaw', at: [107, 181], color: 0xff7c38f7 },
    { part: 'rightPaw', at: [195, 183], color: 0xffdecc16 },
    { part: 'laptop', at: [150, 247], color: 0xff085eaf },
    { part: 'canvas', at: [9, 9], color: 0xffcd24a2 },
  ] as const;
  // Use the canonical sprite masks, but sample away from seams where the
  // visible pixel could be shared by more than one part.
  const locate = (part: CatInkPart, x: number, y: number, except = -1) => {
    if (part === 'canvas') return y * size + x;
    const mask = geometry[part]?.mask;
    if (!mask) throw Error(`Missing source mask for ${part}`);
    let best = -1;
    let distance = Infinity;
    for (let index = 0; index < mask.length; index++) {
      if (!mask[index] || !source[index] || index === except) continue;
      if (subjects.some(({ part: neighbor }) => neighbor !== part && geometry[neighbor]?.mask?.[index])) continue;
      const candidate = (index % size - x) ** 2 + (Math.floor(index / size) - y) ** 2;
      if (candidate < distance) { best = index; distance = candidate; }
    }
    if (best < 0) throw Error(`No editable source pixel on ${part}`);
    return best;
  };
  const probes = subjects.map(subject => {
    const [x, y] = subject.at;
    const paint = locate(subject.part, x, y);
    const erase = subject.part === 'canvas' ? undefined : locate(subject.part, x + 4, y + 3, paint);
    return { ...subject, paint, erase };
  });
  const metadata = {
    action: 'typing', frame: sourceFrame, typingMode: 'gentle', gaze: { x: 0, y: 0 },
    typingLayout: 'aligned', typingAnimation: currentTypingAnimation, laptopVersion: 'clean', typingInkVersion: 'clean',
    outlineVersion: 'adaptive', tailArtVersion: 'clean', earLayout: 'shared', markingLayout: 'shared', legacyNoseOutline: false,
    config: orange,
  } as const;
  const ink = saveCatInk(metadata, probes.flatMap(({ paint, erase, color }): [number, number][] =>
    erase === undefined ? [[paint, color]] : [[paint, color], [erase, 0]])).pixelEdits;
  const saved = JSON.parse(JSON.stringify(ink)) as CatInkDocument;
  for (const { part, paint, erase, color } of probes) {
    const layer = saved.parts[part];
    if (!layer) throw Error(`Save omitted ${part}`);
    const localIndex = (index: number) => (Math.floor(index / size) - layer.bounds.y) * layer.bounds.width
      + index % size - layer.bounds.x;
    if (layer.paint.length !== 1 || layer.paint[0]?.[0] !== localIndex(paint) || layer.paint[0]?.[1] !== color
      || (erase === undefined ? layer.erase.length !== 0 : layer.erase.length !== 1 || layer.erase[0] !== localIndex(erase))) {
      throw Error(`Save did not encode ${part} paint and erasure relative to its bounds`);
    }
  }

  // A current save opens with its edit document and no flattened PNG.
  const custom = prepareStructuredCatCustomization({ ...metadata, pixelEdits: saved });
  if (!custom?.ink) throw Error('A new save requires a flattened image to restore its edits');
  const original = pixels(orange, true, sourceFrame, { ...sourceOptions, custom });
  for (const { part, paint, erase, color } of probes) {
    if (original[paint] !== imagePixel(color) || (erase !== undefined && original[erase] === source[erase])) {
      throw Error(`Paint or erase on ${part} failed to round-trip at its original position`);
    }
  }
  const seamPose = { ...sourceOptions, typingAnimation: 'reference-v2' } as const;
  const seamSource = pixels(orange, true, sourceFrame, seamPose);
  const seamGeometry = catInkGeometry(orange, true, sourceFrame, seamPose);
  const seam = seamGeometry.head?.mask?.findIndex((covered, index) =>
    !!covered && !!seamGeometry.torso?.mask?.[index] && !!seamSource[index]);
  if (seam === undefined || seam < 0) throw Error('Missing typing fixture where the head overlaps the torso');
  const seamSave = prepareStructuredCatCustomization(saveCatInk({ ...metadata, ...seamPose }, [[seam, 0]]));
  const seamFrame = pixels(orange, true, sourceFrame, { ...seamPose, custom: seamSave });
  if (seamFrame[seam] !== 0 || !seamFrame.every((pixel, index) => index === seam || pixel === seamSource[index])) {
    throw Error('The eraser did not open a clean single-pixel hole at a layer seam');
  }
  const withoutOriginal = prepareStructuredCatCustomization({ ...metadata, config: calico, frame: -1, pixelEdits: saved });
  if (!withoutOriginal) throw Error('The new edit document depends on the original pose');
  const restored = pixels(orange, true, sourceFrame, { ...sourceOptions, custom: withoutOriginal });
  if (!original.every((pixel, index) => pixel === restored[index])) {
    throw Error('New ink changed when the original appearance or frame changed');
  }

  const moved = new Set<CatInkPart>();
  const erased = new Set<CatInkPart>();
  const verifyPose = (config: CatConfig, typing: boolean, frame: number, typingMode: TypingMode = 'gentle') => {
    const pose = { typingMode, typingEffects: true } as const;
    const label = `${config.name}/${config.ear}/${config.tail}/${typing ? typingMode : 'sit'}/${frame}`;
    const base = pixels(config, typing, frame, pose);
    const edited = pixels(config, typing, frame, { ...pose, custom });
    const target = catInkGeometry(config, typing, frame, pose);
    const offset = catHeadPlacement(typing, frame).y * size;
    const touched = new Set<number>();
    for (const { part, paint, color } of probes) {
      const layer = saved.parts[part]!;
      const surface = target[part];
      const marker = imagePixel(color);
      const index = edited.indexOf(marker);
      const partOffset = part === 'canvas' ? 0 : offset;
      if (surface) {
        const projected = projectCatInk(layer, surface);
        for (const [pixel, color] of projected) {
          const target = pixel + partOffset;
          touched.add(target);
          if (!color && edited[target] !== base[target]) erased.add(part);
        }
      }
      if ((part === 'laptop' && !typing) || ((part === 'leftPaw' || part === 'rightPaw') && !surface)) {
        if (index !== -1) throw Error(`Ink from hidden ${part} leaked into ${label}`);
        continue;
      }
      if (!surface || index < 0) throw Error(`${label} lost paint on ${part}`);
      for (let mark = index; mark >= 0; mark = edited.indexOf(marker, mark + 1)) {
        if (surface.mask && !surface.mask[mark - partOffset]) throw Error(`${label} misplaced paint on ${part}`);
      }
      if (index - partOffset !== paint) moved.add(part);
    }
    for (let index = 0; index < base.length; index++) {
      if (base[index] !== edited[index] && !touched.has(index)) {
        throw Error(`${label} repainted an untouched pixel at ${index % size},${Math.floor(index / size)}`);
      }
    }
  };
  for (const breed of Object.values(catPresets)) verifyPose(breed, false, 0);
  for (const ear of Object.keys(orangeCatOptions.ear) as CatConfig['ear'][]) {
    verifyPose({ ...calico, ear }, false, 0);
  }
  if (!moved.has('leftEar') || !moved.has('rightEar')) throw Error('Swapping ears did not move their ink with the new shapes');
  moved.clear();
  for (const tail of visibleTails) verifyPose({ ...calico, tail }, false, 0);
  if (!moved.has('tail')) throw Error('Changing the tail silhouette did not move its custom ink');
  moved.clear();
  for (const mode of ['gentle', 'fast', 'frenzy'] as const) {
    erased.clear();
    for (const frame of [0, 1, 4, 8, 9, 12, 20, 63]) {
      verifyPose({ ...calico, ear: 'CE02', tail: 'CT06' }, true, frame, mode);
    }
    verifyPose({ ...calico, ear: 'CE02', tail: 'CT09' }, true, 12, mode);
    for (const { part } of probes) {
      if (part !== 'canvas' && !erased.has(part)) throw Error(`${mode} typing dropped the erasure on ${part}`);
    }
  }
  if (!moved.has('leftPaw') || !moved.has('rightPaw')) throw Error('Typing poses left ink behind as the paws moved');

  const activeLook = { ...calico, ear: 'CE02', tail: 'CT06' } as const;
  const live = document.createElement('canvas');
  const motion = new Motion(live, orange);
  motion.setCustom(custom);
  motion.setConfig(activeLook);
  let now = Math.ceil(performance.now());
  let frame = 0;
  const checkMotionFrame = (mode: TypingMode) => {
    motion.tick(now);
    const expected = pixels(activeLook, true, frame, { typingMode: mode, typingEffects: true, custom });
    const actual = new Uint32Array(live.getContext('2d')!.getImageData(0, 0, size, size).data.buffer);
    if (!expected.every((pixel, index) => pixel === actual[index])) {
      throw Error(`Keyboard input displayed the wrong ink or animation in ${mode} frame ${frame}`);
    }
  };
  for (const [mode, keys] of [['gentle', 1], ['fast', 4], ['frenzy', 4]] as const) {
    for (let key = 0; key < keys; key++) motion.key(now);
    checkMotionFrame(mode);
    now += catTypingFrameDuration(mode);
    frame++;
    checkMotionFrame(mode);
  }
  motion.tick(now + 1100);
  const rested = new Uint32Array(live.getContext('2d')!.getImageData(0, 0, size, size).data.buffer);
  const laptopInk = imagePixel(probes.find(({ part }) => part === 'laptop')!.color);
  const headInk = imagePixel(probes.find(({ part }) => part === 'head')!.color);
  if (rested.includes(laptopInk) || !rested.includes(headInk)) throw Error('Leaving typing lost idle ink or kept the laptop');

  const extraPixel = 78 * size + 153;
  const extraColor = 0xff04b377;
  const idle = { ...metadata, action: 'sit', frame: 17 } as const;
  const bobOffset = catHeadPlacement(false, idle.frame).y * size;
  const revised = saveCatInk({ ...idle, pixelEdits: saved }, [[extraPixel + bobOffset, extraColor]]).pixelEdits;
  if (JSON.stringify(revised.parts.laptop) !== JSON.stringify(saved.parts.laptop)
    || JSON.stringify(revised.parts.leftPaw) !== JSON.stringify(saved.parts.leftPaw)) {
    throw Error('Editing the idle head changed saved ink from the typing pose');
  }
  const updated = prepareStructuredCatCustomization({ ...idle, pixelEdits: revised });
  if (!updated) throw Error('Could not reopen a new save after re-editing');
  const typingAgain = pixels(orange, true, sourceFrame, { ...sourceOptions, custom: updated });
  if (!typingAgain.every((pixel, index) => pixel === (index === extraPixel ? imagePixel(extraColor) : original[index]))) {
    throw Error('Re-editing an idle pixel changed unrelated ink or discarded hidden typing edits');
  }
  verifyPose(orange, false, 17);

  // An old PNG still opens with the old reader. Re-editing it seeds the new
  // document and keeps its typing-only marks even when started from idle.
  const old = document.createElement('canvas');
  render(old, orange, 'typing', sourceFrame, undefined, sourceOptions);
  const editor = old.getContext('2d')!;
  editor.resetTransform();
  editor.fillStyle = '#E711D9';
  editor.fillRect(150, 76, 1, 1);
  editor.clearRect(152, 247, 1, 1);
  const legacy = prepareCatCustomization(old, metadata, orange);
  const existing = pixels(orange, true, sourceFrame, { ...sourceOptions, custom: legacy });
  render(old, orange, 'sit', idle.frame, undefined, { custom: legacy });
  const migrated = seedCatInkForEditor(old, idle, legacy);
  const reopened = prepareStructuredCatCustomization({ ...idle, pixelEdits: migrated });
  if (!reopened || !migrated.parts.head?.paint.length || !migrated.parts.laptop?.erase.length) {
    throw Error('Re-editing an old save failed to retain its paint and hidden laptop erasure');
  }
  const converted = pixels(orange, true, sourceFrame, { ...sourceOptions, custom: reopened });
  if (!converted.every((pixel, index) => pixel === existing[index])) {
    throw Error('Upgrading an old save changed how its retained edits appear');
  }
}

const visibleNoses = Object.keys(catOptions.nose) as (keyof typeof catOptions.nose)[];
const visibleMouths = Object.keys(catOptions.mouth) as (keyof typeof catOptions.mouth)[];
const mouthMigrations = [
  ['CN01', 'CN05', 'NO05'], ['CN02', 'CN09', 'NO02'], ['CN03', 'CN09', 'NO06'], ['CN04', 'CN06', 'NO07'],
] as const;

function historicalMouth(preset: CatConfig, mouth: (typeof mouthMigrations)[number][0]) {
  const config = readPetConfig({ ...preset, mouth }, {
    preserveLegacyMouth: true, preserveLegacyNose: true, preserveLegacyTail: true,
  });
  if (config.frame !== 'CAT' || config.mouth !== mouth) throw Error(`Historical mouth ${mouth} was replaced before reading its save`);
  return config;
}

function historicalNose(preset: CatConfig, nose: 'NO01' | 'NO03' | 'NO04') {
  const config = readPetConfig({ ...preset, nose, noseColor: undefined }, { preserveLegacyNose: true });
  if (config.frame !== 'CAT' || config.nose !== nose) throw Error(`Historical nose ${nose} was replaced before reading its save`);
  return config;
}

function isNoseRegion(x: number, y: number) {
  return x >= 134 && x <= 169 && y >= 118 && y <= 136;
}

export function checkNoseOptions() {
  if (visibleNoses.join(',') !== 'NO02,NO05,NO06,NO07,NO08') throw Error('The workbench must offer the five approved nose shapes');
  const colors = Object.keys(catOptions.noseColor) as CatConfig['noseColor'][];
  const { preset_cat_orange: orange, preset_cat_black: black, preset_cat_british_blue: britishBlue } = catPresets;
  const canvas = document.createElement('canvas');
  const size = 320;
  const image = (config: CatConfig, action: 'sit' | 'typing', frame: number, typingMode: TypingMode) => {
    render(canvas, config, action, frame, undefined, { typingMode, typingEffects: true });
    return new Uint32Array(canvas.getContext('2d')!.getImageData(0, 0, size, size).data.buffer);
  };
  const isDistinct = (variants: Uint32Array[]) => variants.every((first, index) =>
    variants.slice(index + 1).every(next => first.some((pixel, point) => pixel !== next[point])));
  for (const breed of [orange, black, britishBlue]) {
    for (const [action, frame, typingMode] of [
      ['sit', 0, 'gentle'], ['typing', 4, 'gentle'], ['typing', 4, 'fast'], ['typing', 20, 'fast'], ['typing', 17, 'frenzy'],
    ] as const) {
      const shapes = visibleNoses.map(nose => image({ ...breed, nose }, action, frame, typingMode));
      if (!isDistinct(shapes)) throw Error(`Nose shapes matched for ${breed.name}/${action}/${typingMode}`);
      for (const [index, nose] of visibleNoses.entries()) {
        const stock = shapes[index]!;
        for (let pixel = 0; pixel < stock.length; pixel++) {
          if (stock[pixel] === shapes[0]![pixel]) continue;
          const x = pixel % size, y = Math.floor(pixel / size);
          if (!isNoseRegion(x, y) && !(x >= 149 && x <= 153 && y === 137)) {
            throw Error(`Changing ${nose} repainted the mouth or fur at ${x},${y} for ${breed.name}/${typingMode}`);
          }
        }
        const testColors = breed === orange && action === 'sit' ? colors : ['natural', 'plum'] as const;
        const tinted = testColors.map(noseColor => image({ ...breed, nose, noseColor }, action, frame, typingMode));
        if (!isDistinct(tinted)) throw Error(`Nose colors matched for ${breed.name}/${nose}/${typingMode}`);
        for (const variant of tinted) {
          for (let pixel = 0; pixel < variant.length; pixel++) {
            const before = stock[pixel]!, after = variant[pixel]!;
            if (before === after) continue;
            const x = pixel % size, y = Math.floor(pixel / size);
            if ((before >>> 24) !== (after >>> 24) || !isNoseRegion(x, y)) {
              throw Error(`Nose tint changed alpha, fur or mouth at ${x},${y} for ${breed.name}/${nose}/${typingMode}`);
            }
          }
        }
        if (breed === orange) {
          const plum = tinted[testColors.indexOf('plum')]!;
          const center = [150, 151, 152];
          let tip = 136;
          while (tip >= 118 && center.every(x => stock[tip * size + x] === plum[tip * size + x])) tip--;
          const joinsMouth = center.some(x => {
            const below = stock[(tip + 1) * size + x]!;
            return (below & 255) < 140 && ((below >>> 8) & 255) < 100;
          });
          if (tip < 118 || !joinsMouth) throw Error(`Nose ${nose} has a gap above the mouth in ${action}/${typingMode}`);
        }
      }
    }
  }
  for (const [legacy, current] of [['NO01', 'NO05'], ['NO03', 'NO06'], ['NO04', 'NO07']] as const) {
    const config = historicalNose(orange, legacy);
    const migrated = readPetConfig(config);
    if (migrated.frame !== 'CAT' || migrated.nose !== current || migrated.noseColor !== 'natural') {
      throw Error(`Changing the appearance of an old save did not offer ${current} for ${legacy}`);
    }
    render(canvas, config, 'sit', 0);
    const original = prepareCatCustomization(canvas, {
      config, action: 'sit', frame: 0, typingMode: 'gentle', gaze: { x: 0, y: 0 },
      tailArtVersion: 'clean', earLayout: 'shared', markingLayout: 'shared',
    }, orange);
    if (original.source.config.nose !== legacy || original.paint.full) {
      throw Error(`The legacy nose ${legacy} was mistaken for custom paint`);
    }
  }
  const colored = { ...orange, nose: 'NO08', noseColor: 'plum' } as const;
  const saved = saveCatInk({
    config: colored, action: 'typing', frame: 4, typingMode: 'fast', gaze: { x: 0, y: 0 },
    typingLayout: 'aligned', typingAnimation: 'reference-v2', laptopVersion: 'clean', typingInkVersion: 'clean',
    outlineVersion: 'adaptive', tailArtVersion: 'clean', earLayout: 'shared', markingLayout: 'shared', legacyNoseOutline: false,
  }, []);
  const reopened = prepareStructuredCatCustomization(JSON.parse(JSON.stringify(saved)));
  if (reopened?.source.config.nose !== colored.nose || reopened.source.config.noseColor !== colored.noseColor) {
    throw Error('Saving and reopening an appearance lost its selected nose shape or color');
  }
}

export function checkMouthOptions() {
  if (Object.entries(catOptions.mouth).map(([id, label]) => `${id}:${label}`).join(',')
    !== 'CN08:微笑,CN09:吐舌,CN05:凸凸嘴,CN06:严肃嘴,CN07:奔驰嘴') {
    throw Error('The workbench must offer smile and tongue before the other mouths');
  }
  if (Object.values(catPresets).some(preset => preset.mouth !== 'CN08')) {
    throw Error('Every breed must default to the shared smile');
  }
  const canvas = document.createElement('canvas');
  const size = 320;
  const { preset_cat_orange: orange, preset_cat_black: black } = catPresets;
  const pixels = () => new Uint32Array(canvas.getContext('2d')!.getImageData(0, 0, size, size).data.buffer);
  const image = (config: CatConfig, action: 'sit' | 'typing' = 'sit', frame = 0, pose: CatPose = {}) => {
    render(canvas, config, action, frame, undefined, pose);
    return pixels();
  };
  const same = (a: Uint32Array, b: Uint32Array) => a.every((pixel, at) => pixel === b[at]);
  const mouthRegion = (x: number, y: number) => x >= 128 && x < 176 && y >= 126 && y < 163;

  for (const preset of [orange, black]) {
    for (const nose of visibleNoses) {
      const config = { ...preset, nose };
      const stock = image(config);
      const tinted = image({ ...config, noseColor: 'plum' });
      const nosePixels = stock.reduce<number[]>((indices, pixel, at) => {
        if (pixel !== tinted[at]) indices.push(at);
        return indices;
      }, []);
      const faces = visibleMouths.map(mouth => image({ ...config, noseColor: 'plum', mouth }));
      if (!nosePixels.length || faces.some(face => nosePixels.some(at => face[at] !== tinted[at]))) {
        throw Error(`A mouth variant covered the independently tinted nose for ${preset.name}/${nose}`);
      }
      for (const [index, face] of faces.entries()) {
        const mouth = visibleMouths[index]!;
        if (faces.slice(index + 1).some(other => same(face, other))) {
          throw Error(`Mouth shapes matched for ${preset.name}/${nose}/${mouth}`);
        }
        for (let at = 0; at < face.length; at++) {
          if (face[at] === tinted[at]) continue;
          if (!mouthRegion(at % size, Math.floor(at / size)) || face[at]! >>> 24 !== tinted[at]! >>> 24) {
            throw Error(`Mouth ${mouth} changed the fur or silhouette for ${preset.name}/${nose}`);
          }
        }
      }
    }
  }

  const { nose: _nose, noseColor: _noseColor, mouth: _mouth, ...legacyAppearance } = orange;
  for (const [legacy, active, nose] of mouthMigrations) {
    const migrated = readPetConfig({ ...legacyAppearance, muzzle: legacy });
    if (migrated.frame !== 'CAT' || migrated.mouth !== active || migrated.nose !== nose || migrated.noseColor !== 'natural') {
      throw Error(`Legacy muzzle ${legacy} did not restore both face parts`);
    }
    const config = historicalMouth(orange, legacy);
    image(config);
    const metadata = {
      config, action: 'sit', frame: 0, typingMode: 'gentle', gaze: { x: 0, y: 0 },
      tailArtVersion: 'clean', earLayout: 'shared', markingLayout: 'shared',
    } as const;
    for (const source of legacy === 'CN03' ? [metadata, null] : [metadata]) {
      const restored = prepareCatCustomization(canvas, source, orange);
      if (restored.source.config.mouth !== legacy || restored.paint.full) {
        throw Error(`The saved ${legacy} mouth was mistaken for user paint`);
      }
    }
  }

  const mouthMatches = (a: Uint32Array, b: Uint32Array) => a.every((pixel, at) => {
    const x = at % size, y = Math.floor(at / size);
    // At eye level, only the four-pixel stem can belong to the mouth.
    const onMouth = mouthRegion(x, y) && (y >= 131 || (x >= 149 && x <= 152));
    return !onMouth || pixel === b[at];
  });
  for (const preset of Object.values(catPresets)) {
    const selected = { ...preset, mouth: 'CN09', nose: 'NO08', noseColor: 'plum' } as const;
    for (const [typingMode, mouth] of [['gentle', 'CN08'], ['fast', 'CN06'], ['frenzy', 'CN07']] as const) {
      for (const frame of [0, 15, 16, 28, 29, 48, 58, 59, 63]) {
        const rendered = image(selected, 'typing', frame, { typingMode });
        const shared = image({ ...selected, mouth }, 'typing', frame, { typingMode, typingEffects: false });
        if (!mouthMatches(rendered, shared)) {
          throw Error(`${preset.name} did not use ${mouth} throughout ${typingMode} typing`);
        }
      }
    }
  }
  const config = { ...orange, mouth: 'CN05' } as const;
  const typingPose = {
    config, action: 'typing', frame: 20, typingMode: 'fast', gaze: { x: 0, y: 0 },
    typingLayout: 'aligned', typingAnimation: 'reference-v2', laptopVersion: 'clean',
    typingInkVersion: 'clean', outlineVersion: 'adaptive', tailArtVersion: 'clean',
    earLayout: 'shared', markingLayout: 'shared',
  } as const;
  image(config, 'typing', 20, { ...typingPose, typingMouthVersion: 'legacy' });
  const previous = prepareCatCustomization(canvas, typingPose, config);
  const live = image(config, 'typing', 20, typingPose);
  if (previous.source.typingMouthVersion !== 'legacy' || previous.paint.full
    || !same(image(config, 'typing', 20, { ...typingPose, custom: previous }), live)) {
    throw Error('The old typing expression was treated as saved user ink');
  }
  image(config, 'typing', 20, typingPose);
  const current = prepareCatCustomization(canvas, { ...typingPose, typingMouthVersion: 'shared' }, config);
  if (current.source.config.mouth !== 'CN05' || current.paint.full) {
    throw Error('Saving the new typing expression changed the selected idle mouth');
  }
}

export function checkEarColorOptions() {
  const size = 320;
  const canvas = document.createElement('canvas');
  const { preset_cat_orange: orange, preset_cat_calico: calico } = catPresets;
  const image = (config: CatConfig, action: 'sit' | 'typing' = 'sit', typingMode: TypingMode = 'gentle') => {
    render(canvas, config, action, 0, undefined, { typingMode });
    return new Uint32Array(canvas.getContext('2d')!.getImageData(0, 0, size, size).data.buffer);
  };
  const checkLining = (original: Uint32Array, tinted: Uint32Array, label: string) => {
    let left = 0, right = 0;
    for (let index = 0; index < original.length; index++) {
      const before = original[index]!, after = tinted[index]!;
      if (before === after) continue;
      const x = index % size, y = Math.floor(index / size);
      if (y >= 104 || (x >= 125 && x < 176) || before >>> 24 !== after >>> 24) {
        throw Error(`Inner-ear tint changed outside the ears or altered alpha for ${label} at ${x},${y}`);
      }
      if (x < 125) left++;
      else right++;
    }
    if (!left || !right) throw Error(`Inner-ear tint was missing on one side for ${label}`);
  };
  const shapes = Object.keys(catOptions.ear) as CatConfig['ear'][];
  const colors = Object.keys(catOptions.earColor) as CatConfig['earColor'][];
  if (colors.join(',') !== Object.keys(catOptions.noseColor).join(',')) throw Error('Ear and nose colors differ');
  for (const breed of Object.values(catPresets)) {
    for (const ear of shapes) {
      const config = { ...breed, ear };
      checkLining(image(config), image({ ...config, earColor: 'charcoal' }), `${breed.name}/${ear}`);
    }
  }
  const variants = colors.map(earColor => image({ ...orange, earColor }));
  for (const [index, color] of colors.entries()) {
    if (variants.slice(index + 1).some(later => later.every((pixel, at) => pixel === variants[index]![at]))) {
      throw Error(`Inner-ear colors matched for ${color}`);
    }
  }
  const combined = { ...calico, ear: 'CE05', earColor: 'plum', noseColor: 'coral', coat: 'lavender',
    bodyPattern: 'spotted', pattern: 'P05' } as const;
  for (const mode of ['gentle', 'fast', 'frenzy'] as const) {
    checkLining(image({ ...combined, earColor: 'natural' }, 'typing', mode),
      image(combined, 'typing', mode), mode);
  }
  const migrated = readPetConfig({ ...orange, earColor: undefined });
  if (migrated.frame !== 'CAT' || migrated.earColor !== 'natural'
    || !image(migrated).every((pixel, index) => pixel === variants[0]![index])) {
    throw Error('An older appearance picked up an inner-ear tint');
  }
  const saved = saveCatInk({
    config: combined, action: 'typing', frame: 0, typingMode: 'fast', gaze: { x: 0, y: 0 },
    typingLayout: 'aligned', typingAnimation: 'reference-v2', laptopVersion: 'clean', typingInkVersion: 'clean',
    outlineVersion: 'adaptive', tailArtVersion: 'clean', earLayout: 'shared', markingLayout: 'shared', legacyNoseOutline: false,
  }, []);
  const restored = prepareStructuredCatCustomization(JSON.parse(JSON.stringify(saved)))?.source.config;
  if (restored?.earColor !== combined.earColor || restored.ear !== combined.ear || restored.noseColor !== combined.noseColor) {
    throw Error('Saving and reopening lost the selected ear shape, ear color or nose color');
  }
}

export function checkTailOptions() {
  const size = 320;
  const canvas = document.createElement('canvas');
  const { preset_cat_orange: orange, preset_cat_black: black, preset_cat_calico: calico,
    preset_cat_siamese: siamese, preset_cat_ragdoll: ragdoll } = catPresets;
  const pixels = () => new Uint32Array(canvas.getContext('2d')!.getImageData(0, 0, size, size).data.buffer);
  const image = (config: CatConfig, action: 'sit' | 'typing', frame: number, pose: CatPose) => {
    render(canvas, config, action, frame, undefined, pose);
    return pixels();
  };
  const same = (a: Uint32Array, b: Uint32Array) => a.every((pixel, index) => pixel === b[index]);
  if (Object.entries(catOptions.tail).map(([id, label]) => `${id}:${label}`).join(',')
    !== 'CT05:直尾,CT06:短尾,CT07:L字型弯尾,CT08:Z字型弯尾,CT09:卷环型尾') {
    throw Error('The workbench must offer the five reference tail shapes in order');
  }
  const missing = readPetConfig({ ...orange, tail: undefined });
  if (missing.frame !== 'CAT' || missing.tail !== 'CT05') throw Error('An older appearance lost its default straight tail');
  const laptop = document.createElement('canvas');
  laptop.width = laptop.height = size;
  const ctx = laptop.getContext('2d')!;
  ctx.drawImage(catTypingLaptop(orange, 'aligned', 'clean'), 0, 0);
  const prop = new Uint32Array(ctx.getImageData(0, 0, size, size).data.buffer);
  const typingModes = ['gentle', 'fast', 'frenzy'] as const;
  const cases = [['sit', 'gentle'], ...typingModes.map(mode => ['typing', mode] as const)] as const;
  const ringHasHole = (frame: Uint32Array) => {
    const x = 257, y = 226;
    const start = y * size + x;
    if (frame[start]) return false;
    const visited = new Set([start]);
    const pending = [start];
    while (pending.length) {
      const pixel = pending.pop()!;
      const col = pixel % size, row = Math.floor(pixel / size);
      if (col <= 229 || col >= 310 || row <= 155 || row >= 280) return false;
      for (const next of [pixel - 1, pixel + 1, pixel - size, pixel + size]) {
        if (!frame[next] && !visited.has(next)) { visited.add(next); pending.push(next); }
      }
    }
    return visited.size > 12;
  };
  for (const breed of [orange, black, calico, siamese, ragdoll]) {
    for (const [action, typingMode] of cases) {
      const typing = action === 'typing';
      const pose = { typingMode, typingEffects: true } as const;
      const label = `${breed.name}/${action}/${typingMode}`;
      const shapes = visibleTails.map(tail => image({ ...breed, tail }, action, 0, pose));
      for (const [index, tail] of visibleTails.entries()) {
        const stock = shapes[index]!;
        const defaultShape = shapes[0]!;
        const colored = image({ ...breed, tail, coat: 'lavender' }, action, 0, pose);
        const coverage = catInkGeometry({ ...breed, tail }, typing, 0, pose).tail?.mask;
        if (shapes.slice(index + 1).some(next => next.every((pixel, at) => (pixel >>> 24) === (stock[at]! >>> 24)))) {
          throw Error(`${label} uses indistinguishable silhouettes for ${tail} and another choice`);
        }
        if (tail === 'CT09' && !ringHasHole(stock)) throw Error(`${label} has no clean, enclosed ring opening`);
        let tintedTail = false;
        for (let at = 0; at < stock.length; at++) {
          const x = at % size, y = Math.floor(at / size);
          const tailRegion = x >= 218 && y >= 145 && y < 286;
          const before = stock[at]!, after = colored[at]!;
          if (before !== defaultShape[at] && (!tailRegion || (typing && prop[at]))) {
            throw Error(`${label}/${tail} changed the face, body or laptop at ${x},${y}`);
          }
          const alpha = before >>> 24;
          if (tailRegion && alpha !== 0 && alpha !== 255) throw Error(`${label}/${tail} has a soft fringe at ${x},${y}`);
          if (alpha !== (after >>> 24)) throw Error(`${label}/${tail} tint changed the silhouette at ${x},${y}`);
          if (coverage?.[at] && before && before !== after) tintedTail = true;
        }
        if (!tintedTail) throw Error(`${label}/${tail} did not use the chosen fur colors`);
        if (breed === orange && typingMode === 'gentle') {
          const plain = image({ ...breed, tail, bodyPattern: 'plain' }, action, 0, pose);
          const spots = image({ ...breed, tail, bodyPattern: 'spotted' }, action, 0, pose);
          if (!coverage?.some((copied, at) => !!copied && (!typing || !prop[at]) && plain[at] !== spots[at])) {
            throw Error(`${label}/${tail} ignored the selected fur pattern`);
          }
        }
        if (typing && breed === orange) {
          const samples = [4, 12, 20, 31];
          const frames = samples.map(frame => image({ ...breed, tail }, action, frame, pose));
          if (same(stock, frames[0]!) || same(stock, frames[1]!) || same(frames[0]!, frames[1]!)
            || same(frames[0]!, frames[2]!) || same(stock, frames[3]!)) {
            throw Error(`${label}/${tail} froze, truncated or aliased its typing cycle`);
          }
          for (const [sample, next] of [stock, ...frames].entries()) {
            const unchangedProp = typingMode === 'frenzy' ? image(breed, 'typing', [0, ...samples][sample]!, pose) : prop;
            if (!prop.every((pixel, at) => !pixel || unchangedProp[at] === next[at])) {
              throw Error(`${label}/${tail} covers the laptop during typing`);
            }
          }
        }
      }
    }
  }

  const pose = { typingMode: 'gentle', typingLayout: 'aligned', typingAnimation: 'reference-v2',
    laptopVersion: 'clean', typingInkVersion: 'clean', outlineVersion: 'adaptive', earLayout: 'shared',
    markingLayout: 'shared', legacyNoseOutline: false } as const;
  for (const tail of visibleTails) {
    const config = { ...orange, tail };
    const original = image(config, 'sit', 0, { ...pose, tailArtVersion: 'initial' });
    const metadata = { ...pose, config, action: 'sit', frame: 0, gaze: { x: 0, y: 0 } } as const;
    const mark = 76 * size + 150;
    const edited = original.slice();
    edited[mark] = 0xff13d02a;
    const editor = canvas.getContext('2d')!;
    const data = editor.createImageData(size, size);
    new Uint32Array(data.data.buffer).set(edited);
    editor.putImageData(data, 0, 0);
    const sources = tail === 'CT09' ? [metadata, null] : [metadata];
    const saves = sources.map(source => prepareCatCustomization(canvas, source, config));
    const current = image(config, 'sit', 0, pose);
    if (same(original, current)) throw Error(`The ${tail} reference still uses its initial drawing`);
    for (const old of saves) {
      if (old.source.config.tail !== tail || old.source.tailArtVersion !== 'initial') {
        throw Error(`The saved ${tail} did not use its original drawing to recover edits`);
      }
      const restored = image(config, 'sit', 0, { ...pose, custom: old });
      if (!restored.every((pixel, index) => pixel === (index === mark ? edited[mark] : current[index]))) {
        throw Error(`Updating ${tail} reapplied old stock pixels or lost its user edit`);
      }
    }
    image(config, 'sit', 0, pose);
    const captured = prepareCatCustomization(canvas, { ...metadata, tailArtVersion: 'clean' }, config);
    if (captured.paint.full) throw Error(`The new ${tail} was mistaken for saved paint`);
  }
  for (const [legacy, current] of [['CT01', 'CT05'], ['CT02', 'CT06'], ['CT03', 'CT05'], ['CT04', 'CT07']] as const) {
    const config = historicalTail(orange, legacy);
    const migrated = readPetConfig(config);
    if (migrated.frame !== 'CAT' || migrated.tail !== current) throw Error(`Old ${legacy} did not migrate to ${current}`);
    image(config, 'sit', 0, pose);
    const metadata = { ...pose, config: legacy === 'CT01' ? { ...config, tail: undefined } : config,
      action: 'sit', frame: 0, gaze: { x: 0, y: 0 } } as const;
    for (const source of legacy === 'CT01' ? [metadata, null] : [metadata]) {
      const old = prepareCatCustomization(canvas, source, migrated);
      if (old.source.config.tail !== legacy || old.paint.full) throw Error(`The saved ${legacy} tail was mistaken for user paint`);
      const restored = image(migrated, 'sit', 0, { ...pose, custom: old });
      if (!same(restored, image(migrated, 'sit', 0, pose))) throw Error(`Opening ${legacy} restored pixels from its old tail`);
      image(config, 'sit', 0, pose);
    }
  }
  const ringConfig = { ...orange, tail: 'CT09' } as const;
  const oldEdgePose = { ...pose, tailArtVersion: 'reference' } as const;
  const oldEdgePixels = image(ringConfig, 'sit', 0, oldEdgePose);
  const cleanEdgePixels = image(ringConfig, 'sit', 0, pose);
  if (same(oldEdgePixels, cleanEdgePixels)
    || oldEdgePixels.some((pixel, at) => (pixel >>> 24) !== (cleanEdgePixels[at]! >>> 24))) {
    throw Error('The outline cleanup must change the old fur pixels while keeping the same tail silhouette');
  }
  image(ringConfig, 'sit', 0, oldEdgePose);
  const oldEdgeSave = prepareCatCustomization(canvas,
    { ...oldEdgePose, config: ringConfig, action: 'sit', frame: 0, gaze: { x: 0, y: 0 } }, ringConfig);
  if (oldEdgeSave.paint.full || !same(image(ringConfig, 'sit', 0, { ...pose, custom: oldEdgeSave }), cleanEdgePixels)) {
    throw Error('Saved fur was mistaken for user brushwork at the repaired edge');
  }
  // Older per-part saves used full-canvas coordinates for their tail edits.
  const oldConfig = historicalTail(orange, 'CT04');
  const oldMask = catInkGeometry(oldConfig, false, 0, pose).tail?.mask;
  const mark = oldMask?.findIndex((covered, at) => !!covered && at % size >= 250) ?? -1;
  if (mark < 0) throw Error('The historical tail painting fixture is missing');
  const edit = prepareStructuredCatCustomization({
    ...pose, config: oldConfig, action: 'sit', frame: 0, gaze: { x: 0, y: 0 },
    pixelEdits: { version: 1, parts: { tail: {
      bounds: { x: 0, y: 0, width: size, height: size }, paint: [[mark, 0xff32e91f]], erase: [],
    } } },
  });
  const ring = { ...orange, tail: 'CT09' } as const;
  const target = catInkGeometry(ring, false, 0, pose).tail?.mask;
  const editedRing = image(ring, 'sit', 0, { ...pose, custom: edit });
  const painted = editedRing.indexOf(0xff1fe932);
  if (painted < 0 || !target?.[painted] || !ringHasHole(editedRing)) {
    throw Error('An older per-part tail painting did not follow the ring silhouette');
  }
}

export function checkIndependentPupils() {
  const size = 320;
  const canvas = document.createElement('canvas');
  const image = (config: CatConfig, action: 'sit' | 'typing', frame = 0, pose: CatPose = {}, gaze?: Gaze) => {
    render(canvas, config, action, frame, gaze, pose);
    return new Uint32Array(canvas.getContext('2d')!.getImageData(0, 0, size, size).data.buffer);
  };
  const same = (a: Uint32Array, b: Uint32Array) => a.every((pixel, index) => pixel === b[index]);
  const { preset_cat_orange: orange, preset_cat_calico: calico, preset_cat_ragdoll: ragdoll } = catPresets;
  const shared = { eyeColor: 'violet', innerPupil: 'round', innerEyeColor: 'rose' } as const;
  const left = { leftEyeColor: 'blue', leftInnerPupil: 'none', leftInnerEyeColor: 'amber' } as const;
  const right = { rightEyeColor: 'green', rightInnerPupil: 'round', rightInnerEyeColor: 'amber' } as const;

  for (const breed of [orange, calico, ragdoll]) {
    const legacy = { ...breed, ...shared };
    const equalSides = { ...legacy, leftEyeColor: shared.eyeColor, rightEyeColor: shared.eyeColor,
      leftInnerPupil: shared.innerPupil, rightInnerPupil: shared.innerPupil,
      leftInnerEyeColor: shared.innerEyeColor, rightInnerEyeColor: shared.innerEyeColor };
    const chosen = { ...legacy, ...left, ...right };
    for (const [action, typingMode] of [['sit', 'gentle'], ['typing', 'gentle'], ['typing', 'fast']] as const) {
      const pose = { typingMode };
      const stock = image(legacy, action, 0, pose);
      if (!same(stock, image(equalSides, action, 0, pose))) {
        throw Error(`${breed.name}/${action}/${typingMode} changed the pixels of a legacy shared pupil`);
      }
      const leftOnly = image({ ...legacy, ...left }, action, 0, pose);
      const rightOnly = image({ ...legacy, ...right }, action, 0, pose);
      const mixed = image(chosen, action, 0, pose);
      const flat = image({ ...legacy, eyeColor: 'blue', innerPupil: 'none' }, action, 0, pose);
      const double = image({ ...legacy, eyeColor: 'green', innerEyeColor: 'amber' }, action, 0, pose);
      const changed = [0, 0];
      for (let at = 0; at < stock.length; at++) {
        const x = at % size, y = Math.floor(at / size);
        const leftSide = x < size / 2;
        if (leftOnly[at] !== (leftSide ? flat[at] : stock[at])
          || rightOnly[at] !== (leftSide ? stock[at] : double[at])
          || mixed[at] !== (leftSide ? leftOnly[at] : rightOnly[at])) {
          throw Error(`${breed.name}/${action}/${typingMode} did not paint each pupil independently at ${x},${y}`);
        }
        if (mixed[at] === stock[at]) continue;
        if (y < 90 || y >= 140 || x < 90 || x >= 212 || mixed[at]! >>> 24 !== stock[at]! >>> 24) {
          throw Error(`${breed.name}/${action}/${typingMode} changed the face outside the pupil at ${x},${y}`);
        }
        changed[leftSide ? 0 : 1]!++;
      }
      if (changed.some(count => count === 0)) throw Error(`${breed.name} ignored one of the two pupils`);

      const gaze: Gaze = { x: -75, y: 35, space: 'pointer' };
      const tracked = image(chosen, action, 0, pose, gaze);
      const glow = 0xfff6fdff;
      if (same(tracked, mixed) || tracked.some((pixel, at) =>
        pixel !== mixed[at] && pixel !== glow && mixed[at] !== glow)) {
        throw Error(`${breed.name}/${action}/${typingMode} moved pupil color with its reflections`);
      }
    }
    if (!same(image(legacy, 'typing', 36, { typingMode: 'frenzy' }), image(chosen, 'typing', 36, { typingMode: 'frenzy' }))) {
      throw Error(`${breed.name} showed pupil color through effort eyelids`);
    }
    if (breed !== orange && !same(image(legacy, 'sit', 25), image(chosen, 'sit', 25))) {
      throw Error(`${breed.name} showed pupil color through a blink`);
    }
  }

  for (const eye of ['Y03', 'Y04', 'Y05'] as const) {
    const config = { ...calico, eye, leftInnerPupil: 'round' } as const;
    const stock = image(config, 'sit');
    const tinted = image({ ...config, leftInnerEyeColor: 'blue' }, 'sit');
    if (same(stock, tinted) || tinted.some((pixel, at) =>
      pixel !== stock[at] && (at % size >= size / 2 || Math.floor(at / size) < 90 || Math.floor(at / size) >= 140))) {
      throw Error(`${eye} did not tint only the selected inner pupil`);
    }
  }

  const config = readPetConfig({ ...orange, ...shared, ...left, ...right });
  if (config.frame !== 'CAT') throw Error('An independent pupil configuration did not load as a cat');
  const savedAppearance = { ...left, ...right };
  if (Object.entries(savedAppearance).some(([key, value]) => config[key as keyof typeof savedAppearance] !== value)) {
    throw Error('Normalizing an appearance discarded its independent pupil choices');
  }
  const pose = { typingMode: 'fast', typingAnimation: 'reference-v2', typingMouthVersion: 'shared',
    typingInkVersion: 'clean', typingLayout: 'aligned', laptopVersion: 'clean', outlineVersion: 'adaptive',
    tailArtVersion: 'clean', earLayout: 'shared', markingLayout: 'shared', legacyNoseOutline: false } as const;
  const source = { ...pose, config, action: 'typing', frame: 8, gaze: { x: 0, y: 0 } } as const;
  const rendered = image(config, 'typing', 8, pose);
  const flattened = prepareCatCustomization(canvas, source, config);
  const reopened = prepareStructuredCatCustomization(JSON.parse(JSON.stringify(saveCatInk(source, []))));
  if (flattened.paint.full || !reopened || !same(rendered, image(reopened.source.config, 'typing', 8, pose))) {
    throw Error('Independent pupil choices did not round-trip through a saved appearance');
  }
}

// Exercise the bundled renderer in the same WKWebView used by the floating pet.
export function checkCatActions() {
  checkEarColorOptions();
  checkNoseOptions();
  checkMouthOptions();
  checkTailOptions();
  checkStructuredCatInk();
  checkIndependentPupils();
  const SIZE = 320;
  const canvas = document.createElement('canvas');
  const pixels = () => canvas.getContext('2d')!.getImageData(0, 0, SIZE, SIZE).data;
  const rgba = (pose: Uint8ClampedArray, offset: number) =>
    [pose[offset], pose[offset + 1], pose[offset + 2], pose[offset + 3]].join(',');
  const same = (a: Uint8ClampedArray, b: Uint8ClampedArray) => a.length === b.length && a.every((value, offset) => value === b[offset]);
  const samePixel = (a: Uint8ClampedArray, b: Uint8ClampedArray, offset: number) =>
    a[offset] === b[offset] && a[offset + 1] === b[offset + 1]
      && a[offset + 2] === b[offset + 2] && a[offset + 3] === b[offset + 3];
  const isGlint = (pose: Uint8ClampedArray, offset: number) =>
    pose[offset] === 255 && pose[offset + 1] === 253 && pose[offset + 2] === 246 && pose[offset + 3] === 255;
  const distinct = (frames: Uint8ClampedArray[]) =>
    frames.every((frame, index) => frames.slice(index + 1).every(next => !same(frame, next)));
  const assert = (condition: boolean, message: string) => {
    if (!condition) throw Error(message);
  };
  const assertDistinctFrames = (frames: Uint8ClampedArray[], label: string) => {
    const duplicates: string[] = [];
    for (let first = 0; first < frames.length; first++) {
      for (let second = first + 1; second < frames.length; second++) {
        if (same(frames[first]!, frames[second]!)) duplicates.push(`${first}/${second}`);
      }
    }
    assert(!duplicates.length, `Repeated ${label} frames (zero-based): ${duplicates.join(', ')}`);
  };
  const assertTypingCycle = (frames: Uint8ClampedArray[], label: string) => {
    assert(frames.length === frontTyping.pawFrames && distinct([frames[0]!, frames[2]!, frames[10]!]),
      `${label} lost its resting or alternating paw poses`);
    assert(!same(frames.at(-1)!, frames[0]!), `${label} lost the lift at the loop boundary`);
  };
  // The editable crown fans outward toward the cheeks instead of stopping at
  // a rectangular edge. These bounds follow the shared Aseprite region mask.
  const onForehead = (x: number, y: number) => {
    if (y >= 47 && y <= 95) {
      const left = 116 - 2 * Math.floor((y - 47) * 0.6);
      return x >= left && x <= 303 - left;
    }
    return y >= 96 && y <= 103 && x >= 129 && x <= 174;
  };

  const { preset_cat_orange: orange, preset_cat_calico: calico, preset_cat_black: black } = catPresets;
  const snapshot = (action: Action, frame: number, config: Parameters<typeof render>[1] = orange, poseOptions: CatPose = {}) => {
    // Appearance regressions isolate permanent layers from transient effort effects.
    render(canvas, config, action, frame, undefined, { typingEffects: false, ...poseOptions });
    const pose = pixels();
    let area = 0;
    for (let offset = 3; offset < pose.length; offset += 4) {
      const alpha = pose[offset];
      if (alpha !== 0 && alpha !== 255) throw Error(
        `Cat layer has fractional alpha ${alpha} at ${(offset - 3) / 4 % SIZE},${Math.floor(offset / 4 / SIZE)} in ${action}/${frame} ${config.palette} ${poseOptions.custom ? 'custom' : 'preset'}`);
      if (alpha) area++;
    }
    assert(area > 2200, 'Cat pose is missing or clipped');
    return pose;
  };

  const mouthTouchUp = new Set([[148, 132], [133, 134], [149, 134], [168, 134], [130, 140],
    [135, 142], [135, 143], [135, 144], [135, 145]].map(([x, y]) => y! * SIZE + x!));
  const affectedByTypingCleanup = (x: number, y: number) =>
    mouthTouchUp.has(y * SIZE + x)
    || (x >= 138 && x <= 143 && y >= 213 && y <= 219)
    || (x === 157 && y >= 212 && y <= 219)
    || (x >= 210 && x <= 211 && y >= 204 && y <= 206);
  const oldDefaultMouth = historicalMouth(orange, 'CN01');
  for (const typingMode of ['gentle', 'fast', 'frenzy'] as const) {
    for (let frame = 0; frame < catTypingFrameCountFor('reference-v2'); frame++) {
      const pose = { typingMode, typingAnimation: 'reference-v2', typingEffects: true, typingMouthVersion: 'legacy' } as const;
      const before = snapshot('typing', frame, oldDefaultMouth, { ...pose, typingInkVersion: 'original' });
      const clean = snapshot('typing', frame, oldDefaultMouth, pose);
      for (let offset = 0; offset < clean.length; offset += 4) {
        if (samePixel(before, clean, offset)) continue;
        const x = offset / 4 % SIZE, y = Math.floor(offset / 4 / SIZE);
        assert(clean[offset + 3] === before[offset + 3] && affectedByTypingCleanup(x, y),
          `Orange typing touch-up changed a pixel outside the opaque repair at ${x},${y}`);
      }
      for (const [x, y] of [[210, 205], [141, 218], [157, 218], [135, 144]] as const) {
        assert((clean[(y * SIZE + x) * 4 + 1] ?? 0) >= 120,
          `Orange typing left a dark remnant at ${x},${y} in ${typingMode}/${frame}`);
      }
    }
  }
  const oldTyping = document.createElement('canvas');
  const oldOrange = historicalMouth(historicalTail(historicalNose(orange, 'NO01'), 'CT01'), 'CN01');
  render(oldTyping, oldOrange, 'typing', 25, undefined,
    { typingMode: 'frenzy', typingAnimation: 'reference-v2', typingInkVersion: 'original', typingMouthVersion: 'legacy' });
  const oldTypingSource = {
    config: oldOrange, action: 'typing', frame: 25, typingMode: 'frenzy', gaze: { x: 0, y: 0 },
    typingLayout: 'aligned', typingAnimation: 'reference-v2', laptopVersion: 'clean',
    outlineVersion: 'adaptive', earLayout: 'shared', markingLayout: 'shared',
  } as const;
  for (const reference of [oldTypingSource, null]) {
    const historical = prepareCatCustomization(oldTyping, reference, orange);
    assert(historical.source.typingInkVersion === 'original' && historical.source.config.nose === 'NO01' && !historical.paint.full,
      'Opening an older orange typing save mistook the old smudges for user ink');
  }

  const eyeRimBreed = catPresets.preset_cat_british_blue;
  const effortPose = { typingMode: 'frenzy', typingAnimation: 'front-v3', typingEffects: true } as const;
  const formerEyeRim = snapshot('typing', 20, eyeRimBreed, { ...effortPose, typingInkVersion: 'clean' });
  const restoredEyeFur = snapshot('typing', 20, eyeRimBreed, effortPose);
  const cheekGreen = (108 * SIZE + 213) * 4 + 1;
  for (const [x, y] of [[208, 108], [209, 109], [210, 122]] as const) {
    const offset = (y * SIZE + x) * 4 + 1;
    assert(formerEyeRim[offset]! > formerEyeRim[cheekGreen]! + 30
      && Math.abs(restoredEyeFur[offset]! - restoredEyeFur[cheekGreen]!) <= 8,
      `British Blue effort eyes retained the old eye rim at ${x},${y}`);
  }
  const eyelid = (117 * SIZE + 121) * 4;
  assert(samePixel(formerEyeRim, restoredEyeFur, eyelid), 'Eye rim cleanup altered the painted squint');

  for (const action of ['left', 'typing'] as const) {
    const frames = Array.from({ length: action === 'typing' ? frontTyping.pawFrames : 4 },
      (_, frame) => snapshot(action, frame, orange, { typingMode: 'fast' }));
    const label = `${orange.name}/${action}/fast/typingEffects:false`;
    if (action === 'typing') assertTypingCycle(frames, label);
    else assertDistinctFrames(frames, label);
    for (let frame = 0; frame < (action === 'typing' ? frontTyping.pawFrames : 4); frame++) {
      const base = snapshot(action, frame);
      const looks = [
        ...Object.keys(action === 'left' ? catAssetOptions.palette : catOptions.palette)
          .filter(id => id !== orange.palette).map(palette => ({ palette })),
        ...action === 'left' ? Object.keys(catOptions.eye).filter(id => id !== orange.eye).map(eye => ({ eye })) : [],
        ...Object.keys(catOptions.pattern).filter(id => id !== orange.pattern
          && (action !== 'left' || ['P01', 'P02', 'P06'].includes(id))).map(pattern => ({ pattern })),
        { eyeColor: 'blue' }, { eyeColor: 'green' },
      ] as Partial<typeof orange>[];
      for (const change of looks) {
        assert(!same(base, snapshot(action, frame, { ...orange, ...change })), `Ignored ${JSON.stringify(change)} in ${action}`);
      }
    }
  }

  for (const action of ['sit', 'left', 'right', 'typing'] as const) {
    const frames = action === 'sit' ? 1 : action === 'typing' ? frontTyping.pawFrames : 4;
    for (let frame = 0; frame < frames; frame++) {
      for (const part of ['ear', 'mouth', 'eye', 'accessory'] as const) {
        const walking = action === 'left' || action === 'right';
        if (part === 'accessory' && walking) continue;
        if (part === 'mouth' && walking) {
          const poses = mouthMigrations.map(([mouth]) => snapshot(action, frame, historicalMouth(orange, mouth)));
          assert(distinct(poses), `A legacy walking mouth was lost in ${action}/${frame}`);
          continue;
        }
        const ids = Object.keys(orangeCatOptions[part]);
        const choices = part === 'ear' && walking
          ? ids.filter(id => id !== 'CE03' && id !== 'CE05') : ids;
        const poses = choices.map(id =>
          snapshot(action, frame, readPetConfig({ ...(part === 'eye' ? calico : orange), [part]: id })),
        );
        assert(distinct(poses), `Duplicate ${part} variant in ${action}/${frame}`);
        if (part === 'ear' && (action === 'sit' || action === 'typing')) {
          const belowEars = 108 * SIZE * 4;
          const base = poses[0]!.subarray(belowEars);
          assert(poses.every(pose => same(base, pose.subarray(belowEars))),
            `Ear change modified pixels below the ears in ${action}/${frame}`);
        }
      }
      for (const eye of ['Y05', 'Y06', 'Y07'] as const) {
        const combined = { ...black, ear: 'CE04', mouth: 'CN09', eye } as const;
        const natural = snapshot(action, frame, combined);
        assert(!same(natural, snapshot(action, frame, { ...combined, eyeColor: 'blue' })),
          `Iris recolor missing for ${eye} in ${action}/${frame}`);
      }
    }
  }

  const belowKeyboard = 189 * SIZE * 4;
  const laptop = snapshot('typing', 0, black);
  const coats = Object.keys(catOptions.coat) as (keyof typeof catOptions.coat)[];
  const bodyPatterns = Object.keys(catOptions.bodyPattern) as (keyof typeof catOptions.bodyPattern)[];
  const foreheadPatterns = Object.keys(catOptions.pattern) as (keyof typeof catOptions.pattern)[];
  const propCanvas = document.createElement('canvas');
  propCanvas.width = propCanvas.height = SIZE;
  const propContext = propCanvas.getContext('2d')!;
  propContext.drawImage(catTypingLaptop(orange, 'aligned', 'clean'), 0, 0);
  const cleanProp = propContext.getImageData(0, 0, SIZE, SIZE).data;
  const solidProp: number[] = [];
  const propAlpha = (x: number, y: number) => x < 0 || y < 0 || x >= SIZE || y >= SIZE
    ? 0 : cleanProp[(y * SIZE + x) * 4 + 3]!;
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const offset = (y * SIZE + x) * 4;
    const alpha = cleanProp[offset + 3];
    assert(alpha === 0 || alpha === 255, `Laptop has fractional alpha at ${x},${y}`);
    if (!alpha) continue;
    solidProp.push(y * SIZE + x);
    if (!propAlpha(x - 1, y) || !propAlpha(x + 1, y) || !propAlpha(x, y - 1) || !propAlpha(x, y + 1)) {
      assert(rgba(cleanProp, offset) === '68,36,22,255', `Laptop fringe retained a stray color at ${x},${y}`);
    }
  }
  assert(solidProp.length > 1000, 'The cleaned laptop is missing');
  const logoPixels = solidProp.filter(index => {
    const i = index * 4;
    return cleanProp[i]! >= 230 && cleanProp[i + 1]! >= 230 && cleanProp[i + 2]! >= 230;
  });
  assert(logoPixels.length > 0, 'The laptop logo is missing');
  const reached = new Set<number>([solidProp[0]!]);
  const pending = [solidProp[0]!];
  while (pending.length) {
    const index = pending.pop()!, x = index % SIZE, y = Math.floor(index / SIZE);
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (!propAlpha(nx!, ny!)) continue;
      const neighbor = ny! * SIZE + nx!;
      if (!reached.has(neighbor)) { reached.add(neighbor); pending.push(neighbor); }
    }
  }
  assert(reached.size === solidProp.length, 'Detached pixels remain outside the laptop outline');
  for (const preset of Object.values(catPresets)) {
    for (const config of [preset, { ...preset, coat: 'lavender', bodyPattern: 'spotted', tail: 'CT07' } as const]) {
      const composed = snapshot('typing', 0, config);
      assert(solidProp.every(index => samePixel(composed, cleanProp, index * 4)),
        `${preset.name} recolored or covered the clean laptop when changing coat or tail`);
    }
  }
  const outlineBoundary = (pose: Uint8ClampedArray, x: number, y: number) => {
    const opaque = (px: number, py: number) => px >= 0 && py >= 0 && px < SIZE && py < SIZE
      && pose[(py * SIZE + px) * 4 + 3] !== 0;
    return opaque(x, y) && (!opaque(x - 1, y) || !opaque(x + 1, y) || !opaque(x, y - 1) || !opaque(x, y + 1));
  };
  for (const preset of Object.values(catPresets)) {
    for (const [action, typingMode] of [['sit', 'gentle'], ['typing', 'gentle'], ['typing', 'fast'], ['typing', 'frenzy']] as const) {
      const pose = { typingMode, typingEffects: true } as const;
      if (!colorCatBreed(preset.palette)) {
        assert(same(snapshot(action, 8, preset, { ...pose, outlineVersion: 'original' }), snapshot(action, 8, preset, pose)),
          `${preset.name} changed its baked coat when enabling adaptive outlines`);
      }
      const colored = { ...preset, coat: 'lavender' } as const;
      const original = snapshot(action, 8, colored, { ...pose, outlineVersion: 'original' });
      const adaptive = snapshot(action, 8, colored, pose);
      let changedBoundary = 0;
      for (let offset = 0; offset < original.length; offset += 4) {
        const x = offset / 4 % SIZE, y = Math.floor(offset / 4 / SIZE);
        assert(original[offset + 3] === adaptive[offset + 3],
          `${preset.name}/${action}/${typingMode} changed alpha while recoloring its outline at ${x},${y}`);
        // Face ink stays deep and readable. This covers both eye regions,
        // the connecting fur, the independent nose and mouth shapes.
        const face = (x >= 87 && x <= 215 && y >= 92 && y <= 143)
          || (x >= 126 && x <= 178 && y >= 117 && y <= 164);
        const foreheadFur = x >= 133 && x <= 168 && y >= 60 && y <= 90;
        if (face || foreheadFur || (action === 'typing' && cleanProp[offset + 3])) {
          assert(samePixel(original, adaptive, offset),
            `${preset.name}/${action}/${typingMode} recolored face details, forehead fur or the laptop at ${x},${y}`);
        }
        if (!samePixel(original, adaptive, offset) && outlineBoundary(original, x, y)) changedBoundary++;
      }
      assert(changedBoundary > 0, `${preset.name}/${action}/${typingMode} kept its old outer outline after changing coat`);
    }
  }
  const outlineCoats = ['cream', 'lavender', 'deepSea'] as const;
  const outlineSamples = outlineCoats.map(coat => {
    const config = { ...orange, coat };
    return { original: snapshot('sit', 0, config, { outlineVersion: 'original' }), adaptive: snapshot('sit', 0, config) };
  });
  for (let variant = 1; variant < outlineSamples.length; variant++) {
    const first = outlineSamples[0]!, next = outlineSamples[variant]!;
    let changedPigment = false;
    for (let offset = 0; offset < first.original.length; offset += 4) {
      const x = offset / 4 % SIZE, y = Math.floor(offset / 4 / SIZE);
      if (outlineBoundary(first.original, x, y) && samePixel(first.original, next.original, offset)
        && !samePixel(first.original, first.adaptive, offset) && !samePixel(next.original, next.adaptive, offset)
        && !samePixel(first.adaptive, next.adaptive, offset)) changedPigment = true;
    }
    assert(changedPigment, `${outlineCoats[variant]} used the same outline pigment as cream`);
  }
  for (const accessory of ['A01', 'A02', 'A03', 'A06'] as const) {
    const config = { ...orange, coat: 'lavender', accessory } as const;
    for (const action of ['sit', 'typing'] as const) {
      const without = snapshot(action, 0, { ...config, accessory: 'A00' }, { outlineVersion: 'original' });
      const original = snapshot(action, 0, config, { outlineVersion: 'original' });
      const adaptive = snapshot(action, 0, config);
      for (let offset = 0; offset < original.length; offset += 4) {
        if (samePixel(without, original, offset)) continue;
        assert(samePixel(original, adaptive, offset), `Adaptive cat outlines recolored ${accessory} in ${action}`);
      }
    }
  }
  for (const action of ['sit', 'typing'] as const) {
    const config = { ...orange, coat: 'lavender' } as const;
    const unchangedParts = snapshot(action, 0, config, { outlineVersion: 'original' });
    for (const replacement of [
      ...(['CE02', 'CE03', 'CE04', 'CE05'] as const).map(ear => ({ ear })),
      ...visibleTails.slice(1).map(tail => ({ tail })),
    ]) {
      const variant = { ...config, ...replacement };
      const original = snapshot(action, 0, variant, { outlineVersion: 'original' });
      const adaptive = snapshot(action, 0, variant);
      let changedNewPart = false;
      for (let offset = 0; offset < original.length; offset += 4) {
        if (original[offset + 3] && !samePixel(unchangedParts, original, offset)
          && !samePixel(original, adaptive, offset)) changedNewPart = true;
      }
      assert(changedNewPart, `Adaptive outlines missed ${JSON.stringify(replacement)} in ${action}`);
    }
  }
  for (const preset of Object.values(catPresets)) {
    const idle = snapshot('sit', 0, preset);
    assert(same(idle, snapshot('sit', 0, preset, { markingLayout: 'legacy' })),
      `Separating forehead markings changed the default ${preset.name}`);
    const eyeCanvas = document.createElement('canvas');
    eyeCanvas.width = eyeCanvas.height = SIZE;
    const eyeContext = eyeCanvas.getContext('2d')!;
    eyeContext.drawImage(catGlintAperture(preset, true, 0)!, 0, 0);
    const protectedEyes = eyeContext.getImageData(0, 0, SIZE, SIZE).data;
    const { coat: _coat, bodyPattern: _bodyPattern, ...originalPreset } = preset;
    const migratedCoat = readPetConfig(originalPreset);
    assert(migratedCoat.frame === 'CAT' && migratedCoat.coat === 'native' && migratedCoat.bodyPattern === 'native',
      'Legacy cat lost its original coloring or pattern');
    for (const [action, typingMode] of [['sit', 'gentle'], ['typing', 'gentle'], ['typing', 'fast']] as const) {
      const variants = coats.map(coat => snapshot(action, 0, { ...preset, coat }, { typingMode }));
      const stock = variants[0]!;
      assert(distinct(variants), `Coat combinations matched in ${action}/${typingMode}/${preset.name}`);
      for (const colored of variants) {
        for (let pixel = 3; pixel < stock.length; pixel += 4) {
          assert(stock[pixel] === colored[pixel], `Coat changed alpha in ${action}/${preset.name}`);
        }
        for (const [x, y] of [[110, 119], [190, 119], [151, 123]]) {
          const pixel = (y * SIZE + x) * 4;
          assert(samePixel(stock, colored, pixel), `Coat changed the eyes or nose in ${action}/${preset.name}`);
        }
        if (action === 'typing') {
          const sample = (248 * SIZE + 149) * 4;
          assert(samePixel(stock, colored, sample), `Coat painted the laptop for ${preset.name}`);
        }
      }
    }
    for (const [action, typingMode] of [['sit', 'gentle'], ['typing', 'gentle'], ['typing', 'fast']] as const) {
      for (let frame = 0; frame < (action === 'sit' ? 1 : frontTyping.pawFrames); frame++) {
        const variants = bodyPatterns.map(bodyPattern => snapshot(action, frame, { ...preset, bodyPattern }, { typingMode }));
        const stock = variants[0]!;
        assert(distinct(variants), `Pattern options matched in ${action}/${frame}/${typingMode}/${preset.name}`);
        assert(distinct(variants.slice(1).map(variant => variant.slice(86 * SIZE * 4, 174 * SIZE * 4))),
          `Fur pattern selection did not produce different facial fur in ${action}/${preset.name}`);
        for (const painted of variants) {
          // The tail can begin at y145, so only the head above it is isolated here.
          for (let offset = 0; offset < 145 * SIZE * 4; offset += 4) {
            const x = offset / 4 % SIZE, y = Math.floor(offset / 4 / SIZE);
            const facialFur = x >= 50 && x <= 252 && y >= 86 && y <= 173 && !onForehead(x, y);
            if (!facialFur || protectedEyes[offset + 3]) {
              assert(samePixel(stock, painted, offset),
                `Fur pattern altered the independent forehead, ears or pupils of ${preset.name}`);
            }
          }
          for (const [x, y] of [[151, 123], [151, 134], [94, 117], [208, 117]]) {
            const offset = (y! * SIZE + x!) * 4;
            assert(samePixel(stock, painted, offset),
              `Fur pattern painted an eye, nose or mouth of ${preset.name}`);
          }
          for (let pixel = 3; pixel < stock.length; pixel += 4) {
            assert(stock[pixel] === painted[pixel], `Body pattern changed the silhouette in ${action}/${preset.name}`);
          }
          if (action === 'typing') {
            const sample = (248 * SIZE + 149) * 4;
            assert(samePixel(stock, painted, sample), `Body pattern changed the laptop for ${preset.name}`);
          }
        }
      }
      const variants = foreheadPatterns.map(pattern => snapshot(action, 0,
        { ...preset, pattern, bodyPattern: 'mackerel' }, { typingMode }));
      const original = variants[0]!;
      // Native markings may already be blank on a solid coat; the six explicit choices must differ.
      assert(distinct(variants.slice(1)), `Forehead materials matched for ${preset.name}/${action}`);
      for (const variant of variants) {
        for (let offset = 0; offset < original.length; offset += 4) {
          const x = offset / 4 % SIZE, y = Math.floor(offset / 4 / SIZE);
          assert(original[offset + 3] === variant[offset + 3], `Forehead markings changed ${preset.name}'s silhouette`);
          if (onForehead(x, y)) continue;
          assert(samePixel(original, variant, offset),
            `Forehead choice repainted the facial fur, eyes, muzzle or body of ${preset.name}`);
        }
      }
    }
    const theme = { ...preset, coat: 'silver', bodyPattern: 'spotted' } as const;
    assert(!same(snapshot('sit', 0, theme), snapshot('sit', 0, { ...theme, bodyPattern: 'plain' })),
      `A color scheme covered the selected body pattern for ${preset.name}`);

    const choices = preset === orange ? orangeCatOptions : catOptions;
    const accessories = Object.fromEntries(Object.keys(choices.accessory).map(accessory =>
      [accessory, snapshot('sit', 0, readPetConfig({ ...preset, accessory }))],
    ));
    assert(distinct(Object.values(accessories)), `Accessory missing for ${preset.name}`);
    const retiredAccessories = preset === orange ? ['A04', 'A05'] : ['A04', 'A05', 'A06'];
    for (const accessory of retiredAccessories) {
      const restored = readPetConfig({ ...preset, accessory, ear: 'CE02' });
      assert(!Object.hasOwn(choices.accessory, accessory), `Retired accessory ${accessory} offered for ${preset.name}`);
      assert(restored.frame === 'CAT' && restored.accessory === 'A00' && restored.ear === 'CE02',
        `Saved accessory ${accessory} did not reset safely for ${preset.name}`);
    }
    const gentle = snapshot('typing', 0, preset);
    // The nose tip can shorten the connecting stem. The mouth below stays in place.
    const mouthRows = visibleMouths.map(mouth => {
      const row = visibleNoses.map(nose => snapshot('sit', 0, { ...preset, nose, mouth }));
      assert(distinct(row), `Nose choices are identical for ${preset.name}/${mouth}`);
      for (const pose of row) {
        assert(same(pose.subarray(138 * SIZE * 4), row[0]!.subarray(138 * SIZE * 4)),
          `Changing the nose repainted the mouth for ${preset.name}/${mouth}`);
      }
      return row;
    });
    for (const [index, nose] of visibleNoses.entries()) {
      assert(distinct(mouthRows.map(row => row[index]!)), `Mouth choices are identical for ${preset.name}/${nose}`);
    }
    if (preset !== orange) {
      for (const part of ['ear', 'mouth', 'eye', 'pattern'] as const) {
        if (part === 'eye' && usesOrangeCatArt(preset)) continue;
        const configs = Object.keys(choices[part]).map(value => readPetConfig({ ...preset, [part]: value }));
        const variants = configs.map(config => snapshot('sit', 0, config));
        assert(distinct(part === 'pattern' ? variants.slice(1) : variants), `Duplicate ${part} for ${preset.name}`);
        if (part === 'ear') {
          const belowEars = 108 * SIZE * 4;
          assert(variants.every(variant => same(variant.subarray(belowEars), variants[0]!.subarray(belowEars))),
            `Ear change reached below the ears for ${preset.name}`);
          for (const [index, variant] of variants.entries()) {
            const ear = Object.keys(choices.ear)[index]!;
            const shape = snapshot('sit', 0, readPetConfig({ ...orange, ear }));
            for (let y = 0; y < 108; y++) {
              const row = y * SIZE * 4;
              assert(same(variant.subarray(row + 137 * 4, row + 165 * 4), idle.subarray(row + 137 * 4, row + 165 * 4)),
                `Ear change repainted the middle of the forehead for ${preset.name}`);
              for (let offset = row + 3; offset < row + SIZE * 4; offset += 4) {
                assert(variant[offset] === shape[offset], `Ear shape lost silhouette pixels for ${preset.name}`);
              }
            }
            for (const typingMode of ['gentle', 'fast'] as const) {
              for (let frame = 0; frame < frontTyping.pawFrames; frame++) {
                const typing = snapshot('typing', frame, configs[index]!, { typingMode });
                assert(same(typing.subarray(0, belowEars), variant.subarray(0, belowEars)),
                  `Ear seam changed while typing for ${preset.name}/${ear}`);
              }
            }
          }
        }
      }
      for (let y = 226; y < 265; y++) {
        const start = (y * SIZE + 120) * 4;
        const end = (y * SIZE + 198) * 4;
        assert(same(gentle.subarray(start, end), laptop.subarray(start, end)),
          `Laptop paint changed for ${preset.name}`);
      }
    } else {
      assert(same(accessories.A06!, snapshot('sit', 0, readPetConfig({ ...preset, accessory: 'A07' }))),
        'Orange cap alias changed');
    }
    const commonPawCycle = Array.from({ length: frontTyping.pawFrames }, (_, frame) =>
      snapshot('typing', frame, preset, { typingMode: 'gentle' }));
    for (const typingMode of ['gentle', 'fast', 'frenzy'] as const) {
      const poses = Array.from({ length: frontTyping.pawFrames }, (_, frame) => snapshot('typing', frame, preset, { typingMode }));
      const first = poses[0]!;
      if (typingMode !== 'frenzy') assert(poses.every((pose, frame) => same(pose, commonPawCycle[frame]!)),
        `${preset.name}/${typingMode} changed the approved paw shapes instead of their cadence`);
      assert(same(first, snapshot('typing', catTypingFrameCount, preset, { typingMode })),
        `${preset.name}/${typingMode} failed to wrap at the end of its cycle`);
      for (let frame = 0; frame < frontTyping.pawFrames; frame++) {
        const next = poses[frame]!;
        const press = typingMode === 'frenzy' ? 6 : 4;
        const leftHidden = frame >= 2 && frame < 2 + press;
        const rightHidden = frame >= 10 && frame < 10 + press;
        let left = false, right = false;
        for (let offset = 0; offset < next.length; offset += 4) {
          if (cleanProp[offset + 3]) {
            if (!samePixel(cleanProp, next, offset)) throw Error('Typing changed the laptop');
            continue;
          }
          if (samePixel(idle, next, offset)) continue;
          const x = offset / 4 % SIZE, y = Math.floor(offset / 4 / SIZE);
          const isLeft = x >= 82 && x < 122, isRight = x >= 180 && x < 220;
          assert(y >= 168 && y < 189 && (isLeft || isRight),
            `${preset.name}/${typingMode} modified idle artwork outside the paws at ${x},${y}`);
          left ||= isLeft;
          right ||= isRight;
        }
        assert(left !== leftHidden && right !== rightHidden,
          `${preset.name}/${typingMode} failed to alternate completely hidden paws at frame ${frame}`);
      }
    }

    const fastHeads: Uint8ClampedArray[] = [];
    const effortInk = catRenderConfig(preset).palette === 'CC02' ? [32, 27, 30] : [68, 36, 22];
    const protectedEyeOffsets: number[] = [];
    const eyeAreas = [0, 0];
    for (let offset = 0; offset < protectedEyes.length; offset += 4) {
      if (!protectedEyes[offset + 3]) continue;
      protectedEyeOffsets.push(offset);
      eyeAreas[offset / 4 % SIZE < SIZE / 2 ? 0 : 1]!++;
    }
    for (let frame = 0; frame < catTypingFrameCountFor('reference-v2'); frame++) {
      const fastPose = snapshot('typing', frame, preset, { typingMode: 'fast' });
      const openEyes = snapshot('typing', frame, preset, { typingMode: 'fast', typingEffects: true });
      assert(protectedEyeOffsets.every(offset => samePixel(openEyes, fastPose, offset)),
        `${preset.name} closed or moved its pupils before frenzy typing`);
      const previousFast = snapshot('typing', frame, preset, { typingMode: 'fast', typingEffects: true, typingAnimation: 'front-v3' });
      assert(same(openEyes, previousFast), `${preset.name} changed its existing fast typing art`);
      fastHeads.push(openEyes.subarray(0, 140 * SIZE * 4));
      if (frame === frontTyping.pawFrames) {
        render(canvas, preset, 'typing', frame, { x: -100, y: 60, space: 'pointer' }, { typingMode: 'fast' });
        const tracked = pixels(), moved = [0, 0];
        for (const offset of protectedEyeOffsets) {
          if (samePixel(openEyes, tracked, offset)) continue;
          assert(isGlint(openEyes, offset) || isGlint(tracked, offset),
            `${preset.name} moved its fast-typing pupil instead of its reflection`);
          moved[offset / 4 % SIZE < SIZE / 2 ? 0 : 1]!++;
        }
        assert(moved.every(count => count > 0), `${preset.name} disabled eye tracking before frenzy typing`);
      }

    }
    for (const frame of [0, 13, 28, 29, 36, 48, 58, 59, 63]) {
      const normal = snapshot('typing', frame, preset);
      const effort = snapshot('typing', frame, preset, { typingMode: 'frenzy', typingEffects: true });
      const eyelidArea = [0, 0];
      let changedEyes = 0;
      for (const offset of protectedEyeOffsets) {
        if (!samePixel(effort, normal, offset)) changedEyes++;
        const red = effort[offset]!, green = effort[offset + 1]!, blue = effort[offset + 2]!;
        if (red === effortInk[0] && green === effortInk[1] && blue === effortInk[2] && effort[offset + 3] === 255) {
          eyelidArea[offset / 4 % SIZE < SIZE / 2 ? 0 : 1]!++;
        } else if (['CC05', 'CC06', 'CC07', 'CC08'].includes(preset.palette)) {
          assert(!(green <= 55 && red - green >= 12 && green > blue),
            `${preset.name} retained a baked dark pupil behind its effort eyelids`);
        }
      }
      assert(changedEyes > 0 && eyelidArea.every((area, eye) => area > 0 && area < eyeAreas[eye]! / 2),
        `${preset.name} did not replace both pupils with narrow effort eyelids`);
      const baseline = snapshot('typing', frame, preset, { typingMode: 'frenzy' });
      const panel = (241 * SIZE + 110) * 4;
      if (frame === 36) {
        assert(effort[panel]! > baseline[panel]! && effort[panel + 1]! < baseline[panel + 1]!
          && logoPixels.every(index => samePixel(effort, baseline, index * 4)), `${preset.name} failed to heat the laptop while retaining its logo`);
      }
      render(canvas, preset, 'typing', frame, { x: -100, y: 60, space: 'pointer' }, { typingMode: 'frenzy' });
      assert(same(pixels(), effort), `${preset.name} drew moving glints over its effort expression`);
    }
    assert(!same(fastHeads[0]!, fastHeads[catTypingFrameCount / 4]!), `${preset.name} fast expression and sweat did not progress`);
    // Historic shared saves retain the exact old fast expression; reference
    // fast deliberately uses open eyes, so it cannot reconstruct these pixels.
    const sharedEffort = snapshot('typing', 11, preset,
      { typingMode: 'fast', typingAnimation: 'shared', typingEffects: true });
    for (const [x, y] of [[99, 108], [115, 116], [201, 108], [187, 116]]) {
      const offset = (y! * SIZE + x!) * 4;
      assert(effortInk.every((channel, index) => sharedEffort[offset + index] === channel)
        && sharedEffort[offset + 3] === 255,
      `${preset.name} changed the historical shared effort-eye chevrons`);
    }
    // Typing uses the shared mouth even when the sitting mouth, nose and fur are customized.
    const config = { ...preset, mouth: 'CN09', nose: 'NO08', noseColor: 'plum',
      coat: 'silver', bodyPattern: 'spotted', ear: 'CE04' } as const;
    for (const [typingMode, mouth] of [['gentle', 'CN08'], ['fast', 'CN06'], ['frenzy', 'CN07']] as const) {
      const plain = snapshot('typing', 8, { ...config, mouth }, { typingMode });
      const expressive = snapshot('typing', 8, config, { typingMode, typingEffects: true });
      // The upper rectangle stops before the corner of the right eye.
      for (const [left, top, right, bottom] of [[134, 118, 169, 136], [128, 131, 175, 162]] as const) {
        for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
          const offset = (y * SIZE + x) * 4;
          assert(samePixel(plain, expressive, offset),
            `${preset.name}/${typingMode} did not reuse ${mouth} with the selected nose and coat at ${x},${y}`);
        }
      }
    }
  }

  // A unified plain coat must not retain a deep point-color triangle when its
  // independent forehead is blank. Native breed pigment is tested separately.
  const bareForehead = snapshot('sit', 0, {
    ...catPresets.preset_cat_siamese, pattern: 'P03', bodyPattern: 'plain',
  });
  const foreheadBase = Number.parseInt(nativeCatFur.CC04[0].slice(1), 16);
  const foreheadMarking = Number.parseInt(nativeCatFur.CC04[1].slice(1), 16);
  // Stay below the preserved top outline; its dark edge reaches y54 here.
  for (let y = 60; y <= 90; y++) for (let x = 124; x <= 178; x++) {
    for (let channel = 0; channel < 3; channel++) {
      const shift = 16 - channel * 8;
      const base = (foreheadBase >>> shift) & 255, marking = (foreheadMarking >>> shift) & 255;
      const color = bareForehead[(y * SIZE + x) * 4 + channel]!;
      assert(color >= base + (marking - base) * 0.35 - 2 && color <= base + 2,
        'No-forehead-pattern retained a deep pigment patch instead of clean fur');
    }
  }
  for (const preset of [calico, catPresets.preset_cat_siamese, catPresets.preset_cat_ragdoll]) {
    const original = snapshot('sit', 0, preset);
    const unmarked = snapshot('sit', 0, { ...preset, pattern: 'P03' });
    for (let i = 0; i < unmarked.length; i += 4) {
      if (samePixel(original, unmarked, i)) continue;
      const x = i / 4 % SIZE, y = Math.floor(i / (SIZE * 4));
      assert(y >= 52 && y <= 58 && ((x >= 115 && x <= 131) || (x >= 170 && x <= 186))
        && original[i + 3] === unmarked[i + 3],
      `${preset.name} changed the silhouette or natural coat beyond the ear seams`);
    }
  }
  const unmarkedOrange = { ...orange, pattern: 'P03' } as const;
  const oldCrown = snapshot('sit', 0, unmarkedOrange, { markingLayout: 'shared' });
  const cleanCrown = snapshot('sit', 0, unmarkedOrange);
  for (const x of [124, 177]) {
    const spot = (54 * SIZE + x) * 4;
    const outerLine = (50 * SIZE + x) * 4;
    assert(oldCrown[spot + 1]! < 78 && cleanCrown[spot + 1]! > 120
      && samePixel(oldCrown, cleanCrown, outerLine),
    `Unmarked forehead retained dark ink at the ear seam or changed the outer line at x=${x}`);
  }

  // The calico atlas used a white fringe around its muzzle. A plain fur choice
  // must remove that background while preserving every dark/pink facial pixel.
  const calicoFace = snapshot('sit', 0, calico);
  const plainCalicoFace = snapshot('sit', 0, { ...calico, bodyPattern: 'plain' });
  for (let y = 119; y < 157; y++) for (let x = 133; x < 171; x++) {
    const offset = (y * SIZE + x) * 4;
    const red = calicoFace[offset]!, green = calicoFace[offset + 1]!, blue = calicoFace[offset + 2]!;
    const feature = (red < 145 && green < 70)
      || (red >= 110 && red > green * 1.25 && blue > green * 0.75);
    if (feature) assert(samePixel(calicoFace, plainCalicoFace, offset),
      'Cleaning the muzzle background repainted the nose or mouth');
    if (!feature) assert(Math.min(plainCalicoFace[offset]!, plainCalicoFace[offset + 1]!, plainCalicoFace[offset + 2]!) < 190,
      'Plain facial fur retained the old white fringe around the muzzle');
  }

  for (let frame = 0; frame < 4; frame++) {
    const left = snapshot('left', frame, calico);
    const right = snapshot('right', frame, calico);
    let flankDiffers = false;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const a = (y * SIZE + x) * 4;
        const b = (y * SIZE + SIZE - 1 - x) * 4;
        assert(left[a + 3] === right[b + 3], 'Right walk silhouette is not mirrored');
        if (left[a + 3] && (left[a] !== right[b] || left[a + 1] !== right[b + 1] || left[a + 2] !== right[b + 2])) {
          flankDiffers = true;
        }
      }
    }
    assert(flankDiffers, 'Calico walk reused the opposite flank markings');
  }

  const sit = snapshot('sit', 0, calico);
  const motion = new Motion(canvas, calico);
  const time = Math.ceil(performance.now());
  motion.tick(time);
  assert(same(pixels(), sit), 'Cat did not start sitting');
  motion.beginDrag();
  motion.drag(-16);
  motion.tick(time);
  const draggedLeft = pixels();
  assert(!same(draggedLeft, sit), 'Dragging did not stretch the front-facing cat');
  motion.drag(16);
  motion.tick(time + 16);
  assert(!same(pixels(), draggedLeft), 'The cat did not respond to a change in drag direction');
  motion.release(time + 16);
  motion.tick(time + 640);
  assert(same(pixels(), snapshot('sit', 6, calico)), 'The cat did not settle after release');
  const gentleDuration = catTypingFrameDuration('gentle');
  const fastDuration = catTypingFrameDuration('fast');
  const frenzyDuration = catTypingFrameDuration('frenzy');
  assert(catTypingFrameCount === 64 && gentleDuration === 70 && fastDuration === 40 && frenzyDuration === 20,
    'Approved typing did not use 64 frames at progressively faster 70/40/20ms intervals');
  assert(catTypingFrameCountFor('reference') === 12 && catTypingFrameCountFor('shared') === 12
    && catTypingFrameCountFor('legacy') === 4 && catTypingFrameCountFor('reference-v2') === 32,
  'Expanding current typing changed a historical animation frame count');
  assert(catTypingFrameDuration('gentle', 'reference') * 12 === 1000
    && catTypingFrameDuration('fast', 'reference') * 12 === 600
    && catTypingFrameDuration('frenzy', 'reference') * 12 === 360,
  'Expanding current typing changed historical reference timing');
  for (const preset of Object.values(catPresets)) {
    const timedCanvas = document.createElement('canvas');
    const typingMotion = new Motion(timedCanvas, preset);
    const observed = () => timedCanvas.getContext('2d')!.getImageData(0, 0, SIZE, SIZE).data;
    const expected = (frame: number, typingMode: TypingMode, frenzyElapsed = 0) =>
      snapshot('typing', frame, preset, { typingMode, typingEffects: true,
        frenzyHeatFrame: typingMode === 'frenzy' ? frenzyHeatFrameAt(frenzyElapsed) : undefined });
    const start = Math.ceil(performance.now());
    typingMotion.key(start);
    typingMotion.tick(start);
    assert(same(observed(), expected(0, 'gentle')), `${preset.name} did not start at the first gentle pose`);
    const change = start + 3 * gentleDuration + 0.1;
    typingMotion.tick(change);
    assert(same(observed(), expected(3, 'gentle')), `${preset.name} did not advance through the smoother gentle cycle`);
    for (let key = 0; key < 3; key++) typingMotion.key(change);
    typingMotion.tick(change);
    assert(same(observed(), expected(3, 'gentle')), `${preset.name} sped up before its fifth key`);
    typingMotion.key(change);
    typingMotion.tick(change);
    assert(same(observed(), expected(3, 'fast')), `${preset.name} restarted the paws when changing to fast typing`);
    const frenzyStart = change + fastDuration + 0.1;
    typingMotion.tick(frenzyStart);
    assert(same(observed(), expected(4, 'fast')), `${preset.name} did not advance at the faster cadence`);
    for (let key = 0; key < 3; key++) typingMotion.key(frenzyStart);
    typingMotion.tick(frenzyStart);
    assert(same(observed(), expected(4, 'fast')), `${preset.name} entered frenzy before its ninth key`);
    typingMotion.key(frenzyStart);
    typingMotion.tick(frenzyStart);
    assert(same(observed(), expected(4, 'frenzy')), `${preset.name} reset its paw phase when entering frenzy`);
    typingMotion.tick(frenzyStart + frenzyDuration + 0.1);
    assert(same(observed(), expected(5, 'frenzy', frenzyDuration)), `${preset.name} did not advance at the frenzy cadence`);
    // Sustain the same input rate across the longer letter loop.
    let lastKey = frenzyStart;
    const cycle = catTypingFrameCount * frenzyDuration;
    const panel = (241 * SIZE + 110) * 4;
    let red = observed()[panel]!;
    let fullHeat: Uint8ClampedArray | undefined;
    for (let elapsed = 100; elapsed < cycle; elapsed += 100) {
      lastKey = frenzyStart + elapsed;
      typingMotion.key(lastKey);
      typingMotion.tick(lastKey);
      const frame = observed();
      assert(frame[panel]! >= red, `${preset.name} cooled down in the middle of frenzy`);
      red = frame[panel]!;
      if (elapsed === 600) fullHeat = frame;
    }
    typingMotion.tick(frenzyStart + cycle);
    assert(same(observed(), expected(4, 'frenzy', cycle)), `${preset.name} lost its phase across the 64-pose frenzy cycle`);
    assert(fullHeat !== undefined && samePixel(observed(), fullHeat, panel), `${preset.name} restarted the warm-up at the loop boundary`);
    const stop = lastKey + 1001;
    typingMotion.tick(stop);
    assert(same(observed(), snapshot('sit', Math.floor((stop - start) / 90), preset)),
      `${preset.name} did not stop at its keyboard timeout`);
    typingMotion.key(stop + 1);
    typingMotion.tick(stop + 1);
    assert(same(observed(), expected(0, 'gentle')), `${preset.name} did not restart gently after stopping`);

    const slowing = new Motion(timedCanvas, preset);
    for (const elapsed of [0, 10, 20, 30, 40, 50, 60, 70, 80, 400, 800]) {
      slowing.key(start + elapsed);
      slowing.tick(start + elapsed);
    }
    slowing.tick(start + 1021);
    assert(same(observed(), expected(48, 'frenzy', 1021 - 80)), `${preset.name} lost frenzy hysteresis at eight keys`);
    slowing.tick(start + 1031);
    assert(same(observed(), expected(49, 'frenzy', 1031 - 80)), `${preset.name} lost frenzy hysteresis at seven keys`);
    slowing.tick(start + 1041);
    assert(same(observed(), expected(49, 'fast')), `${preset.name} failed to slow at six keys without resetting phase`);
    slowing.tick(start + 1071);
    assert(same(observed(), expected(50, 'fast')), `${preset.name} lost fast-mode hysteresis at three keys`);
    slowing.tick(start + 1081);
    assert(same(observed(), expected(50, 'gentle')), `${preset.name} reset its paw phase when slowing below three keys`);
  }

  for (const preset of Object.values(catPresets)) {
    for (const action of ['sit', 'typing', 'left', 'right'] as const) {
      const straight = snapshot(action, 0, preset);
      for (const gaze of [{ x: -2, y: 0 }, { x: horizontalGazeRange.min, y: -1 },
        { x: 2, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }]) {
        render(canvas, preset, action, 0, gaze, { typingEffects: false });
        const looking = pixels();
        const eyes = Array.from({ length: 2 }, () => ({ gained: 0, lost: 0, gainedAt: 0, lostAt: 0 }));
        for (let i = 0; i < straight.length; i += 4) {
          if (straight[i] === looking[i] && straight[i + 1] === looking[i + 1]
            && straight[i + 2] === looking[i + 2] && straight[i + 3] === looking[i + 3]) continue;
          const from = isGlint(straight, i), to = isGlint(looking, i);
          assert(straight[i + 3] === looking[i + 3] && (from || to), `Gaze moved the pupil in ${action}/${preset.name}`);
          const column = (i / 4) % SIZE;
          const along = gaze.x ? column : Math.floor(i / 4 / SIZE);
          const eye = eyes[column < SIZE / 2 ? 0 : 1]!;
          if (from) { eye.lost++; eye.lostAt += along; }
          if (to) { eye.gained++; eye.gainedAt += along; }
        }
        const moved = eyes.filter(eye => eye.gained || eye.lost);
        assert(moved.length === (action === 'sit' || action === 'typing' ? 2 : 1)
          && moved.every(({ gained, lost, gainedAt, lostAt }) =>
            gained > 0 && lost > 0 && (gainedAt / gained - lostAt / lost) * (gaze.x || gaze.y) > 0),
          `Glint did not follow ${gaze.x},${gaze.y} in ${action}/${preset.name}`);
        if (gaze.x === horizontalGazeRange.min && (action === 'sit' || action === 'typing')) {
          const { x, scale } = catHeadPlacement(action === 'typing', 0);
          assert(eyes.every((eye, i) => eye.gainedAt / eye.gained < x + (111 + i * 80) * scale),
            `Glint stayed on the right of the pupil in ${action}/${preset.name}`);
        }
      }
      render(canvas, preset, action, 0, { x: 0, y: 0 }, { typingEffects: false });
      assert(same(pixels(), straight), `Gaze reset did not restore ${action}/${preset.name}`);
    }
  }
  for (const eye of Object.keys(catOptions.eye).filter(id => id !== 'Y01') as (keyof typeof catOptions.eye)[]) {
    const config = { ...calico, eye };
    const straight = snapshot('sit', 0, config);
    render(canvas, config, 'sit', 0, { x: 2, y: -1 });
    assert(same(pixels(), straight), `Gaze changed the ${eye} expression`);
  }
  for (const preset of Object.values(catPresets)) {
    for (const [action, typingMode] of [['sit', 'gentle'], ['typing', 'gentle'], ['typing', 'fast']] as const) {
      const straight = snapshot(action, 0, preset, { typingMode });
      const positions = new Set<string>();
      for (let step = 0; step < 24; step++) {
        const angle = step * Math.PI / 12;
        render(canvas, preset, action, 0, {
          x: Math.round(pointerGazeLimit * Math.cos(angle)),
          y: Math.round(pointerGazeLimit * Math.sin(angle)),
          space: 'pointer',
        }, { typingMode, typingEffects: false });
        const looking = pixels();
        const changed: number[] = [];
        for (let i = 0; i < straight.length; i += 4) {
          if (straight[i] === looking[i] && straight[i + 1] === looking[i + 1]
            && straight[i + 2] === looking[i + 2] && straight[i + 3] === looking[i + 3]) continue;
          assert(straight[i + 3] === looking[i + 3] && (isGlint(straight, i) || isGlint(looking, i)),
            `Pointer angle moved pixels outside the glints in ${action}/${preset.name}`);
          changed.push(i);
        }
        positions.add(changed.join(','));
      }
      assert(positions.size === 24, `Pointer angles share glint positions in ${action}/${preset.name}`);
    }
  }
  for (const preset of Object.values(catPresets)) {
    const { innerPupil: _innerPupil, innerEyeColor: _innerEyeColor, ...legacy } = preset;
    const migrated = readPetConfig(legacy);
    assert(migrated.frame === 'CAT' && migrated.innerPupil === preset.innerPupil,
      `Legacy preset changed its pupil style for ${preset.name}`);
    for (const [pupil, innerPupil] of [['single', 'none'], ['double', 'round']] as const) {
      const saved = readPetConfig({ ...legacy, pupil });
      assert(saved.frame === 'CAT' && saved.innerPupil === innerPupil && saved.innerEyeColor === 'natural',
        `Legacy ${pupil} setting did not restore for ${preset.name}`);
    }
    for (const [action, typingMode] of [['sit', 'gentle'], ['typing', 'gentle'], ['typing', 'fast']] as const) {
      const base = snapshot(action, 0, preset, { typingMode });
      const single = { ...preset, eyeColor: 'violet', innerPupil: 'none' } as const;
      const double = { ...preset, eyeColor: 'violet', innerPupil: 'round' } as const;
      const flat = snapshot(action, 0, single, { typingMode });
      const ring = snapshot(action, 0, double, { typingMode });
      const rosyCenter = { ...double, innerEyeColor: 'rose' } as const;
      const rose = snapshot(action, 0, rosyCenter, { typingMode });
      const amber = snapshot(action, 0, { ...rosyCenter, eyeColor: 'amber' }, { typingMode });
      const outerPixel = (117 * SIZE + 180) * 4;
      assert(samePixel(rose, ring, outerPixel) && !samePixel(amber, rose, outerPixel),
        `Inner color repainted the outer pupil in ${action}/${preset.name}`);
      assert(same(flat, snapshot(action, 0, { ...single, innerEyeColor: 'rose' }, { typingMode })),
        `A hidden inner pupil changed the outer color in ${action}/${preset.name}`);
      for (const centerX of [110, 190]) {
        const center = (117 * SIZE + centerX) * 4;
        assert(rgba(flat, center) === '137,106,178,255' && !samePixel(ring, flat, center),
          `Pupil style did not set the solid color or retain the dark center in ${action}/${preset.name}`);
        assert(rgba(rose, center) === '185,99,130,255' && samePixel(amber, rose, center),
          `Inner pupil did not preserve its color through an outer color change in ${action}/${preset.name}`);
      }
      for (let i = 0; i < flat.length; i += 4) {
        if (flat[i] === ring[i] && flat[i + 1] === ring[i + 1] && flat[i + 2] === ring[i + 2]) continue;
        const x = (i / 4) % SIZE, y = Math.floor(i / 4 / SIZE);
        assert(x >= 92 && x < 210 && y >= 90 && y < 140 && flat[i + 3] === ring[i + 3]
          && !isGlint(flat, i) && !isGlint(ring, i),
          `Pupil style changed pixels outside the iris in ${action}/${preset.name}`);
      }
      const gaze: Gaze = { x: -80, y: 45, space: 'pointer' };
      render(canvas, single, action, 0, gaze, { typingMode, typingEffects: false });
      const movedSingle = pixels();
      render(canvas, rosyCenter, action, 0, gaze, { typingMode, typingEffects: false });
      const movedDouble = pixels();
      assert(!same(flat, movedSingle) && !same(rose, movedDouble), `Pupil style stopped gaze in ${action}/${preset.name}`);
      for (let i = 0; i < flat.length; i += 4) {
        assert(isGlint(movedSingle, i) === isGlint(movedDouble, i),
          `Pupil style changed the tracked reflection in ${action}/${preset.name}`);
      }
      const colors = (Object.keys(catIrisColors) as CatIrisColor[]).map(eyeColor => {
        const config = readPetConfig({ ...preset, eyeColor });
        assert(config.eyeColor === eyeColor, `Could not read ${eyeColor} for ${preset.name}`);
        const colored = snapshot(action, 0, config, { typingMode });
        for (let i = 0; i < base.length; i += 4) {
          if (base[i] === colored[i] && base[i + 1] === colored[i + 1] && base[i + 2] === colored[i + 2]) continue;
          const x = (i / 4) % SIZE;
          const y = Math.floor(i / 4 / SIZE);
          assert(x >= 92 && x < 210 && y >= 90 && y < 140 && !isGlint(base, i) && !isGlint(colored, i),
            `Eye color changed pixels outside the iris in ${action}/${preset.name}`);
        }
        return colored;
      });
      assert(distinct(colors), `Eye colors matched in ${action}/${preset.name}`);
    }
  }
  for (const eye of ['Y02', 'Y07'] as const) {
    assert(same(snapshot('sit', 0, { ...calico, eye, innerPupil: 'none' }),
      snapshot('sit', 0, { ...calico, eye, innerPupil: 'round', innerEyeColor: 'rose' })),
    `Pupil style changed the ${eye} expression`);
  }

  const editable = document.createElement('canvas');
  const editor = editable.getContext('2d')!;
  const britishBlue = catPresets.preset_cat_british_blue;
  const oldBritishBlue = historicalMouth(historicalNose(britishBlue, 'NO01'), 'CN01');
  const noseSource = {
    config: oldBritishBlue, action: 'sit', frame: 0, typingMode: 'gentle', gaze: { x: 0, y: 0 },
    tailArtVersion: 'clean', earLayout: 'shared', markingLayout: 'shared',
  } as const;
  render(editable, oldBritishBlue, 'sit', 0, undefined, { legacyNoseOutline: true });
  for (const reference of [noseSource, null]) {
    const previous = prepareCatCustomization(editable, reference, britishBlue);
    assert(previous.source.config.nose === 'NO01' && previous.source.legacyNoseOutline && !previous.paint.full,
      'A saved British Blue nose outline was mistaken for custom paint');
  }
  render(editable, oldBritishBlue, 'sit');
  const borderless = prepareCatCustomization(editable, { ...noseSource, legacyNoseOutline: false }, britishBlue);
  assert(!borderless.source.legacyNoseOutline && !borderless.paint.full,
    'A new British Blue nose was mistaken for an edit to the original outline');

  for (const preset of [orange, calico]) {
    const config = historicalMouth({
      ...preset, coat: 'lavender', ear: 'CE04', tail: 'CT08', pattern: 'P05', bodyPattern: 'spotted', nose: 'NO03',
    }, 'CN03');
    for (const [action, frame, typingMode, typingAnimation, laptopVersion] of [
      ['sit', 0, 'gentle', 'reference', 'clean'],
      ['typing', 1, 'gentle', 'legacy', 'original'],
      ['typing', 2, 'fast', 'shared', 'original'],
      ['typing', 7, 'frenzy', 'reference', 'clean'],
    ] as const) {
      const source = {
        config, action, frame, typingMode, typingAnimation, laptopVersion,
        tailArtVersion: 'clean', typingLayout: 'aligned', earLayout: 'shared', markingLayout: 'shared', gaze: { x: 0, y: 0 },
      } as const;
      render(editable, config, action, frame, source.gaze,
        { typingMode, typingAnimation, laptopVersion, outlineVersion: 'original' });
      const previous = prepareCatCustomization(editable, source, config);
      assert(previous.source.outlineVersion === 'original' && !previous.paint.full && !previous.laptop
        && !previous.idleTorso && !previous.typingTorso,
      `${preset.name}/${action}/${typingAnimation} mistook its original outline for user paint`);
      const currentPose = { typingMode, typingEffects: true } as const;
      assert(same(snapshot(action, frame, config, { ...currentPose, custom: previous }), snapshot(action, frame, config, currentPose)),
        `${preset.name}/${typingAnimation} restored old dark outlines after migrating a colored save`);

      // Paint uses the very same brown as the former outlines. It must remain
      // the user's chosen ink, even when the underlying coat and outline change.
      editor.resetTransform();
      editor.fillStyle = '#442416';
      editor.fillRect(150, 76, 3, 3);
      editor.clearRect(80, 92, 2, 2);
      const painted = prepareCatCustomization(editable, source, config);
      const nextCoat = { ...config, coat: 'cream' } as const;
      for (const nextAction of ['sit', 'typing'] as const) {
        const base = snapshot(nextAction, 0, nextCoat);
        const migrated = snapshot(nextAction, 0, nextCoat, { custom: painted });
        for (let offset = 0; offset < base.length; offset += 4) {
          const x = offset / 4 % SIZE, y = Math.floor(offset / 4 / SIZE);
          const marked = x >= 150 && x < 153 && y >= 76 && y < 79;
          const erased = x >= 80 && x < 82 && y >= 92 && y < 94;
          assert(erased ? migrated[offset + 3] === 0
            : rgba(migrated, offset) === (marked ? '68,36,22,255' : rgba(base, offset)),
          `${preset.name}/${typingAnimation} recolored user ink or baked old outlines at ${x},${y}`);
        }
      }
    }
    for (const [action, frame, typingMode] of [
      ['sit', 0, 'gentle'], ['typing', 31, 'gentle'], ['typing', 31, 'fast'], ['typing', 31, 'frenzy'],
    ] as const) {
      render(editable, config, action, frame, undefined, { typingMode });
      const current = prepareCatCustomization(editable, {
        config, action, frame, typingMode, gaze: { x: 0, y: 0 },
        typingAnimation: currentTypingAnimation, typingLayout: 'aligned', laptopVersion: 'clean', outlineVersion: 'adaptive',
        typingInkVersion: 'clean', typingMouthVersion: 'shared',
        tailArtVersion: 'clean', earLayout: 'shared', markingLayout: 'shared',
      }, config);
      assert(current.source.outlineVersion === 'adaptive' && current.source.typingAnimation === currentTypingAnimation
        && current.source.frame === frame && !current.paint.full && !current.laptop
        && !current.idleTorso && !current.typingTorso,
      `${preset.name}/${action} mistook its adaptive outline for new custom paint`);
    }
    for (const outlineVersion of ['adaptive', 'original'] as const) {
      render(editable, config, 'sit', 0, undefined, { outlineVersion });
      const inferred = prepareCatCustomization(editable, null, config);
      assert(inferred.source.outlineVersion === outlineVersion && !inferred.paint.full,
        `${preset.name} failed to identify ${outlineVersion} outlines in a PNG-only colored save`);
    }
  }
  for (const preset of [orange, calico]) {
    const oldLook = { ...preset, pattern: 'P02', bodyPattern: 'classic' } as const;
    render(editable, oldLook, 'sit', 0, undefined, { markingLayout: 'legacy' });
    const oldSource = {
      config: oldLook, action: 'sit', frame: 0, gaze: { x: 0, y: 0 }, typingMode: 'gentle',
      tailArtVersion: 'clean', earLayout: 'shared', typingLayout: 'aligned', typingAnimation: 'shared',
    } as const;
    for (const reference of [oldSource, null]) {
      const previousMarkings = prepareCatCustomization(editable, reference, oldLook);
      assert(previousMarkings.source.markingLayout === 'legacy' && !previousMarkings.paint.full,
        `${preset.name} baked the old white cheeks or facial pattern into custom paint`);
      assert(same(snapshot('sit', 0, oldLook, { custom: previousMarkings }), snapshot('sit', 0, oldLook)),
        `${preset.name} replayed its old facial overlay after migrating the forehead options`);
    }
    editor.resetTransform();
    editor.fillStyle = '#E711D9';
    editor.fillRect(150, 76, 3, 3);
    const previousPaint = prepareCatCustomization(editable, oldSource, oldLook);
    const newLook = { ...oldLook, pattern: 'P05', bodyPattern: 'spotted' } as const;
    for (const action of ['sit', 'typing'] as const) {
      const base = snapshot(action, 0, newLook);
      const migrated = snapshot(action, 0, newLook, { custom: previousPaint });
      for (let offset = 0; offset < base.length; offset += 4) {
        const x = offset / 4 % SIZE, y = Math.floor(offset / 4 / SIZE);
        const mark = x >= 150 && x < 153 && y >= 76 && y < 79;
        assert(rgba(migrated, offset) === (mark ? '231,17,217,255' : rgba(base, offset)),
          `${preset.name} lost a user edit or kept old cheek paint after changing markings`);
      }
    }
    for (const [action, frame, typingMode] of [['sit', 0, 'gentle'], ['typing', 5, 'gentle'], ['typing', 2, 'fast'], ['typing', 8, 'fast'], ['typing', 11, 'frenzy']] as const) {
      render(editable, newLook, action, frame, undefined, { typingMode });
      const source = {
        config: newLook, action, frame, typingMode, gaze: { x: 0, y: 0 },
        typingLayout: 'aligned', typingAnimation: currentTypingAnimation, laptopVersion: 'clean', outlineVersion: 'adaptive',
        typingInkVersion: 'clean', typingMouthVersion: 'shared',
        tailArtVersion: 'clean', earLayout: 'shared', markingLayout: 'shared',
      } as const;
      const currentMarkings = prepareCatCustomization(editable, source, newLook);
      assert(currentMarkings.source.markingLayout === 'shared' && currentMarkings.source.typingAnimation === currentTypingAnimation
        && !currentMarkings.paint.full
        && !currentMarkings.idleTorso && !currentMarkings.typingTorso && !currentMarkings.laptop,
      `${preset.name} mistook the new forehead or facial fur for user paint in ${action}/${typingMode}`);
    }
  }
  render(editable, orange);
  editor.resetTransform();
  editor.fillStyle = '#FFF9ED';
  editor.fillRect(114, 108, 9, 9);
  const fixedReflection = editor.getImageData(0, 0, SIZE, SIZE).data;
  const oldReflection = prepareCatCustomization(editable, null, orange);
  assert(oldReflection.fixedGlints[0] && !oldReflection.fixedGlints[1], 'Legacy reflection was not isolated to its eye');
  assert(same(snapshot('sit', 0, orange, { custom: oldReflection }), fixedReflection),
    'Turning off tracking changed the original reflection');
  for (const [action, typingMode] of [['sit', 'gentle'], ['typing', 'gentle'], ['typing', 'fast'], ['typing', 'frenzy']] as const) {
    for (const x of [-100, 0, 100]) {
      const pointing: Gaze = { x, y: 0, space: 'pointer' };
      render(canvas, orange, action, 0, pointing, { typingMode });
      const oneReflection = pixels();
      render(canvas, orange, action, 0, pointing, { custom: oldReflection, typingMode });
      assert(same(pixels(), oneReflection), `Custom cat accumulated two reflections in ${action}/${typingMode}`);
    }
  }
  assert(same(snapshot('sit', 0, orange, { custom: oldReflection }), fixedReflection),
    'Tracking did not restore the saved reflection after disabling it');
  assert(same(snapshot('typing', 36, orange, { typingMode: 'frenzy', typingEffects: true, custom: oldReflection }),
    snapshot('typing', 36, orange, { typingMode: 'frenzy', typingEffects: true })),
  'A fixed custom reflection appeared over effort eyes while pointer tracking was off');

  const legacyEyeSource = {
    config: orange, action: 'sit', frame: 0, gaze: { x: 0, y: 0 }, typingMode: 'gentle',
    typingAnimation: 'reference-v2', typingLayout: 'aligned', laptopVersion: 'clean', legacyNoseOutline: false,
    tailArtVersion: 'clean', earLayout: 'shared', markingLayout: 'shared', outlineVersion: 'adaptive',
  } as const;
  render(editable, orange);
  const unlit = makeLayer(SIZE);
  drawCatHead(unlit.ctx, orange, false, 0, legacyEyeSource.gaze, { hideGlints: [true, true] });
  // An old highlight overlaps the white rim and exposes bare pupil at
  // its former edge. Both remnants were replayed as opaque head paint.
  editor.putImageData(unlit.ctx.getImageData(116, 109, 1, 7), 116, 109);
  editor.putImageData(unlit.ctx.getImageData(196, 109, 2, 7), 196, 109);
  editor.resetTransform();
  editor.fillStyle = '#FFFFFF';
  for (const [x, width] of [[120, 5], [200, 6]]) editor.fillRect(x!, 108, width!, 3);
  editor.fillRect(145, 78, 1, 1);
  const editedEyes = prepareCatCustomization(editable, legacyEyeSource, orange);
  render(editable, orange, 'sit', 0, undefined, { custom: editedEyes });
  const migratedEyes = prepareStructuredCatCustomization({
    ...legacyEyeSource, pixelEdits: seedCatInkForEditor(editable, legacyEyeSource, editedEyes),
  });
  assert(editedEyes.fixedGlints.every(Boolean) && !!migratedEyes,
    'Displaced legacy highlights could not be recognized or reopened');
  for (const preset of Object.values(catPresets)) {
    const pose = { typingMode: 'frenzy', typingEffects: true } as const;
    const expected = snapshot('typing', 36, preset, pose);
    expected.set([255, 255, 255, 255], (78 * SIZE + 145) * 4);
    for (const custom of [editedEyes, migratedEyes]) {
      assert(same(expected, snapshot('typing', 36, preset, { ...pose, custom })),
        `${preset.name} replayed legacy eye remnants or lost a separate user mark`);
    }
  }

  const roundCalico = { ...calico, ear: 'CE03' } as const;
  const earSource = { config: roundCalico, action: 'sit', frame: 0, gaze: { x: 0, y: 0 }, typingMode: 'gentle', tailArtVersion: 'clean' };
  render(editable, roundCalico, 'sit', 0, undefined, { earLayout: 'legacy', markingLayout: 'legacy' });
  assert(!same(editor.getImageData(0, 0, SIZE, SIZE).data, snapshot('sit', 0, roundCalico)),
    'Calico round ears still use the old coat patch');
  editor.resetTransform();
  editor.fillStyle = '#E711D9';
  editor.fillRect(157, 76, 3, 3);
  const oldEarSave = prepareCatCustomization(editable, earSource, orange);
  const migrated = snapshot('sit', 0, roundCalico, { custom: oldEarSave });
  const shared = snapshot('sit', 0, roundCalico);
  const earMark = (76 * SIZE + 157) * 4;
  assert(rgba(migrated, earMark) === '231,17,217,255', 'Updating the ears dropped a saved forehead edit');
  assert(same(migrated.subarray(0, 76 * SIZE * 4), shared.subarray(0, 76 * SIZE * 4)),
    'An older saved sprite brought back the original ear artifacts');
  render(editable, roundCalico);
  const newEarSave = prepareCatCustomization(editable, { ...earSource, earLayout: 'shared', markingLayout: 'shared' }, orange);
  assert(!newEarSave.paint.full, 'New ear pixels were mistaken for user paint');

  render(editable, calico);
  editor.resetTransform();
  editor.fillStyle = '#E711D9';
  editor.fillRect(150, 76, 12, 12);
  editor.clearRect(80, 92, 8, 8);
  const edited = editor.getImageData(0, 0, SIZE, SIZE).data;
  const custom = prepareCatCustomization(editable,
    { config: calico, action: 'sit', frame: 0, gaze: { x: 0, y: 0 }, typingMode: 'gentle', tailArtVersion: 'clean', markingLayout: 'shared' }, orange);
  const legacy = prepareCatCustomization(editable, null, orange);
  for (const drawing of [custom, legacy]) {
    assert(drawing.source.config.palette === calico.palette, 'Custom cat lost its coat');
    assert(same(edited, snapshot('sit', 0, drawing.source.config, { custom: drawing })),
      'Custom cat did not retain its idle pixels');
    for (const typingMode of ['gentle', 'fast', 'frenzy'] as const) {
      const frames = Array.from({ length: frontTyping.pawFrames }, (_, frame) =>
        snapshot('typing', frame, drawing.source.config, { custom: drawing, typingMode }));
      assertTypingCycle(frames, `${drawing.source.config.name}/custom/typing/${typingMode}/typingEffects:false`);
      const mark = (76 * SIZE + 161) * 4;
      assert(frames.every(frame => rgba(frame, mark) === '231,17,217,255'), 'Forehead edit disappeared during typing');
      const erased = (95 * SIZE + 84) * 4;
      assert(frames.every(frame => frame[erased + 3] === 0), 'Erased head pixels reappeared during typing');
      assert(frames.every((frame, index) => same(frame.subarray(belowKeyboard),
        snapshot('typing', index, calico, { typingMode }).subarray(belowKeyboard))), 'Custom marking covered the laptop');
    }
  }

  const layeredLook = {
    ...calico, palette: 'CC04', coat: 'silver', ear: 'CE04', nose: 'NO02', mouth: 'CN09', pattern: 'P01',
    accessory: 'A02', eyeColor: 'rose', tail: 'CT08',
  } as const;
  const layeredBase = snapshot('sit', 0, layeredLook);
  const oldBase = snapshot('sit', 0, calico);
  const composed = snapshot('sit', 0, layeredLook, { custom });
  for (let offset = 0; offset < composed.length; offset += 4) {
    const wasPainted = !samePixel(edited, oldBase, offset);
    assert(rgba(composed, offset) === rgba(wasPainted ? edited : layeredBase, offset),
      'Changing the appearance failed to preserve the original paint as a separate layer');
  }
  render(editable, layeredLook, 'sit', 0, undefined, { custom });
  const savedAgain = prepareCatCustomization(editable,
    { config: layeredLook, action: 'sit', frame: 0, gaze: { x: 0, y: 0 }, typingMode: 'gentle', tailArtVersion: 'clean', outlineVersion: 'adaptive', earLayout: 'shared', markingLayout: 'shared' }, orange);
  assert(same(snapshot('sit', 0, calico, { custom: savedAgain }), edited),
    'Saving over a changed appearance baked the base into the custom pixels');

  const customCanvas = document.createElement('canvas');
  const customMotion = new Motion(customCanvas, calico);
  const customPixels = () => customCanvas.getContext('2d')!.getImageData(0, 0, SIZE, SIZE).data;
  customMotion.setCustom(custom);
  customMotion.setConfig(layeredLook);
  const customStart = Math.ceil(performance.now());
  customMotion.key(customStart);
  customMotion.tick(customStart);
  assert(same(customPixels(), snapshot('typing', 0, layeredLook, { custom, typingMode: 'gentle', typingEffects: true })),
    'The configured appearance did not remain underneath custom paint during keyboard input');
  const customChange = customStart + gentleDuration + 0.1;
  customMotion.tick(customChange);
  assert(same(customPixels(), snapshot('typing', 1, layeredLook, { custom, typingMode: 'gentle', typingEffects: true })),
    'Custom cat did not advance after the first key');
  for (let key = 0; key < 5; key++) customMotion.key(customChange);
  customMotion.tick(customChange);
  assert(same(customPixels(), snapshot('typing', 1, layeredLook, { custom, typingMode: 'fast', typingEffects: true })),
    'Custom cat did not keep its paw position when switching to fast typing');
  customMotion.tick(customChange + fastDuration);
  assert(same(customPixels(), snapshot('typing', 2, layeredLook, { custom, typingMode: 'fast', typingEffects: true })),
    'Custom cat did not advance during fast typing');
  const customFrenzy = customChange + fastDuration;
  for (let key = 0; key < 3; key++) customMotion.key(customFrenzy);
  customMotion.tick(customFrenzy);
  assert(same(customPixels(), snapshot('typing', 2, layeredLook, { custom, typingMode: 'frenzy', typingEffects: true, frenzyHeatFrame: 0 })),
    'Custom paint stopped the phase-preserving switch to frenzy typing');
  customMotion.tick(customFrenzy + frenzyDuration);
  assert(same(customPixels(), snapshot('typing', 3, layeredLook, { custom, typingMode: 'frenzy', typingEffects: true, frenzyHeatFrame: 1 })),
    'Custom paint froze frenzy typing');
  customMotion.tick(customFrenzy + 1001);
  assert(same(customPixels(), snapshot('sit', 12, layeredLook, { custom })), 'Custom cat did not return to its edited idle pose');

  render(editable, calico, 'typing', 1);
  editor.resetTransform();
  editor.fillStyle = '#E711D9';
  editor.fillRect(149, 244, 8, 8);
  const laptopEdit = prepareCatCustomization(editable,
    { config: calico, action: 'typing', frame: 1, gaze: { x: 0, y: 0 }, typingMode: 'gentle', tailArtVersion: 'clean', typingLayout: 'aligned', typingAnimation: currentTypingAnimation, laptopVersion: 'clean', earLayout: 'shared', markingLayout: 'shared' }, orange);
  const laptopMark = (247 * SIZE + 152) * 4;
  assert(rgba(snapshot('typing', 2, calico, { custom: laptopEdit, typingMode: 'fast' }), laptopMark) === '231,17,217,255',
    'Laptop edit was dropped at a different typing speed');
  assert(same(snapshot('sit', 0, calico, { custom: laptopEdit }), snapshot('sit', 0, calico)),
    'Laptop edits leaked onto the idle cat');

  for (const preset of [orange, calico]) {
    for (const typingAnimation of ['legacy', 'shared', 'reference'] as const) {
      // All three historical generations stored the original prop, including
      // the first reference poses that predate laptopVersion metadata.
      const historical = historicalTail(preset, 'CT01');
      const source = {
        config: historical, action: 'typing', frame: 1, typingMode: 'gentle', typingAnimation,
        typingLayout: 'aligned', earLayout: 'shared', markingLayout: 'shared', gaze: { x: 0, y: 0 },
      } as const;
      render(editable, historical, 'typing', 1, undefined,
        { typingMode: 'gentle', typingAnimation, laptopVersion: 'original' });
      const previous = prepareCatCustomization(editable, source, preset);
      assert(previous.source.config.tail === 'CT01' && previous.source.laptopVersion === 'original' && !previous.paint.full && !previous.laptop
        && !previous.idleTorso && !previous.typingTorso,
      `${preset.name}/${typingAnimation} mistook the original laptop edge for custom paint`);
      for (const typingMode of ['gentle', 'fast', 'frenzy'] as const) {
        assert(same(snapshot('typing', 1, preset, { custom: previous, typingMode }), snapshot('typing', 1, preset, { typingMode })),
          `${preset.name}/${typingAnimation} restored an old laptop fringe in ${typingMode}`);
      }

      editor.resetTransform();
      editor.fillStyle = '#E711D9';
      editor.fillRect(149, 244, 8, 8);
      editor.clearRect(159, 246, 2, 2);
      if (preset.palette === 'CC01') {
        // This fur connector used to live in the laptop cel; it now belongs
        // to the body beneath the clean prop. Preserve both paint and erasure.
        editor.fillRect(230, 236, 1, 1);
        editor.clearRect(231, 236, 1, 1);
      }
      const painted = prepareCatCustomization(editable, source, preset);
      if (preset.palette === 'CC01') assert(!!painted.typingTorso, 'The former fur connector lost its edits');
      const base = snapshot('typing', 1, preset);
      const restored = snapshot('typing', 1, preset, { custom: painted });
      for (let offset = 0; offset < base.length; offset += 4) {
        const x = offset / 4 % SIZE, y = Math.floor(offset / 4 / SIZE);
        const marked = x >= 149 && x < 157 && y >= 244 && y < 252;
        const erased = x >= 159 && x < 161 && y >= 246 && y < 248;
        assert(erased ? restored[offset + 3] === 0
          : rgba(restored, offset) === (marked ? '231,17,217,255' : rgba(base, offset)),
        `${preset.name}/${typingAnimation} lost laptop edits or reapplied its former edge at ${x},${y}`);
      }
    }
  }
  for (const [typingAnimation, laptopVersion] of [
    ['reference', 'clean'], ['reference', 'original'], ['reference-v2', 'clean'], ['front-v3', 'clean'], [currentTypingAnimation, 'clean'],
  ] as const) {
    render(editable, orange, 'typing', 0, undefined, { typingAnimation, laptopVersion });
    const inferred = prepareCatCustomization(editable, null, orange);
    assert(inferred.source.typingAnimation === typingAnimation && inferred.source.laptopVersion === laptopVersion
      && !inferred.paint.full && !inferred.laptop && !inferred.idleTorso && !inferred.typingTorso,
    `PNG-only ${typingAnimation}/${laptopVersion} laptop or old paws were baked into user paint`);
  }

  const hotSource = {
    config: orange, action: 'typing', frame: 4, gaze: { x: 0, y: 0 }, typingMode: 'frenzy',
    typingAnimation: currentTypingAnimation, frenzyHeatFrame: frenzySteamLoopStart, typingMouthVersion: 'shared',
    typingLayout: 'aligned', laptopVersion: 'clean', earLayout: 'shared', markingLayout: 'shared',
    tailArtVersion: 'clean', outlineVersion: 'adaptive',
  } as const;
  for (const typingAnimation of [currentTypingAnimation, 'front-v4'] as const) {
    const source = { ...hotSource, typingAnimation };
    render(editable, orange, 'typing', source.frame, undefined, source);
    for (const reference of [null, source]) {
      const restored = prepareCatCustomization(editable, reference, orange);
      assert(restored.source.typingAnimation === typingAnimation
        && restored.source.frenzyHeatFrame === frenzySteamLoopStart && !restored.paint.full && !restored.laptop,
      'A saved typing expression, red laptop, or steam became custom paint after reopening');
    }
  }

  render(editable, calico, 'typing', 0, undefined, { typingLayout: 'legacy', typingAnimation: 'legacy', markingLayout: 'legacy' });
  editor.resetTransform();
  editor.fillStyle = '#E711D9';
  editor.fillRect(146, 73, 8, 8);
  editor.fillRect(145, 242, 8, 8);
  const olderTyping = prepareCatCustomization(editable,
    { config: calico, action: 'typing', frame: 0, gaze: { x: 0, y: 0 }, typingMode: 'gentle', tailArtVersion: 'clean' }, calico);
  const recovered = snapshot('typing', 0, calico, { custom: olderTyping });
  assert(rgba(recovered, (83 * SIZE + 143) * 4) === '231,17,217,255'
    && rgba(recovered, (251 * SIZE + 141) * 4) === '231,17,217,255',
    'Saved edits from the previous typing layout did not realign');

  for (const preset of [orange, calico]) {
    // Reconstruct the exact old four-frame art before extracting user paint.
    // Otherwise the former raised arm becomes a permanent pixel overlay.
    render(editable, preset, 'typing', 1, undefined, { typingMode: 'fast', typingAnimation: 'legacy', markingLayout: 'legacy' });
    editor.resetTransform();
    editor.fillStyle = '#E711D9';
    editor.fillRect(150, 76, 3, 3);
    const oldFast = prepareCatCustomization(editable, {
      config: preset, action: 'typing', frame: 1, gaze: { x: 0, y: 0 }, typingMode: 'fast',
      tailArtVersion: 'clean', typingLayout: 'aligned', earLayout: 'shared',
    }, preset);
    assert(oldFast.source.typingAnimation === 'legacy', 'Old typing metadata did not select the legacy animation');
    for (let frame = 0; frame < catTypingFrameCount; frame++) {
      const base = snapshot('typing', frame, preset, { typingMode: 'fast', typingEffects: true });
      const migrated = snapshot('typing', frame, preset, { typingMode: 'fast', typingEffects: true, custom: oldFast });
      for (let offset = 0; offset < base.length; offset += 4) {
        const x = offset / 4 % SIZE, y = Math.floor(offset / 4 / SIZE);
        const mark = x >= 150 && x < 153 && y >= 76 && y < 79;
        assert(rgba(migrated, offset) === (mark ? '231,17,217,255' : rgba(base, offset)),
          `${preset.name} restored an old raised hand while migrating a custom typing save`);
      }
    }
    const sharedSource = {
      config: preset, action: 'typing', frame: 11, gaze: { x: 0, y: 0 }, typingMode: 'fast',
      tailArtVersion: 'clean', typingLayout: 'aligned', typingAnimation: 'shared', earLayout: 'shared', markingLayout: 'shared',
    } as const;
    render(editable, preset, 'typing', sharedSource.frame, undefined, { typingMode: 'fast', typingAnimation: 'shared' });
    const newFast = prepareCatCustomization(editable, sharedSource, preset);
    assert(newFast.source.typingAnimation === 'shared' && newFast.source.frame === 11
      && !newFast.paint.full && !newFast.laptop && !newFast.idleTorso && !newFast.typingTorso,
    `${preset.name} treated the historical shared paws, effort eyes or sweat as custom paint`);
    assert(same(snapshot('sit', 0, preset, { custom: newFast }), snapshot('sit', 0, preset)),
      `${preset.name} baked effort effects into its idle appearance`);
    assert(same(snapshot('typing', 0, preset, { custom: newFast }), snapshot('typing', 0, preset)),
      `${preset.name} baked effort effects into gentle typing`);

    // The former twelve-frame reference has a different arm shape and fur
    // cleanup. Neither may become permanent paint after adopting v2.
    const referenceSource = {
      ...sharedSource, typingAnimation: 'reference', typingMode: 'frenzy',
      laptopVersion: 'clean', outlineVersion: 'adaptive',
    } as const;
    render(editable, preset, 'typing', 11, undefined, referenceSource);
    const oldReference = prepareCatCustomization(editable, referenceSource, preset);
    assert(oldReference.source.typingAnimation === 'reference' && oldReference.source.frame === 11
      && !oldReference.paint.full && !oldReference.laptop && !oldReference.idleTorso && !oldReference.typingTorso,
    `${preset.name} mistook historical reference fur or paws for custom paint`);
    const invalidReference = prepareCatCustomization(editable, { ...referenceSource, frame: 12 }, preset);
    assert(invalidReference.source.typingAnimation === 'reference' && invalidReference.source.frame === 11,
      `${preset.name} accepted a v2-sized frame index in a historical reference save`);

    editor.resetTransform();
    editor.fillStyle = '#E711D9';
    editor.fillRect(150, 76, 3, 3);
    editor.fillStyle = '#15D3E7';
    editor.fillRect(79, 184, 2, 2);
    const referencePaint = prepareCatCustomization(editable, referenceSource, preset);
    for (const typingMode of ['gentle', 'fast', 'frenzy'] as const) {
      for (const frame of [0, 4, 12, 20, 31]) {
        const pose = { typingMode, typingEffects: true } as const;
        const base = snapshot('typing', frame, preset, pose);
        const migrated = snapshot('typing', frame, preset, { ...pose, custom: referencePaint });
        for (let offset = 0; offset < base.length; offset += 4) {
          const x = offset / 4 % SIZE, y = Math.floor(offset / 4 / SIZE);
          const headInk = x >= 150 && x < 153 && y >= 76 && y < 79;
          const bodyInk = x >= 79 && x < 81 && y >= 184 && y < 186;
          assert(rgba(migrated, offset) === (headInk ? '231,17,217,255'
            : bodyInk ? '21,211,231,255' : rgba(base, offset)),
          `${preset.name}/${typingMode}/${frame} lost reference-era edits or retained an old paw/stripe at ${x},${y}`);
        }
      }
    }
  }

  render(editable, calico);
  editor.resetTransform();
  editor.fillStyle = '#442416';
  editor.fillRect(99, 117, 1, 1);
  editor.fillStyle = '#FFFAF2';
  editor.fillRect(100, 117, 1, 1);
  const paintedIris = prepareCatCustomization(editable,
    { config: calico, action: 'sit', frame: 0, gaze: { x: 0, y: 0 }, typingMode: 'gentle', tailArtVersion: 'clean', markingLayout: 'shared' }, calico);
  const violet = { ...calico, eyeColor: 'violet' } as const;
  const newColor = snapshot('sit', 0, violet, { custom: paintedIris });
  const violetBase = snapshot('sit', 0, violet);
  const irisPixel = (117 * SIZE + 99) * 4;
  assert(rgba(newColor, irisPixel) === '68,36,22,255', 'Changing the base eye color covered custom iris paint');
  assert(rgba(newColor, irisPixel + 4) === '255,250,242,255', 'Recoloring removed a painted reflection');
  assert(rgba(newColor, irisPixel + 8) === rgba(violetBase, irisPixel + 8)
    && rgba(newColor, irisPixel + 8) !== rgba(snapshot('sit', 0, calico), irisPixel + 8),
    'The new eye color did not reach the unpainted iris');
  assert(rgba(snapshot('sit', 0, calico, { custom: paintedIris }), irisPixel) === '68,36,22,255',
    'Resetting the eye color lost the saved iris paint');

  const savedGazes: Gaze[] = [{ x: horizontalGazeRange.min, y: -1 }, { x: -43, y: 70, space: 'pointer' }];
  for (const gaze of savedGazes) {
    render(editable, orange, 'sit', 0, gaze);
    const saved = prepareCatCustomization(editable,
      { config: orange, action: 'sit', frame: 0, gaze, typingMode: 'gentle', tailArtVersion: 'clean', markingLayout: 'shared' }, orange);
    assert(saved.source.gaze.x === gaze.x && saved.source.gaze.space === gaze.space && !saved.paint.full,
      'A saved gaze was interpreted as pixel edits');
  }
  return 'cat actions ready';
}

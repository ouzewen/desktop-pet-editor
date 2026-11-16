import { catIrisColors, catOptions, catPresets, nativeCatFur, orangeCatOptions, readPetConfig, type CatIrisColor } from './cat';
import { prepareCatCustomization } from './cat-custom';
import { Motion } from './motion';
import { catTypingFrameCount, catTypingFrameDuration } from './cat-typing';
import { catGlintAperture, catHeadPlacement, catTypingLaptop, horizontalGazeRange, pointerGazeLimit, render, type Action, type CatPose, type Gaze, type TypingMode } from './render';

// Exercise the bundled renderer in the same WKWebView used by the floating pet.
export function checkCatActions() {
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

  for (const action of ['left', 'typing'] as const) {
    assertDistinctFrames(Array.from({ length: action === 'typing' ? catTypingFrameCount : 4 },
      (_, frame) => snapshot(action, frame, orange, { typingMode: 'fast' })),
    `${orange.name}/${action}/fast/typingEffects:false`);
    for (let frame = 0; frame < (action === 'typing' ? catTypingFrameCount : 4); frame++) {
      const base = snapshot(action, frame);
      const looks = [
        ...Object.keys(catOptions.palette).filter(id => id !== orange.palette).map(palette => ({ palette })),
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
    const frames = action === 'sit' ? 1 : action === 'typing' ? catTypingFrameCount : 4;
    for (let frame = 0; frame < frames; frame++) {
      for (const part of ['ear', 'mouth', 'eye', 'accessory'] as const) {
        if (part === 'accessory' && (action === 'left' || action === 'right')) continue;
        const ids = Object.keys(orangeCatOptions[part]);
        const choices = part === 'ear' && (action === 'left' || action === 'right')
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
        const combined = { ...black, ear: 'CE04', mouth: 'CN03', eye } as const;
        const natural = snapshot(action, frame, combined);
        assert(!same(natural, snapshot(action, frame, { ...combined, eyeColor: 'blue' })),
          `Iris recolor missing for ${eye} in ${action}/${frame}`);
      }
    }
  }

  const belowKeyboard = 221 * SIZE * 4;
  const laptop = snapshot('typing', 0, black);
  const coats = Object.keys(catOptions.coat) as (keyof typeof catOptions.coat)[];
  const bodyPatterns = Object.keys(catOptions.bodyPattern) as (keyof typeof catOptions.bodyPattern)[];
  const foreheadPatterns = Object.keys(catOptions.pattern) as (keyof typeof catOptions.pattern)[];
  const tails = Object.keys(catOptions.tail) as (keyof typeof catOptions.tail)[];
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
    for (const config of [preset, { ...preset, coat: 'lavender', bodyPattern: 'spotted', tail: 'CT04' } as const]) {
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
      assert(same(snapshot(action, 8, preset, { ...pose, outlineVersion: 'original' }), snapshot(action, 8, preset, pose)),
        `${preset.name} changed its native coat when enabling adaptive outlines`);
      const colored = { ...preset, coat: 'lavender' } as const;
      const original = snapshot(action, 8, colored, { ...pose, outlineVersion: 'original' });
      const adaptive = snapshot(action, 8, colored, pose);
      let changedBoundary = 0;
      for (let offset = 0; offset < original.length; offset += 4) {
        const x = offset / 4 % SIZE, y = Math.floor(offset / 4 / SIZE);
        assert(original[offset + 3] === adaptive[offset + 3],
          `${preset.name}/${action}/${typingMode} changed alpha while recoloring its outline at ${x},${y}`);
        // Face ink stays deep and readable. This covers both eye regions,
        // the connecting fur, the independent nose and all four mouth shapes.
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
      ...(['CT02', 'CT03', 'CT04'] as const).map(tail => ({ tail })),
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
    const restoredTail = readPetConfig({ ...preset, tail: undefined });
    assert(restoredTail.frame === 'CAT' && restoredTail.tail === 'CT01', 'An older cat save lost its default tail');
    for (const [action, typingMode] of [['sit', 'gentle'], ['typing', 'gentle'], ['typing', 'fast']] as const) {
      const tailPoses = tails.map(tail => snapshot(action, 0, { ...preset, tail }, { typingMode }));
      assert(distinct(tailPoses), `Tail choices matched for ${preset.name}/${action}/${typingMode}`);
      const original = tailPoses[0]!;
      for (const [index, tail] of tails.entries()) {
        const pose = tailPoses[index]!;
        for (let y = 0; y < SIZE; y++) {
          for (let x = 0; x < SIZE; x++) {
            if (x >= 218 && y >= 145 && y < 286) continue;
            const offset = (y * SIZE + x) * 4;
            assert(samePixel(pose, original, offset),
              `Tail choice changed the face, torso or floor for ${preset.name}/${tail}/${action}`);
          }
        }
        if (tail === 'CT01') continue;
        const colored = snapshot(action, 0, { ...preset, tail, coat: 'lavender' }, { typingMode });
        let tailRecolored = false;
        for (let y = 145; y < 286; y++) {
          for (let x = 248; x < SIZE; x++) {
            const offset = (y * SIZE + x) * 4;
            assert(pose[offset + 3] === colored[offset + 3], `Coat altered the ${tail} silhouette`);
            if (pose[offset + 3] && !samePixel(pose, colored, offset)) tailRecolored = true;
          }
        }
        assert(tailRecolored, `Selected coat did not reach the ${tail} fur for ${preset.name}/${action}`);
        if (action === 'typing') {
          const frames = Array.from({ length: catTypingFrameCount }, (_, frame) =>
            snapshot(action, frame, { ...preset, tail }, { typingMode }));
          assertDistinctFrames(frames, `${preset.name}/typing/${typingMode}/${tail}/typingEffects:false`);
        }
      }
    }
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
      for (let frame = 0; frame < (action === 'sit' ? 1 : catTypingFrameCount); frame++) {
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
    const abovePaws = 190 * SIZE * 4;
    const belowFloor = 286 * SIZE * 4;
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
    // Each new field is independent, while old saves keep their original pair.
    const { nose: _nose, mouth: _mouth, ...legacy } = preset;
    const noses = Object.keys(catOptions.nose) as (keyof typeof catOptions.nose)[];
    const mouths = Object.keys(catOptions.mouth) as (keyof typeof catOptions.mouth)[];
    const mouthRows = mouths.map((mouth, index) => {
      const migrated = readPetConfig({ ...legacy, muzzle: mouth });
      assert(migrated.frame === 'CAT' && migrated.nose === noses[index] && migrated.mouth === mouth,
        `Legacy muzzle ${mouth} did not restore both face parts`);
      const row = noses.map(nose => snapshot('sit', 0, { ...preset, nose, mouth }));
      assert(distinct(row), `Nose choices are identical for ${preset.name}/${mouth}`);
      for (const pose of row) {
        assert(same(pose.subarray(134 * SIZE * 4), row[0]!.subarray(134 * SIZE * 4)),
          `Changing the nose repainted the mouth for ${preset.name}/${mouth}`);
      }
      return row;
    });
    for (const [index, nose] of noses.entries()) {
      assert(distinct(mouthRows.map(row => row[index]!)), `Mouth choices are identical for ${preset.name}/${nose}`);
    }
    if (preset !== orange) {
      for (const part of ['ear', 'mouth', 'eye', 'pattern'] as const) {
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
              for (let frame = 0; frame < catTypingFrameCount; frame++) {
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
    for (const typingMode of ['gentle', 'fast', 'frenzy'] as const) {
      const poses = Array.from({ length: catTypingFrameCount }, (_, frame) => snapshot('typing', frame, preset, { typingMode }));
      const first = poses[0]!;
      assertDistinctFrames(poses, `${preset.name}/typing/${typingMode}/typingEffects:false`);
      assert(same(idle.subarray(0, 154 * SIZE * 4), first.subarray(0, 154 * SIZE * 4)),
        `Typing shifted or resized the face of ${preset.name}/${typingMode}`);
      assert(poses.every(pose => same(gentle.subarray(0, abovePaws), pose.subarray(0, abovePaws))),
        `Typing moved the head or raised the paws above y190 for ${preset.name}/${typingMode}`);
      assert(poses.every(pose => pose.subarray(belowFloor).every(channel => channel === 0)),
        `Typing extended below the sitting baseline of ${preset.name}`);
      assert(poses.every(pose => same(gentle.subarray(belowKeyboard), pose.subarray(belowKeyboard))),
        `${preset.name} ${typingMode} typing changed the laptop or tail below the keyboard`);
      for (let frame = 1; frame < catTypingFrameCount; frame++) {
        const next = poses[frame]!;
        for (let y = 0; y < 154; y++) {
          for (let x = 147; x < 181; x++) {
            const i = (y * SIZE + x) * 4;
            assert(samePixel(first, next, i), `Typing moved the center of the cat's head`);
          }
        }
      }
    }
    const effortHeads: Uint8ClampedArray[] = [];
    const fastHeads: Uint8ClampedArray[] = [];
    const effortInk = preset.palette === 'CC02' ? [32, 27, 30] : [68, 36, 22];
    const protectedEyeOffsets: number[] = [];
    const eyeAreas = [0, 0];
    for (let offset = 0; offset < protectedEyes.length; offset += 4) {
      if (!protectedEyes[offset + 3]) continue;
      protectedEyeOffsets.push(offset);
      eyeAreas[offset / 4 % SIZE < SIZE / 2 ? 0 : 1]!++;
    }
    for (let frame = 0; frame < catTypingFrameCount; frame++) {
      const fastPose = snapshot('typing', frame, preset, { typingMode: 'fast' });
      const openEyes = snapshot('typing', frame, preset, { typingMode: 'fast', typingEffects: true });
      assert(protectedEyeOffsets.every(offset => samePixel(openEyes, fastPose, offset)),
        `${preset.name} closed or moved its pupils before frenzy typing`);
      assert(same(openEyes.subarray(154 * SIZE * 4), fastPose.subarray(154 * SIZE * 4)),
        `${preset.name} fast expression changed the paws, torso or laptop`);
      fastHeads.push(openEyes.subarray(0, 154 * SIZE * 4));
      if (frame === 6) {
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

      const frenzyPose = snapshot('typing', frame, preset, { typingMode: 'frenzy' });
      const effort = snapshot('typing', frame, preset, { typingMode: 'frenzy', typingEffects: true });
      const eyelidArea = [0, 0];
      let changedEyes = 0;
      for (const offset of protectedEyeOffsets) {
        if (!samePixel(effort, frenzyPose, offset)) changedEyes++;
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
      assert(same(effort.subarray(154 * SIZE * 4), frenzyPose.subarray(154 * SIZE * 4)),
        `${preset.name} effort effects changed the paws, torso or laptop`);
      effortHeads.push(effort.subarray(0, 154 * SIZE * 4));
      render(canvas, preset, 'typing', frame, { x: -100, y: 60, space: 'pointer' }, { typingMode: 'frenzy' });
      assert(same(pixels(), effort), `${preset.name} drew moving glints over its effort expression`);
    }
    assert(!same(fastHeads[0]!, fastHeads[6]!), `${preset.name} fast expression and sweat did not progress`);
    assert(!same(effortHeads[0]!, effortHeads[6]!), `${preset.name} frenzy sweat did not animate`);
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
    // User-selected mouths remain independent of the default typing expression.
    for (const mouth of ['CN02', 'CN03', 'CN04'] as const) {
      const config = { ...preset, mouth, coat: 'silver', bodyPattern: 'spotted', ear: 'CE04' } as const;
      for (const typingMode of ['fast', 'frenzy'] as const) {
        const plain = snapshot('typing', 8, config, { typingMode });
        const expressive = snapshot('typing', 8, config, { typingMode, typingEffects: true });
        // The face-parts atlas places every nose at x143..158/y120..133
        // and all mouth ink below y130, extending through y160 for CN03.
        // A single wide upper rectangle also includes the right eye's edge
        // at x172/y119..123, which must disappear when that eye squeezes.
        for (const [part, left, top, right, bottom] of [
          ['nose', 143, 120, 158, 133], ['mouth', 129, 131, 171, 160],
        ] as const) {
          for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
            const offset = (y * SIZE + x) * 4;
            if (samePixel(plain, expressive, offset)) continue;
            assert(false, `${preset.name}/${typingMode}/${mouth}/${config.nose} replaced chosen ${part} at ${x},${y}: `
              + `${rgba(plain, offset)} -> ${rgba(expressive, offset)}`);
          }
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
    assert(same(snapshot('sit', 0, preset), snapshot('sit', 0, { ...preset, pattern: 'P03' })),
      `${preset.name} removed natural coat patches when clearing an already unmarked forehead`);
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
  assert(catTypingFrameCount === 12 && gentleDuration * 12 === 1000
    && fastDuration * 12 === 600 && frenzyDuration * 12 === 360,
  'Reference typing did not retain its three twelve-frame cycle durations');
  for (const preset of Object.values(catPresets)) {
    const timedCanvas = document.createElement('canvas');
    const typingMotion = new Motion(timedCanvas, preset);
    const observed = () => timedCanvas.getContext('2d')!.getImageData(0, 0, SIZE, SIZE).data;
    const expected = (frame: number, typingMode: TypingMode) =>
      snapshot('typing', frame, preset, { typingMode, typingEffects: true });
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
    assert(same(observed(), expected(5, 'frenzy')), `${preset.name} did not advance at the frenzy cadence`);
    typingMotion.tick(frenzyStart + 12 * frenzyDuration);
    assert(same(observed(), expected(4, 'frenzy')), `${preset.name} lost its phase across the twelve-pose frenzy cycle`);
    const stop = frenzyStart + (preset.palette === 'CC01' ? 500 : 1001);
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
    assert(same(observed(), expected(8, 'frenzy')), `${preset.name} lost frenzy hysteresis at eight keys`);
    slowing.tick(start + 1031);
    assert(same(observed(), expected(8, 'frenzy')), `${preset.name} lost frenzy hysteresis at seven keys`);
    slowing.tick(start + 1041);
    assert(same(observed(), expected(9, 'fast')), `${preset.name} failed to slow at six keys without resetting phase`);
    slowing.tick(start + 1071);
    assert(same(observed(), expected(9, 'fast')), `${preset.name} lost fast-mode hysteresis at three keys`);
    slowing.tick(start + 1081);
    assert(same(observed(), expected(10, 'gentle')), `${preset.name} reset its paw phase when slowing below three keys`);
  }

  for (const preset of Object.values(catPresets)) {
    for (const action of ['sit', 'typing', 'left', 'right'] as const) {
      const straight = snapshot(action, 0, preset);
      for (const gaze of [{ x: -2, y: 0 }, { x: horizontalGazeRange.min, y: -1 },
        { x: 2, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }]) {
        render(canvas, preset, action, 0, gaze);
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
      render(canvas, preset, action, 0, { x: 0, y: 0 });
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
  for (const preset of [orange, calico]) {
    const config = {
      ...preset, coat: 'lavender', ear: 'CE04', tail: 'CT03', pattern: 'P05', bodyPattern: 'spotted',
      mouth: 'CN03', nose: 'NO03',
    } as const;
    for (const [action, frame, typingMode, typingAnimation, laptopVersion] of [
      ['sit', 0, 'gentle', 'reference', 'clean'],
      ['typing', 1, 'gentle', 'legacy', 'original'],
      ['typing', 2, 'fast', 'shared', 'original'],
      ['typing', 7, 'frenzy', 'reference', 'clean'],
    ] as const) {
      const source = {
        config, action, frame, typingMode, typingAnimation, laptopVersion,
        typingLayout: 'aligned', earLayout: 'shared', markingLayout: 'shared', gaze: { x: 0, y: 0 },
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
    for (const [action, frame, typingMode] of [['sit', 0, 'gentle'], ['typing', 8, 'frenzy']] as const) {
      render(editable, config, action, frame, undefined, { typingMode });
      const current = prepareCatCustomization(editable, {
        config, action, frame, typingMode, gaze: { x: 0, y: 0 },
        typingAnimation: 'reference', typingLayout: 'aligned', laptopVersion: 'clean', outlineVersion: 'adaptive',
        earLayout: 'shared', markingLayout: 'shared',
      }, config);
      assert(current.source.outlineVersion === 'adaptive' && !current.paint.full && !current.laptop
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
      earLayout: 'shared', typingLayout: 'aligned', typingAnimation: 'shared',
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
        typingLayout: 'aligned', typingAnimation: 'reference', laptopVersion: 'clean', outlineVersion: 'adaptive', earLayout: 'shared', markingLayout: 'shared',
      } as const;
      const currentMarkings = prepareCatCustomization(editable, source, newLook);
      assert(currentMarkings.source.markingLayout === 'shared' && currentMarkings.source.typingAnimation === 'reference'
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
  assert(same(snapshot('typing', 0, orange, { typingMode: 'frenzy', typingEffects: true, custom: oldReflection }),
    snapshot('typing', 0, orange, { typingMode: 'frenzy', typingEffects: true })),
  'A fixed custom reflection appeared over effort eyes while pointer tracking was off');

  const roundCalico = { ...calico, ear: 'CE03' } as const;
  const earSource = { config: roundCalico, action: 'sit', frame: 0, gaze: { x: 0, y: 0 }, typingMode: 'gentle' };
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
    { config: calico, action: 'sit', frame: 0, gaze: { x: 0, y: 0 }, typingMode: 'gentle', markingLayout: 'shared' }, orange);
  const legacy = prepareCatCustomization(editable, null, orange);
  for (const drawing of [custom, legacy]) {
    assert(drawing.source.config.palette === calico.palette, 'Custom cat lost its coat');
    assert(same(edited, snapshot('sit', 0, drawing.source.config, { custom: drawing })),
      'Custom cat did not retain its idle pixels');
    for (const typingMode of ['gentle', 'fast', 'frenzy'] as const) {
      const frames = Array.from({ length: catTypingFrameCount }, (_, frame) =>
        snapshot('typing', frame, drawing.source.config, { custom: drawing, typingMode }));
      assertDistinctFrames(frames, `${drawing.source.config.name}/custom/typing/${typingMode}/typingEffects:false`);
      const mark = (76 * SIZE + 161) * 4;
      assert(frames.every(frame => rgba(frame, mark) === '231,17,217,255'), 'Forehead edit disappeared during typing');
      const erased = (95 * SIZE + 84) * 4;
      assert(frames.every(frame => frame[erased + 3] === 0), 'Erased head pixels reappeared during typing');
      assert(frames.every((frame, index) => same(frame.subarray(belowKeyboard),
        snapshot('typing', index, calico, { typingMode }).subarray(belowKeyboard))), 'Custom marking covered the laptop');
    }
  }

  const layeredLook = {
    ...calico, palette: 'CC04', coat: 'silver', ear: 'CE04', nose: 'NO02', mouth: 'CN03', pattern: 'P01',
    accessory: 'A02', eyeColor: 'rose', tail: 'CT03',
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
    { config: layeredLook, action: 'sit', frame: 0, gaze: { x: 0, y: 0 }, typingMode: 'gentle', outlineVersion: 'adaptive', earLayout: 'shared', markingLayout: 'shared' }, orange);
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
  assert(same(customPixels(), snapshot('typing', 0, layeredLook, { custom, typingMode: 'gentle' })),
    'The configured appearance did not remain underneath custom paint during keyboard input');
  const customChange = customStart + gentleDuration + 0.1;
  customMotion.tick(customChange);
  assert(same(customPixels(), snapshot('typing', 1, layeredLook, { custom, typingMode: 'gentle' })),
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
  assert(same(customPixels(), snapshot('typing', 2, layeredLook, { custom, typingMode: 'frenzy', typingEffects: true })),
    'Custom paint stopped the phase-preserving switch to frenzy typing');
  customMotion.tick(customFrenzy + frenzyDuration);
  assert(same(customPixels(), snapshot('typing', 3, layeredLook, { custom, typingMode: 'frenzy', typingEffects: true })),
    'Custom paint froze frenzy typing');
  customMotion.tick(customFrenzy + 1001);
  assert(same(customPixels(), snapshot('sit', 12, layeredLook, { custom })), 'Custom cat did not return to its edited idle pose');

  render(editable, calico, 'typing', 1);
  editor.resetTransform();
  editor.fillStyle = '#E711D9';
  editor.fillRect(149, 244, 8, 8);
  const laptopEdit = prepareCatCustomization(editable,
    { config: calico, action: 'typing', frame: 1, gaze: { x: 0, y: 0 }, typingMode: 'gentle', typingLayout: 'aligned', typingAnimation: 'reference', laptopVersion: 'clean', earLayout: 'shared', markingLayout: 'shared' }, orange);
  const laptopMark = (247 * SIZE + 152) * 4;
  assert(rgba(snapshot('typing', 2, calico, { custom: laptopEdit, typingMode: 'fast' }), laptopMark) === '231,17,217,255',
    'Laptop edit was dropped at a different typing speed');
  assert(same(snapshot('sit', 0, calico, { custom: laptopEdit }), snapshot('sit', 0, calico)),
    'Laptop edits leaked onto the idle cat');

  for (const preset of [orange, calico]) {
    for (const typingAnimation of ['legacy', 'shared', 'reference'] as const) {
      // All three historical generations stored the original prop, including
      // the first reference poses that predate laptopVersion metadata.
      const source = {
        config: preset, action: 'typing', frame: 1, typingMode: 'gentle', typingAnimation,
        typingLayout: 'aligned', earLayout: 'shared', markingLayout: 'shared', gaze: { x: 0, y: 0 },
      } as const;
      render(editable, preset, 'typing', 1, undefined,
        { typingMode: 'gentle', typingAnimation, laptopVersion: 'original' });
      const previous = prepareCatCustomization(editable, source, preset);
      assert(previous.source.laptopVersion === 'original' && !previous.paint.full && !previous.laptop
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
      const base = snapshot('typing', 1, preset);
      const restored = snapshot('typing', 1, preset, { custom: painted });
      for (let offset = 0; offset < base.length; offset += 4) {
        const x = offset / 4 % SIZE, y = Math.floor(offset / 4 / SIZE);
        const marked = (x >= 149 && x < 157 && y >= 244 && y < 252)
          || (preset.palette === 'CC01' && x === 230 && y === 236);
        const erased = (x >= 159 && x < 161 && y >= 246 && y < 248)
          || (preset.palette === 'CC01' && x === 231 && y === 236);
        assert(erased ? restored[offset + 3] === 0
          : rgba(restored, offset) === (marked ? '231,17,217,255' : rgba(base, offset)),
        `${preset.name}/${typingAnimation} lost laptop edits or reapplied its former edge at ${x},${y}`);
      }
    }
  }
  for (const laptopVersion of ['clean', 'original'] as const) {
    render(editable, orange, 'typing', 0, undefined, { laptopVersion });
    const inferred = prepareCatCustomization(editable, null, orange);
    assert(inferred.source.typingAnimation === 'reference' && inferred.source.laptopVersion === laptopVersion
      && !inferred.paint.full && !inferred.laptop && !inferred.idleTorso && !inferred.typingTorso,
    `PNG-only ${laptopVersion} laptop was baked into user paint`);
  }

  render(editable, calico, 'typing', 0, undefined, { typingLayout: 'legacy', typingAnimation: 'legacy', markingLayout: 'legacy' });
  editor.resetTransform();
  editor.fillStyle = '#E711D9';
  editor.fillRect(146, 73, 8, 8);
  editor.fillRect(145, 242, 8, 8);
  const olderTyping = prepareCatCustomization(editable,
    { config: calico, action: 'typing', frame: 0, gaze: { x: 0, y: 0 }, typingMode: 'gentle' }, calico);
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
      typingLayout: 'aligned', earLayout: 'shared',
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
      typingLayout: 'aligned', typingAnimation: 'shared', earLayout: 'shared', markingLayout: 'shared',
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
  }

  render(editable, calico);
  editor.resetTransform();
  editor.fillStyle = '#442416';
  editor.fillRect(99, 117, 1, 1);
  editor.fillStyle = '#FFFAF2';
  editor.fillRect(100, 117, 1, 1);
  const paintedIris = prepareCatCustomization(editable,
    { config: calico, action: 'sit', frame: 0, gaze: { x: 0, y: 0 }, typingMode: 'gentle', markingLayout: 'shared' }, calico);
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
      { config: orange, action: 'sit', frame: 0, gaze, typingMode: 'gentle', markingLayout: 'shared' }, orange);
    assert(saved.source.gaze.x === gaze.x && saved.source.gaze.space === gaze.space && !saved.paint.full,
      'A saved gaze was interpreted as pixel edits');
  }
  return 'cat actions ready';
}

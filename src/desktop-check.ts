import { catOptions, catPresets, orangeCatOptions, readPetConfig } from './cat';
import { Motion } from './motion';
import { render, type Action, type CatPose } from './render';

// Exercise the bundled renderer in the same WKWebView used by the floating pet.
export function checkCatActions() {
  const SIZE = 320;
  const canvas = document.createElement('canvas');
  const pixels = () => canvas.getContext('2d')!.getImageData(0, 0, SIZE, SIZE).data;
  const rgba = (pose: Uint8ClampedArray, offset: number) =>
    [pose[offset], pose[offset + 1], pose[offset + 2], pose[offset + 3]].join(',');
  const same = (a: Uint8ClampedArray, b: Uint8ClampedArray) => a.every((value, offset) => value === b[offset]);
  const distinct = (frames: Uint8ClampedArray[]) =>
    frames.every((frame, index) => frames.slice(index + 1).every(next => !same(frame, next)));
  const assert = (condition: boolean, message: string) => {
    if (!condition) throw Error(message);
  };

  const { preset_cat_orange: orange, preset_cat_calico: calico, preset_cat_black: black } = catPresets;
  const snapshot = (action: Action, frame: number, config: Parameters<typeof render>[1] = orange, poseOptions: CatPose = {}) => {
    render(canvas, config, action, frame, undefined, poseOptions);
    const pose = pixels();
    let area = 0;
    for (let offset = 3; offset < pose.length; offset += 4) {
      const alpha = pose[offset];
      assert(alpha === 0 || alpha === 255, 'Cat layer has fractional alpha');
      if (alpha) area++;
    }
    assert(area > 2200, 'Cat pose is missing or clipped');
    return pose;
  };

  for (const action of ['left', 'typing'] as const) {
    assert(distinct(Array.from({ length: 4 }, (_, frame) => snapshot(action, frame, orange, { typingMode: 'fast' }))), `Repeated ${action} frame`);
    for (let frame = 0; frame < 4; frame++) {
      const base = snapshot(action, frame);
      const looks = [
        ...Object.keys(catOptions.palette).filter(id => id !== orange.palette).map(palette => ({ palette })),
        ...action === 'left' ? Object.keys(catOptions.eye).filter(id => id !== orange.eye).map(eye => ({ eye })) : [],
        ...Object.keys(catOptions.pattern).filter(id => id !== orange.pattern).map(pattern => ({ pattern })),
        { eyeColor: 'blue' }, { eyeColor: 'green' },
      ] as Partial<typeof orange>[];
      for (const change of looks) {
        assert(!same(base, snapshot(action, frame, { ...orange, ...change })), `Ignored ${JSON.stringify(change)} in ${action}`);
      }
    }
  }

  for (const action of ['sit', 'left', 'right', 'typing'] as const) {
    const frames = action === 'sit' ? 1 : 4;
    for (let frame = 0; frame < frames; frame++) {
      for (const part of ['ear', 'muzzle', 'eye', 'accessory'] as const) {
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
        const combined = { ...black, ear: 'CE04', muzzle: 'CN03', eye } as const;
        const natural = snapshot(action, frame, combined);
        assert(!same(natural, snapshot(action, frame, { ...combined, eyeColor: 'blue' })),
          `Iris recolor missing for ${eye} in ${action}/${frame}`);
      }
    }
  }

  const belowKeyboard = 211 * SIZE * 4;
  const laptop = snapshot('typing', 0, black);
  for (const preset of Object.values(catPresets)) {
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
    if (preset !== orange) {
      for (const part of ['ear', 'muzzle', 'eye', 'pattern'] as const) {
        const variants = Object.keys(choices[part]).map(value =>
          snapshot('sit', 0, readPetConfig({ ...preset, [part]: value })),
        );
        assert(distinct(variants), `Duplicate ${part} for ${preset.name}`);
        if (part === 'ear') {
          const belowEars = 108 * SIZE * 4;
          assert(variants.every(variant => same(variant.subarray(belowEars), variants[0]!.subarray(belowEars))),
            `Ear change reached below the ears for ${preset.name}`);
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
    for (const typingMode of ['gentle', 'fast'] as const) {
      const poses = Array.from({ length: 4 }, (_, frame) => snapshot('typing', frame, preset, { typingMode }));
      const first = poses[0]!;
      assert(distinct(poses), `Repeated ${preset.name} ${typingMode} frame`);
      assert(poses.every(pose => same(gentle.subarray(belowKeyboard), pose.subarray(belowKeyboard))),
        `${preset.name} ${typingMode} typing changed the laptop or tail below the keyboard`);
      for (let frame = 1; frame < 4; frame++) {
        const next = poses[frame]!;
        for (let y = 0; y < 154; y++) {
          for (let x = 147; x < 181; x++) {
            const i = (y * SIZE + x) * 4;
            assert(rgba(first, i) === rgba(next, i), `Typing moved the center of the cat's head`);
          }
        }
      }
    }
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
  const time = performance.now();
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
  motion.key(time + 641);
  motion.tick(time + 641);
  assert(same(pixels(), snapshot('typing', 0, calico)), 'Key did not trigger gentle typing');
  for (let i = 1; i <= 5; i++) motion.key(time + 641 + i * 100);
  motion.tick(time + 1141);
  assert(same(pixels(), snapshot('typing', 0, calico, { typingMode: 'fast' })), 'Six keys did not trigger fast typing');
  motion.tick(time + 1231);
  assert(same(pixels(), snapshot('typing', 1, calico, { typingMode: 'fast' })), 'Fast typing did not advance at 90 ms');
  motion.tick(time + 1942);
  assert(same(pixels(), snapshot('typing', 0, calico)), 'Typing did not return to gentle below three keys per second');
  motion.key(time + 1990);
  motion.tick(time + 2192);
  assert(same(pixels(), snapshot('typing', 1, calico, { typingMode: 'gentle' })),
    'Gentle typing did not advance at 250 ms');

  for (const eye of Object.keys(catOptions.eye).filter(id => id !== 'Y02') as (keyof typeof catOptions.eye)[]) {
    const config = { ...calico, eye };
    const straight = snapshot('sit', 0, config);
    render(canvas, config, 'sit', 0, { x: 2, y: 0 });
    const lookingRight = pixels();
    render(canvas, config, 'sit', 0, { x: -2, y: 0 });
    const lookingLeft = pixels();
    assert(!same(straight, lookingRight), `Gaze right did not move ${eye}`);
    assert(!same(lookingRight, lookingLeft), `Gaze left matched gaze right for ${eye}`);
    render(canvas, config, 'sit', 0, { x: 0, y: 0 });
    assert(same(pixels(), straight), `Gaze reset did not restore ${eye}`);
  }
  const orangeMotion = new Motion(canvas, orange);
  const begin = Math.ceil(performance.now());
  orangeMotion.key(begin);
  orangeMotion.tick(begin);
  assert(same(pixels(), snapshot('typing', 0)), 'Orange typing did not start gentle');
  orangeMotion.tick(begin + 250);
  assert(same(pixels(), snapshot('typing', 1)), 'Orange gentle typing did not advance at 250 ms');
  orangeMotion.tick(begin + 500);
  assert(same(pixels(), snapshot('sit', 5)), 'Orange typing did not stop at 500 ms');
  orangeMotion.key(begin + 1000);
  orangeMotion.tick(begin + 1000);
  for (let i = 1; i <= 5; i++) {
    orangeMotion.key(begin + 1000 + i * 100);
    orangeMotion.tick(begin + 1000 + i * 100);
  }
  const firstFast = pixels();
  assert(Array.from({ length: 4 }, (_, i) => snapshot('typing', i, orange, { typingMode: 'fast' }))
    .some(frame => same(frame, firstFast)), 'Orange typing did not switch to fast above five keys per second');
  orangeMotion.tick(begin + 1591);
  assert(!same(pixels(), firstFast), 'Orange fast typing did not advance after 90 ms');
  return 'cat actions ready';
}

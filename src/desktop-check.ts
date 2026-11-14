import { catOptions, catPresets, readPetConfig } from './cat';
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

  const orange = catPresets.preset_cat_orange;
  const calico = catPresets.preset_cat_calico;
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
        ...Object.keys(catOptions.eye).filter(id => id !== orange.eye).map(eye => ({ eye })),
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
      for (const part of ['ear', 'muzzle', 'eye'] as const) {
        const ids = Object.keys(catOptions[part]);
        const choices = part === 'ear' && (action === 'left' || action === 'right')
          ? ids.filter(id => id !== 'CE03' && id !== 'CE05') : ids;
        const poses = choices.map(id =>
          snapshot(action, frame, readPetConfig({ ...orange, [part]: id })),
        );
        assert(distinct(poses), `Duplicate ${part} variant in ${action}/${frame}`);
      }
      for (const eye of ['Y05', 'Y06', 'Y07'] as const) {
        const combined = { ...catPresets.preset_cat_black, ear: 'CE04', muzzle: 'CN03', eye } as const;
        const natural = snapshot(action, frame, combined);
        assert(!same(natural, snapshot(action, frame, { ...combined, eyeColor: 'blue' })),
          `Iris recolor missing for ${eye} in ${action}/${frame}`);
      }
    }
  }

  for (const preset of Object.values(catPresets)) {
    const accessories = Object.keys(catOptions.accessory).map(accessory =>
      snapshot('sit', 0, readPetConfig({ ...preset, accessory })),
    );
    assert(distinct(accessories), `Accessory missing for ${preset.name}`);
    for (const typingMode of ['gentle', 'fast'] as const) {
      const first = snapshot('typing', 0, preset, { typingMode });
      for (let frame = 1; frame < 4; frame++) {
        const next = snapshot('typing', frame, preset, { typingMode });
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
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        assert(rgba(left, (y * SIZE + x) * 4) === rgba(right, (y * SIZE + SIZE - 1 - x) * 4), 'Right walk is not mirrored');
      }
    }
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
    const config = { ...orange, eye };
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
  return 'cat actions ready';
}

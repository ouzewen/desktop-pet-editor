import { catOptions, catPresets, readPetConfig } from './cat';
import { Motion } from './motion';
import { render, SIZE, type Action } from './render';

// Exercise the bundled renderer in the same WKWebView used by the floating pet.
export function checkCatActions() {
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
  const snapshot = (action: Action, frame: number, config: Parameters<typeof render>[1] = orange) => {
    render(canvas, config, action, frame);
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
    assert(distinct(Array.from({ length: 4 }, (_, frame) => snapshot(action, frame))), `Repeated ${action} frame`);
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
        const poses = Object.keys(catOptions[part]).map(id =>
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
    for (const ear of Object.keys(catOptions.ear)) {
      const config = readPetConfig({ ...preset, ear });
      const first = snapshot('typing', 0, config);
      for (let frame = 1; frame < 4; frame++) {
        const next = snapshot('typing', frame, config);
        for (let i = 0; i < next.length; i += 4) {
          if (rgba(first, i) === rgba(next, i)) continue;
          const x = (i / 4) % SIZE;
          const y = Math.floor(i / 4 / SIZE);
          assert(y >= 90 && y <= 105 && x >= 60 && x <= 100,
            `Typing shifted pixels outside the front paws for ${ear}/${frame}`);
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
  const left = snapshot('left', 1, calico);
  const right = snapshot('right', 0, calico);
  const typing = snapshot('typing', 0, calico);
  const motion = new Motion(canvas, calico);
  const time = performance.now();
  motion.tick(time);
  assert(same(pixels(), sit), 'Cat did not start sitting');
  motion.beginDrag();
  motion.drag(-16);
  motion.tick(time);
  assert(same(pixels(), left), 'Drag left did not trigger walk');
  motion.drag(1);
  motion.tick(time);
  assert(same(pixels(), right), 'Drag right did not trigger mirrored walk');
  motion.release(time);
  motion.tick(time);
  assert(same(pixels(), sit), 'Release did not restore sitting');
  motion.key(time);
  motion.tick(time);
  assert(same(pixels(), typing), 'Key did not trigger typing');
  motion.tick(time + 521);
  assert(same(pixels(), snapshot('sit', 5, calico)), 'Typing did not return to sitting');
  return 'cat actions ready';
}

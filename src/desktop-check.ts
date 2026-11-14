import { catOptions, catPresets } from './cat';
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

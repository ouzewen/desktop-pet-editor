import { CAT_SIZE } from './pet-assets';

export const dragHoldStrength = 0.4;

export type JellyPose = { head: number; body: number; tail: number };
type SpringState = { position: number; velocity: number };
type Spring = { stiffness: number; damping: number };

const follow = {
  head: { stiffness: 2500, damping: 80, delay: 0 },
  body: { stiffness: 400, damping: 30, delay: 140 },
  tail: { stiffness: 100, damping: 17, delay: 200 },
};
const recovery = { stiffness: 180, damping: 6.8 };
const mass = 1;
const settleTime = 1200;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function stepSpring({ position, velocity }: SpringState, goal: number, seconds: number, spring: Spring): SpringState {
  const decay = spring.damping / (2 * mass);
  const rate = Math.sqrt(spring.stiffness / mass - decay * decay);
  const a = position - goal, b = (velocity + decay * a) / rate;
  const cos = Math.cos(rate * seconds), sin = Math.sin(rate * seconds);
  const envelope = Math.exp(-decay * seconds);
  const wave = a * cos + b * sin;
  return { position: goal + envelope * wave, velocity: envelope * (rate * (b * cos - a * sin) - decay * wave) };
}

const stopped = (): SpringState => ({ position: 0, velocity: 0 });
const parts = ['head', 'body', 'tail'] as const;

export class CatJellyMotion {
  private state = { head: stopped(), body: stopped(), tail: stopped() };
  private samples: { at: number; value: number; hold: number }[] = [];
  private time: number | undefined;
  private releasedAt: number | undefined;

  begin(now: number) {
    this.reset();
    this.time = now;
  }

  reset() {
    this.state = { head: stopped(), body: stopped(), tail: stopped() };
    this.samples.length = 0;
    this.time = this.releasedAt = undefined;
  }

  drag(dx: number, elapsed: number, now: number) {
    if (this.time === undefined || this.releasedAt !== undefined) return;
    this.advanceDrag(now);
    // After a pause, the event interval includes the dwell as well as the move.
    const speed = dx * 1000 / clamp(elapsed, 1, 120);
    const strength = clamp((Math.abs(speed) - 8) / (900 - 45), 0, 1);
    const hold = dx ? Math.sign(dx) * dragHoldStrength : this.samples.at(-1)?.hold ?? dragHoldStrength;
    const value = Math.sign(hold) * Math.max(dragHoldStrength, Math.pow(strength, 0.72));
    this.samples.push({ at: now, value, hold });
    while (this.samples[1] && this.samples[1].at < now - 300) this.samples.shift();
  }

  release(now: number) {
    if (this.time === undefined || this.releasedAt !== undefined) return;
    this.advanceDrag(now);
    this.releasedAt = now;
  }

  pose(now: number): JellyPose | undefined {
    if (this.time === undefined) return;
    const release = this.releasedAt;
    if (release !== undefined && now - release >= settleTime + 90) {
      this.reset();
      return;
    }
    if (release === undefined) this.advanceDrag(now);
    const position = (part: keyof JellyPose, delay: number) => {
      const state = this.state[part];
      const initial = clamp(state.position, -1, 1);
      const elapsed = release === undefined ? 0 : Math.max(0, now - release - delay);
      if (elapsed >= settleTime) return 0;
      // Give the slower layers time to catch up even when a short swipe ends
      // before the drag sample reaches them.
      const velocity = clamp(state.velocity * 0.28 + (this.state.head.position - state.position) * 4, -5, 5);
      const value = elapsed === 0 ? initial
        : stepSpring({ position: initial, velocity }, 0, elapsed / 1000, recovery).position
          * (1 - smooth(1020, settleTime, elapsed));
      return Math.round(clamp(value, -1, 1) * 128) / 128;
    };
    const pose = { head: position('head', 50), body: position('body', 0), tail: position('tail', 90) };
    if (pose.head || pose.body || pose.tail) return pose;
  }

  private advanceDrag(now: number) {
    const from = Math.max(this.time ?? now, now - 500);
    if (from >= now) return;
    this.time = now;
    for (let start = from; start < now;) {
      const end = Math.min(now, start + 8);
      for (const part of parts) {
        const spring = follow[part];
        const at = (start + end) / 2 - spring.delay;
        const target = this.targetAt(at);
        this.state[part] = stepSpring(this.state[part], target, (end - start) / 1000, spring);
      }
      start = end;
    }
  }

  private targetAt(at: number) {
    // Ease from the velocity response into a held pose until mouse-up.
    for (let i = this.samples.length - 1; i >= 0; i--) {
      const sample = this.samples[i]!;
      if (sample.at <= at) {
        const moving = clamp((120 - (at - sample.at)) / 75, 0, 1);
        return sample.hold + (sample.value - sample.hold) * moving;
      }
    }
    return 0;
  }
}

type TailRow = { left: number; right: number; gap: number; free: number };
type JellySprite = { pixels: Uint32Array; tailMask?: Uint8Array; rows: (TailRow | undefined)[]; top: number; root: number };
const size = CAT_SIZE;
const smooth = (start: number, end: number, position: number) => {
  const t = clamp((position - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};

export function splitJellySprite(pixels: Uint32Array, tailMask?: Uint8Array): JellySprite {
  const rows: (TailRow | undefined)[] = [];
  let top = size, root = 0, attachment = size;
  if (tailMask) {
    for (let y = 0; y < size; y++) {
      const start = y * size;
      let left = size, right = 0;
      for (let x = 0; x < size; x++) {
        if (!tailMask[start + x]) continue;
        left = Math.min(left, x);
        right = x + 1;
      }
      if (left === size) continue;
      let gap = 0;
      while (gap < 4 && left > gap && !pixels[start + left - 1 - gap]) gap++;
      if (!gap) attachment = Math.min(attachment, y);
      rows[y] = { left, right, gap, free: 0 };
      top = Math.min(top, y);
      root = y;
    }
    for (let y = top; y <= root; y++) {
      const row = rows[y];
      if (row) row.free = row.gap / 4 * (1 - smooth(top + 2, Math.max(top + 3, attachment), y));
    }
  }
  return { pixels, rows, tailMask, top, root };
}

export function warpJellySprite(sprite: JellySprite, pose: JellyPose, front: ImageData, tail: ImageData) {
  const { pixels, tailMask, rows, top, root } = sprite;
  const foreground = new Uint32Array(front.data.buffer);
  const background = new Uint32Array(tail.data.buffer);
  background.fill(0);
  const center = 150;
  for (let y = 0; y < size; y++) {
    const row = y * size;
    // Keep every pixel on its original row and stretch the face evenly.
    // The chest yields on the leading side before tapering into the pinned paws.
    const headWeight = 1 - smooth(143, 204, y);
    const bodyWeight = (1 - headWeight) * (1 - smooth(188, 236, y));
    const head = pose.head * headWeight;
    const body = pose.body * bodyWeight;
    const chestShift = (pose.body * 0.84 + pose.head * 0.16) * bodyWeight * 13;
    const shift = head * 18 + chestShift;
    const stretch = Math.abs(head) * 0.13 + Math.abs(body) * 0.19;
    const bias = body * 0.10;
    const leftScale = 1 + stretch - bias;
    const rightScale = 1 + stretch + bias;
    const hinge = center + shift;
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - hinge;
      const sx = Math.floor(center + dx / (dx < 0 ? leftScale : rightScale));
      const source = row + sx;
      foreground[row + x] = sx >= 0 && sx < size && !tailMask?.[source] ? pixels[source]! : 0;
    }
    const tailRow = rows[y];
    if (!tailRow) continue;
    // The exposed tip can swing freely. At the attachment, keep the edge
    // against the torso and bend the visible tail away from that anchor.
    const bend = pose.tail * 22 * (1 - smooth(top, Math.max(top + 1, root), y));
    const span = tailRow.right - tailRow.left;
    const attached = 1 - tailRow.free;
    const mountScale = 1 + (rightScale - 1) * attached;
    const desiredLeft = center + (tailRow.left - center) * mountScale + shift * attached + bend * tailRow.free;
    const desiredWidth = span * clamp(mountScale + bend * attached / span, 0.85, 1.17);
    // Longer tail styles can reach the frame edge. Ease a free tip inward
    // and let an attached row compress while its root stays on the body.
    const limit = Math.max(size - 4, tailRow.right);
    const excess = Math.max(0, desiredLeft + desiredWidth - limit);
    const left = Math.min(desiredLeft - excess * tailRow.free, limit - 1);
    const tailScale = Math.min(desiredWidth, limit - left) / span;
    const start = Math.max(0, Math.ceil(left - 0.5));
    const end = Math.min(size, Math.ceil(left + span * tailScale - 0.5));
    for (let x = start; x < end; x++) {
      const sx = Math.floor(tailRow.left + (x + 0.5 - left) / tailScale);
      if (tailMask?.[row + sx]) background[row + x] = pixels[row + sx]!;
    }
  }
}


export function warpStretchSprite(pixels: Uint32Array, stretch: number, target: ImageData) {
  const output = new Uint32Array(target.data.buffer);
  const headShift = 2 * Math.round(stretch * 7);
  for (let y = 0; y < size; y++) {
    // Keep the sit's original ground anchor and taper the move into the planted paws.
    const weight = 1 - smooth(204, 236, y);
    const scaleX = 1 + Math.abs(stretch) * 0.11 * weight;
    const scaleY = 1 - Math.abs(stretch) * 0.055 * weight;
    const sourceY = Math.floor(278 + (y + 0.5 - 278) / scaleY);
    const hinge = 160 + scaleX * headShift * (1 - smooth(143, 204, sourceY));
    for (let x = 0; x < size; x++) {
      const sourceX = Math.floor(160 + (x + 0.5 - hinge) / scaleX);
      output[y * size + x] = sourceY >= 0 && sourceY < size && sourceX >= 0 && sourceX < size
        ? pixels[sourceY * size + sourceX]! : 0;
    }
  }
}

import { CAT_SIZE } from './pet-assets';

export type JellyPose = { head: number; body: number; tail: number };
type SpringState = { position: number; velocity: number };
type Spring = { stiffness: number; damping: number };

const follow = {
  head: { stiffness: 4900, damping: 130, delay: 0 },
  body: { stiffness: 400, damping: 30, delay: 100 },
  tail: { stiffness: 130, damping: 17, delay: 155 },
};
const recovery = { stiffness: 180, damping: 12 };
const mass = 1;
const settleTime = 780;
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
  private samples: { at: number; value: number }[] = [];
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
    const speed = dx * 1000 / Math.max(1, elapsed);
    const value = Math.sign(speed) * clamp((Math.abs(speed) - 45) / (900 - 45), 0, 1);
    this.samples.push({ at: now, value });
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
      const initial = clamp(this.state[part].position, -1, 1);
      const elapsed = release === undefined ? 0 : Math.max(0, now - release - delay);
      const value = elapsed === 0 ? initial : elapsed >= settleTime ? 0
        : stepSpring({ position: initial, velocity: 0 }, 0, elapsed / 1000, recovery).position;
      return Math.round(value * 128) / 128;
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
    // A stopped mouse sends no events. Let the last sample fade while held.
    for (let i = this.samples.length - 1; i >= 0; i--) {
      const sample = this.samples[i]!;
      if (sample.at <= at) return sample.value * clamp((120 - (at - sample.at)) / 75, 0, 1);
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

export function splitJellySprite(image: ImageData, tailMask?: Uint8Array): JellySprite {
  const pixels = new Uint32Array(image.data.buffer);
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
  const center = 150, neck = 176;
  const angle = pose.head * 5 * Math.PI / 180;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  for (let y = 0; y < size; y++) {
    const row = y * size;
    // Blend the head and body at the neck and pin the lower legs and paws.
    const bodyWeight = 1 - smooth(196, 242, y);
    const scale = 1 + 0.15 * Math.abs(pose.body) * bodyWeight;
    const bodyShift = pose.body * 6 * bodyWeight;
    const headWeight = 1 - smooth(148, 185, y);
    const dy = y + 0.5 - neck;
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - center;
      const bodyX = center + (dx - bodyShift) / scale;
      const headX = center + dx * cos + dy * sin;
      const sx = Math.floor(bodyX + (headX - bodyX) * headWeight);
      const sy = Math.floor(y + 0.5 + (dy * (cos - 1) - dx * sin) * headWeight);
      const source = sy * size + sx;
      foreground[row + x] = sx >= 0 && sx < size && sy >= 0 && sy < size && !tailMask?.[source] ? pixels[source]! : 0;
    }
    const tailRow = rows[y];
    if (!tailRow) continue;
    // The exposed tip can swing freely. At the attachment, keep the edge
    // against the torso and bend the visible tail away from that anchor.
    const bend = pose.tail * 23 * (1 - smooth(top, Math.max(top + 1, root), y));
    const span = tailRow.right - tailRow.left;
    const attached = 1 - tailRow.free;
    const mountScale = 1 + (scale - 1) * attached;
    const left = center + (tailRow.left - center) * mountScale + bodyShift * attached + bend * tailRow.free;
    const tailScale = clamp(mountScale + bend * attached / span, 0.85, 1.15);
    const start = Math.max(0, Math.ceil(left - 0.5));
    const end = Math.min(size, Math.ceil(left + span * tailScale - 0.5));
    for (let x = start; x < end; x++) {
      const sx = Math.floor(tailRow.left + (x + 0.5 - left) / tailScale);
      if (tailMask?.[row + sx]) background[row + x] = pixels[row + sx]!;
    }
  }
}

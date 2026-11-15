import { frameCount, render, type Action, type Gaze, type TypingMode } from './render';
import { isOrangeCat, type PetConfig } from './cat';

const orangeTypingTimeout = 500;

/** Drive the same sprite with editor previews or native pointer/keyboard events. */
export class Motion {
  private dragAction: 'left' | 'right' | null = null;
  private dragDistance = 0;
  private pressing = false;
  private lastKey = -Infinity;
  private typingFrame = 0;
  private typingMode: TypingMode = 'gentle';
  private typingSince = 0;
  private orangeFrameTick = 0;
  private orangePhase = 0;
  private recentKeys: number[] = [];
  private stretch = 0;
  private stretchTarget = 0;
  private releaseStretch = 0;
  private settledAt = -Infinity;
  private idleSince = performance.now();
  private rendered = '';
  private gaze: Gaze = { x: 0, y: 0 };

  constructor(private canvas: HTMLCanvasElement, private config: PetConfig) {}

  setConfig(config: PetConfig) {
    this.config = config;
    this.rendered = '';
    this.lastKey = -Infinity;
    this.recentKeys = [];
    this.typingMode = 'gentle';
  }

  setGaze(x: number, y: number) {
    if (this.gaze.x === x && this.gaze.y === y) return;
    this.gaze = { x, y };
    this.rendered = '';
  }

  beginDrag() {
    this.pressing = true;
    this.stretchTarget = 0;
    this.dragDistance = 0;
    this.dragAction = null;
  }

  drag(dx: number) {
    if (!dx || !this.pressing) return;
    if (this.config.frame === 'CAT') {
      this.stretchTarget = Math.max(-1, Math.min(1, dx / 12));
      return;
    }
    const next = dx < 0 ? 'left' : 'right';
    if (this.dragAction !== next) this.dragDistance = 0;
    this.dragAction = next;
    this.dragDistance += Math.abs(dx);
  }

  release(now = performance.now()) {
    this.pressing = false;
    this.releaseStretch = this.stretch;
    this.settledAt = now;
    this.recentKeys = [];
    this.typingMode = 'gentle';
    this.dragAction = null;
    this.lastKey = -Infinity;
    this.idleSince = now;
  }

  key(now = performance.now()) {
    if (this.pressing) return;
    if (this.config.frame === 'CAT') {
      if (isOrangeCat(this.config) && now - this.lastKey >= orangeTypingTimeout) {
        this.orangeFrameTick = now;
        this.orangePhase = 0;
        this.typingMode = 'gentle';
      }
      this.recentKeys = this.recentKeys.filter(time => now - time < 1000);
      this.recentKeys.push(now);
      if (now - this.lastKey > 1000) this.typingSince = now;
    } else {
      this.typingFrame = now - this.lastKey > 520 ? 0 : (this.typingFrame + 1) % 4;
    }
    this.lastKey = now;
  }

  tick(now = performance.now()) {
    let action: Action = 'sit';
    let frame: number;
    const cat = this.config.frame === 'CAT';
    const orange = isOrangeCat(this.config);
    if (this.pressing && cat) {
      frame = 0;
      this.stretch += (this.stretchTarget - this.stretch) * 0.36;
      this.stretchTarget *= 0.86;
    } else if (this.pressing) {
      action = this.dragAction ?? 'sit';
      frame = this.dragAction ? Math.floor(this.dragDistance / 10) % frameCount(this.config, action) : 0;
    } else if (now - this.lastKey < (orange ? orangeTypingTimeout : cat ? 1001 : 521)) {
      action = 'typing';
      if (orange) {
        this.recentKeys = this.recentKeys.filter(time => now - time < 1000);
        const rate = this.recentKeys.length;
        if (rate < 3) this.typingMode = 'gentle';
        else if (rate > 5) this.typingMode = 'fast';
        const mix = Math.max(0, Math.min(1, (rate - 3) / 2));
        const interval = 250 - 160 * mix * mix * (3 - 2 * mix);
        this.orangePhase = (this.orangePhase + (now - this.orangeFrameTick) / interval) % 4;
        this.orangeFrameTick = now;
        frame = Math.floor(this.orangePhase);
      } else if (cat) {
        this.recentKeys = this.recentKeys.filter(time => now - time < 1000);
        const rate = this.recentKeys.length;
        const mode = rate > 5 ? 'fast' : rate < 3 ? 'gentle' : this.typingMode;
        if (mode !== this.typingMode) this.typingSince = now;
        this.typingMode = mode;
        frame = Math.floor(Math.max(0, now - this.typingSince) / (mode === 'fast' ? 90 : 250)) % 4;
      } else {
        frame = this.typingFrame;
      }
    } else {
      frame = Math.floor(Math.max(0, now - this.idleSince) / 90) % 80;
    }
    if (cat && !this.pressing) {
      const elapsed = now - this.settledAt;
      this.stretch = elapsed < 600
        ? this.releaseStretch * Math.cos(elapsed / 53) * Math.exp(-elapsed / 150) : 0;
    }
    const stretch = cat && action === 'sit' ? Math.round(this.stretch * 32) / 32 : 0;
    const pose = `${action}/${frame}/${this.typingMode}/${stretch}`;
    if (pose !== this.rendered) {
      render(this.canvas, this.config, action, frame, this.gaze, { typingMode: this.typingMode, stretch });
      this.rendered = pose;
    }
  }
}

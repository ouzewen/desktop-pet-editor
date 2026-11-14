import { frameCount, render, type Action, type Gaze, type TypingMode } from './render';
import type { PetConfig } from './cat';

/** Drive the same sprite with editor previews or native pointer/keyboard events. */
export class Motion {
  private dragAction: 'left' | 'right' | null = null;
  private dragDistance = 0;
  private pressing = false;
  private lastKey = -Infinity;
  private typingFrame = 0;
  private typingMode: TypingMode = 'gentle';
  private typingSince = 0;
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
    if (this.pressing && cat) {
      frame = 0;
      this.stretch += (this.stretchTarget - this.stretch) * 0.36;
      this.stretchTarget *= 0.86;
    } else if (this.pressing) {
      action = this.dragAction ?? 'sit';
      frame = this.dragAction ? Math.floor(this.dragDistance / 10) % frameCount(this.config, action) : 0;
    } else if (now - this.lastKey <= (cat ? 1000 : 520)) {
      action = 'typing';
      if (cat) {
        this.recentKeys = this.recentKeys.filter(time => now - time < 1000);
        const rate = this.recentKeys.length;
        const mode = rate > 5 ? 'fast' : rate < 3 ? 'gentle' : this.typingMode;
        if (mode !== this.typingMode) this.typingSince = now;
        this.typingMode = mode;
      }
      frame = cat ? Math.floor(Math.max(0, now - this.typingSince) / (this.typingMode === 'fast' ? 90 : 250)) % 4
        : this.typingFrame;
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

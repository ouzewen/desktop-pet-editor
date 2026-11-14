import { render, type Action } from './render';
import type { Config } from './model';

/** Drive the same sprite with editor previews or native pointer/keyboard events. */
export class Motion {
  private dragAction: 'left' | 'right' | null = null;
  private dragDistance = 0;
  private pressing = false;
  private lastKey = -Infinity;
  private typingFrame = 0;
  private idleSince = performance.now();
  private rendered = '';

  constructor(private canvas: HTMLCanvasElement, private config: Config) {}

  setConfig(config: Config) {
    this.config = config;
    this.rendered = '';
  }

  beginDrag() {
    this.pressing = true;
    this.dragDistance = 0;
    this.dragAction = null;
  }

  drag(dx: number) {
    if (!dx || !this.pressing) return;
    const next = dx < 0 ? 'left' : 'right';
    if (this.dragAction !== next) this.dragDistance = 0;
    this.dragAction = next;
    this.dragDistance += Math.abs(dx);
  }

  release(now = performance.now()) {
    this.pressing = false;
    this.dragAction = null;
    this.lastKey = -Infinity;
    this.idleSince = now;
  }

  key(now = performance.now()) {
    if (this.pressing) return;
    this.typingFrame = now - this.lastKey > 520 ? 0 : (this.typingFrame + 1) % 4;
    this.lastKey = now;
  }

  tick(now = performance.now()) {
    let action: Action = 'sit';
    let frame: number;
    if (this.pressing) {
      action = this.dragAction ?? 'sit';
      frame = this.dragAction ? Math.floor(this.dragDistance / 10) % 6 : 0;
    } else if (now - this.lastKey <= 520) {
      action = 'typing';
      // Each key press advances the contact or rebound pose.
      frame = this.typingFrame;
    } else {
      frame = Math.floor(Math.max(0, now - this.idleSince) / 90) % 80;
    }
    const pose = `${action}/${frame}`;
    if (pose !== this.rendered) {
      render(this.canvas, this.config, action, frame);
      this.rendered = pose;
    }
  }
}

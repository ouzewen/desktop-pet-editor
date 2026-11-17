import { frameCount, render, type Action, type CatEdge, type Gaze, type TypingMode } from './render';
import { usesOrangeCatArt, type PetConfig } from './cat';
import type { CatCustomization } from './cat-custom';
import { CatJellyMotion } from './cat-jelly';
import { catTypingFrameCount, catTypingFrameDuration, currentTypingAnimation, frenzyHeatFrameAt } from './cat-typing';

const catTypingTimeout = 1001;

/** Drive the same sprite with editor previews or native pointer/keyboard events. */
export class Motion {
  private dragAction: 'left' | 'right' | null = null;
  private dragDistance = 0;
  private pressing = false;
  private lastKey = -Infinity;
  private typingFrame = 0;
  private typingMode: TypingMode = 'gentle';
  private frenzyStarted = 0;
  private typingFrameTick = 0;
  private typingPhase = 0;
  private recentKeys: number[] = [];
  private stretch = 0;
  private stretchTarget = 0;
  private releaseStretch = 0;
  private settledAt = -Infinity;
  private jelly = new CatJellyMotion();
  private idleSince = performance.now();
  private rendered = '';
  private gaze: Gaze = { x: 0, y: 0 };
  private custom?: CatCustomization;
  private edge: CatEdge | null = null;

  constructor(private canvas: HTMLCanvasElement, private config: PetConfig) {}

  setConfig(config: PetConfig) {
    this.config = config;
    this.jelly.reset();
    this.rendered = '';
    this.lastKey = -Infinity;
    this.recentKeys = [];
    this.typingMode = 'gentle';
  }

  setCustom(custom: CatCustomization | undefined) {
    this.custom = custom;
    this.setConfig(this.config);
  }

  setGaze(gaze: Gaze) {
    if (this.gaze.x === gaze.x && this.gaze.y === gaze.y && this.gaze.space === gaze.space) return;
    this.gaze = gaze;
    this.rendered = '';
  }

  setEdge(edge: CatEdge | null) {
    this.edge = edge;
    this.rendered = '';
    this.stretch = this.stretchTarget = this.releaseStretch = 0;
    if (edge) this.jelly.reset();
  }

  beginDrag(now = performance.now()) {
    this.pressing = true;
    if (usesOrangeCatArt(this.config)) this.jelly.begin(now);
    this.stretchTarget = 0;
    this.dragDistance = 0;
    this.dragAction = null;
  }

  drag(dx: number, elapsed = 16, now = performance.now()) {
    if (!this.pressing) return;
    if (usesOrangeCatArt(this.config)) {
      this.jelly.drag(dx, elapsed, now);
      return;
    }
    if (!dx) return;
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
    this.jelly.release(now);
    this.releaseStretch = this.stretch;
    this.settledAt = now;
    this.recentKeys = [];
    this.typingMode = 'gentle';
    this.dragAction = null;
    this.lastKey = -Infinity;
    this.idleSince = now;
  }

  key(now = performance.now()) {
    if (this.pressing || this.edge) return;
    const config = this.config;
    if (config.frame === 'CAT') {
      if (now - this.lastKey >= catTypingTimeout) {
        this.typingFrameTick = now;
        this.typingPhase = 0;
        this.typingMode = 'gentle';
        this.recentKeys = [];
      } else {
        // Finish the elapsed motion before this key changes the typing speed.
        this.advanceCatTyping(now);
      }
      this.recentKeys = this.recentKeys.filter(time => now - time < 1000);
      this.recentKeys.push(now);
      this.selectTypingMode(now);
    } else {
      this.typingFrame = now - this.lastKey > 520 ? 0 : (this.typingFrame + 1) % 4;
    }
    this.lastKey = now;
  }

  private selectTypingMode(now: number) {
    const rate = this.recentKeys.length;
    const previous = this.typingMode;
    // Separate entry and exit thresholds keep nearby typing rates from
    // flickering between the open-eyed and effort expressions.
    if (rate <= 2) this.typingMode = 'gentle';
    else if (rate >= 9) this.typingMode = 'frenzy';
    else if (this.typingMode === 'frenzy') {
      if (rate <= 6) this.typingMode = 'fast';
    } else if (rate >= 5) this.typingMode = 'fast';
    if (previous !== 'frenzy' && this.typingMode === 'frenzy') this.frenzyStarted = now;
  }

  private advanceCatTyping(now: number) {
    // Advance the phase at its previous speed before selecting the next
    // speed. Key events and frame ticks can change tempo without resetting
    // the paw positions or applying a new rate to time already elapsed.
    const interval = catTypingFrameDuration(this.typingMode);
    this.typingPhase = (this.typingPhase + Math.max(0, now - this.typingFrameTick) / interval) % catTypingFrameCount;
    this.typingFrameTick = now;
    this.recentKeys = this.recentKeys.filter(time => now - time < 1000);
    this.selectTypingMode(now);
    return Math.floor(this.typingPhase);
  }

  tick(now = performance.now()) {
    let action: Action = 'sit';
    let frame: number;
    const config = this.config;
    const cat = config.frame === 'CAT';
    const edge = cat ? this.edge ?? undefined : undefined;
    const jellyCat = usesOrangeCatArt(config);
    const jelly = !edge && jellyCat ? this.jelly.pose(now) : undefined;
    if (edge) {
      const idle = Math.floor(Math.max(0, now - this.idleSince) / 90) % 80;
      frame = idle >= 25 && idle <= 26 ? 25 : 0;
    } else if (this.pressing && cat) {
      frame = 0;
      if (!jellyCat) {
        this.stretch += (this.stretchTarget - this.stretch) * 0.36;
        this.stretchTarget *= 0.86;
      }
    } else if (this.pressing) {
      action = this.dragAction ?? 'sit';
      frame = this.dragAction ? Math.floor(this.dragDistance / 10) % frameCount(config, action) : 0;
    } else if (now - this.lastKey < (cat ? catTypingTimeout : 521)) {
      action = 'typing';
      if (cat) {
        frame = this.advanceCatTyping(now);
      } else {
        frame = this.typingFrame;
      }
    } else if (jelly) {
      frame = 0;
    } else {
      frame = Math.floor(Math.max(0, now - this.idleSince) / 90) % 80;
    }
    if (cat && !this.pressing) {
      const elapsed = now - this.settledAt;
      this.stretch = elapsed < 600
        ? this.releaseStretch * Math.cos(elapsed / 53) * Math.exp(-elapsed / 150) : 0;
    }
    const stretch = cat && !jellyCat && action === 'sit' ? Math.round(this.stretch * 32) / 32 : 0;
    const frenzyHeatFrame = cat && action === 'typing' && this.typingMode === 'frenzy'
      ? frenzyHeatFrameAt(now - this.frenzyStarted) : undefined;
    const pose = `${action}/${frame}/${this.typingMode}/${stretch}/${frenzyHeatFrame}/${edge}/${jelly?.head}/${jelly?.body}/${jelly?.tail}`;
    if (pose !== this.rendered) {
      render(this.canvas, config, action, frame, this.gaze, {
        typingMode: this.typingMode, typingAnimation: currentTypingAnimation, frenzyHeatFrame, stretch, edge, jelly, custom: this.custom,
      });
      this.rendered = pose;
    }
  }
}

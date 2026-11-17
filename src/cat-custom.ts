import { catPresets, readPetConfig, type CatConfig, type PetConfig } from './cat';
import { catTypingFrameCountFor, currentTypingAnimation, type TypingAnimation } from './cat-typing';
import { captureCatInk, readCatInk, type CatInkChange, type CatInkDocument } from './cat-ink';
import { alignTypingLayer, catGlintAperture, catHeadPlacement, catInkGeometry, catTypingLaptop, drawCatHead, frameCount, hasLegacyNoseOutline, horizontalGazeRange, makeLayer, pointerGazeLimit, render, type Gaze, type LaptopVersion, type OutlineVersion, type TypingLayout, type TypingMode } from './render';

const size = 320;
const straight: Gaze = { x: 0, y: 0 };

export type CatEditSource = {
  config: CatConfig;
  action: 'sit' | 'typing';
  frame: number;
  typingMode: TypingMode;
  typingAnimation: TypingAnimation;
  laptopVersion: LaptopVersion;
  outlineVersion: OutlineVersion;
  typingLayout: TypingLayout;
  earLayout: 'shared' | 'legacy';
  markingLayout: 'shared' | 'legacy';
  legacyNoseOutline: boolean;
  gaze: Gaze;
};

export type CatPixelEdits = { paint: HTMLCanvasElement; mask: HTMLCanvasElement };
export type CatInkSource = CatEditSource & { pixelEdits: CatInkDocument };
type CatHeadEdits = { full?: CatPixelEdits; idleHead?: CatPixelEdits; typingHead?: CatPixelEdits };

export type CatCustomization = {
  source: CatEditSource;
  ink?: CatInkDocument;
  scratch: ReturnType<typeof makeLayer>;
  laptop?: CatPixelEdits;
  idleTorso?: CatPixelEdits;
  typingTorso?: CatPixelEdits;
  fixedGlints: readonly [boolean, boolean];
  paint: CatHeadEdits;
  following?: CatHeadEdits;
};

function readSource(value: unknown): CatEditSource | undefined {
  if (!value || typeof value !== 'object') return;
  const record = value as Partial<CatEditSource>;
  try {
    const config = readPetConfig(record.config);
    const { action, frame, typingMode, gaze } = record;
    const typingAnimation = record.typingAnimation ?? (action === 'typing' ? 'legacy' : 'shared');
    const referenceAnimation = typingAnimation === 'reference' || typingAnimation === 'reference-v2';
    const typingLayout = record.typingLayout ?? (action === 'typing' && !referenceAnimation ? 'legacy' : 'aligned');
    // Even the first reference-animation saves used the original laptop.
    const laptopVersion = record.laptopVersion ?? 'original';
    // Older saved images have the fixed source ink, even when their fur was recolored.
    const outlineVersion = record.outlineVersion ?? 'original';
    const earLayout = record.earLayout ?? 'legacy';
    const markingLayout = record.markingLayout ?? 'legacy';
    if (config.frame !== 'CAT' || (action !== 'sit' && action !== 'typing')
      || frame === undefined || !Number.isInteger(frame) || frame < 0
      || frame >= (action === 'typing' ? catTypingFrameCountFor(typingAnimation) : frameCount(config, action))
      || (typingMode !== 'gentle' && typingMode !== 'fast' && typingMode !== 'frenzy') || !gaze
      || (typingLayout !== 'aligned' && typingLayout !== 'legacy')
      || (laptopVersion !== 'clean' && laptopVersion !== 'original')
      || (outlineVersion !== 'adaptive' && outlineVersion !== 'original')
      || (laptopVersion === 'clean' && typingLayout === 'legacy')
      || (!referenceAnimation && typingAnimation !== 'shared' && typingAnimation !== 'legacy')
      || (typingMode === 'frenzy' && !referenceAnimation)
      || (action === 'typing' && referenceAnimation && typingLayout !== 'aligned')
      || (earLayout !== 'shared' && earLayout !== 'legacy')
      || (markingLayout !== 'shared' && markingLayout !== 'legacy')
      || !Number.isInteger(gaze.x) || !Number.isInteger(gaze.y)) return;
    if (gaze.space === 'pointer') {
      if (Math.abs(gaze.x) > pointerGazeLimit || Math.abs(gaze.y) > pointerGazeLimit) return;
    } else if (gaze.space !== undefined || gaze.x < horizontalGazeRange.min || gaze.x > horizontalGazeRange.max
      || Math.abs(gaze.y) > 2) return;
    // Saves from before the nose cleanup have no flag and used the outlined art.
    const legacyNoseOutline = hasLegacyNoseOutline(config) && record.legacyNoseOutline !== false;
    return { config, action, frame, typingMode, typingAnimation, laptopVersion, outlineVersion, typingLayout,
      earLayout, markingLayout, legacyNoseOutline, gaze };
  } catch {
    return;
  }
}

function pixels(ctx: CanvasRenderingContext2D) {
  return new Uint32Array(ctx.getImageData(0, 0, size, size).data.buffer);
}

export function prepareStructuredCatCustomization(reference: unknown): CatCustomization | undefined {
  if (!reference || typeof reference !== 'object' || !Object.hasOwn(reference, 'pixelEdits')) return;
  const record = reference as Partial<CatInkSource>;
  const ink = readCatInk(record.pixelEdits);
  const config = readPetConfig(record.config);
  if (config.frame !== 'CAT') throw Error('自定义笔迹须关联猫咪外观');
  // Pose metadata is only context for the editor. Old poses are not needed
  // to play any per-part ink, even if one is no longer supported.
  const source = readSource(reference) ?? {
    config, action: 'sit', frame: 0, gaze: straight, typingMode: 'gentle',
    typingAnimation: currentTypingAnimation, typingLayout: 'aligned', laptopVersion: 'clean',
    outlineVersion: 'adaptive', earLayout: 'shared', markingLayout: 'shared', legacyNoseOutline: false,
  };
  return { source, ink, scratch: makeLayer(size), fixedGlints: [false, false], paint: {} };
}

export function saveCatInk(reference: unknown, changes: CatInkChange[]): CatInkSource {
  const source = readSource(reference);
  if (!source || !Array.isArray(changes)) throw Error('像素编辑预览无效，请重新打开编辑器');
  const previous = (reference as Partial<CatInkSource>).pixelEdits;
  const typing = source.action === 'typing';
  const geometry = catInkGeometry(source.config, typing, source.frame, source);
  const offsetY = typing ? 0 : catHeadPlacement(false, source.frame).y;
  const pixelEdits = captureCatInk(geometry, changes, previous === undefined ? undefined : readCatInk(previous), offsetY);
  return { ...source, pixelEdits };
}

function isPale(pixel: number) {
  return (pixel >>> 24) === 255 && Math.min(pixel & 255, (pixel >>> 8) & 255, (pixel >>> 16) & 255) >= 220;
}

function savedGlints(edited: Uint32Array, original: Uint32Array, aperture: Uint32Array | undefined) {
  const fixed: [boolean, boolean] = [false, false];
  const inside: [number[], number[]] = [[], []];
  if (aperture) {
    // Flattened saves may contain a larger or displaced glint over the stock pupil.
    for (let index = 0; index < edited.length; index++) {
      if (!aperture[index] || !isPale(edited[index]!)) continue;
      const eye = index % size < size / 2 ? 0 : 1;
      inside[eye].push(index);
      if (edited[index] !== original[index]) fixed[eye] = true;
    }
  }
  const hide = new Set(inside.flatMap((indices, eye) => fixed[eye] ? indices : []));
  return { fixed, hide };
}

function drawSource(layer: ReturnType<typeof makeLayer>, source: CatEditSource) {
  render(layer.canvas, source.config, source.action, source.frame, source.gaze, {
    typingMode: source.typingMode, typingAnimation: source.typingAnimation, typingLayout: source.typingLayout,
    laptopVersion: source.laptopVersion, outlineVersion: source.outlineVersion,
    earLayout: source.earLayout, markingLayout: source.markingLayout,
    legacyNoseOutline: source.legacyNoseOutline,
  });
  return pixels(layer.ctx);
}

function argb(pixel: number) {
  return ((pixel & 0xff00ff00) | ((pixel & 255) << 16) | ((pixel >>> 16) & 255)) >>> 0;
}

// Only legacy overlays need a one-time conversion, when actually re-edited.
// Compare against this exact live frame so the stock art never enters the edits.
export function seedCatInkForEditor(
  preview: HTMLCanvasElement, source: CatEditSource, custom: CatCustomization,
): CatInkDocument {
  if (custom.ink) return custom.ink;
  const edited = pixels(preview.getContext('2d')!);
  const clean = drawSource(makeLayer(size), source);
  const changes: CatInkChange[] = [];
  for (let i = 0; i < edited.length; i++) {
    if (edited[i] !== clean[i]) changes.push([i, argb(edited[i]!)]);
  }
  const { pixelEdits } = saveCatInk(source, changes);
  // The computer is absent in idle, but old computer strokes must survive
  // opening the idle preview and saving another edit.
  if (source.action === 'sit' && custom.laptop) {
    const coverage = pixels(custom.laptop.mask.getContext('2d')!);
    const color = pixels(custom.laptop.paint.getContext('2d')!);
    const laptopChanges: CatInkChange[] = [];
    for (let i = 0; i < coverage.length; i++) {
      if (coverage[i]) laptopChanges.push([i, argb(color[i]!)]);
    }
    const laptop = captureCatInk(catInkGeometry(source.config, true, 0), laptopChanges).parts.laptop;
    if (laptop) pixelEdits.parts.laptop = laptop;
  }
  return pixelEdits;
}

function inferSource(edited: Uint32Array, layer: ReturnType<typeof makeLayer>, fallback: PetConfig) {
  // Older saves are just PNGs. Match their closest built-in coat and pose once
  // when selected, while keeping the saved image bytes intact.
  const choices = Object.values(catPresets);
  const configs: CatConfig[] = [];
  const seen = new Set<string>();
  for (const config of fallback.frame === 'CAT' ? [fallback, ...choices] : choices) {
    // Names do not affect the drawing; do not repeat a preset search when
    // the selected configuration already has that exact appearance.
    const key = JSON.stringify(Object.entries(config).filter(([field]) => field !== 'name')
      .sort(([left], [right]) => left.localeCompare(right)));
    if (!seen.has(key)) { seen.add(key); configs.push(config); }
  }
  let source: CatEditSource = {
    config: configs[0]!, action: 'sit', frame: 0, typingMode: 'gentle', typingLayout: 'aligned',
    typingAnimation: 'reference-v2', laptopVersion: 'clean', outlineVersion: 'adaptive',
    earLayout: 'shared', markingLayout: 'shared', legacyNoseOutline: false, gaze: straight,
  };
  const idlePoses = [0, 17].map(frame =>
    ({ frame, typingMode: 'gentle', typingLayout: 'aligned', typingAnimation: 'reference-v2' } as const));
  const oldTypingPoses = [
    ...(['aligned', 'legacy'] as const).flatMap(typingLayout =>
      (['gentle', 'fast'] as const).flatMap(typingMode => [0, 1, 2, 3].map(frame =>
        ({ frame, typingMode, typingLayout, typingAnimation: 'legacy' } as const)))),
    ...(['gentle', 'fast'] as const).flatMap(typingMode =>
      Array.from({ length: catTypingFrameCountFor('shared') }, (_, frame) =>
        ({ frame, typingMode, typingLayout: 'aligned', typingAnimation: 'shared' } as const))),
  ];
  // Keep every saved animation's own frame count. Old reference PNGs still
  // need their original twelve poses, rather than wrapping through v2's 32.
  const referenceTypingPoses = (['reference-v2', 'reference'] as const).flatMap(typingAnimation =>
    (['gentle', 'fast', 'frenzy'] as const).flatMap(typingMode =>
      Array.from({ length: catTypingFrameCountFor(typingAnimation) }, (_, frame) =>
        ({ frame, typingMode, typingLayout: 'aligned', typingAnimation } as const))));
  const currentTypingPoses = [...referenceTypingPoses, ...oldTypingPoses];
  let best = Infinity;
  for (const config of configs) {
    // Native coats retain their original pixels in either version.
    const outlineVersions: readonly OutlineVersion[] = config.coat === 'native' ? ['adaptive'] : ['adaptive', 'original'];
    for (const action of ['sit', 'typing'] as const) {
      const markingLayouts = ['P03', 'P04', 'P05'].includes(config.pattern)
        ? ['shared'] as const : ['shared', 'legacy'] as const;
      for (const markingLayout of markingLayouts) {
        // New references only existed after independent forehead/fur layers.
        // Idle has no animation difference, so try each idle pose just once.
        const poses = action === 'sit' ? idlePoses
          : markingLayout === 'shared' ? currentTypingPoses : oldTypingPoses;
        for (const pose of poses) {
          const versions: readonly LaptopVersion[] = action === 'sit' ? ['clean']
            : pose.typingAnimation === 'reference-v2' ? ['clean']
              : pose.typingAnimation === 'reference' ? ['clean', 'original'] : ['original'];
          for (const laptopVersion of versions) {
            for (const outlineVersion of outlineVersions) {
              const candidate = { config, action, gaze: straight, earLayout: 'shared', markingLayout,
                laptopVersion, outlineVersion, legacyNoseOutline: false, ...pose } as const;
              const reference = drawSource(layer, candidate);
              let difference = 0;
              for (let index = 0; index < edited.length; index += 5) {
                if (reference[index] !== edited[index]) difference++;
              }
              if (difference < best) {
                best = difference;
                source = candidate;
                if (difference === 0) return source;
              }
            }
          }
        }
      }
    }
  }
  if (hasLegacyNoseOutline(source.config)) {
    // Once the pose is identified, use the closer of the two nose versions
    // for PNGs without source metadata.
    const outlined = { ...source, legacyNoseOutline: true };
    const current = drawSource(layer, source);
    const original = drawSource(layer, outlined);
    let outlineMatches = 0, borderlessMatches = 0;
    for (let i = 0; i < edited.length; i++) {
      if (current[i] === original[i]) continue;
      if (edited[i] === original[i]) outlineMatches++;
      if (edited[i] === current[i]) borderlessMatches++;
    }
    if (outlineMatches > borderlessMatches) return outlined;
  }
  return source;
}

type Placement = ReturnType<typeof catHeadPlacement>;

function editsFor(indices: number[], edited: Uint32Array, projection?: { from: Placement; to: Placement }): CatPixelEdits | undefined {
  if (!indices.length) return;
  const paint = makeLayer(size);
  const mask = makeLayer(size);
  const paintData = paint.ctx.createImageData(size, size);
  const maskData = mask.ctx.createImageData(size, size);
  const colors = new Uint32Array(paintData.data.buffer);
  const opaque = new Uint32Array(maskData.data.buffer);
  // An opaque mask also removes pixels intentionally erased in the editor.
  if (projection) {
    // Resolve the frame transform to whole pixels before compositing the mask.
    const { from, to } = projection;
    const scale = from.scale / to.scale;
    const selected = new Uint8Array(edited.length);
    for (const index of indices) selected[index] = 1;
    for (let y = 0; y < size; y++) {
      const sourceY = Math.floor((y + 0.5 - to.y) * scale + from.y);
      if (sourceY < 0 || sourceY >= size) continue;
      for (let x = 0; x < size; x++) {
        const sourceX = Math.floor((x + 0.5 - to.x) * scale + from.x);
        if (sourceX < 0 || sourceX >= size) continue;
        const fromIndex = sourceY * size + sourceX;
        if (!selected[fromIndex]) continue;
        const toIndex = y * size + x;
        opaque[toIndex] = 0xffffffff;
        colors[toIndex] = edited[fromIndex]!;
      }
    }
  } else {
    for (const index of indices) {
      opaque[index] = 0xffffffff;
      colors[index] = edited[index]!;
    }
  }
  paint.ctx.putImageData(paintData, 0, 0);
  mask.ctx.putImageData(maskData, 0, 0);
  return { paint: paint.canvas, mask: mask.canvas };
}

export function prepareCatCustomization(image: CanvasImageSource, reference: unknown, fallback: PetConfig): CatCustomization {
  const layer = makeLayer(size);
  layer.ctx.drawImage(image, 0, 0, size, size);
  const edited = pixels(layer.ctx);
  const source = readSource(reference) ?? inferSource(edited, layer, fallback);
  const original = drawSource(layer, source);
  layer.ctx.resetTransform();
  layer.ctx.clearRect(0, 0, size, size);
  const typing = source.action === 'typing';
  const placement = catHeadPlacement(typing, source.frame, source.typingLayout);
  layer.ctx.translate(placement.x, placement.y);
  layer.ctx.scale(placement.scale, placement.scale);
  drawCatHead(layer.ctx, source.config, typing, source.frame, source.gaze,
    { scale: placement.scale, earLayout: source.earLayout, markingLayout: source.markingLayout,
      outlineVersion: source.outlineVersion, legacyNoseOutline: source.legacyNoseOutline,
      typingMode: source.typingMode, typingAnimation: source.typingAnimation });
  const headPixels = pixels(layer.ctx);
  const aperture = catGlintAperture(source.config, typing, source.frame, {
    typingMode: source.typingMode, typingAnimation: source.typingAnimation,
  });
  if (aperture) {
    layer.ctx.resetTransform();
    layer.ctx.clearRect(0, 0, size, size);
    layer.ctx.translate(placement.x, placement.y);
    layer.ctx.scale(placement.scale, placement.scale);
    layer.ctx.drawImage(aperture, 0, 0);
  }
  const reflections = savedGlints(edited, original, aperture && pixels(layer.ctx));
  let laptopPixels: Uint32Array | undefined;
  if (typing) {
    layer.ctx.resetTransform();
    layer.ctx.clearRect(0, 0, size, size);
    // The original orange prop stored a small tail-root connector alongside
    // the computer. Its edits belong to fur: a laptop-only erasure cannot
    // remove that connector now that it is rendered on the body underneath.
    const laptopConfig = source.laptopVersion === 'original'
      && source.config.palette === 'CC01' && source.config.tail === 'CT01'
      ? { ...source.config, tail: 'CT02' as const } : source.config;
    layer.ctx.drawImage(catTypingLaptop(laptopConfig, source.typingLayout, source.laptopVersion), 0, 0);
    laptopPixels = pixels(layer.ctx);
  }
  let lastHeadPixel = headPixels.length - 1;
  while (lastHeadPixel >= 0 && headPixels[lastHeadPixel] === 0) lastHeadPixel--;
  const headBottom = Math.floor(lastHeadPixel / size);
  const full: number[] = [];
  const head: number[] = [];
  const torso: number[] = [];
  const laptop: number[] = [];
  for (let index = 0; index < edited.length; index++) {
    const before = original[index];
    if (before === edited[index] && !reflections.hide.has(index)) continue;
    full.push(index);
    if (laptopPixels?.[index]) {
      laptop.push(index);
      continue;
    }
    const onHead = headPixels[index] !== 0 && headPixels[index] === before;
    const aboveNeck = before === 0 && Math.floor(index / size) <= headBottom;
    (onHead || aboveNeck ? head : torso).push(index);
  }

  const projection = { from: placement, to: catHeadPlacement(!typing, 0) };
  const transferredTorso = editsFor(torso, edited, projection);
  const alignLegacyPaint = (indices: number[]) => {
    const edits = editsFor(indices, edited);
    if (!edits || !typing || source.typingLayout !== 'legacy') return edits;
    return { paint: alignTypingLayer(edits.paint), mask: alignTypingLayer(edits.mask) };
  };
  function headEdits(all: number[], onHead: number[]): CatHeadEdits {
    return {
      full: alignLegacyPaint(all),
      idleHead: typing ? editsFor(onHead, edited, projection) : undefined,
      typingHead: typing ? alignLegacyPaint(onHead) : editsFor(onHead, edited, projection),
    };
  }
  const keepWhenFollowing = (index: number) => !reflections.hide.has(index);
  return {
    source,
    scratch: layer,
    laptop: alignLegacyPaint(laptop),
    idleTorso: typing ? transferredTorso : undefined,
    typingTorso: typing ? alignLegacyPaint(torso) : transferredTorso,
    fixedGlints: reflections.fixed,
    paint: headEdits(full, head),
    following: reflections.hide.size ? headEdits(full.filter(keepWhenFollowing), head.filter(keepWhenFollowing)) : undefined,
  };
}

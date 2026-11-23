const size = 80;
const scale = 4;
const center = 38;

type PaintCell = (x: number, y: number, rgba: Uint8ClampedArray) => void;
type RestingMasks = { body: ImageData; legs: ImageData; legFur: ImageData };

function cell(data: ImageData, x: number, y: number) {
  const i = (y * size + x) * 4;
  return data.data.subarray(i, i + 4);
}

function isInk(color: Uint8ClampedArray, ink: ArrayLike<number>, tolerance: number) {
  return color[3] === 255
    && Math.abs(color[0]! - ink[0]!) <= tolerance
    && Math.abs(color[1]! - ink[1]!) <= tolerance
    && Math.abs(color[2]! - ink[2]!) <= tolerance;
}

// The donor directions are authored in the 80px guide: R and G are signed
// offsets around 128. Keep the donor on the same side of the coat.
function restoreFur(source: ImageData, guide: ImageData, x: number, y: number, paint: PaintCell) {
  const [r, g] = cell(guide, x, y);
  const nx = x + r! - 128, ny = y + g! - 128;
  if (nx < 0 || nx >= size || ny < 0 || ny >= size) return;
  const fur = cell(source, nx, ny);
  if (fur[3] === 255) paint(x, y, fur);
}

export function paintRestingOutline(source: ImageData, masks: RestingMasks, fittedBody: boolean, warmInk: ArrayLike<number> | undefined, paint: PaintCell) {
  // Existing layers supply the coat-specific ink. Inner and outer leg inks
  // can differ when the foreleg crosses from a coloured patch into a sock.
  const leftInner = cell(source, 35, 58);
  // Some legacy white chests cover the right inner stroke at this anchor.
  const rightInner = [cell(source, 40, 58), cell(source, 40, 57), cell(source, 39, 65)]
    .find(color => isInk(color, leftInner, 13)) ?? leftInner;
  const inkAt = (x: number) => x <= 30 ? cell(source, 26, 62) : x < center ? leftInner
    : x <= 45 ? rightInner : cell(source, 49, 62);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const old = cell(source, x, y);
      if (old[3] !== 255) continue;
      const onStroke = cell(masks.legs, x, y)[3];
      const former = cell(masks.legFur, x, y)[3];
      if (!onStroke && !former) continue;
      const ink = inkAt(x);
      if (ink[3] !== 255) continue;
      const tolerance = x === 51 ? 2 : warmInk || ink[0]! < 24 ? 10 : 13;
      const inner = x > 30 && x <= 45;
      const matches = isInk(old, ink, tolerance) || (inner && isInk(old, leftInner, tolerance))
        || Boolean(warmInk && (isInk(old, warmInk, 4) || isInk(old, [58, 30, 19], 8)));
      if (onStroke && !matches) paint(x, y, ink);
      if (!onStroke && matches) restoreFur(source, masks.legFur, x, y, paint);
    }
  }
  if (!fittedBody) return;
  fitBodyContour(source, masks.body, paint);
}

function fitBodyContour(source: ImageData, mask: ImageData, paint: PaintCell) {
  const clear = new Uint8ClampedArray(4);
  for (let y = 0; y < size; y++) {
    for (const [first, end, step] of [[0, center, 1], [size - 1, center - 1, -1]] as const) {
      let outline = first;
      while (outline !== end && !cell(mask, outline, y)[3]) outline += step;
      if (outline === end) continue;
      let old = first;
      while (old !== end && !cell(source, old, y)[3]) old += step;
      // This body has already had its baked tail removed. Retain its actual
      // edge ink, even when the shared art moves the boundary by a pixel.
      if (old === outline || old === end || Math.abs(old - outline) > 2) continue;
      const ink = cell(source, old, y);
      if ((outline - old) * step > 0) {
        for (let x = old; x !== outline; x += step) paint(x, y, clear);
      } else {
        const fur = cell(source, old + step, y);
        for (let x = outline + step; x !== old + step; x += step) paint(x, y, fur);
      }
      paint(outline, y, ink);
    }
  }
}

export function paintGoldenCheekSeam(source: ImageData, guide: ImageData, ink: ArrayLike<number>, paint: PaintCell) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (cell(guide, x, y)[3] && isInk(cell(source, x, y), ink, 0)) restoreFur(source, guide, x, y, paint);
    }
  }
}

// In the front grid the rear-paw line already follows the outer diagonal.
// These two legacy ink cells are one step inside that line.
export function paintRearPawSpurs(source: ImageData, paint: PaintCell) {
  let painted = false;
  for (const [x, inner, edge] of [[18, 17, 16], [57, 58, 59]] as const) {
    const old = cell(source, x, 66);
    const reference = cell(source, edge, 66);
    const local = cell(source, inner, 66);
    const light = (rgba: Uint8ClampedArray) => rgba[0]! + rgba[1]! + rgba[2]!;
    if (reference[3] !== 255 || !isInk(old, reference, 24)
      || local[3] !== 255 || light(local) - light(old) < 18) continue;
    const above = cell(source, x, 65);
    const donor = above[3] === 255 && light(above) - light(old) >= 18 ? above : local;
    paint(x, 66, donor);
    painted = true;
  }
  return painted;
}

/** Fill on the runtime canvas at 4×. Leave every unedited source pixel intact. */
export function restingOutlinePainter(ctx: CanvasRenderingContext2D): PaintCell {
  return (x, y, rgba) => {
    ctx.clearRect(x * scale, y * scale, scale, scale);
    if (!rgba[3]) return;
    ctx.fillStyle = `rgb(${rgba[0]}, ${rgba[1]}, ${rgba[2]})`;
    ctx.fillRect(x * scale, y * scale, scale, scale);
  };
}

/** The shared guide selects interior ink directly above the visible sole. */
export function paintFrontPawSoles(source: ImageData, guide: ImageData, paint: PaintCell) {
  const light = (c: Uint8ClampedArray) => c[0]! + c[1]! + c[2]!;
  const distance = (a: Uint8ClampedArray, b: Uint8ClampedArray) =>
    Math.abs(a[0]! - b[0]!) + Math.abs(a[1]! - b[1]!) + Math.abs(a[2]! - b[2]!);
  let changed = false;
  for (let y = 1; y < size - 2; y++) {
    for (let x = 1; x < size - 1; x++) {
      const marker = cell(guide, x, y);
      if (!marker[3]) continue;
      const sx = x + marker[0]! - 128, sy = y + marker[1]! - 128;
      if (sx < 0 || sx >= size || sy < 0 || sy >= size) continue;
      const ink = cell(source, x, y), edge = cell(source, x, y + 1), fur = cell(source, sx, sy);
      // A gap and an opaque lower edge identify the stationary sole. Keep
      // silhouette corners, existing toe fur and unrelated inner shades.
      if (ink[3] !== 255 || fur[3] !== 255 || edge[3] !== 255 || cell(source, x, y + 2)[3]
        || cell(source, x - 1, y)[3] !== 255 || cell(source, x + 1, y)[3] !== 255
        || light(fur) <= light(ink) || distance(ink, edge) > distance(ink, fur) + 24) continue;
      paint(x, y, fur);
      changed = true;
    }
  }
  return changed;
}

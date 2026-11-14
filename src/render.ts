import { anchors, colors, palettes, type Config } from './model';

export const SIZE = 160;
export const actions = { sit: 1, left: 6, right: 6, typing: 4 } as const;
export type Action = keyof typeof actions;
type Context = CanvasRenderingContext2D;
type Point = readonly [number, number];

function path(ctx: Context, points: number[], fill: string, border = false) {
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (border) {
    ctx.lineWidth = 2;
    ctx.lineJoin = 'miter';
    ctx.strokeStyle = colors.outline;
    ctx.stroke();
  }
}

function rect(ctx: Context, x: number, y: number, w: number, h: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

const spots = [[-17, -19], [17, -15], [-21, -2], [11, 4], [23, 15], [-14, 21]];
const paletteTerms = (config: Config) => {
  const [main, shade, light, white, nose] = palettes[config.palette];
  return { main, shade, light, white, nose, whiteShade: colors.whiteShade };
};

function eye(ctx: Context, config: Config, x: number, y: number) {
  const { eye: ink, glint } = colors;
  if (config.eye === 'Y02' || config.eye === 'Y03') {
    rect(ctx, x - 5, y, 10, 2, ink);
    const offset = config.eye === 'Y02' ? 2 : -1;
    rect(ctx, x - 6, y + offset, 2, 2, ink);
    rect(ctx, x + 4, y + offset, 2, 2, ink);
    return;
  }
  const wide = config.eye === 'Y04';
  path(ctx, [-4,-5, 3,-5, 5,-3, 5,3, 3,5, -4,5, -6,3, -6,-3].map((n,i) => n + (i % 2 ? y : x)), ink);
  rect(ctx, x - 3, y - 4, wide ? 5 : 3, wide ? 4 : 2, glint);
  if (wide) rect(ctx, x + 2, y + 2, 2, 2, glint);
}

function tail(ctx: Context, config: Config, at: Point, side: boolean, sway: number) {
  const { main, shade, light, white } = paletteTerms(config);
  ctx.save();
  ctx.translate(...at);
  const sign = side ? 1 : -1;
  ctx.scale(sign, 1);
  if (config.tail === 'T01') {
    path(ctx, [-5,6, 7,3, 16,-5, 18,-17+sway, 24,-22+sway, 32,-20+sway, 37,-14+sway, 36,-5+sway, 29,1, 22,1, 18,-3, 22,-8+sway, 28,-6+sway, 29,-13+sway, 25,-14+sway, 23,-8, 23,2, 16,10, 4,14], main, true);
    path(ctx, [4,10, 16,5, 21,-1, 23,2, 15,10, 4,13], shade);
  } else {
    const reach = side ? 35 : 48;
    path(ctx, [-4,5, 11,2, 20,-4, reach-8,-12+sway, reach,-18+sway, reach+5,-15+sway, reach+3,-6+sway, reach-5,2+sway, 20,13, 5,17], main, true);
    path(ctx, [9,12, 20,9, reach-6,-1+sway, reach+2,-7+sway, reach-5,2+sway, 20,13, 5,17], shade);
    if (config.pattern === 'P03' && config.palette === 'C03') {
      path(ctx, [reach-7,-12+sway, reach,-17+sway, reach+4,-14+sway, reach+2,-7+sway, reach-4,-1+sway], white);
    } else {
      rect(ctx, reach-5, -12+sway, 4, 3, light);
    }
  }
  ctx.restore();
}

function ears(ctx: Context, config: Config, side: boolean) {
  const { main, shade, light } = paletteTerms(config);
  for (const sign of side ? [1] : [1,-1]) {
    ctx.save();
    ctx.scale(sign, 1);
    const floppy = config.ear === 'E03' || config.ear === 'E04';
    if (floppy) {
      const tip = config.ear === 'E04' ? 23 : 14;
      path(ctx, [10,-31, 21,-34, 28,-29, 33,-18, 34,tip-4, 29,tip, 22,tip, 18,tip-6, 18,-3, 12,-14], config.palette === 'C03' ? light : main, true);
      path(ctx, [29,-24, 33,-15, 33,tip-5, 28,tip-1, 25,tip-1, 28,tip-7, 28,-10], shade);
    } else {
      const folded = config.ear === 'E02';
      const top = anchors.crown[1] - anchors.neck[1];
      path(ctx, folded
        ? [11,-20, 15,-34, 20,top, 26,top, 31,top+7, 28,-32, 33,-24, 28,-17]
        : [11,-23, 16,-35, 25,top, 30,top, 33,top+5, 34,-24, 29,-18], main, true);
      path(ctx, [18,-25, 22,-34, 27,top+5, 29,top+6, 29,-25, 26,-20], light);
      if (folded) path(ctx, [21,top+2, 26,top, 30,top+7, 27,-31, 23,-33], shade);
    }
    ctx.restore();
  }
}

function bodyPattern(ctx: Context, config: Config, side: boolean) {
  const { shade, light } = paletteTerms(config);
  if (config.pattern === 'P03') {
    if (side) {
      path(ctx, [-18,-15, 5,-17, 27,-14, 29,-5, 17,3, 6,-4, -5,2, -18,-4], shade);
    } else {
      path(ctx, [-25,-13, -18,-19, -15,-14, -18,6, -25,14, -27,3], shade);
      path(ctx, [18,-15, 24,-17, 28,-3, 24,13, 18,7], shade);
    }
  }
  if (config.pattern === 'P04') {
    for (const [x,y] of spots) rect(ctx, x, y, 5, 4, config.palette === 'C03' ? light : shade);
  }
}

function head(ctx: Context, config: Config, x: number, y: number, side: boolean) {
  const { main, shade, light, white, nose, whiteShade } = paletteTerms(config);
  ctx.save();
  ctx.translate(x, y);
  const headShape = side
    ? [-28,-25, -17,-35, 5,-36, 19,-30, 26,-18, 24,-4, 12,7, -9,7, -23,1, -29,-9]
    : [-27,-23, -16,-34, 16,-34, 27,-23, 30,-12, 25,0, 15,7, -15,7, -25,0, -30,-12];
  path(ctx, headShape, main, true);
  path(ctx, [-25,-23, -15,-32, 3,-32, -9,-26, -17,-22, -25,-16], config.palette === 'C03' ? shade : light);
  path(ctx, [17,-23, 25,-19, 27,-10, 22,0, 13,6, 6,6, 15,-2], shade);
  if (config.pattern === 'P01') path(ctx, [-4,-32, 3,-32, 2,-20, 5,-12, -4,-9, -2,-20], white);
  if (config.pattern === 'P05') {
    const ex = side ? -14 : -12;
    path(ctx, [ex-9,-19, ex+3,-22, ex+8,-17, ex+7,-7, ex-1,-4, ex-8,-8], shade);
  }
  if (config.pattern === 'P04') {
    rect(ctx, -8, -27, 4, 4, shade);
    rect(ctx, 7, -24, 5, 4, shade);
  }
  const cheeks = config.palette === 'C01' || config.palette === 'C03' || config.pattern === 'P02';
  if (cheeks && !side) {
    path(ctx, [-26,-9, -17,-10, -10,-5, 10,-5, 17,-10, 26,-9, 23,0, 14,6, -14,6, -23,0], white);
  }
  if (config.pattern === 'P02' || config.palette === 'C03') {
    rect(ctx, side ? -16 : -15, -22, 7, 3, light);
    if (!side) rect(ctx, 8, -22, 7, 3, light);
  }
  ears(ctx, config, side);
  eye(ctx, config, side ? -14 : -12, -14);
  if (!side) eye(ctx, config, 12, -14);
  const pointy = config.muzzle === 'N01';
  if (side) {
    const tip = pointy ? -44 : -38;
    path(ctx, [-22,-11, -32,-11, tip+3,-7, tip,-3, tip+3,2, -27,5, -15,2, -13,-6], cheeks ? white : light, true);
    path(ctx, [tip,-7, tip+5,-9, tip+10,-6, tip+8,-2, tip+2,-2, tip,-4], nose);
    rect(ctx, tip+7, -7, 2, 1, whiteShade);
    rect(ctx, tip+7, 0, 8, 2, colors.outline);
  } else {
    const width = pointy ? 12 : 16;
    path(ctx, [-width,-5, -8,-10, 8,-10, width,-5, width,3, 7,9, -7,9, -width,3], cheeks ? white : light);
    path(ctx, [-width+2,3, -7,6, 7,6, width-1,2, 7,9, -7,9], cheeks ? whiteShade : shade);
    path(ctx, [-6,-7, 6,-7, 8,-5, 7,-2, 2,1, -2,1, -7,-2, -8,-5], nose);
    rect(ctx, -4, -6, 5, 1, whiteShade);
    rect(ctx, -1, 1, 2, 4, nose);
    rect(ctx, -7, 4, 14, 2, colors.outline);
    rect(ctx, -8, 2, 2, 2, colors.outline);
    rect(ctx, 6, 2, 2, 2, colors.outline);
  }
  ctx.restore();
}

function sit(ctx: Context, config: Config, frame?: number) {
  const { main, shade, light, white, whiteShade } = paletteTerms(config);
  const [cx, neck] = anchors.neck;
  const floor = anchors.floor - 1;
  const socks = ['C01', 'C03'].includes(config.palette);
  tail(ctx, config, anchors.tail, false, 0);
  path(ctx, [65,49, 95,49, 100,63, 108,78, 113,108, 118,123, 118,floor-6, 111,floor, 49,floor, 42,floor-6, 42,123, 47,109, 52,79, 61,63], main, true);
  path(ctx, [94,54, 99,67, 107,81, 111,106, 117,124, 117,134, 110,140, 96,140, 102,121, 97,99, 90,81], shade);
  if (socks) {
    path(ctx, [67,57, 93,57, 101,77, 98,90, 89,107, 80,114, 71,107, 60,90, 59,77], white);
    path(ctx, [96,71, 100,78, 97,91, 89,106, 80,113, 74,108, 84,102, 91,91], whiteShade);
  } else {
    path(ctx, [67,58, 85,56, 77,67, 69,84, 67,98, 61,89, 62,73], light);
  }
  ctx.save();
  ctx.translate(cx, 101);
  bodyPattern(ctx, config, false);
  ctx.restore();
  if (frame !== undefined) keyboard(ctx, frame);
  for (const sign of [-1,1]) {
    const tap = frame === (sign === -1 ? 0 : 2);
    const x = cx + sign * 16;
    const recovering = frame === (sign === -1 ? 1 : 3);
    const y = frame === undefined ? floor : tap ? 135 : recovering ? 129 : 125;
    const legContour = [x-8,105, x-6,115, x-6,y-9, x-10,y-5, x-10,y-2,
      x-7,y, x+6,y, x+9,y-3, x+9,y-6, x+6,y-10, x+5,114, x+6,103];
    path(ctx, legContour, main);
    path(ctx, [x+3,108, x+6,103, x+5,114, x+6,y-10, x+9,y-6, x+9,y-3,
      x+6,y, x+4,y-3, x+5,y-8, x+2,y-14], shade);
    path(ctx, [x-8,105, x-5,116, x-5,y-8, x-9,y-4, x-9,y-2, x-7,y, x-10,y-2,
      x-10,y-5, x-7,y-9, x-7,116], colors.outline);
    if (socks) path(ctx, [x-6,y-8, x+5,y-8, x+8,y-5, x+7,y-2, x+5,y-1, x-6,y-1, x-8,y-3], white);
    rect(ctx, x+3, y-5, 2, 3, socks ? whiteShade : shade);
  }
  head(ctx, config, cx, neck + (frame === 0 || frame === 2 ? 2 : 0), false);
}

function keyboard(ctx: Context, frame: number) {
  path(ctx, [58,128, 102,128, 109,137, 106,141, 54,141, 51,137], '#626B71', true);
  path(ctx, [58,129, 102,129, 106,136, 54,136], '#A0A9AA');
  for (let col = 0; col < 8; col++) {
    rect(ctx, 59 + col * 5, 130, 3, 2, '#545D63');
    rect(ctx, 58 + col * 5, 133, 3, 2, '#545D63');
  }
  if (frame === 0 || frame === 2) rect(ctx, frame === 0 ? 63 : 93, 133, 4, 2, '#F0C49D');
}

const strides = [
  { bob: 0, fore: [-10,40], hind: [17,41], farFore: [12,31], farHind: [-17,35] },
  { bob: -2, fore: [0,42], hind: [8,39], farFore: [16,34], farHind: [-11,35] },
  { bob: -4, fore: [13,37], hind: [-5,34], farFore: [2,44], farHind: [4,45] },
  { bob: -2, fore: [15,34], hind: [-14,37], farFore: [-9,42], farHind: [17,43] },
  { bob: 0, fore: [6,34], hind: [-16,36], farFore: [1,41], farHind: [8,40] },
  { bob: 1, fore: [-6,36], hind: [0,37], farFore: [10,37], farHind: [-9,36] },
] as const;

function run(ctx: Context, config: Config, frame: number) {
  const { main, shade, light, white } = paletteTerms(config);
  const stride = strides[frame];
  const by = 100 + stride.bob;
  const tailRoot: Point = [105, 84 + stride.bob];
  tail(ctx, config, tailRoot, true, [1,0,-2,-3,-1,1][frame]);
  const leg = (hip: number, [dx,dy]: Point, far: boolean) => {
    const x = hip + dx;
    const foot = Math.min(by+dy, anchors.floor-1);
    const knee = hip + Math.round(dx / 2) + (hip < 80 ? 2 : 6);
    path(ctx, [hip-6,by-1, hip+6,by-2, knee+5,by+15, x+4,foot-2, x-8,foot, x-11,foot-3, x-9,foot-7, x-4,foot-8, knee-4,by+19], far ? shade : main, true);
    if (['C01','C03'].includes(config.palette)) path(ctx, [x-8,foot-5, x-1,foot-7, x+2,foot-3, x-7,foot-1, x-10,foot-3], white);
  };
  leg(64, stride.farFore, true);
  leg(103, stride.farHind, true);
  path(ctx, [48,by-18, 55,by-27, 79,by-24, 99,by-23, 111,by-15, 114,by-4, 106,by+6, 91,by+8, 79,by+6, 63,by+9, 53,by+6, 47,by-1], main, true);
  path(ctx, [57,by-11, 67,by+2, 79,by+3, 95,by+5, 108,by-2, 105,by+5, 92,by+7, 80,by+5, 63,by+8, 53,by+5, 49,by-2], shade);
  path(ctx, [57,by-24, 76,by-23, 88,by-20, 68,by-19, 60,by-14, 50,by-12], config.palette === 'C03' ? shade : light);
  ctx.save();
  ctx.translate(80, by-8);
  ctx.beginPath();
  ctx.rect(-28,-16,57,24);
  ctx.clip();
  bodyPattern(ctx, config, true);
  ctx.restore();
  leg(58, stride.fore, false);
  leg(102, stride.hind, false);
  head(ctx, config, 49, by-23, true);
}

export function render(canvas: HTMLCanvasElement, config: Config, action: Action = 'sit', frame = 0) {
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw Error('无法初始化 Canvas');
  const index = ((frame % actions[action]) + actions[action]) % actions[action];
  if (action === 'left' || action === 'right') {
    run(ctx, config, index);
  } else {
    sit(ctx, config, action === 'typing' ? index : undefined);
  }

  // Rasterize vector edges to the nearest of the authored slots, with binary alpha.
  // This keeps export and browser previews on exactly the same logical pixel grid.
  const pixels = ctx.getImageData(0, 0, SIZE, SIZE);
  const rgb = [...new Set([...Object.values(colors), ...palettes[config.palette],
    '#626B71','#A0A9AA','#545D63','#F0C49D'])].map(hex => {
    const packed = Number.parseInt(hex.slice(1), 16);
    return [packed >> 16, (packed >> 8) & 255, packed & 255];
  });
  const data = pixels.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i+3] < 128) {
      data.fill(0, i, i+4);
      continue;
    }
    let nearest = rgb[0], best = Infinity;
    for (const candidate of rgb) {
      const d = (data[i]-candidate[0])**2 + (data[i+1]-candidate[1])**2 + (data[i+2]-candidate[2])**2;
      if (d < best) { nearest = candidate; best = d; }
      if (d === 0) break;
    }
    data.set(nearest, i);
    data[i+3] = 255;
  }
  if (action === 'right') {
    const words = new Uint32Array(data.buffer);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE / 2; x++) {
        const left = y * SIZE + x;
        const right = y * SIZE + SIZE - 1 - x;
        const pixel = words[left];
        words[left] = words[right];
        words[right] = pixel;
      }
    }
  }
  ctx.putImageData(pixels, 0, 0);
}

export function png(config: Config, scale: 1 | 2 | 4) {
  const source = document.createElement('canvas');
  render(source, config);
  const output = document.createElement('canvas');
  output.width = output.height = SIZE * scale;
  const ctx = output.getContext('2d');
  if (!ctx) throw Error('无法初始化 PNG 画布');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, output.width, output.height);
  return new Promise<Blob>((resolve, reject) => {
    output.toBlob(blob => blob ? resolve(blob) : reject(Error(`${scale}× PNG 编码失败`)), 'image/png');
  });
}

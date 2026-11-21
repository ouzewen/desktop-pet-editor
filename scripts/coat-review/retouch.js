import { spriteSize } from './retouch-data.js';

const dialog = document.getElementById('retouch');
const field = name => document.getElementById('retouch-' + name);
const toolButtons = [...dialog.querySelectorAll('[data-tool]')];
const undoHistory = new WeakMap();
const hints = {
  paint: '点一下改一格，拖动可以连续画。',
  sample: '点画布上的任意有颜色的像素取色。',
  restore: '点掉改过的像素，恢复候选原稿的颜色。',
  boundary: '沿你认可的分界线点绘，青色标注只出现在放大画布里。',
  clearMark: '清除画布上的分界或关键点标注。',
};
const scale = 8;

export async function openRetouch(option, area, prior, onEdit, canOpen) {
  const sourceImage = new Image();
  sourceImage.src = option.image;
  await sourceImage.decode();
  if (dialog.open || !canOpen()) return;
  if (sourceImage.naturalWidth !== spriteSize || sourceImage.naturalHeight !== spriteSize) throw new Error('待机素材尺寸不符');
  const idle = field('idle');
  idle.src = option.image;

  const { x, y, width, height } = area;
  const grid = field('grid');
  const viewport = field('viewport');
  const zoom = field('zoom');
  grid.width = width * scale;
  grid.height = height * scale;
  grid.style.setProperty('--retouch-native-width', grid.width + 'px');
  const region = area.label ?? '右耳';
  grid.setAttribute('aria-label', region + '像素画布，可用方向键移动，空格或回车落点');
  const tipButton = dialog.querySelector('[data-tool="tip"]');
  tipButton.textContent = area.label ? '标关键点' : '标耳尖';
  const gridContext = grid.getContext('2d');
  gridContext.imageSmoothingEnabled = false;
  const crop = document.createElement('canvas');
  crop.width = width;
  crop.height = height;
  const cropContext = crop.getContext('2d', { willReadFrequently: true });
  cropContext.drawImage(sourceImage, x, y, width, height, 0, 0, width, height);
  const source = cropContext.getImageData(0, 0, width, height);
  const previews = ['idle-paint', 'typing-paint'].map(name => field(name).getContext('2d'));
  const typing = field('typing');
  typing.src = option.typing;
  idle.alt = option.label + '待机';
  typing.alt = option.label + '特别快打字';
  field('title').textContent = option.id + ' ' + option.label + ' · ' + region + '像素微调';
  field('typing-caption').textContent = area.idleOnly ? '特别快打字 · 原稿参考' : '特别快打字';

  const color = field('color');
  const undo = field('undo');
  const compare = field('compare');
  const motion = field('motion');
  motion.hidden = area.idleOnly || !option.retouchFrames || !area.animation;
  const history = undoHistory.get(option) ?? [];
  undoHistory.set(option, history);
  let paint = new Map(prior?.paint);
  let boundary = new Set(prior?.boundary);
  let tip = prior?.tip ?? null;
  let tool = 'paint';
  let original = false;
  let playing = false;
  let active = true;
  let atlas;
  let animationRequest;
  let frame = 0;
  const animation = area.animation;
  const blocked = animation?.blocked.map(positions => new Set(positions));
  let cursor = [Math.round(width / 2), Math.round(height / 3)];
  let keyboard = false;
  let stroke;

  function snapshot() {
    return { paint: [...paint], boundary: [...boundary], tip };
  }

  function load(edit) {
    paint = new Map(edit.paint);
    boundary = new Set(edit.boundary);
    tip = edit.tip;
  }

  function update() {
    const markCount = boundary.size + Number(tip !== null);
    field('status').textContent = `${original ? '正在看原稿' : '正在看微调稿'} · ${paint.size} 个改色像素 · ${markCount} 个标注点`;
    undo.disabled = original || !history.length;
    for (const button of toolButtons) button.disabled = original;
    color.disabled = original;
  }

  function select(nextTool) {
    tool = nextTool;
    for (const button of toolButtons) button.setAttribute('aria-pressed', String(button.dataset.tool === tool));
    field('hint').textContent = tool === 'tip'
      ? `点一个像素标记${area.label ? '转折或端点' : '耳尖'}，金色圆圈只出现在画布里。`
      : hints[tool];
  }

  function positionAt(col, row) {
    return (y + row) * spriteSize + x + col;
  }

  function coords(position) {
    return [position % spriteSize - x, Math.floor(position / spriteSize) - y];
  }

  function readColor(col, row) {
    const index = (row * width + col) * 4;
    if (!source.data[index + 3]) return null;
    return Array.from(source.data.subarray(index, index + 3), value => value.toString(16).padStart(2, '0')).join('');
  }

  function drawPreview(index) {
    const context = previews[index];
    const animated = index === 1 && playing;
    const covered = animated && blocked[frame];
    context.clearRect(0, 0, spriteSize, spriteSize);
    if (index === 1 && area.idleOnly) return;
    if (animated) {
      const col = frame % animation.columns;
      const row = Math.floor(frame / animation.columns);
      context.drawImage(atlas, col * spriteSize, row * spriteSize, spriteSize, spriteSize,
        0, 0, spriteSize, spriteSize);
    }
    if (original) return;
    for (const [position, hex] of paint) {
      if (covered && covered.has(position)) continue;
      context.fillStyle = '#' + hex;
      context.fillRect(position % spriteSize, Math.floor(position / spriteSize), 1, 1);
    }
  }

  function draw() {
    cropContext.putImageData(source, 0, 0);
    if (!original) {
      for (const [position, hex] of paint) {
        const [col, row] = coords(position);
        cropContext.fillStyle = '#' + hex;
        cropContext.fillRect(col, row, 1, 1);
      }
    }
    drawPreview(0);
    drawPreview(1);
    gridContext.clearRect(0, 0, grid.width, grid.height);
    gridContext.drawImage(crop, 0, 0, grid.width, grid.height);
    gridContext.strokeStyle = 'rgba(40, 28, 47, .22)';
    gridContext.beginPath();
    for (let col = 1; col < width; col++) {
      gridContext.moveTo(col * scale + .5, 0);
      gridContext.lineTo(col * scale + .5, grid.height);
    }
    for (let row = 1; row < height; row++) {
      gridContext.moveTo(0, row * scale + .5);
      gridContext.lineTo(grid.width, row * scale + .5);
    }
    gridContext.stroke();
    if (!original) {
      gridContext.fillStyle = '#35f6d6';
      for (const position of boundary) {
        const [col, row] = coords(position);
        gridContext.fillRect(col * scale + 1, row * scale + 1, scale - 2, scale - 2);
      }
      if (tip !== null) {
        const [col, row] = coords(tip);
        gridContext.beginPath();
        gridContext.arc((col + .5) * scale, (row + .5) * scale, scale, 0, 2 * Math.PI);
        gridContext.lineWidth = 2;
        gridContext.strokeStyle = '#fff07b';
        gridContext.stroke();
        gridContext.lineWidth = 1;
      }
    }
    if (keyboard) {
      gridContext.strokeStyle = '#fff';
      gridContext.strokeRect(cursor[0] * scale + .5, cursor[1] * scale + .5, scale - 1, scale - 1);
    }
  }

  function apply([col, row]) {
    const position = positionAt(col, row);
    const base = readColor(col, row);
    if (tool === 'sample') {
      if (base !== null) {
        color.value = '#' + (paint.get(position) ?? base);
        select('paint');
      }
    } else if (tool === 'paint' && base !== null) {
      const hex = color.value.slice(1);
      if (hex === base) paint.delete(position);
      else paint.set(position, hex);
    } else if (tool === 'restore') {
      paint.delete(position);
    } else if (tool === 'boundary') {
      boundary.add(position);
    } else if (tool === 'tip') {
      tip = position;
    } else if (tool === 'clearMark') {
      boundary.delete(position);
      if (tip === position) tip = null;
    }
  }

  function commit(before) {
    const after = snapshot();
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    history.push(before);
    if (history.length > 32) history.shift();
    onEdit(after);
    update();
  }

  function pixelAt(event) {
    const bounds = grid.getBoundingClientRect();
    return [Math.max(0, Math.min(width - 1, Math.floor((event.clientX - bounds.x) / bounds.width * width))),
      Math.max(0, Math.min(height - 1, Math.floor((event.clientY - bounds.y) / bounds.height * height)))];
  }

  function finishStroke() {
    if (!stroke) return;
    commit(stroke.before);
    stroke = undefined;
  }

  grid.onpointerdown = event => {
    if (original || stroke || event.button !== 0) return;
    keyboard = false;
    const start = pixelAt(event);
    const before = snapshot();
    const drag = tool !== 'sample' && tool !== 'tip';
    apply(start);
    if (drag) {
      grid.setPointerCapture(event.pointerId);
      stroke = { id: event.pointerId, before, last: start };
    } else {
      commit(before);
    }
    draw();
  };
  grid.onpointermove = event => {
    if (stroke?.id !== event.pointerId) return;
    const target = pixelAt(event);
    const [cx, cy] = stroke.last;
    const dx = target[0] - cx, dy = target[1] - cy;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let step = 1; step <= steps; step++) {
      apply([Math.round(cx + dx * step / steps), Math.round(cy + dy * step / steps)]);
    }
    if (steps) {
      stroke.last = target;
      draw();
    }
  };
  grid.onlostpointercapture = finishStroke;
  grid.onpointerup = grid.onpointercancel = event => {
    if (stroke?.id === event.pointerId) finishStroke();
  };
  grid.onblur = () => { keyboard = false; draw(); };
  grid.onkeydown = event => {
    if (original || stroke) return;
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!direction && event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    keyboard = true;
    if (direction) {
      cursor = [Math.max(0, Math.min(width - 1, cursor[0] + direction[0])),
        Math.max(0, Math.min(height - 1, cursor[1] + direction[1]))];
    } else {
      const before = snapshot();
      apply(cursor);
      commit(before);
    }
    draw();
  };

  for (const button of toolButtons) button.onclick = () => select(button.dataset.tool);
  color.oninput = () => select('paint');
  undo.onclick = () => {
    if (!history.length) return;
    load(history.pop());
    onEdit(snapshot());
    update();
    draw();
  };
  dialog.onkeydown = event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !event.shiftKey
      && !undo.disabled && !stroke) {
      event.preventDefault();
      undo.click();
    }
  };
  compare.textContent = '查看原稿';
  compare.setAttribute('aria-pressed', 'false');
  compare.onclick = () => {
    original = !original;
    compare.textContent = original ? '返回微调稿' : '查看原稿';
    compare.setAttribute('aria-pressed', String(original));
    update();
    draw();
  };
  function setZoom(zoomed) {
    viewport.classList.toggle('is-zoomed', zoomed);
    zoom.textContent = zoomed ? '适应画布' : '放大画布';
    zoom.setAttribute('aria-pressed', String(zoomed));
  }
  setZoom(false);
  zoom.onclick = () => {
    if (stroke) return;
    setZoom(!viewport.classList.contains('is-zoomed'));
    viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
    viewport.scrollTop = (viewport.scrollHeight - viewport.clientHeight) / 2;
  };
  motion.textContent = '播放特别快打字';
  motion.setAttribute('aria-pressed', 'false');
  motion.disabled = false;
  typing.hidden = false;
  function stopPlayback() {
    playing = false;
    cancelAnimationFrame(animationRequest);
    typing.hidden = false;
    motion.textContent = '播放特别快打字';
    motion.setAttribute('aria-pressed', 'false');
    drawPreview(1);
  }
  motion.onclick = async () => {
    if (playing) {
      stopPlayback();
      return;
    }
    motion.disabled = true;
    try {
      if (!atlas) {
        const image = new Image();
        image.src = option.retouchFrames;
        await image.decode();
        if (!active) return;
        atlas = image;
      }
      playing = true;
      frame = 0;
      typing.hidden = true;
      motion.textContent = '回到定格';
      motion.setAttribute('aria-pressed', 'true');
      const start = performance.now();
      drawPreview(1);
      const step = now => {
        const next = Math.floor(Math.max(0, now - start) / animation.frameMs) % blocked.length;
        if (next !== frame) {
          frame = next;
          drawPreview(1);
        }
        animationRequest = requestAnimationFrame(step);
      };
      animationRequest = requestAnimationFrame(step);
    } catch {
      if (active) field('status').textContent = '打字动画加载失败，可以重试。';
    } finally {
      if (active) motion.disabled = false;
    }
  };
  dialog.onclose = () => {
    active = false;
    stopPlayback();
    atlas = undefined;
    finishStroke();
    typing.removeAttribute('src');
  };

  select('paint');
  update();
  draw();
  dialog.showModal();
}

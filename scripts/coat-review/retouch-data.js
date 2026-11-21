export const spriteSize = 320;

export function inRetouchArea(position, area) {
  if (!Number.isInteger(position) || position < 0 || position >= spriteSize ** 2) return false;
  const x = position % spriteSize;
  const y = Math.floor(position / spriteSize);
  return x >= area.x && x < area.x + area.width && y >= area.y && y < area.y + area.height;
}

export function hasRetouch(edit) {
  return Boolean(edit && (edit.paint.length || edit.boundary.length || edit.tip !== null));
}

export function validateRetouches(value, area, options) {
  if (value === undefined) return {};
  const invalid = () => { throw new Error('像素微调内容无效，请重新打开候选稿检查。'); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  const available = new Set(options.map(option => option.id));
  const retouches = {};
  for (const [id, edit] of Object.entries(value)) {
    if (!area || !available.has(id) || !edit || !Array.isArray(edit.paint) || !Array.isArray(edit.boundary)
      || edit.paint.length > area.width * area.height || edit.boundary.length > area.width * area.height) invalid();
    const paint = new Set();
    for (const item of edit.paint) {
      if (!Array.isArray(item) || item.length !== 2 || !inRetouchArea(item[0], area) || paint.has(item[0])
        || typeof item[1] !== 'string' || !/^[0-9a-f]{6}$/i.test(item[1])) invalid();
      paint.add(item[0]);
    }
    if (edit.boundary.some(position => !inRetouchArea(position, area))
      || new Set(edit.boundary).size !== edit.boundary.length
      || (edit.tip !== null && !inRetouchArea(edit.tip, area))) invalid();
    if (hasRetouch(edit)) retouches[id] = {
      paint: edit.paint.map(([position, color]) => [position, color.toLowerCase()]),
      boundary: edit.boundary,
      tip: edit.tip,
    };
  }
  return retouches;
}

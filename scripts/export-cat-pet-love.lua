local sprite = assert(app.activeSprite)
local output = assert(app.params.output)
local frames = assert(tonumber(app.params.frames))
local columns = assert(tonumber(app.params.columns))
local duration = assert(tonumber(app.params.duration)) / 1000
local scale = 4
assert(sprite.width == 80 and sprite.height == 80 and #sprite.frames == frames and sprite.colorMode == ColorMode.RGB)

local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end
local function composite(names, frame)
  local image = Image(80, 80, ColorMode.RGB)
  for _, name in ipairs(names) do
    local cel = assert(layers[name], "Missing love layer " .. name):cel(frame)
    if cel then image:drawImage(cel.image, cel.position, cel.opacity) end
  end
  return image
end

local function drawNative(target, image, atX, atY, left, top, width, height)
  for y = 0, height - 1 do
    for x = 0, width - 1 do
      local ink = image:getPixel(left + x, top + y)
      if app.pixelColor.rgbaA(ink) > 0 then
        for dy = 0, scale - 1 do
          for dx = 0, scale - 1 do
            target:drawPixel(atX + x * scale + dx, atY + y * scale + dy, ink)
          end
        end
      end
    end
  end
end

local x, y, w, h = assert(app.params.hearts):match("^(%d+),(%d+),(%d+),(%d+)$")
x, y, w, h = tonumber(x), tonumber(y), tonumber(w), tonumber(h)
assert(x % scale == 0 and y % scale == 0 and w % scale == 0 and h % scale == 0)
local eyes = Image(320, 320, ColorMode.RGB)
local closed = composite({"Happy squint"}, 4)
assert(not closed:isEmpty())
drawNative(eyes, closed, 0, 0, 0, 0, 80, 80)
assert(eyes:saveAs(output .. "/eyes.png"))
local hearts = Image(w * columns, h * math.ceil(frames / columns), ColorMode.RGB)
for i, frame in ipairs(sprite.frames) do
  assert(math.abs(frame.duration - duration) < 0.0001, "Unexpected love frame duration")
  local image = composite({"Heart 1", "Heart 2"}, i)
  if not image:isEmpty() then
    local bounds = image:shrinkBounds(0)
    assert(bounds.x * scale >= x and bounds.y * scale >= y + 2 * scale
      and (bounds.x + bounds.width) * scale <= x + w and (bounds.y + bounds.height) * scale <= y + h)
  end
  drawNative(hearts, image, ((i - 1) % columns) * w, ((i - 1) // columns) * h,
    x / scale, y / scale, w / scale, h / scale)
end
assert(hearts:saveAs(output .. "/hearts.png"))

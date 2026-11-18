-- Export the editable review draft without its locked idle reference.
local sprite = assert(app.activeSprite)
local output = assert(app.params.output)
local frames, pawFrames, columns = tonumber(app.params.frames), tonumber(app.params.pawFrames), tonumber(app.params.columns)
local x, y = tonumber(app.params.x), tonumber(app.params.y)
local width, height = tonumber(app.params.width), tonumber(app.params.height)
assert(sprite.width == 320 and sprite.height == 320 and sprite.colorMode == ColorMode.RGB)
assert(#sprite.frames == frames and frames % pawFrames == 0 and pawFrames % columns == 0)
app.fs.makeAllDirectories(output)

local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end
local function draw(name, index, image)
  local cel = assert(layers[name], "Missing layer " .. name):cel(index)
  if cel then image:drawImage(cel.image, cel.position) end
end
local function save(image, name)
  image:saveAs(app.fs.joinPath(output, name .. ".png"))
end
local function sheet(count)
  return Image(width * columns, height * count / columns, ColorMode.RGB)
end
local function origin(index)
  return Point((index - 1) % columns * width, math.floor((index - 1) / columns) * height)
end
local alpha = app.pixelColor.rgbaA
local function crop(image, cover)
  local result = Image(width, height, ColorMode.RGB)
  for py = 0, sprite.height - 1 do
    for px = 0, sprite.width - 1 do
      local pixel = image:getPixel(px, py)
      if alpha(pixel) > 0 and (not cover or alpha(cover:getPixel(px, py)) ~= 255) then
        assert(alpha(pixel) == 255, "Expected opaque pixel art")
        assert(px >= x and px < x + width and py >= y and py < y + height, "Visible pixel outside the atlas region")
        result:putPixel(px - x, py - y, pixel)
      end
    end
  end
  return result
end

local laptop = Image(sprite.spec)
draw("front_laptop", 1, laptop)
local paws, letters = sheet(pawFrames), sheet(frames)
local firstCycle = {}
for index, frame in ipairs(sprite.frames) do
  assert(math.abs(frame.duration - 0.070) < 0.0001, "Unexpected review frame duration")
  local cover = Image(sprite.spec)
  draw("front_laptop", index, cover)
  assert(cover:isEqual(laptop), "Laptop moved during the loop")
  local hands = Image(sprite.spec)
  draw("left_paw", index, hands)
  draw("right_paw", index, hands)
  -- Keep the visible paw pixels only. An erased computer pixel must not reveal a hidden press.
  local visible = crop(hands, cover)
  local step = (index - 1) % pawFrames + 1
  if index <= pawFrames then
    firstCycle[step] = visible
    paws:drawImage(visible, origin(step))
  else
    assert(visible:isEqual(firstCycle[step]), "Paw geometry diverged between repetitions")
  end
  local effects = Image(sprite.spec)
  draw("typing_letters", index, effects)
  letters:drawImage(crop(effects), origin(index))
end
save(laptop, "laptop")
save(paws, "paws")
save(letters, "letters")

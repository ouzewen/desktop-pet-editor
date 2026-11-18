local sprite = assert(app.activeSprite)
local output = assert(app.params.output)
local columns = assert(tonumber(app.params.columns))
local frames = assert(tonumber(app.params.frames))
local duration = assert(tonumber(app.params.duration)) / 1000
assert(sprite.width == 320 and sprite.height == 320 and sprite.colorMode == ColorMode.RGB)
assert(#sprite.frames == frames)
local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end

local function saveLayer(name, file, required)
  local layer = assert(layers[name], "Missing listening layer " .. name)
  local region = assert(app.params[file])
  local left, top, width, height = region:match("^(%d+),(%d+),(%d+),(%d+)$")
  left, top, width, height = tonumber(left), tonumber(top), tonumber(width), tonumber(height)
  local image = Image(width * columns, height * math.ceil(frames / columns), ColorMode.RGB)
  for index = 1, frames do
    local cel = layer:cel(index)
    assert(cel or not required, name .. " missing at frame " .. index)
    if cel then
      local bounds = cel.image:shrinkBounds(0)
      local x = cel.position.x - left
      local y = cel.position.y - top
      assert(x + bounds.x >= 0 and y + bounds.y >= 0
        and x + bounds.x + bounds.width <= width and y + bounds.y + bounds.height <= height,
        name .. " outside the registered region at frame " .. index)
      x = ((index - 1) % columns) * width + x
      y = ((index - 1) // columns) * height + y
      image:drawImage(cel.image, Point(x, y))
    end
  end
  image:saveAs(output .. "/" .. file .. ".png")
end

for _, frame in ipairs(sprite.frames) do
  assert(math.abs(frame.duration - duration) < 0.0001, "Unexpected listening duration")
end
saveLayer("Headphone band", "headband", true)
saveLayer("Headphone earcups", "earcups", true)
saveLayer("Eyes", "closed_eyes", true)
saveLayer("Music notes", "notes")

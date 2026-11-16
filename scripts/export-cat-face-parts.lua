-- Export the front-facing mouths, noses and optional clean-skin patch.
local sprite = assert(app.activeSprite, "Open front-face-parts.aseprite")
local output = assert(app.params.output, "Set --script-param output to an existing directory")
local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end
assert(layers.mouth and layers.nose and layers.base_patch, "Missing face-part layers")

local left, top, width, height = 128, 119, 48, 44

local function copy(atlas, layer, frame, column, row)
  local cel = layer:cel(frame)
  if not cel then return end
  local x, y = cel.position.x - left, cel.position.y - top
  local image = cel.image
  assert(x >= 0 and y >= 0 and x + image.width <= width and y + image.height <= height,
         "Keep " .. layer.name .. " inside the front face tile")
  atlas:drawImage(image, Point(column * width + x, row * height + y))
end

for _, tag in ipairs(sprite.tags) do
  local first = tag.fromFrame.frameNumber
  assert(tag.toFrame.frameNumber == first + 3, "Use four variants per coat tag")
  local atlas = Image(320, 320, ColorMode.RGB)
  for column = 0, 3 do
    copy(atlas, layers.mouth, first + column, column, 0)
    copy(atlas, layers.nose, first + column, column, 1)
  end
  copy(atlas, layers.base_patch, first, 0, 2)
  atlas:saveAs(app.fs.joinPath(output, tag.name .. ".png"))
end

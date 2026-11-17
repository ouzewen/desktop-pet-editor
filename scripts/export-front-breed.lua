-- Export the four-variant front or eight-frame typing breed source.
local sprite = assert(app.activeSprite, "Open a front or typing breed source")
local output = assert(app.params.output, "Set output to the breed PNG directory")
assert(sprite.width == 320 and sprite.height == 320 and sprite.colorMode == ColorMode.RGB,
       "Expected a 320x320 RGB sprite")

local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end

local function image(name, frame)
  local layer = assert(layers[name], "Missing layer " .. name)
  local cel = assert(layer:cel(frame), "Missing " .. name .. " frame " .. frame)
  local result = Image(320, 320, ColorMode.RGB)
  result:drawImage(cel.image, cel.position)
  return result
end

local function save(name, frame, filename)
  image(name, frame):saveAs(app.fs.joinPath(output, filename .. ".png"))
end

if layers.arms then
  assert(#sprite.frames == 8, "Expected gentle and fast tags with four frames each")
  save("body", 1, "typing_body")
  for _, mode in ipairs({"gentle", "fast"}) do
    local tag
    for _, candidate in ipairs(sprite.tags) do
      if candidate.name == mode then tag = candidate end
    end
    assert(tag and tag.toFrame.frameNumber == tag.fromFrame.frameNumber + 3,
           "Missing four-frame " .. mode .. " tag")
    for offset = 0, 3 do
      local frame = tag.fromFrame.frameNumber + offset
      save("arms", frame, "typing_arms_" .. mode .. "_" .. offset)
      if mode == "fast" and offset < 3 then
        save("paws_front", frame, "typing_front_" .. offset)
      end
    end
  end
else
  local left = tonumber(app.params.left or "128")
  local top = tonumber(app.params.top or "119")
  local width = tonumber(app.params.width or "48")
  local height = tonumber(app.params.height or "44")
  local columns = tonumber(app.params.columns or "4")
  assert(#sprite.frames == columns, "Face variant count must match the manifest")
  for _, name in ipairs({"body", "head", "ear_upright", "eyes", "iris", "aperture"}) do
    save(name, 1, name)
  end
  local face = assert(app.params.face, "Set face to the output face atlas PNG path")
  local atlas = Image(320, 320, ColorMode.RGB)
  for column = 0, columns - 1 do
    for row, name in ipairs({"mouth", "nose"}) do
      local part = Image(image(name, column + 1), Rectangle(left, top, width, height))
      atlas:drawImage(part, Point(column * width, (row - 1) * height))
    end
  end
  atlas:saveAs(face)
end

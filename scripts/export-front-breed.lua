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
  assert(#sprite.frames == 4, "Expected four front face variants")
  for _, name in ipairs({"body", "head", "ear_upright", "eyes", "iris", "aperture"}) do
    save(name, 1, name)
  end
  local face = assert(app.params.face, "Set face to the output face atlas PNG path")
  local atlas = Image(320, 320, ColorMode.RGB)
  for column = 0, 3 do
    for row, name in ipairs({"mouth", "nose"}) do
      local part = Image(image(name, column + 1), Rectangle(128, 119, 48, 44))
      atlas:drawImage(part, Point(column * 48, (row - 1) * 44))
    end
  end
  atlas:saveAs(face)
end

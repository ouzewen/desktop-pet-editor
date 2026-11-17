-- Copy approved MCP artwork into production source documents. No new art is
-- painted here: the only generated pixels are the derived paw region mask.
local candidate = assert(app.params.candidate, "Set candidate to the approved 32-frame source")
local root = assert(app.params.root, "Set root to the repository")
local output = app.fs.joinPath(root, "art/cat-shared/typing-v2")
app.fs.makeAllDirectories(output)
local effects = {"face_cleanup", "effort_eyes", "mouth_expression", "mouth_region", "sweat"}
local durations = {gentle=70, fast=40, frenzy=20}
local function named(sprite)
  local result = {}
  for _, layer in ipairs(sprite.layers) do result[layer.name] = layer end
  return result
end
local function pawImage(layers, index)
  local result = Image(320, 320, ColorMode.RGB)
  for _, name in ipairs({"paw_left", "paw_right", "paw_upper_outline"}) do
    local cel = assert(layers[name]):cel(index)
    if cel then result:drawImage(cel.image, cel.position) end
  end
  return result
end
for _, mode in ipairs({"gentle", "fast", "frenzy"}) do
  local sprite = assert(app.open(candidate))
  assert(sprite.width == 320 and sprite.height == 320 and #sprite.frames == 32)
  local layers = named(sprite)
  for _, name in ipairs({"paw_left", "paw_right", "paws_mask"}) do
    assert(not layers[name].isVisible, "Old paw layer unexpectedly visible")
    sprite:deleteLayer(layers[name])
  end
  layers.paw_left_candidate.name = "paw_left"
  layers.paw_right_candidate.name = "paw_right"
  layers = named(sprite)
  for _, name in ipairs({"paw_left", "paw_right", "paw_upper_outline"}) do layers[name].isEditable = true end
  local maskLayer = sprite:newLayer()
  maskLayer.name = "paws_mask"
  maskLayer.isVisible = false
  for index=1,32 do
    local paws = pawImage(layers, index)
    local mask = Image(320, 320, ColorMode.RGB)
    for pixel in paws:pixels() do
      if app.pixelColor.rgbaA(pixel()) > 0 then
        assert(pixel.y < 220, "Paw exceeds approved keyboard cutoff")
        mask:drawPixel(pixel.x, pixel.y, app.pixelColor.rgba(255,255,255,255))
      end
    end
    sprite:newCel(maskLayer, index, mask, Point(0,0))
    sprite.frames[index].duration = durations[mode] / 1000
  end
  maskLayer.isEditable = false
  if mode ~= "gentle" then
    local old = assert(app.open(app.fs.joinPath(root, "art/cat-shared/typing-reference/"..mode..".aseprite")))
    local oldLayers = named(old)
    for _, name in ipairs(effects) do
      local destination, source = assert(layers[name]), assert(oldLayers[name])
      destination.isVisible = source.isVisible
      for index=1,32 do
        local existing = destination:cel(index)
        if existing then sprite:deleteCel(existing) end
        local sourceIndex = 1 + math.floor((index-1) * #old.frames / 32)
        local cel = source:cel(sourceIndex)
        if cel then
          local copy = sprite:newCel(destination, index, Image(cel.image), cel.position)
          copy.opacity = cel.opacity
        end
      end
    end
    old:close()
  end
  for _, tag in ipairs(sprite.tags) do
    tag.name = mode
    tag.fromFrame = sprite.frames[1]
    tag.toFrame = sprite.frames[32]
  end
  sprite:saveAs(app.fs.joinPath(output, mode..".aseprite"))
  sprite:close()
  print(mode..": approved 32-frame artwork, "..durations[mode].."ms per frame")
end

local sprite = assert(app.activeSprite, "Open front-tails.aseprite")
local output = assert(app.params.output, "Set output to the tail asset directory")
assert(sprite.width == 320 and sprite.height == 320 and sprite.colorMode == ColorMode.RGB,
       "Expected a 320x320 RGB sprite")
assert(#sprite.frames == 10 and #sprite.tags == 10, "Expected two poses for each of the five tails")

local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end

local function image(name, frame)
  local cel = assert(assert(layers[name], "Missing layer " .. name):cel(frame), "Missing cel " .. name)
  local full = Image(sprite.width, sprite.height, ColorMode.RGB)
  full:drawImage(cel.image, cel.position)
  return full
end

local exported = {}
local color = app.pixelColor
local previousEdges = app.params.previousEdges and assert(layers.previous_tail_edges, "Missing historical tail edges")
for _, tag in ipairs(sprite.tags) do
  local pose, id = tag.name:match("^(%a+)_CT(0[5-9])$")
  assert(id and (pose == "idle" or pose == "typing"), "Unknown tail pose " .. tag.name)
  assert(not exported[tag.name] and tag.fromFrame == tag.toFrame, "Expected one frame for " .. tag.name)
  local frame = tag.fromFrame.frameNumber
  local base = image("tail", frame)
  local oldEdge = previousEdges and previousEdges:cel(frame)
  if oldEdge then base:drawImage(oldEdge.image, oldEdge.position) end
  local narrow, broad, spots = image("mackerel", frame), image("classic", frame), image("spotted", frame)
  local patterns = Image(sprite.width, sprite.height, ColorMode.RGB)
  for y = 0, sprite.height - 1 do
    for x = 0, sprite.width - 1 do
      local pixel = base:getPixel(x, y)
      if color.rgbaA(pixel) > 0 and color.rgbaG(pixel) >= 65 then
        patterns:drawPixel(x, y, color.rgba(color.rgbaA(narrow:getPixel(x, y)),
          color.rgbaA(broad:getPixel(x, y)), color.rgbaA(spots:getPixel(x, y)), 255))
      end
    end
  end
  base:saveAs(app.fs.joinPath(output, tag.name .. ".png"))
  patterns:saveAs(app.fs.joinPath(output, tag.name .. "_patterns.png"))
  exported[tag.name] = true
end

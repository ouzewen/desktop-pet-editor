-- Export a CT02–CT04 source, including its two pose masks and three pattern channels.
local sprite = assert(app.activeSprite, "Open a cat tail source")
local output = assert(app.params.output, "Set output to the tail asset directory")
local id = assert(app.params.id, "Set id to CT02, CT03 or CT04")
assert(id == "CT02" or id == "CT03" or id == "CT04", "Unknown tail ID")
assert(sprite.width == 320 and sprite.height == 320 and sprite.colorMode == ColorMode.RGB,
       "Expected a 320x320 RGB sprite")

local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end

local function image(name, frame)
  local cel = assert(assert(layers[name], "Missing layer " .. name):cel(frame), "Missing cel " .. name)
  local full = Image(320, 320, ColorMode.RGB)
  full:drawImage(cel.image, cel.position)
  return full
end

for _, tag in ipairs(sprite.tags) do
  local pose = tag.name
  assert(pose == "idle" or pose == "typing", "Unknown pose " .. pose)
  assert(tag.fromFrame == tag.toFrame, "Each tail pose uses one frame")
  local frame = tag.fromFrame.frameNumber
  local base = image("tail", frame)
  base:saveAs(app.fs.joinPath(output, pose .. "_" .. id .. ".png"))
  image("original_tail_mask", frame):saveAs(app.fs.joinPath(output, pose .. "_remove.png"))

  local patterns = Image(320, 320, ColorMode.RGB)
  local narrow, broad, spots = image("mackerel", frame), image("classic", frame), image("spotted", frame)
  for y = 0, 319 do
    for x = 0, 319 do
      local pixel = base:getPixel(x, y)
      if app.pixelColor.rgbaA(pixel) > 0 and app.pixelColor.rgbaG(pixel) >= 65 then
        patterns:drawPixel(x, y, app.pixelColor.rgba(
          app.pixelColor.rgbaA(narrow:getPixel(x, y)),
          app.pixelColor.rgbaA(broad:getPixel(x, y)),
          app.pixelColor.rgbaA(spots:getPixel(x, y))))
      end
    end
  end
  patterns:saveAs(app.fs.joinPath(output, pose .. "_" .. id .. "_patterns.png"))
end

-- Run in Aseprite batch mode with one of the two typing sprites open.
local sprite = assert(app.activeSprite, "Open the typing sprite before exporting")
local mode = app.params.mode
local output = assert(app.params.output, "Set --script-param output to an existing directory")
assert(mode == "gentle" or mode == "fast", "Set --script-param mode=gentle or mode=fast")
assert(sprite.width == 320 and sprite.height == 320 and #sprite.frames == 4
       and sprite.colorMode == ColorMode.RGB, "Expected a four-frame 320x320 RGB typing sprite")

local layers = {}
for _, layer in ipairs(sprite.layers) do
  assert(not layers[layer.name], "Duplicate layer " .. layer.name)
  layers[layer.name] = layer
end

local function export(name, frame, filename)
  local layer = assert(layers[name], "Missing layer " .. name)
  local cel = assert(layer:cel(frame), "Missing " .. name .. " cel in frame " .. frame)
  local image = Image(sprite.width, sprite.height, sprite.colorMode)
  image:drawImage(cel.image, cel.position)
  image:saveAs(app.fs.joinPath(output, "CAT_typing_" .. filename .. ".png"))
end

if mode == "gentle" then
  export("body", 1, "body")
  export("laptop", 1, "laptop")
end

for frame = 1, 4 do
  export("torso_motion", frame, "arms_" .. mode .. "_" .. (frame - 1))
  if mode == "fast" and frame < 4 then
    export("paws_front", frame, "front_" .. (frame - 1))
  end
end

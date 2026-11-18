-- Export the shared effort expression and sweat poses from their Aseprite source.
local sprite = assert(app.activeSprite, "Open typing-effects.aseprite")
local output = assert(app.params.output, "Set output to the typing-effects directory")
assert(sprite.width == 320 and sprite.height == 320 and #sprite.frames == 4
       and sprite.colorMode == ColorMode.RGB, "Expected four 320x320 RGB frames")

local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end

local function export(name, frame, filename)
  local cel = assert(assert(layers[name], "Missing " .. name):cel(frame), "Missing frame " .. frame)
  local image = Image(320, 320, ColorMode.RGB)
  image:drawImage(cel.image, cel.position)
  image:saveAs(app.fs.joinPath(output, filename .. ".png"))
end

export("orange_eye_patch", 1, "orange_eye_patch")
export("effort_eyes", 1, "effort_eyes")
for frame = 2, 4 do export("sweat", frame, "sweat_" .. (frame - 2)) end

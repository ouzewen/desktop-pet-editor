-- Export the directly painted low-paw poses and their independent effects.
local sprite = assert(app.activeSprite, "Open typing-reference/<mode>.aseprite")
local output = assert(app.params.output, "Set output to the typing-reference directory")
local mode = app.params.mode or app.fs.fileTitle(sprite.filename)
local frames = tonumber(app.params.frames or "12")
assert(mode == "gentle" or mode == "fast" or mode == "frenzy", "Unknown typing mode")
assert(sprite.width == 320 and sprite.height == 320 and #sprite.frames == frames
       and sprite.colorMode == ColorMode.RGB, "Expected twelve 320x320 RGB frames")
local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end
local function frame(names, index)
  local image = Image(320, 320, ColorMode.RGB)
  for _, name in ipairs(names) do
    local cel = assert(layers[name], "Missing layer " .. name):cel(index)
    if cel then image:drawImage(cel.image, cel.position) end
  end
  return image
end
local function save(image, name) image:saveAs(app.fs.joinPath(output, name .. ".png")) end
local function atlas(names, name)
  local image = Image(320, 320 * frames, ColorMode.RGB)
  for index = 1, frames do image:drawImage(frame(names, index), Point(0, (index - 1) * 320)) end
  save(image, name)
end
atlas({"torso_base", "paw_left", "paw_right"}, "arms_" .. mode)
atlas({"paws_mask"}, "paws_" .. mode)
if mode ~= "gentle" then atlas({"sweat"}, "sweat_" .. mode) end
if mode == "fast" then
  save(frame({"mouth_expression"}, 1), "mouth_smile")
  save(frame({"mouth_expression"}, math.floor(frames / 2) + 1), "mouth_flat")
  save(frame({"mouth_region"}, 1), "mouth_region")
elseif mode == "frenzy" then save(frame({"effort_eyes"}, 1), "effort_eyes") end

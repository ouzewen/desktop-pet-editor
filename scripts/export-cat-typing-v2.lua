-- Export the approved MCP-drawn cycle; legacy typing-reference stays intact.
local sprite = assert(app.activeSprite, "Open typing-v2/<mode>.aseprite")
local output = assert(app.params.output, "Set output to the typing-v2 directory")
local mode = app.params.mode or app.fs.fileTitle(sprite.filename)
if mode == "gentle" then mode = "shared" end
local frames = tonumber(app.params.frames or "32")
assert(mode == "shared" or mode == "fast" or mode == "frenzy", "Unknown typing mode")
assert(sprite.width == 320 and sprite.height == 320 and #sprite.frames == frames
       and sprite.colorMode == ColorMode.RGB, "Expected thirty-two 320x320 RGB frames")
app.fs.makeAllDirectories(output)
local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end
local function frame(names, index)
  local image = Image(320, 320, ColorMode.RGB)
  for _, name in ipairs(names) do
    local cel = assert(layers[name], "Missing layer "..name):cel(index)
    if cel then image:drawImage(cel.image, cel.position) end
  end
  return image
end
local function save(image, name) image:saveAs(app.fs.joinPath(output, name..".png")) end
local function atlas(names, name)
  local image = Image(320, 320 * #sprite.frames, ColorMode.RGB)
  for index=1,#sprite.frames do
    image:drawImage(frame(names, index), Point(0, (index-1)*320))
  end
  save(image, name)
end
if mode == "shared" then
  atlas({"torso_base", "forearm_texture_restore", "forearm_edge_cleanup",
         "paw_left", "paw_right", "paw_upper_outline"}, app.params.arms or "arms")
  atlas({"paws_mask"}, app.params.paws or "paws_mask")
  save(frame({"forearm_ink_cleanup"}, 1), "forearm_ink_cleanup")
  save(frame({"mouth_ink_cleanup"}, 1), "mouth_ink_cleanup")
else
  atlas({"sweat"}, "sweat_"..mode)
end
if mode == "fast" then
  save(frame({"mouth_expression"}, 1), "mouth_smile")
  save(frame({"mouth_expression"}, math.floor(frames / 2) + 1), "mouth_flat")
  save(frame({"mouth_region"}, 1), "mouth_region")
elseif mode == "frenzy" then
  save(frame({"effort_eyes"}, 1), "effort_eyes")
end
print("Exported typing-v2 "..mode.." ("..frames.." frames)")

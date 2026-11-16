-- Export shared face fur masks or a single independent forehead design.
local sprite = assert(app.activeSprite, "Open face-fur-patterns.aseprite or forehead/<ID>.aseprite")
local output = assert(app.params.output, "Set output to the head-patterns directory")
assert(sprite.width == 320 and sprite.height == 320 and sprite.colorMode == ColorMode.RGB,
       "Expected a 320x320 RGB document")
local pc = app.pixelColor
local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end
local function image(name)
  local result = Image(320, 320, ColorMode.RGB)
  local cel = assert(layers[name], "Missing layer " .. name):cel(1)
  if cel then result:drawImage(cel.image, cel.position) end
  return result
end
local function save(result, name)
  result:saveAs(app.fs.joinPath(output, name .. ".png"))
end
if layers.forehead then
  local id = app.fs.fileTitle(sprite.filename)
  assert(id:match("^P0[1-6]$"), "Expected a stable P01-P06 source filename")
  if id ~= "P03" then save(image("forehead"), "forehead_" .. id) end
else
  save(image("forehead_region"), "forehead_region")
  save(image("face_region"), "face_region")
  local masks = { image("mackerel"), image("classic"), image("spotted") }
  local result = Image(320, 320, ColorMode.RGB)
  for y = 0, 319 do for x = 0, 319 do
    local r, g, b = pc.rgbaA(masks[1]:getPixel(x,y)), pc.rgbaA(masks[2]:getPixel(x,y)), pc.rgbaA(masks[3]:getPixel(x,y))
    if r + g + b > 0 then result:drawPixel(x, y, pc.rgba(r,g,b,255)) end
  end end
  save(result, "face_patterns")
end

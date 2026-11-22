local sprite = assert(app.activeSprite)
local shape = assert(app.params.shape)
assert(sprite.width == 80 and sprite.height == 80 and #sprite.frames == 1)
local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end

local function sheet(name)
  local cel = assert(assert(layers[name], name):cel(1))
  local image = Image(sprite.spec)
  image:drawImage(cel.image, cel.position)
  return image
end

-- Rebuild the generated cel from the locked original and its trim mask.
if shape == "curled" then
  local trimmed = sheet("CAT_ear_curled")
  local trim = sheet("Silhouette trim mask")
  for pixel in trim:pixels() do
    if app.pixelColor.rgbaA(pixel()) > 0 then trimmed:drawPixel(pixel.x, pixel.y, 0) end
  end
  local preview = assert(layers["Trimmed stock (generated)"])
  preview.isEditable = true
  sprite:newCel(preview, 1, trimmed, Point(0, 0))
  layers["Silhouette trim mask"].isVisible = false
end

local component = Image(sprite.spec)
component:drawSprite(sprite, 1)
component:resize(320, 320)
assert(component:saveAs(assert(app.params.output) .. "/" .. shape .. ".png"))

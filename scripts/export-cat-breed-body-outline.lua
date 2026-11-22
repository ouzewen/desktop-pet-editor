-- Export sparse paint and trim. Only the optional native review image composites the body.
local sprite = assert(app.activeSprite)
assert(sprite.width == 80 and sprite.height == 80 and #sprite.frames == 1)
local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end
local function sheet(name)
  local cel = assert(assert(layers[name], name):cel(1))
  local image = Image(sprite.spec)
  image:drawImage(cel.image, cel.position)
  return image
end

local paint = sheet("Native coat contour")
paint:drawImage(sheet("Original nearby fur"), Point(0,0))
local trim = sheet("Silhouette trim")
if app.params.native then
  local body = sheet("Body isolated with original tail mask (locked)")
  for pixel in trim:pixels() do
    if app.pixelColor.rgbaA(pixel()) ~= 0 then body:drawPixel(pixel.x, pixel.y, 0) end
  end
  body:drawImage(paint, Point(0,0))
  assert(body:saveAs(app.params.native))
end
local prefix = assert(app.params.output) .. "/" .. assert(app.params.breed)
paint:resize(320, 320)
trim:resize(320, 320)
assert(paint:saveAs(prefix .. ".png"))
assert(trim:saveAs(prefix .. "-erase.png"))

-- Build the body without its old baked tail, retaining native 80px coordinates.
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

local body = sheet("Body isolated with build62 tail mask (locked)")
local trim = sheet("Silhouette trim")
for pixel in trim:pixels() do
  if app.pixelColor.rgbaA(pixel()) ~= 0 then body:drawPixel(pixel.x, pixel.y, 0) end
end
body:drawImage(sheet("Warm-brown contour"), Point(0,0))
body:drawImage(sheet("Local fur at old ink"), Point(0,0))
if app.params.native then assert(body:saveAs(app.params.native)) end
body:resize(320, 320)
assert(body:saveAs(assert(app.params.output) .. "/orange-body-outline-v11.png"))

-- Composite the approved retouch over the original body, on the 320px runtime grid.
local sprite = assert(app.activeSprite)
assert(sprite.width == 80 and sprite.height == 80 and #sprite.frames == 1 and sprite.colorMode == ColorMode.RGB)
local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end

local body = Image(sprite.spec)
for _, name in ipairs({"body", "left-front-leg-outline"}) do
  local cel = assert(assert(layers[name], name):cel(1))
  body:drawImage(cel.image, cel.position)
end

local scale = 4
local runtime = Image(sprite.width * scale, sprite.height * scale, sprite.colorMode)
for pixel in runtime:pixels() do
  pixel(body:getPixel(math.floor(pixel.x / scale), math.floor(pixel.y / scale)))
end
assert(runtime:saveAs(assert(app.params.output) .. "/orange-foreleg-v4.png"))

-- Export the approved 80px patches and split the erasure layer by replaceable part.
local sprite = assert(app.activeSprite)
local output = assert(app.params.output)
assert(sprite.width == 80 and sprite.height == 80 and #sprite.frames == 1 and sprite.colorMode == ColorMode.RGB)

local function layerImage(name)
  for _, layer in ipairs(sprite.layers) do
    if layer.name == name then
      local cel = assert(layer:cel(1), name)
      local image = Image(sprite.spec)
      image:drawImage(cel.image, cel.position)
      return image
    end
  end
  error("Missing layer: " .. name)
end

local regions = {
  ["ear-left"] = Rectangle(0, 0, 40, 24),
  ["ear-right"] = Rectangle(40, 0, 40, 24),
  whiskers = Rectangle(0, 24, 80, 56),
}
local erase = layerImage("erase")
for _, name in ipairs({"ear-left", "ear-right", "whiskers", "mouth"}) do
  assert(layerImage(name):saveAs(output .. "/" .. name .. ".png"))
  local region = regions[name]
  if region then
    local mask = Image(sprite.spec)
    for pixel in erase:pixels(region) do
      mask:putPixel(pixel.x, pixel.y, pixel())
    end
    assert(mask:saveAs(output .. "/" .. name .. "-erase.png"))
  end
end

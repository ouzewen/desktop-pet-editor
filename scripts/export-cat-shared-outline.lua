local sprite = assert(app.activeSprite)
assert(sprite.width == 80 and sprite.height == 80 and #sprite.frames == 1)
local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end

local function draw(image, name, mirror)
  local cel = assert(assert(layers[name], name):cel(1), name)
  image:drawImage(cel.image, cel.position)
  if mirror then
    for x = 0, 37 do
      for y = 0, 79 do
        image:drawPixel(75 - x, y, image:getPixel(x, y))
      end
    end
  end
end

local function export(name, layer, mirror, former)
  local image = Image(sprite.spec)
  if former then draw(image, former) end
  draw(image, layer, mirror)
  assert(image:saveAs(assert(app.params.output) .. "/" .. name .. ".png"))
end

export("body", "Left shoulder to hindleg", true)
export("legs", "Left foreleg and paw structure", true)
export("leg-fur", "Remove former leg ink", false, "Legacy leg and paw ink")
export("cheek-fur", "Remove former cheek ink")

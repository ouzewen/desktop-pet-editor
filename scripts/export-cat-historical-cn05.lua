local sprite = assert(app.activeSprite)
assert(sprite.width == 80 and sprite.height == 80 and #sprite.frames == 1)
local output = assert(app.params.output)
local names = {["CN05"] = "CN05", ["Li Hua lip backing"] = "li-hua-backing"}
local exported = 0
for _, layer in ipairs(sprite.layers) do
  local name = names[layer.name]
  if name then
    local cel = assert(layer:cel(1), "Missing cel in " .. layer.name)
    local spriteImage = Image(sprite.spec)
    spriteImage:drawImage(cel.image, cel.position)
    local packed = Image(320, 320, ColorMode.RGB)
    for point in packed:pixels() do
      point(spriteImage:getPixel(math.floor(point.x / 4), math.floor(point.y / 4)))
    end
    assert(packed:saveAs(output .. "/" .. name .. ".png"))
    exported = exported + 1
  end
end
assert(exported == 2, "Missing required CN05 layers")

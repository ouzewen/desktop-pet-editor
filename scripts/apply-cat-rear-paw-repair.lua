local sprite = assert(app.activeSprite, "Open the current 80px stock sprite")
assert(sprite.width == 80 and sprite.height == 80 and sprite.colorMode == ColorMode.RGB)
local id = assert(app.params.id, "Missing breed ID")
local stock = Image(sprite.spec)
stock:drawSprite(sprite, 1, Point(0, 0))
local repair = Image(sprite.spec)
local left = id == "ragdoll" and Point(18, 65) or Point(17, 66)
for _, cell in ipairs({ {18, left}, {57, Point(58, 66)} }) do
  local x, donor = cell[1], cell[2]
  local color = stock:getPixel(donor.x, donor.y)
  assert(app.pixelColor.rgbaA(color) == 255 and app.pixelColor.rgbaA(stock:getPixel(x, 66)) == 255)
  assert(stock:getPixel(x, 66) ~= color)
  repair:drawPixel(x, 66, color)
end
local layer = sprite:newLayer()
layer.name = "Rear-paw seam cleanup"
sprite:newCel(layer, 1, repair, Point(0, 0))
sprite:saveAs(assert(app.params.output, "Missing output file"))

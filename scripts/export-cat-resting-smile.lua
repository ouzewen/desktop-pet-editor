local sprite = assert(app.activeSprite)
assert(sprite.width == 80 and sprite.height == 80 and #sprite.frames == 1)
local names = {["Smile line mask"]="resting-smile", ["Restore former corners"]="resting-smile-restore"}
if app.params.reviewed == "yes" then
  names = {["Reviewed mouth ink"]="resting-smile-reviewed", ["Reviewed fur paint"]="resting-smile-reviewed-fur"}
end
for _, layer in ipairs(sprite.layers) do
  local key = names[layer.name]
  if key then
    local cel = assert(layer:cel(1))
    local image = Image(sprite.spec)
    image:drawImage(cel.image, cel.position)
    assert(image:saveAs(assert(app.params.output) .. "/" .. key .. ".png"))
  end
end

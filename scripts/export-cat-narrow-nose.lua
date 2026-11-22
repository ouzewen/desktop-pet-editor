-- Export the approved x37 nose and mouth as a transparent local retouch.
local sprite = assert(app.activeSprite)
assert(sprite.width == 80 and sprite.height == 80 and #sprite.frames == 1)
local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end
local sheet = Image(sprite.spec)
for _, name in ipairs({"Build 58 B (export base)", "Restore native fur", "x37 nose", "x37 smile"}) do
  local cel = assert(assert(layers[name], name):cel(1))
  sheet:drawImage(cel.image, cel.position)
end
assert(sheet:saveAs(assert(app.params.output) .. "/nose-mouth-x37.png"))

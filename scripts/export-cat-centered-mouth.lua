-- Export the approved transparent mouth overlay. The base cel is the original
-- B3 overlay, not the whole head or nose.
local sprite = assert(app.activeSprite)
assert(sprite.width == 80 and sprite.height == 80 and #sprite.frames == 1)
local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end
local sheet = Image(sprite.spec)
for _, name in ipairs({"Build 57 B3 mouth (export base)", "Restore local fur", "A - Centered smile", "B - Softer philtrum"}) do
  local cel = assert(assert(layers[name], name):cel(1))
  sheet:drawImage(cel.image, cel.position)
end
assert(sheet:saveAs(assert(app.params.output) .. "/mouth-b.png"))

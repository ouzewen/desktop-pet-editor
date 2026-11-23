local sprite = assert(app.activeSprite)
local names = {}
for _, layer in ipairs(sprite.layers) do names[layer.name] = layer end
for _, side in ipairs({"Left", "Right"}) do
  local mask = Image(sprite.spec)
  for _, role in ipairs({"main", "shadow"}) do
    local cel = assert(names[side .. " " .. role]:cel(1))
    mask:drawImage(cel.image,cel.position)
  end
  assert(mask:saveAs(app.params.output .. "/CE01-" .. side:lower() .. "-mask.png"))
end

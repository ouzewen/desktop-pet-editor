local sprite = assert(app.activeSprite)
assert(sprite.width == 80 and sprite.height == 80 and #sprite.frames == 1)
local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end

local function export(key, names)
  local image = Image(sprite.spec)
  for _, name in ipairs(names) do
    local cel = assert(assert(layers[name], name):cel(1))
    image:drawImage(cel.image, cel.position)
  end
  if app.params.native then
    assert(image:saveAs(app.params.native .. "/" .. key .. ".png"))
  end
  image:resize(320, 320)
  assert(image:saveAs(assert(app.params.output) .. "/" .. key .. ".png"))
end

if app.params.pattern == "sampled-reference" then
  export("head", {"Registered face fur"})
  export("ears", {"Registered standing ears"})
  export("body", {"Registered torso", "Registered resting toes"})
  export("tail", {"Registered straight tail"})
elseif app.params.pattern == "reference-cheeks" then
  export("head", {"Face and chin shading", "V14 crown M", "V15 brow tabs", "V15 outer-eye bands", "V15 lower cheek sweeps"})
elseif app.params.pattern == "libtv" then
  export("head", {"Face and chin shading", "V14 crown M", "V14 cheek sweeps"})
  export("body", {"Chest and paw shading", "V14 shoulder sweeps", "V14 leg bars", "Mirrored toe color"})
else
  export("head", {"Face and chin shading", "Forehead M", "Cheek stripes"})
  export("body", {"Chest and paw shading", "Shoulder and flank stripes", "Mirrored toe color"})
end

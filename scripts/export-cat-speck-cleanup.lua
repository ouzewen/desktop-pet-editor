-- Export the sparse native-grid repairs at the runtime front-layer scale.
local sprite = assert(app.activeSprite)
assert(sprite.width == 80 and sprite.height == 80 and #sprite.frames == 1)
local files = {
  ["Clean neck and cheek"] = "head",
  ["Correct left upright ear seam"] = "left-standing-ear",
  ["Rear paw outline"] = "rear-paw",
  ["Body-tail seam outline"] = "tail-seam",
}
for _, layer in ipairs(sprite.layers) do
  local kind = files[layer.name]
  if kind then
    local cel = assert(layer:cel(1))
    local image = Image(sprite.spec)
    image:drawImage(cel.image, cel.position)
    image:resize(320, 320)
    assert(image:saveAs(assert(app.params.output) .. "/" .. kind .. ".png"))
  end
end

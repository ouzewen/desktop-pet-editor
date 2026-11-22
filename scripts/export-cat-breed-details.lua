-- Export each authored rest-pose piece from an 80×80 source.
local sprite = assert(app.activeSprite)
assert(sprite.width == 80 and sprite.height == 80 and #sprite.frames == 1, string.format("Unexpected source %s: %dx%d, %d frames", sprite.filename, sprite.width, sprite.height, #sprite.frames))
local files = {
  ["Nose and fine smile"] = "nose",
  ["Whiskers B3"] = "whiskers",
  ["Old whiskers erase"] = "whiskers-erase",
  ["Standing ear tips"] = "standing-ears",
  ["Paw shapes and ankle"] = "paws",
  ["Paw silhouette erase"] = "paws-erase",
}
for _, layer in ipairs(sprite.layers) do
  local file = files[layer.name]
  if file then
    local cel = assert(layer:cel(1))
    local image = Image(sprite.spec)
    image:drawImage(cel.image, cel.position)
    assert(image:saveAs(assert(app.params.output) .. "/" .. file .. ".png"))
  end
end

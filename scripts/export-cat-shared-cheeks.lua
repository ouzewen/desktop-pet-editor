local sprite = assert(app.activeSprite, "Open the shared tabby cheek drawing")
assert(sprite.width == 80 and sprite.height == 80 and sprite.colorMode == ColorMode.RGB)
local directory = assert(app.params.output, "Missing output directory")
local outputs = {
  ["stripes"] = { ["Left cheek stripes"] = true, ["Right cheek stripes"] = true },
  ["orange-restore"] = { ["Orange cheek underpaint"] = true },
  ["li-hua-restore"] = { ["Li Hua cheek underpaint"] = true },
}
for name, layers in pairs(outputs) do
  for _, layer in ipairs(sprite.layers) do layer.isVisible = layers[layer.name] == true end
  local image = Image(80, 80, ColorMode.RGB)
  image:drawSprite(sprite, 1, Point(0, 0))
  assert(image:saveAs(app.fs.joinPath(directory, name .. ".png")))
end

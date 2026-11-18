-- Export one registered layer onto its original full canvas.
local sprite = assert(app.activeSprite, "Open the source sprite")
local name = assert(app.params.layer, "Missing layer argument")
local frame = tonumber(app.params.frame or "1")
local layer
for _, candidate in ipairs(sprite.layers) do
  if candidate.name == name then layer = candidate break end
end
local cel = assert(layer and layer:cel(frame), "Missing layer or frame: " .. name)
local image = Image(sprite.width, sprite.height, sprite.colorMode)
image:drawImage(cel.image, cel.position)
image:saveAs(assert(app.params.file, "Missing output file argument"))

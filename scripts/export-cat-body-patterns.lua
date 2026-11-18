-- Export the three independent body-pattern masks for each pose into RGB channels.
local sprite = assert(app.activeSprite, "Open front-body-patterns.aseprite")
local output = assert(app.params.output, "Set --script-param output to an existing directory")
assert(sprite.width == 320 and sprite.height == 320 and sprite.colorMode == ColorMode.RGB,
       "Expected a 320x320 RGB sprite")

local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end
local names = { "mackerel", "classic", "spotted" }
local rgba = app.pixelColor.rgba
local red, green, blue, alpha = app.pixelColor.rgbaR, app.pixelColor.rgbaG, app.pixelColor.rgbaB, app.pixelColor.rgbaA

for _, tag in ipairs(sprite.tags) do
  local frame = tag.fromFrame.frameNumber
  assert(frame == tag.toFrame.frameNumber, "Use one tagged frame per body layer")
  local image = Image(320, 320, ColorMode.RGB)
  for channel, name in ipairs(names) do
    local layer = assert(layers[name], "Missing pattern layer " .. name)
    local cel = assert(layer:cel(frame), "Missing mask " .. name .. " for " .. tag.name)
    for pixel in cel.image:pixels() do
      local opacity = alpha(pixel())
      if opacity ~= 0 then
        local x, y = pixel.x + cel.position.x, pixel.y + cel.position.y
        local previous = image:getPixel(x, y)
        image:drawPixel(x, y, rgba(
          channel == 1 and opacity or red(previous),
          channel == 2 and opacity or green(previous),
          channel == 3 and opacity or blue(previous),
          255
        ))
      end
    end
  end
  image:saveAs(app.fs.joinPath(output, tag.name .. ".png"))
end

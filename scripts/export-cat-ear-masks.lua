-- Export the shared ear-root masks from the tagged frames in Aseprite.
local sprite = assert(app.activeSprite, "Open front-ear-masks.aseprite")
local output = assert(app.params.output, "Set --script-param output to an existing directory")
assert(sprite.width == 320 and sprite.height == 320 and sprite.colorMode == ColorMode.RGB,
       "Expected a 320x320 RGB sprite")

local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end
local left, right = layers.ear_left_mask, layers.ear_right_mask
assert(left and right, "Missing left or right ear mask layer")
local rgba = app.pixelColor.rgba
local red, green, blue, alpha = app.pixelColor.rgbaR, app.pixelColor.rgbaG, app.pixelColor.rgbaB, app.pixelColor.rgbaA

for _, tag in ipairs(sprite.tags) do
  local frame = tag.fromFrame.frameNumber
  assert(frame == tag.toFrame.frameNumber, "Use one tagged frame per ear shape")
  local image = Image(320, 320, ColorMode.RGB)
  for side, layer in ipairs({ left, right }) do
    local cel = assert(layer:cel(frame), "Missing mask for " .. tag.name)
    for pixel in cel.image:pixels() do
      local color = pixel()
      if alpha(color) ~= 0 and red(color) > 0 then
        local x, y = pixel.x + cel.position.x, pixel.y + cel.position.y
        assert(alpha(color) == 255 and red(color) == green(color) and red(color) == blue(color),
               "Use solid gray pixels for blend strength")
        assert(alpha(image:getPixel(x, y)) == 0, "Left and right ear masks overlap")
        image:drawPixel(x, y, rgba(side == 1 and red(color) or 0, side == 2 and red(color) or 0, 0, 255))
      end
    end
  end
  image:saveAs(app.fs.joinPath(output, tag.name .. ".png"))
end

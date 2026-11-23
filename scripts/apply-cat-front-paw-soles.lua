-- Open the shared guide in Aseprite batch mode. Generate editable, versioned
-- cousins of the approved v25 idle sources; the original cels stay locked.
local guide = assert(app.activeSprite, "Open front-paw-soles.aseprite")
local input = assert(app.params.input, "Set the v25 source directory")
local output = assert(app.params.output, "Set the v26 source directory")
local marker = app.pixelColor
local mask = assert(guide.layers[1]:cel(1))
local targets = {}
for y = 0, mask.image.height - 1 do
  for x = 0, mask.image.width - 1 do
    local color = mask.image:getPixel(x, y)
    if marker.rgbaA(color) > 0 then
      local sx, sy = x + mask.position.x, y + mask.position.y
      targets[#targets + 1] = {sx, sy, sx + marker.rgbaR(color) - 128, sy + marker.rgbaG(color) - 128}
    end
  end
end
assert(#targets > 0)
app.fs.makeDirectory(output)
for _, filename in ipairs(app.fs.listFiles(input)) do
  if app.fs.fileExtension(filename) == "aseprite" and app.fs.fileTitle(filename) ~= "CE01-inner-ear-shared" then
    local cat = assert(app.open(app.fs.joinPath(input, filename)))
    assert(cat.width == 80 and cat.height == 80 and cat.colorMode == ColorMode.RGB)
    local composite = Image(cat.spec)
    composite:drawSprite(cat, 1, Point(0, 0))
    local patch = Image(cat.spec)
    for _, point in ipairs(targets) do
      local x, y, sx, sy = table.unpack(point)
      local fur = composite:getPixel(sx, sy)
      for _, neighbor in ipairs({{x,y}, {x-1,y}, {x+1,y}, {x,y+1}, {sx,sy}}) do
        assert(marker.rgbaA(composite:getPixel(table.unpack(neighbor))) == 255, filename)
      end
      assert(marker.rgbaA(composite:getPixel(x, y+2)) == 0, filename)
      patch:drawPixel(x, y, fur)
    end
    for _, layer in ipairs(cat.layers) do layer.isEditable = false end
    local layer = cat:newLayer()
    layer.name = "Front soles - restore local fur"
    cat:newCel(layer, 1, patch, Point(0, 0))
    cat:saveAs(app.fs.joinPath(output, app.fs.fileName(filename)))
    cat:close()
  end
end

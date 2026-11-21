local root = assert(app.params.root)
local sampling = dofile(app.fs.joinPath(root, "scripts/cat-pixel80-grid.lua"))
local documents = {}
local order = {}

for line in io.lines(assert(app.params.manifest)) do
  local fields = {}
  for value in line:gmatch("[^\t]+") do fields[#fields + 1] = value end
  local name, layer, key = fields[1], fields[2], fields[3]
  if not documents[name] then
    documents[name] = {}
    order[#order + 1] = name
  end
  local durations = {}
  for value in fields[13]:gmatch("[^,]+") do durations[#durations + 1] = tonumber(value) end
  local part = { layer = layer, key = key, durations = durations }
  local names = { "width", "height", "x", "y", "cellWidth", "cellHeight", "columns", "frames", "minimum" }
  for index, field in ipairs(names) do part[field] = assert(tonumber(fields[index + 3])) end
  documents[name][#documents[name] + 1] = part
end

local function cellOrigin(part, frame)
  return Point((frame - 1) % part.columns * part.cellWidth, (frame - 1) // part.columns * part.cellHeight)
end

local function draft(parts, file)
  local sprite = Sprite(80, 80, ColorMode.RGB)
  local blank = sprite.layers[1]
  local frames = 1
  for _, part in ipairs(parts) do frames = math.max(frames, part.frames) end
  for frame = 2, frames do sprite:newEmptyFrame(frame) end
  for _, part in ipairs(parts) do
    local layer = sprite:newLayer()
    layer.name = part.layer
    local png = assert(app.open(app.fs.joinPath(root, "public/assets", part.key .. ".png")))
    local original = Image(png.spec)
    local cel = assert(png.cels[1])
    original:drawImage(cel.image, cel.position)
    png:close()
    for frame = 1, part.frames do
      sprite.frames[frame].duration = (part.durations[frame] or part.durations[1]) / 1000
      local origin = cellOrigin(part, frame)
      local tile = Image(original, Rectangle(origin.x, origin.y, part.cellWidth, part.cellHeight))
      local image, position = sampling.merge(tile, part.x, part.y, part.cellWidth, part.cellHeight, part.minimum)
      if not image:isEmpty() then sprite:newCel(layer, frame, image, position) end
    end
  end
  sprite:deleteLayer(blank)
  sprite:saveAs(file)
  return sprite
end

local function getLayer(sprite, name)
  for _, layer in ipairs(sprite.layers) do
    if layer.name == name then return layer end
  end
  error("Missing layer " .. name)
end

local function export(sprite, part)
  local layers = {}
  for name in part.layer:gmatch("[^+]+") do layers[#layers + 1] = getLayer(sprite, name) end
  local sheet = Image(part.width, part.height, ColorMode.RGB)
  for frame = 1, part.frames do
    local canvas = Image(sprite.spec)
    for _, layer in ipairs(layers) do
      local cel = layer:cel(frame)
      if cel then canvas:drawImage(cel.image, cel.position) end
    end
    local tile = sampling.expand(canvas, part.cellWidth, part.cellHeight, part.x, part.y)
    sheet:drawImage(tile, cellOrigin(part, frame))
  end
  local file = app.fs.joinPath(root, "output/cat-pixel80/assets", part.key .. ".png")
  app.fs.makeAllDirectories(app.fs.filePath(file))
  assert(sheet:saveAs(file), "Could not write " .. file)
end

for _, name in ipairs(order) do
  local parts = documents[name]
  local file = app.fs.joinPath(root, "art/cat-pixel80", name .. ".aseprite")
  local sprite = app.fs.isFile(file) and assert(app.open(file)) or draft(parts, file)
  assert(sprite.width == 80 and sprite.height == 80 and sprite.colorMode == ColorMode.RGB, file)
  for _, part in ipairs(parts) do export(sprite, part) end
  sprite:close()
end


-- Match the cutout in the exported 80px heat cels to the shared paw badge.
if app.params.heat then
  local fields = {}
  for field in app.params.heat:gmatch("[^,]+") do fields[#fields + 1] = field end
  local key = fields[1]
  local x, y, width, height, columns, frames = tonumber(fields[2]), tonumber(fields[3]),
    tonumber(fields[4]), tonumber(fields[5]), tonumber(fields[6]), tonumber(fields[7])
  local original = assert(app.open(app.fs.joinPath(root, "output/cat-pixel80/assets", key .. ".png")))
  local sheet = Image(original.spec)
  sheet:drawSprite(original, 1, Point(0, 0))
  original:close()
  local source = assert(app.open(app.fs.joinPath(root, "art/cat-pixel80/typing-gentle.aseprite")))
  local cel = assert(getLayer(source, "paw_badge"):cel(1))
  local badge = Image(source.spec)
  badge:drawImage(cel.image, cel.position)
  local alpha = app.pixelColor.rgbaA
  for frame = 0, frames - 1 do
    local ox, oy = frame % columns * width - x, frame // columns * height - y
    local panel = sheet:getPixel(ox + 122, oy + 208)
    if alpha(panel) > 0 then
      for py = 204, 251 do
        for px = 124, 179 do
          local clean = badge:getPixel(px // 4, py // 4)
          sheet:drawPixel(ox + px, oy + py, alpha(clean) > 0 and 0 or panel)
        end
      end
    end
  end
  source:close()
  local file = app.fs.joinPath(root, "output/cat-pixel80/assets", key .. ".png")
  app.fs.makeAllDirectories(app.fs.filePath(file))
  assert(sheet:saveAs(file), "Could not write " .. file)
end

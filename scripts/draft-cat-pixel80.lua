-- Draft an 80px source from the registered art and stage exports at their runtime size.
local appRoot = assert(app.params.root)
local work = app.fs.joinPath(appRoot, "output/cat-pixel80")
local source = app.fs.joinPath(appRoot, "art/cat-pixel80")
local rgba = app.pixelColor
local grid = 4
local size = 80

local function read(path)
  local sprite = assert(app.open(app.fs.joinPath(appRoot, "public/assets", path .. ".png")))
  local image = Image(sprite.spec)
  local cel = sprite.cels[1]
  image:drawImage(cel.image, cel.position)
  sprite:close()
  return image
end

local function write(image, path)
  app.fs.makeAllDirectories(app.fs.filePath(path))
  assert(image:saveAs(path), "Could not write " .. path)
end

local sampling = dofile(app.fs.joinPath(appRoot, "scripts/cat-pixel80-grid.lua"))
local merge, expand = sampling.merge, sampling.expand

local function addLayer(sprite, name)
  local layer = sprite:newLayer()
  layer.name = name
  return layer
end

local orange = "cat/new_/CAT_"
local face = "cat/hd/face-parts/"
local tail = "cat/hd/tails/"
local typing = "cat/hd/typing-front/"
local parts = {
  { "body", orange .. "body", 8 },
  { "tail_removal", tail .. "idle_remove", 8, true },
  { "tail", tail .. "idle_CT05", 8 },
  { "tail_pattern_mask", tail .. "idle_CT05_patterns", 8, true },
  { "head", orange .. "head_base", 8 },
  { "ears", orange .. "ear_upright", 8 },
  { "iris", orange .. "iris", 7 },
  { "eye_glints", orange .. "eye_glints", 4 },
  { "nose", face .. "noses/NO05", 6 },
  { "mouth_skin", face .. "mouths/skin_cleanup", 7, true },
  { "smile", face .. "mouths/CN08", 4 },
}

local function narrowSmile(image, original)
  image:clear()
  local ink = original:getPixel(150, 132)
  assert(rgba.rgbaA(ink) > 0, "Expected smile ink at the original anchor")
  local rows = { "....#....", "....#....", "....#....", "#..#.#..#", ".##...##." }
  for row, line in ipairs(rows) do
    for column = 1, #line do
      if line:sub(column, column) == "#" then image:drawPixel(32 + column, 30 + row, ink) end
    end
  end
end

for _, filename in ipairs({"orange-front.aseprite", "typing-gentle.aseprite"}) do
  assert(not app.fs.isFile(app.fs.joinPath(source, filename)), "Already drafted: " .. filename)
end
local sprite = Sprite(size, size, ColorMode.RGB)
local empty = sprite.layers[1]
for _, part in ipairs(parts) do
  local name, path, minimum, hidden = table.unpack(part)
  local original = read(path)
  assert(original.width == size * grid and original.height == size * grid, path)
  local image = merge(original, 0, 0, original.width, original.height, minimum)
  if name == "smile" then narrowSmile(image, original) end
  local layer = addLayer(sprite, name)
  sprite:newCel(layer, 1, image, Point(0, 0))
  layer.isVisible = not hidden
  write(expand(image, original.width, original.height, 0, 0), app.fs.joinPath(work, "assets", path .. ".png"))
end
sprite:deleteLayer(empty)
sprite:saveAs(app.fs.joinPath(source, "orange-front.aseprite"))
sprite:close()

local function frameAtlas(sprite, layer, path, count, columns, x, y, width, height, minimum)
  local original = read(path)
  assert(original.width == width * columns and original.height == height * math.ceil(count / columns), path)
  local sheet = Image(original.spec)
  for frame = 1, count do
    local cellX, cellY = (frame - 1) % columns * width, (frame - 1) // columns * height
    local cel = Image(original, Rectangle(cellX, cellY, width, height))
    local merged, origin = merge(cel, x, y, width, height, minimum)
    if not merged:isEmpty() then sprite:newCel(layer, frame, merged, origin) end
    sheet:drawImage(expand(merged, width, height, x % grid, y % grid), Point(cellX, cellY))
  end
  write(sheet, app.fs.joinPath(work, "assets", path .. ".png"))
end

local motion = Sprite(size, size, ColorMode.RGB)
local first = motion.layers[1]
for frame = 1, 64 do
  if frame > 1 then motion:newEmptyFrame(frame) end
  motion.frames[frame].duration = 0.070
end
local laptop = merge(read(typing .. "laptop"), 0, 0, 320, 320, 8)
local laptopLayer = addLayer(motion, "laptop")
for frame = 1, 64 do motion:newCel(laptopLayer, frame, laptop, Point(0, 0)) end
write(expand(laptop, 320, 320, 0, 0), app.fs.joinPath(work, "assets", typing .. "laptop.png"))
local paws = addLayer(motion, "paws")
frameAtlas(motion, paws, typing .. "paws", 16, 8, 48, 140, 208, 49, 4)
-- Repeat the source paw cycle over the falling-letter timeline.
for frame = 17, 64 do
  local cel = paws:cel((frame - 1) % 16 + 1)
  if cel then motion:newCel(paws, frame, cel.image, cel.position) end
end
frameAtlas(motion, addLayer(motion, "falling_letters"), "cat/hd/typing-falling/gentle", 64, 8, 0, 90, 320, 200, 3)
motion:deleteLayer(first)
motion:saveAs(app.fs.joinPath(source, "typing-gentle.aseprite"))

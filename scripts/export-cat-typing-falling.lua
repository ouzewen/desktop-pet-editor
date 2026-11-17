local sprite = assert(app.activeSprite)
local output = assert(app.params.output)
local mode = assert(app.params.mode)
local frames = assert(tonumber(app.params.frames))
local columns = assert(tonumber(app.params.columns))
local durations = {gentle=0.070, fast=0.040, frenzy=0.020}
local duration = assert(durations[mode])
assert(sprite.width == 320 and sprite.height == 320 and sprite.colorMode == ColorMode.RGB)
assert(#sprite.frames == frames)
for _, frame in ipairs(sprite.frames) do assert(math.abs(frame.duration-duration) < 0.0001) end
app.fs.makeAllDirectories(output)

local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end
local function frame(names, index)
  local image = Image(sprite.spec)
  for _, name in ipairs(names) do
    local cel = assert(layers[name], "Missing layer " .. name):cel(index)
    if cel then image:drawImage(cel.image, cel.position) end
  end
  return image
end
local function save(image, name)
  image:saveAs(app.fs.joinPath(output, name .. ".png"))
end
local alpha = app.pixelColor.rgbaA
local function atlas(part, names, coverWithLaptop)
  local dimensions = {}
  for value in assert(app.params[part]):gmatch("%d+") do dimensions[#dimensions+1] = tonumber(value) end
  local x, y, width, height, count = table.unpack(dimensions)
  assert(frames % count == 0 and count % columns == 0)
  local sheet = Image(width*columns,height*count/columns,ColorMode.RGB)
  local repeated = {}
  for index=1,frames do
    local image = frame(names,index)
    local cover = coverWithLaptop and frame({"front_laptop"},index)
    local cropped = Image(width,height,ColorMode.RGB)
    for py=0,sprite.height-1 do for px=0,sprite.width-1 do
      local pixel = image:getPixel(px,py)
      if alpha(pixel) > 0 and (not cover or alpha(cover:getPixel(px,py)) ~= 255) then
        assert(alpha(pixel) == 255, "Expected opaque pixel art in " .. part)
        assert(px >= x and px < x+width and py >= y and py < y+height, "Pixel outside " .. part .. " atlas")
        cropped:putPixel(px-x,py-y,pixel)
      end
    end end
    local step = (index-1)%count
    if index <= count then
      if count < frames then repeated[step+1] = cropped end
      sheet:drawImage(cropped,Point(step%columns*width,math.floor(step/columns)*height))
    else
      assert(cropped:isEqual(repeated[step+1]), part .. " changed between cycles")
    end
  end
  save(sheet,part)
end

atlas(mode,{"letter_bursts","letter_landings"})
if mode == "frenzy" then
  atlas("paws",{"left_paw","right_paw"},true)
  atlas("heat",{"laptop_overheat"})
  atlas("air",{"steam","keystroke_sparks"})
  atlas("sparks",{"keystroke_sparks"})
  atlas("steam",{"steam"})
  atlas("sweat",{"sweat"})
  local authored = frame({"effort_mouth"},30)
  local mouth = Image(sprite.spec)
  local ink = app.pixelColor.rgba(101,51,33,255)
  for y=126,146 do for x=129,172 do
    if authored:getPixel(x,y) == ink then mouth:putPixel(x,y,ink) end
  end end
  assert(not mouth:isEmpty(), "Missing effort mouth ink")
  save(mouth,"mouth")
  save(authored,"mouth_orange")
end

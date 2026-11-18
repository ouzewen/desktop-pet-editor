local sprite = assert(app.activeSprite)
local output = assert(app.params.output)
local columns = assert(tonumber(app.params.columns))
local action = app.params.action
local sources = {
  shredder = {
    eyes = "Satisfied eyes",
    arms = {"Left forearm","Right forearm"},
    props = {"Shredder housing","Green indicator","File sheet","Falling strips","Paper on the floor","Motion marks"},
  },
  zip = {
    eyes = "Satisfied eyes (reused)",
    arms = {"Left forearm press","Right forearm press"},
    props = {"Carton interior","Paper stack edges","Top sheet (reused)","Carton front and flaps","Sealed carton",
      "Carton opening","Left lid flap","Right lid flap","Zipper track","Zipper pull","Press marks (reused)"},
    retreat = {"Left paw behind carton","Right paw behind carton"},
  },
  convert = {
    eyes = "Satisfied eyes (reused)",
    arms = {"Left forearm (reused)","Right forearm (reused)"},
    props = {"Feed rollers (reused)","Input document (reused)","Pink output document","Converter front housing",
      "Green status lamp","Active green button","Rainbow processing panel","Panel glint","Gold sparkles"},
  },
}
local source = assert(sources[action], "Unknown file action")
local layers = {}
for _, layer in ipairs(sprite.layers) do layers[layer.name] = layer end
local durations, closed = {}, {}
for value in app.params.durations:gmatch("%d+") do durations[#durations+1] = tonumber(value) end
for value in app.params.closed:gmatch("%d+") do closed[tonumber(value)+1] = true end
assert(sprite.width == 320 and sprite.height == 320 and sprite.colorMode == ColorMode.RGB)
assert(#sprite.frames == #durations and #durations % columns == 0)
for i, frame in ipairs(sprite.frames) do
  assert(math.floor(frame.duration*1000+0.5)==durations[i], "Unexpected "..action.." frame duration")
  assert((layers[source.eyes]:cel(i)~=nil)==(closed[i]==true), "Unexpected "..action.." expression")
end

local function composite(members, frame)
  local image = Image(sprite.spec)
  for _, name in ipairs(members) do
    local cel = assert(layers[name], "Missing "..action.." layer "..name):cel(frame)
    if cel then image:drawImage(cel.image, cel.position) end
  end
  return image
end

local function saveGroup(name, drawFrame)
  local left, top, width, height = app.params[name]:match("^(%d+),(%d+),(%d+),(%d+)$")
  left, top, width, height = tonumber(left), tonumber(top), tonumber(width), tonumber(height)
  local image = Image(width*columns, height*(#sprite.frames//columns), ColorMode.RGB)
  for i=1,#sprite.frames do
    local frame = drawFrame(i)
    local box = frame:shrinkBounds(0)
    assert(box.width==0 or (box.x>=left and box.y>=top and box.x+box.width<=left+width and box.y+box.height<=top+height),
      name.." outside registered region at frame "..i)
    image:drawImage(Image(frame, Rectangle(left, top, width, height)),
      Point(((i-1)%columns)*width, ((i-1)//columns)*height))
  end
  image:saveAs(output.."/"..name..".png")
end

local paws = {"Left paw (reused)","Right paw (reused)"}
local retreat = source.retreat

saveGroup("arms", function(i) return composite(source.arms, i) end)
saveGroup("props", function(i) return composite(source.props, i) end)
saveGroup("paws", function(i)
  local image = composite(paws, i)
  if retreat and (layers[retreat[1]]:cel(i) or layers[retreat[2]]:cel(i)) then
    local lowered = composite(retreat, i)
    local carton = composite(source.props, i)
    local alpha = app.pixelColor.rgbaA
    for pixel in lowered:pixels() do
      if alpha(carton:getPixel(pixel.x, pixel.y))>0 then pixel(0) end
    end
    lowered:drawImage(image, Point(0, 0))
    return lowered
  end
  return image
end)

local root = app.params.root or app.fs.filePath(assert(app.activeSprite).filename)
local output = assert(app.params.output, "Pass -script-param output=<existing directory>")
local recipe = dofile(app.fs.joinPath(root, "recipes.lua"))
local runtime = app.params.runtime == "1"
local chestWhite = app.params.chestWhite == "1"
local forehead = app.params.forehead == "1"
local preview = runtime or chestWhite or forehead or app.params.preview == "1"
local size = 80
local sprites, layers = {}, {}
local rgbaA = app.pixelColor.rgbaA

local function rootPath(name)
  return app.fs.joinPath(root, name)
end

local function open(id, file)
  local sprite = assert(app.open(rootPath(file)), file)
  assert(sprite.width == size and sprite.height == size and #sprite.frames == 1, file)
  sprites[id], layers[id] = sprite, {}
  local function record(children)
    for _, layer in ipairs(children) do
      if layer.isGroup then
        record(layer.layers)
      else
        assert(not layers[id][layer.name], layer.name)
        layers[id][layer.name] = layer
      end
    end
  end
  record(sprite.layers)
end

local function celImage(id, name)
  local layer = assert(layers[id][name], id .. "/" .. name)
  local image = Image(size, size, ColorMode.RGB)
  local cel = layer:cel(1)
  if cel then image:drawImage(cel.image, cel.position) end
  return image
end

local function singleSwatch(swatch, name)
  local color
  for pixel in swatch:pixels() do
    if rgbaA(pixel()) > 0 then
      color = color or pixel()
      assert(color == pixel() and rgbaA(color) == 255, name .. " must use one opaque swatch")
    end
  end
  return assert(color, name .. " has no swatch")
end

local function paintShared(guide, swatch, name)
  local color = singleSwatch(swatch, name)
  local paint = Image(size, size, ColorMode.RGB)
  for pixel in guide:pixels() do
    if rgbaA(pixel()) > 0 then paint:putPixel(pixel.x, pixel.y, color) end
  end
  return paint
end

local function assemble(cat, substitute, hidden, useShared)
  local result = Image(size, size, ColorMode.RGB)
  for _, slot in ipairs(recipe.slots) do
    local swap = substitute[slot.id]
    if swap ~= false and not hidden(slot.id) then
      local plane = celImage(swap and swap.sprite or cat, swap and swap.layer or slot.id)
      if slot.paintShared then
        plane = paintShared(celImage("shared", slot.guide), plane, slot.id)
      elseif useShared and slot.guide then
        local guide = celImage("shared", slot.guide)
        for pixel in plane:pixels() do
          if rgbaA(pixel()) > 0 then
            assert(rgbaA(guide:getPixel(pixel.x, pixel.y)) > 0,
              ("%s/%s outside shared %s at (%d,%d)"):format(cat, slot.id, slot.guide, pixel.x, pixel.y))
          end
        end
      end
      result:drawImage(plane, Point(0, 0))
    end
  end
  return result
end

local function compare(image, other)
  local diff = 0
  for pixel in image:pixels() do
    if pixel() ~= other:getPixel(pixel.x, pixel.y) then diff = diff + 1 end
  end
  return diff
end

local function assertLocalChanges(before, after, allowed, label)
  local count = 0
  for pixel in before:pixels() do
    if pixel() ~= after:getPixel(pixel.x, pixel.y) then
      assert(allowed(pixel.x, pixel.y), ("%s changed (%d,%d)"):format(label, pixel.x, pixel.y))
      count = count + 1
    end
  end
  assert(count > 0, label .. " made no visible changes")
end

local function write(name, image, baseline)
  local count, colors = 0, {}
  for pixel in image:pixels() do
    local alpha = rgbaA(pixel())
    assert(alpha == 0 or alpha == 255, name .. " contains partial alpha")
    if alpha == 255 then
      local rgb = pixel() % 0x1000000
      if not colors[rgb] then
        colors[rgb] = true
        count = count + 1
      end
    end
  end
  assert(image:saveAs(app.fs.joinPath(output, name .. ".png")), name)
  print(("%s\t%d\t%d"):format(name, count, compare(image, baseline)))
  return count
end

local function hideNothing()
  return false
end

open("shared", recipe.shared)
if not preview then open("variants", recipe.variants) end
for _, id in ipairs(recipe.cats) do open(id, id .. ".aseprite") end

if forehead then
  for _, id in ipairs(recipe.cats) do
    local mask = Image(size, size, ColorMode.RGB)
    local part = celImage(id, "head.forehead")
    for pixel in part:pixels() do
      if rgbaA(pixel()) == 255 then
        mask:putPixel(pixel.x, pixel.y, app.pixelColor.rgba(255, 255, 255, 255))
      end
    end
    assert(mask:saveAs(app.fs.joinPath(output, id .. ".png")))
  end
  return
end

local sides = { "left", "right" }
local earRoles = { "main", "shadow" }
local rgba = app.pixelColor.rgba

-- Pack the same shared role cells used by stock composition into the
-- runtime's two-tone mask. The renderer owns placement for swapped ears.
local runtimeLining = Image(size, size, ColorMode.RGB)
for _, side in ipairs(sides) do
  local outer = celImage("shared", "ear.CE01." .. side)
  local packed = Image(size, size, ColorMode.RGB)
  for i, role in ipairs(earRoles) do
    local guide = celImage("shared", "ear.CE01.lining." .. side .. "." .. role)
    for pixel in guide:pixels() do
      if rgbaA(pixel()) > 0 then
        assert(rgbaA(outer:getPixel(pixel.x, pixel.y)) == 255, side .. " liner outside ear")
        assert(rgbaA(packed:getPixel(pixel.x, pixel.y)) == 0, side .. " liner roles overlap")
        local tone = i == 1 and 255 or 112
        packed:putPixel(pixel.x, pixel.y, rgba(tone, tone, tone, 255))
      end
    end
  end
  if runtime then
    -- Keep this historical lining footprint separate. Layered CE01 has
    -- its own fur restoration and must not receive the stock-only colors.
    runtimeLining:drawImage(celImage("shared", "ear.CE01.lining." .. side), Point(0, 0))
    runtimeLining:drawImage(packed, Point(0, 0))
    assert(packed:saveAs(app.fs.joinPath(output, "CE01-" .. side .. "-mask.png")))
  end
end

local function saveEarSwatches(id)
  local swatches = Image(4, 1, ColorMode.RGB)
  for sideIndex, side in ipairs(sides) do
    for roleIndex, role in ipairs(earRoles) do
      local name = "ear." .. side .. ".liner." .. role
      swatches:putPixel((sideIndex - 1) * 2 + roleIndex - 1, 0, singleSwatch(celImage(id, name), name))
    end
  end
  assert(swatches:saveAs(app.fs.joinPath(output, id .. "-ear-swatches.png")))
end

-- Values are consumed by cat-coat-recipe.ts. Red identifies pigment;
-- green identifies replaceable parts. Coverage comes from the recipe stack.
local function saveCoatRoles(id)
  local roles = Image(size, size, ColorMode.RGB)
  local function owner(part)
    if part:match("^ear%.left") then return 1 end
    if part:match("^ear%.right") then return 2 end
    if part:match("^eye%.left") then return 3 end
    if part:match("^eye%.right") then return 4 end
    if part == "face.nose" then return 5 end
    if part == "face.mouth" then return 6 end
    if part:match("^tail%.") then return 7 end
    return 0
  end
  local function pigment(part)
    if part:match("^eye%.") or part == "face.nose" or part:match("%.liner%.") then return 3 end
    if part:match("^face%.") then return 4 end
    if part:match("%.ink$") or part == "body.structure" then return 2 end
    return 1
  end
  for _, slot in ipairs(recipe.slots) do
    local plane = celImage(id, slot.id)
    if slot.paintShared then plane = paintShared(celImage("shared", slot.guide), plane, slot.id) end
    local p, part = pigment(slot.id), owner(slot.id)
    for pixel in plane:pixels() do
      if rgbaA(pixel()) == 255 then roles:putPixel(pixel.x, pixel.y, rgba(p, part, 0, 255)) end
    end
  end
  assert(roles:saveAs(app.fs.joinPath(output, id .. "-coat-roles.png")))
end

local function saveFaceBacking(id, suffix, hidden)
  local clean = assemble(id, {}, hidden, true)
  local backing = Image(size, size, ColorMode.RGB)
  for _, slot in ipairs(recipe.slots) do
    if hidden(slot.id) then
      local feature = celImage(id, slot.id)
      for pixel in feature:pixels() do
        if rgbaA(pixel()) == 255 then
          backing:putPixel(pixel.x, pixel.y, clean:getPixel(pixel.x, pixel.y))
        end
      end
    end
  end
  assert(backing:saveAs(app.fs.joinPath(output, id .. suffix .. "-backing.png")))
end

local function saveNativeEditMask(id, image, reference)
  local mask = Image(size, size, ColorMode.RGB)
  for pixel in image:pixels() do
    local x, y = pixel.x, pixel.y
    if pixel() ~= reference:getPixel(x, y) and rgbaA(runtimeLining:getPixel(x, y)) == 0 then
      mask:putPixel(x, y, rgba(255, 255, 255, 255))
    end
  end
  assert(mask:saveAs(app.fs.joinPath(output, id .. "-native-edit-mask.png")))
end

local function chestWhitePatch(id, image, reference)
  local swatch = assert(recipe.chestWhite[id], id)
  local function opaque(color) return rgba(color[1], color[2], color[3], 255) end
  local before, after = opaque(swatch.before), opaque(swatch.after)
  local patch = Image(size, size, ColorMode.RGB)
  assertLocalChanges(reference, image, function(x, y)
    return y >= 61 and y <= 65 and reference:getPixel(x, y) == before and image:getPixel(x, y) == after
  end, id .. " chest and gloves")
  for pixel in image:pixels() do
    if pixel() ~= reference:getPixel(pixel.x, pixel.y) then patch:putPixel(pixel.x, pixel.y, pixel()) end
  end
  return patch
end

if chestWhite then
  for id in pairs(recipe.chestWhite) do
    local reference = Image { fromFile = rootPath("reference/" .. id .. ".png") }
    local image = assemble(id, {}, hideNothing, true)
    local patch = chestWhitePatch(id, image, reference)
    assert(patch:saveAs(app.fs.joinPath(output, id .. ".png")))
    print(id .. " chest and glove cells: " .. compare(image, reference))
  end
  return
end

print("sample\tvisible RGB\tRGBA difference from build84")
local references = {}
for _, id in ipairs(recipe.cats) do
  local reference = Image { fromFile = rootPath("reference/" .. id .. ".png") }
  references[id] = reference
  local locked = assert(layers[id]["Build84 reference - locked"])
  assert(not locked.isVisible and not locked.isEditable, id .. " reference must be hidden and locked")
  assert(compare(celImage(id, locked.name), reference) == 0, id .. " embedded reference")
  local image = assemble(id, {}, hideNothing, true)
  local editorImage = Image(size, size, ColorMode.RGB)
  editorImage:drawSprite(sprites[id], 1, Point(0, 0))
  if not preview then
    assert(compare(image, editorImage) == 0, id .. " Aseprite layer stack differs from recipe")
    if recipe.chestWhite[id] then
      chestWhitePatch(id, image, reference)
    else
      assert(compare(image, reference) == 0, id .. " differs from build84")
    end
  end
  -- The base stock is the frozen v40/v41 source for the two revised
  -- breeds. The v42 patch has its own asset group and never overwrites it.
  local stock = image
  if runtime and recipe.chestWhite[id] then
    stock = Image(size, size, ColorMode.RGB)
    stock:drawImage(reference, Point(0, 0))
  end
  assert(write(id .. "-stock", stock, reference) <= 30, id .. " exceeds 30 colors")
  references[id] = image
  if runtime then
    saveEarSwatches(id)
    saveNativeEditMask(id, stock, reference)
    if app.params.coatRoles == "1" then
      saveCoatRoles(id)
      saveFaceBacking(id, "-mouth", function(name) return name == "face.mouth" end)
      saveFaceBacking(id, "-eyes", function(name) return name:match("^eye%.") end)
    end
  end
  if not preview then
    local function hideFace(name)
      return name:match("^eye%.") or name:match("^face%.")
    end
    local function hideRightEar(name)
      return name:match("^ear%.right%.")
    end
    local faceOff = assemble(id, {}, hideFace, true)
    local faceFootprint = Image(size, size, ColorMode.RGB)
    for _, slot in ipairs(recipe.slots) do
      if hideFace(slot.id) then
        faceFootprint:drawImage(celImage(id, slot.id), Point(0, 0))
      end
    end
    assertLocalChanges(image, faceOff,
      function(x, y) return rgbaA(faceFootprint:getPixel(x, y)) > 0 end, id .. " face off")
    for _, guide in ipairs { "eye.Y01.left", "eye.Y01.right", "nose.NO05", "mouth.CN08" } do
      local footprint = celImage("shared", guide)
      for pixel in footprint:pixels() do
        if rgbaA(pixel()) > 0 then
          assert(rgbaA(faceOff:getPixel(pixel.x, pixel.y)) == 255, id .. " face backing gap")
        end
      end
    end
    local earOff = assemble(id, {}, hideRightEar, true)
    local ear = celImage("shared", "ear.CE01.right")
    assertLocalChanges(image, earOff,
      function(x, y) return rgbaA(ear:getPixel(x, y)) > 0 end, id .. " right ear off")
    write(id .. "-face-off", faceOff, image)
    write(id .. "-right-ear-off", earOff, image)
  end
end

if preview then return end

for _, trial in ipairs(recipe.trials) do
  local allowance = Image(size, size, ColorMode.RGB)
  for id, swap in pairs(trial.substitute) do
    allowance:drawImage(celImage(trial.cat, id), Point(0, 0))
    if swap then allowance:drawImage(celImage(swap.sprite, swap.layer or id), Point(0, 0)) end
  end
  local image = assemble(trial.cat, trial.substitute, hideNothing, false)
  local baseline = references[trial.cat]
  assertLocalChanges(baseline, image,
    function(x, y) return rgbaA(allowance:getPixel(x, y)) > 0 end, trial.id)
  assert(write(trial.id, image, baseline) <= 30, trial.id .. " exceeds 30 colors")
end


-- Add a single interior cell to a copy of the left lining cel. The disk
-- asset is never saved. Restoration must reproduce all frozen frames.
local guide = layers.shared["ear.CE01.lining.left.main"]:cel(1)
local savedImage = Image(guide.image)
local editedImage = Image(savedImage)
local x, y = 21, 10
assert(rgbaA(celImage("shared", "ear.CE01.left"):getPixel(x, y)) == 255)
assert(rgbaA(celImage("shared", "ear.CE01.lining.left.shadow"):getPixel(x, y)) == 0)
local localX, localY = x - guide.position.x, y - guide.position.y
assert(rgbaA(editedImage:getPixel(localX, localY)) == 0)
editedImage:putPixel(localX, localY, app.pixelColor.rgba(255, 255, 255, 255))
guide.image = editedImage
for _, id in ipairs(recipe.cats) do
  local updated = assemble(id, {}, hideNothing, true)
  assertLocalChanges(references[id], updated, function(px, py) return px == x and py == y end,
    id .. " shared CE01 change")
  assert(write(id .. "-CE01-shared-edit-proof", updated, references[id]) <= 30)
end
guide.image = savedImage
for id, reference in pairs(references) do
  assert(compare(assemble(id, {}, hideNothing, true), reference) == 0, id .. " shared mask did not restore")
end
print("Restored shared CE01 mask: all recipe stocks match the unmodified reassembly")

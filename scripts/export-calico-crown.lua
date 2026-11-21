local sprite = assert(app.activeSprite, "Open the calico crown source")
local out = assert(app.params.output, "Missing crown output directory")
for filename, part in pairs({head = "脸侧毛束", ears = "额顶与外耳"}) do
  local image = Image(sprite.width, sprite.height, sprite.colorMode)
  for _, side in ipairs({"左", "右"}) do
    local name = side .. "｜" .. part
    local cel
    for _, layer in ipairs(sprite.layers) do
      if layer.name == name then cel = layer:cel(1); break end
    end
    assert(cel, "Missing crown layer: " .. name)
    image:drawImage(cel.image, cel.position)
  end
  image:saveAs(out .. "/" .. filename .. ".png")
end

for _, group in ipairs(sprite.layers) do
  if group.isGroup and (group.name == "eye-streak" or group.name == "eye-mask" or group.name == "high-cap") then
    for _, layer in ipairs(group.layers) do
      local cel = assert(layer:cel(1), "Missing template layer: " .. layer.name)
      local authored = Image(sprite.width, sprite.height, sprite.colorMode)
      authored:drawImage(cel.image, cel.position)
      authored:saveAs(out .. "/" .. group.name .. "-orange-left-" .. layer.name .. ".png")
      local reversed = Image(sprite.width, sprite.height, sprite.colorMode)
      for p in authored:pixels() do
        local x = 301 - p.x
        if x >= 0 and x < sprite.width then reversed:drawPixel(x, p.y, p()) end
      end
      reversed:saveAs(out .. "/" .. group.name .. "-orange-right-" .. layer.name .. ".png")
    end
  end
end

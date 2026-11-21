local rgba = app.pixelColor
local grid = 4

local function merge(image, ox, oy, width, height, minimum)
  local left, top = ox // grid, oy // grid
  local right, bottom = (ox + width + grid - 1) // grid, (oy + height + grid - 1) // grid
  local result = Image(right - left, bottom - top, ColorMode.RGB)
  for y = top, bottom - 1 do
    for x = left, right - 1 do
      local colors, counts = {}, {}
      local opaque = 0
      -- Visit the center first so ties favor nearby pixels.
      for _, dy in ipairs({1, 2, 0, 3}) do
        for _, dx in ipairs({1, 2, 0, 3}) do
          local px, py = x * grid + dx - ox, y * grid + dy - oy
          if px >= 0 and py >= 0 and px < width and py < height then
            local pixel = image:getPixel(px, py)
            if rgba.rgbaA(pixel) >= 128 then
              opaque = opaque + 1
              pixel = rgba.rgba(rgba.rgbaR(pixel), rgba.rgbaG(pixel), rgba.rgbaB(pixel), 255)
              if not counts[pixel] then
                colors[#colors + 1] = pixel
                counts[pixel] = 0
              end
              counts[pixel] = counts[pixel] + 1
            end
          end
        end
      end
      if opaque >= minimum then
        local selected = colors[1]
        for _, candidate in ipairs(colors) do
          if counts[candidate] > counts[selected] then selected = candidate end
        end
        result:drawPixel(x - left, y - top, selected)
      end
    end
  end
  return result, Point(left, top)
end

local function expand(image, width, height, offsetX, offsetY)
  local result = Image(width, height, ColorMode.RGB)
  for y = 0, height - 1 do
    for x = 0, width - 1 do
      result:drawPixel(x, y, image:getPixel((x + offsetX) // grid, (y + offsetY) // grid))
    end
  end
  return result
end

return { merge = merge, expand = expand }

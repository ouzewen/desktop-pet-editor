-- The visible layers contain the original orange anchors and two new corners.
local sprite = assert(app.activeSprite)
assert(sprite.width == 80 and sprite.height == 80 and #sprite.frames == 1)
local image = Image(sprite.spec)
image:drawSprite(sprite, 1)
image:resize(320, 320)
assert(image:saveAs(assert(app.params.output) .. "/orange-square-v8.png"))

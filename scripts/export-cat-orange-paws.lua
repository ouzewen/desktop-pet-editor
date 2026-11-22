-- Composite the authored static paw pairs over the prepared body.
local sprite = assert(app.activeSprite)
assert(sprite.width == 80 and sprite.height == 80 and #sprite.frames == 1)
local body = Image(sprite.spec)
body:drawSprite(sprite, 1)
body:resize(320, 320)
assert(body:saveAs(assert(app.params.output) .. "/orange-paws-v5.png"))

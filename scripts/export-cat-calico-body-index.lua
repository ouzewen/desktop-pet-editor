local sprite = assert(app.activeSprite, "Open the shared calico body index")
assert(sprite.width == 80 and sprite.height == 80 and sprite.colorMode == ColorMode.INDEXED)
sprite:saveCopyAs(app.fs.joinPath(assert(app.params.output), "body-index.png"))

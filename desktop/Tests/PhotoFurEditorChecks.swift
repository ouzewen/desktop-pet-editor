import Foundation

// Compile with PixelEditor.swift and PixelUI.swift in the standalone test target.
enum DesktopPetStorage {
    static let directoryName = "PhotoFurEditorChecks"
}

@main
enum PhotoFurEditorChecks {
    static func main() throws {
        let width = PixelEditorModel.side
        let row = 120 * width
        let leftFur = row + 101, nose = row + 103, rightFur = row + 105
        let originalColor: UInt32 = 0xFFECA96F
        let protectedColor: UInt32 = 0xFFD77792
        let editColor: UInt32 = 0xFF83CEC3
        var original = Array(repeating: UInt32(0), count: width * width)
        original[leftFur] = originalColor
        original[nose] = protectedColor
        original[rightFur] = originalColor
        let originalPNG = try unwrap(PixelPresetStore.renderPNG(cells: original))
        var mask = Data(repeating: 0, count: original.count)
        mask[leftFur] = 1
        mask[rightFur] = 1
        let fur = PhotoFurEditorSurface(mask: mask, originalPNG: originalPNG)
        let source = Data(#"{"pixelEdits":{"version":1,"scope":"photo-fur","parts":{}}}"#.utf8)
        let model = try unwrap(PixelEditorModel(previewPNG: originalPNG, source: source, fur: fur))
        model.brushSize = 1
        model.chooseColor(editColor & 0xFFFFFF)
        model.paint(column: 99, row: 120)
        model.paint(column: 107, row: 120)
        model.endStroke()
        var painted = original
        painted[leftFur] = editColor
        painted[rightFur] = editColor
        precondition(model.cells == painted)
        precondition(model.pixelChanges == [[UInt32(leftFur), editColor], [UInt32(rightFur), editColor]])
        model.undo()
        precondition(model.cells == original && !model.hasChanges)

        let paintedPNG = try unwrap(PixelPresetStore.renderPNG(cells: painted))
        let reopened = try unwrap(PixelEditorModel(previewPNG: paintedPNG, source: source, fur: fur))
        reopened.brushSize = 1
        reopened.tool = .erase
        reopened.paint(column: 99, row: 120)
        reopened.paint(column: 107, row: 120)
        reopened.endStroke()
        precondition(reopened.cells == original)
        precondition(reopened.pixelChanges == [[UInt32(leftFur), 0], [UInt32(rightFur), 0]])
        reopened.undo()
        precondition(reopened.cells == painted && !reopened.hasChanges)
        reopened.clear()
        precondition(reopened.cells == original)

        let unrestricted = try unwrap(PixelEditorModel(previewPNG: originalPNG))
        unrestricted.brushSize = 1
        unrestricted.tool = .erase
        unrestricted.paint(column: 103, row: 120)
        precondition(unrestricted.cells[nose] == 0)
        print("PASS: stroke over locked pixels, undo, reopen and fur restore, legacy canvas eraser")
    }

    private static func unwrap<T>(_ value: T?) throws -> T {
        guard let value else { throw CocoaError(.coderReadCorrupt) }
        return value
    }
}

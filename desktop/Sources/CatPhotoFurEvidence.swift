import CoreGraphics
import CoreVideo
import Foundation
import ImageIO
import Vision

/// Uses the cat's foreground and facial landmarks to check colors independently of the language model.
enum CatPhotoFurEvidence {
    static func measure(jpeg: Data) -> [String: Any]? {
        guard #available(macOS 14.0, *) else { return nil }
        guard let source = CGImageSourceCreateWithData(jpeg as CFData, nil),
              let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else { return nil }
        var evidence = measure(image) ?? [:]
        if evidence["crownFrontal"] == nil, let padded = letterboxedFace(image), let face = measure(padded),
           face["crownFrontal"] as? Bool == true {
            // Close head crops can miss the animal-pose detector. Use the
            // padded retry only for the local shape measurements around the eyes.
            for key in ["leftCrownLayout", "rightCrownLayout"] { evidence[key] = face[key] }
        }
        return evidence.isEmpty ? nil : evidence
    }

    private static func letterboxedFace(_ image: CGImage) -> CGImage? {
        let size = 640
        guard let space = CGColorSpace(name: CGColorSpace.sRGB),
              let canvas = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: size * 4,
                                     space: space, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
        canvas.setFillColor(red: 0.50, green: 0.47, blue: 0.43, alpha: 1)
        canvas.fill(CGRect(x: 0, y: 0, width: size, height: size))
        let scale = 0.73 * CGFloat(size) / CGFloat(max(image.width, image.height))
        let width = CGFloat(image.width) * scale, height = CGFloat(image.height) * scale
        canvas.draw(image, in: CGRect(x: (CGFloat(size) - width) / 2, y: (CGFloat(size) - height) / 2,
                                      width: width, height: height))
        return canvas.makeImage()
    }

    @available(macOS 14.0, *)
    private static func measure(_ image: CGImage) -> [String: Any]? {
        let pose = VNDetectAnimalBodyPoseRequest()
        let foreground = VNGenerateForegroundInstanceMaskRequest()
        let handler = VNImageRequestHandler(cgImage: image)
        guard (try? handler.perform([pose, foreground])) != nil, pose.results?.count == 1,
              let animal = pose.results?.first, let mask = foreground.results?.first else { return nil }

        let width = image.width, height = image.height
        func point(_ joint: VNAnimalBodyPoseObservation.JointName, minimum: Float = 0.55) -> CGPoint? {
            guard let landmark = try? animal.recognizedPoint(joint), landmark.confidence >= minimum,
                  (0...1).contains(landmark.x), (0...1).contains(landmark.y) else { return nil }
            return CGPoint(x: landmark.x * CGFloat(width), y: (1 - landmark.y) * CGFloat(height))
        }
        guard let nose = point(.nose),
              let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
              let instance = catInstance(mask, at: nose, width: width, height: height),
              let scaledMask = try? mask.generateScaledMaskForImage(forInstances: IndexSet(integer: instance), from: handler),
              CVPixelBufferGetPixelFormatType(scaledMask) == kCVPixelFormatType_OneComponent32Float,
              CVPixelBufferGetWidth(scaledMask) == width, CVPixelBufferGetHeight(scaledMask) == height,
              let bitmap = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8,
                                     bytesPerRow: width * 4, space: colorSpace,
                                     bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue),
              let pixels = bitmap.data?.assumingMemoryBound(to: UInt8.self) else { return nil }
        bitmap.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))

        CVPixelBufferLockBaseAddress(scaledMask, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(scaledMask, .readOnly) }
        guard let maskPixels = CVPixelBufferGetBaseAddress(scaledMask)?.assumingMemoryBound(to: Float.self) else { return nil }
        let maskStride = CVPixelBufferGetBytesPerRow(scaledMask) / MemoryLayout<Float>.stride
        func collect(_ x: Int, _ y: Int, into counts: inout ColorCounts) {
            guard x >= 0, x < width, y >= 0, y < height, maskPixels[y * maskStride + x] >= 0.9 else { return }
            let offset = 4 * (y * width + x)
            counts.add(Int(pixels[offset]), Int(pixels[offset + 1]), Int(pixels[offset + 2]))
        }

        var coat = ColorCounts()
        for y in stride(from: 0, to: height, by: 3) {
            for x in stride(from: 0, to: width, by: 3) { collect(x, y, into: &coat) }
        }
        guard coat.total >= 170 else { return nil }
        var evidence: [String: Any] = [
            "white": coat.share(coat.white), "orange": coat.share(coat.orange), "dark": coat.share(coat.dark),
            "tailVisible": point(.tailMiddle) != nil || point(.tailTop) != nil,
        ]

        let eyes = (point(.leftEye), point(.rightEye))
        let ears = (point(.leftEarBottom, minimum: 0.65), point(.rightEarBottom, minimum: 0.65))
        let faceAligned: Bool
        let firstAnchor: CGPoint, secondAnchor: CGPoint
        if let a = eyes.0, let b = eyes.1, abs(a.x - b.x) >= 17 {
            (firstAnchor, secondAnchor) = (a, b)
            faceAligned = true
        } else if let a = ears.0, let b = ears.1, abs(a.x - b.x) >= 22,
                  abs(a.y - b.y) <= abs(a.x - b.x) * 0.75 {
            (firstAnchor, secondAnchor) = (a, b)
            faceAligned = false
        } else { return evidence }
        let viewerLeftIsAnatomicalLeft = firstAnchor.x < secondAnchor.x
        let (left, right) = viewerLeftIsAnatomicalLeft ? (firstAnchor, secondAnchor) : (secondAnchor, firstAnchor)
        let separation = hypot(right.x - left.x, right.y - left.y)
        let across = CGPoint(x: (right.x - left.x) / separation, y: (right.y - left.y) / separation)
        let midpoint = CGPoint(x: (left.x + right.x) / 2, y: (left.y + right.y) / 2)
        let cross = across.x * (nose.y - midpoint.y) - across.y * (nose.x - midpoint.x)
        guard abs(cross) > 0.18 * separation else { return evidence }
        let along = cross > 0 ? CGPoint(x: -across.y, y: across.x) : CGPoint(x: across.y, y: -across.x)
        evidence["imageLeftAnatomicalSide"] = viewerLeftIsAnatomicalLeft ? "left" : "right"

        func region(_ center: CGPoint, _ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat) -> ColorCounts {
            var result = ColorCounts()
            for row in -5...5 {
                for column in -5...5 where row * row + column * column <= 25 {
                    let u = separation * (x + CGFloat(column) * w / 10)
                    let v = separation * (y + CGFloat(row) * h / 10)
                    collect(Int((center.x + u * across.x + v * along.x).rounded()),
                            Int((center.y + u * across.y + v * along.y).rounded()), into: &result)
                }
            }
            return result
        }

        if let neck = point(.neck, minimum: 0.38), let rump = point(.tailBottom, minimum: 0.42),
           hypot(rump.x - neck.x, rump.y - neck.y) >= separation * 1.35 {
            let torso = [0.36, 0.56, 0.76].map { fraction in
                let center = CGPoint(x: neck.x + fraction * (rump.x - neck.x),
                                     y: neck.y + fraction * (rump.y - neck.y))
                return region(center, 0, 0.15, 0.42, 0.43)
            }.filter { $0.total >= 60 }
            if torso.count >= 2 {
                evidence["torsoVisible"] = true
                evidence["torsoSpan"] = Double(abs(rump.x - neck.x) / separation)
                evidence["torsoWhite"] = torso.allSatisfy { $0.share($0.white) >= 0.66 }
            }
        }

        let leftJoint: VNAnimalBodyPoseObservation.JointName = viewerLeftIsAnatomicalLeft ? .leftFrontPaw : .rightFrontPaw
        let rightJoint: VNAnimalBodyPoseObservation.JointName = viewerLeftIsAnatomicalLeft ? .rightFrontPaw : .leftFrontPaw
        let paired = [(side: "left", joint: leftJoint, other: rightJoint), (side: "right", joint: rightJoint, other: leftJoint)]
        for (side, joint, other) in paired {
            let confidence = (try? animal.recognizedPoint(joint).confidence) ?? 0
            let otherConfidence = (try? animal.recognizedPoint(other).confidence) ?? 0
            let guess = point(joint, minimum: 0.18)
            let neighbor = point(other, minimum: 0.6)
            let overlaps = guess.flatMap { a in neighbor.map { b in
                hypot(a.x - b.x, a.y - b.y) < separation * 0.23
            }} ?? false
            let clipped = guess.map { $0.y >= CGFloat(height) * 0.95 || $0.x <= 3 || $0.x >= CGFloat(width) - 3 } ?? false
            if clipped || (neighbor != nil && (confidence < 0.60 || (overlaps && confidence + 0.08 < otherConfidence))) {
                evidence[side + "PawVisibility"] = "occluded"
                continue
            }
            guard let paw = point(joint, minimum: 0.60), !overlaps || confidence >= otherConfidence + 0.08 else { continue }
            let fur = region(paw, 0, 0, 0.22, 0.16)
            guard fur.total >= 65 else { continue }
            evidence[side + "PawVisibility"] = "visible"
            if fur.share(fur.pale) >= 0.65 && confidence >= 0.66 { evidence[side + "Paw"] = "white" }
            else if fur.share(fur.dark) >= 0.70 && fur.share(fur.pale) <= 0.16 { evidence[side + "Paw"] = "colored" }
        }
        let leftWrist: VNAnimalBodyPoseObservation.JointName = viewerLeftIsAnatomicalLeft ? .leftFrontKnee : .rightFrontKnee
        let rightWrist: VNAnimalBodyPoseObservation.JointName = viewerLeftIsAnatomicalLeft ? .rightFrontKnee : .leftFrontKnee
        let leftPaw: VNAnimalBodyPoseObservation.JointName = viewerLeftIsAnatomicalLeft ? .leftFrontPaw : .rightFrontPaw
        let rightPaw: VNAnimalBodyPoseObservation.JointName = viewerLeftIsAnatomicalLeft ? .rightFrontPaw : .leftFrontPaw
        for (side, wristJoint, pawJoint) in [("left", leftWrist, leftPaw), ("right", rightWrist, rightPaw)] {
            guard evidence[side + "PawVisibility"] as? String == "visible",
                  let wrist = point(wristJoint, minimum: 0.52), let paw = point(pawJoint, minimum: 0.54),
                  hypot(wrist.x - paw.x, wrist.y - paw.y) >= separation * 0.34 else { continue }
            func legColor(_ fraction: CGFloat) -> ColorCounts {
                let sample = CGPoint(x: wrist.x + fraction * (paw.x - wrist.x), y: wrist.y + fraction * (paw.y - wrist.y))
                return region(sample, 0, 0, 0.29, 0.29)
            }
            let top = legColor(-0.35), center = legColor(0.25), lower = legColor(0.5), toe = legColor(1)
            guard [top, center, lower, toe].allSatisfy({ $0.total >= 55 }) else { continue }
            if toe.share(toe.pale) >= 0.63 && center.share(center.dark) >= 0.65 && lower.share(lower.dark) >= 0.59 {
                if top.share(top.white) >= 0.62 { evidence[side + "ForelegDarkPatch"] = "distal" }
                else if top.share(top.dark) >= 0.62 { evidence[side + "WhiteToesOnly"] = true }
            }
            if toe.share(toe.pale) <= 0.14 && lower.share(lower.pale) <= 0.43 {
                evidence[side + "Paw"] = "colored"
            }
        }
        for (side, joint) in [("left", leftWrist), ("right", rightWrist)] {
            let name = side + "ForelegWhiteCoverage"
            if evidence[side + "PawVisibility"] as? String == "occluded" {
                evidence[name] = "out-of-frame"
                continue
            }
            guard let wrist = point(joint, minimum: 0.5) else {
                // A predicted wrist at the crop boundary is not visible evidence.
                if let guess = point(joint, minimum: 0.12), guess.y >= CGFloat(height) * 0.95 {
                    evidence[name] = "out-of-frame"
                }
                continue
            }
            let upper = region(wrist, 0, -0.31, 0.27, 0.19)
            let lower = region(wrist, 0, -0.12, 0.27, 0.19)
            if upper.total >= 65, lower.total >= 65 {
                if upper.share(upper.creamWhite) >= 0.72 && lower.share(lower.creamWhite) >= 0.72 {
                    evidence[name] = "leg"
                } else if upper.share(upper.lightCream) >= 0.64 && lower.share(lower.lightCream) >= 0.72 {
                    evidence[name] = "forearm"
                }
            }
        }
        if let a = point(leftWrist, minimum: 0.5), let b = point(rightWrist, minimum: 0.5),
           hypot(a.x - b.x, a.y - b.y) >= separation * 0.45 {
            let leftFur = region(a, 0, -0.06, 0.3, 0.35)
            let rightFur = region(b, 0, -0.06, 0.3, 0.35)
            if leftFur.total >= 65, rightFur.total >= 65 {
                if leftFur.share(leftFur.warm) >= 0.58, rightFur.share(rightFur.dark) >= 0.8 { evidence["warmForeleg"] = "left" }
                if rightFur.share(rightFur.warm) >= 0.58, leftFur.share(leftFur.dark) >= 0.8 { evidence["warmForeleg"] = "right" }
            }
        }
        if faceAligned, abs(cross) < 1.1 * separation {
            let noseSide = (nose.x - midpoint.x) * across.x + (nose.y - midpoint.y) * across.y
            evidence["crownFrontal"] = abs(noseSide) <= 0.23 * separation
            let earJoints: [(VNAnimalBodyPoseObservation.JointName, VNAnimalBodyPoseObservation.JointName)] =
                [(.leftEarTop, .leftEarBottom), (.rightEarTop, .rightEarBottom)]
            if earJoints.allSatisfy({ top, bottom in
                guard let a = point(top, minimum: 0.7), let b = point(bottom, minimum: 0.7) else { return false }
                return (b.x - a.x) * along.x + (b.y - a.y) * along.y > 0.34 * separation
            }) { evidence["uprightEars"] = true }

            for (index, joints) in earJoints.enumerated() {
                guard let tip = point(joints.0, minimum: 0.6), let root = point(joints.1, minimum: 0.6),
                      hypot(root.x - tip.x, root.y - tip.y) >= 0.26 * separation else { continue }
                let isLeft = (index == 0) == viewerLeftIsAnatomicalLeft
                let direction: CGFloat = isLeft ? 1 : -1
                var crown = Set<String>()
                var perimeter = Set<String>()
                for fraction: CGFloat in [0.18, 0.34, 0.50] {
                    let center = CGPoint(x: tip.x + fraction * (root.x - tip.x), y: tip.y + fraction * (root.y - tip.y))
                    let inset = (0.035 + 0.085 * fraction) * direction
                    let inner = region(center, inset, 0, 0.095, 0.12)
                    let outer = region(center, -inset, 0, 0.095, 0.12)
                    guard inner.total >= 30, outer.total >= 30 else { continue }
                    for (color, innerCount, outerCount) in [
                        ("white", inner.white, outer.white), ("orange", inner.ginger, outer.ginger),
                        ("brown", inner.warm, outer.warm), ("dark", inner.dark, outer.dark),
                        ("gray", inner.gray, outer.gray),
                    ] {
                        let a = inner.share(innerCount), b = outer.share(outerCount)
                        if a >= 0.25 && a - b >= 0.22 { crown.insert(color) }
                        if b >= 0.25 && b - a >= 0.22 { perimeter.insert(color) }
                    }
                }
                evidence[isLeft ? "leftEarFur" : "rightEarFur"] =
                    ["crown": crown.sorted(), "perimeter": perimeter.sorted()]
            }

            let centerRows = [-0.28, -0.46, -0.64] as [CGFloat]
            let bridge = centerRows.map { region(nose, 0, $0, 0.15, 0.12) }
            let whiteRows = bridge.filter { $0.total >= 50 && $0.share($0.white) >= 0.55 }.count
            if whiteRows >= 2 {
                let wide = [-0.19, 0.19].allSatisfy { offset in
                    let side = region(nose, offset, -0.42, 0.12, 0.2)
                    return side.total >= 50 && side.share(side.white) >= 0.62
                }
                evidence["noseBlaze"] = wide ? "wide" : "thin"
                let upperBridge = [-1.12, -1.36].map { region(nose, 0, $0, 0.20, 0.22) }
                if upperBridge.allSatisfy({ $0.total >= 60 && $0.share($0.white) <= 0.33 })
                    && upperBridge.contains(where: { $0.share($0.ginger) >= 0.48 }) {
                    evidence["shortNoseBlaze"] = true
                }
            } else if bridge.allSatisfy({ $0.total >= 50 && $0.share($0.white) <= 0.15 }) {
                evidence["noseBlaze"] = "none"
            }

            // Measure the muzzle separately from the eye surrounds and the bib.
            // A wide white chest must not imply a white face.
            let eyeRegions = [(left, -0.12), (right, 0.12)].map { eye, offset in
                region(eye, offset, 0.34, 0.43, 0.25)
            }
            let muzzle = region(nose, 0, 0.43, 0.62, 0.34)
            let muzzleRows = [0.35, 0.55, 0.75].map { region(nose, 0, $0, 0.28, 0.28) }
            if muzzleRows.filter({ $0.total >= 55 && $0.share($0.white) >= 0.55 && $0.share($0.brightWhite) >= 0.28 }).count >= 2 {
                evidence["muzzleWhite"] = true
                if evidence["noseBlaze"] as? String == "none",
                   muzzleRows[0].share(muzzleRows[0].white) <= 0.28 { evidence["chinOnly"] = true }
            } else if muzzleRows.allSatisfy({ $0.total >= 55 && $0.share($0.brightWhite) <= 0.22 })
                && muzzleRows.filter({ $0.share($0.white) <= 0.28 }).count >= 2 {
                evidence["muzzleWhite"] = false
            }
            if let neck = point(.neck, minimum: 0.40) {
                let chest = [0.0, 0.38, 0.67, 0.93].map { region(neck, 0, $0, 0.38, 0.38) }
                let full = [0.66, 0.96, 1.22].map { region(neck, 0, $0, 0.45, 0.26) }
                let upper = [-0.24, 0.04, 0.34].map { region(neck, 0, $0, 0.34, 0.24) }
                let isWhite = { (r: ColorCounts) in r.total >= 60 && r.share(r.white) >= 0.62 }
                if full.allSatisfy(isWhite), upper.contains(where: isWhite) {
                    evidence["chestExtent"] = "full"
                } else if upper.contains(where: isWhite),
                          full.filter({ $0.total >= 60 && $0.share($0.white) <= 0.18 && $0.share($0.dark) >= 0.57 }).count >= 2 {
                    evidence["chestExtent"] = "upper-only"
                }

                let elbows = viewerLeftIsAnatomicalLeft
                    ? [VNAnimalBodyPoseObservation.JointName.leftFrontElbow, .rightFrontElbow]
                    : [VNAnimalBodyPoseObservation.JointName.rightFrontElbow, .leftFrontElbow]
                for (index, joint) in elbows.enumerated() {
                    guard let elbow = point(joint, minimum: 0.33) else { continue }
                    let samples = [0.55, 0.78, 1.0].map { fraction in
                        region(CGPoint(x: neck.x + (elbow.x - neck.x) * fraction,
                                       y: neck.y + (elbow.y - neck.y) * fraction), 0, 0, 0.30, 0.30)
                    }
                    if samples.allSatisfy({ $0.total >= 65 && $0.share($0.lightCream) >= 0.76 }) {
                        evidence[index == 0 ? "leftShoulderWhite" : "rightShoulderWhite"] = true
                    }
                }

                // Check the visible stretch between the chin sample and the upper chest.
                if upper.contains(where: isWhite) {
                    let chin = CGPoint(x: nose.x + along.x * separation * 0.72, y: nose.y + along.y * separation * 0.72)
                    let gap = [0.22, 0.47, 0.70].map { t in
                        region(CGPoint(x: chin.x + (neck.x - chin.x) * t, y: chin.y + (neck.y - chin.y) * t),
                               0, 0, 0.11, 0.15)
                    }
                    if gap.filter({ $0.total >= 60 && $0.share($0.dark) >= 0.80 }).count >= 2 {
                        evidence["chestChinGap"] = true
                    }
                }
                if chest.filter({ $0.total >= 55 && $0.share($0.white) >= 0.6 }).count >= 2 {
                    evidence["chestWhite"] = true
                } else if chest.filter({ $0.total >= 55 && $0.share($0.white) <= 0.17 }).count >= 3 {
                    evidence["chestWhite"] = false
                }
            }
            let muzzleOnly = evidence["noseBlaze"] as? String == "none"
                && muzzle.total >= 60 && muzzle.share(muzzle.white) >= 0.66
                && eyeRegions.allSatisfy { $0.total >= 65 && $0.share($0.white) <= 0.24 }
            if muzzleOnly { evidence["faceWhiteCoverage"] = "muzzle" }

            for (index, side) in [("leftFace", left, -0.18), ("rightFace", right, 0.18)].enumerated() {
                let (name, eye, outward) = side
                let crownColumns: [CGFloat] = [outward * 1.5, 0, -outward, -outward * 1.7]
                let crownRows: [CGFloat] = [-0.14, -0.31, -0.55]
                let crown = crownColumns.flatMap { column in
                    crownRows.map { row in region(eye, column, row, 0.23, 0.28) }
                }.filter { $0.total >= 60 }
                let orangeStreak = crown.contains { $0.share($0.ginger) >= 0.33 }
                    && crown.filter({ $0.share($0.ginger) >= 0.13 }).count >= 2
                if orangeStreak {
                    evidence[index == 0 ? "leftCrown" : "rightCrown"] = "orange"
                } else if crown.filter({ $0.share($0.dark) >= 0.62 }).count >= 3 {
                    evidence[index == 0 ? "leftCrown" : "rightCrown"] = "black"
                }
                let brow = region(eye, 0, -0.30, 0.65, 0.30)
                let cheek = region(eye, outward, 0.24, 0.55, 0.34)
                let inside = eyeRegions[index]
                let upperColumns: [CGFloat] = [outward * 1.5, 0, -outward]
                let upperCrown = upperColumns.map { x in
                    region(eye, x, -0.80, 0.28, 0.32)
                }
                let lowerEye = region(eye, outward * 0.6, 0.40, 0.42, 0.28)
                if crown.count >= 7 {
                    let browOrange = crown.reduce(0.0) { $0 + $1.share($1.ginger) } / Double(crown.count)
                    var layout = ["browOrange": browOrange]
                    let visibleCap = upperCrown.filter { $0.total >= 55 }
                    if visibleCap.count >= 2 {
                        layout["capOrange"] = visibleCap.reduce(0.0) { $0 + $1.share($1.ginger) } / Double(visibleCap.count)
                    }
                    if lowerEye.total >= 55 { layout["eyeWhite"] = lowerEye.share(lowerEye.white) }
                    evidence[index == 0 ? "leftCrownLayout" : "rightCrownLayout"] = layout
                }
                guard brow.total >= 50, cheek.total >= 50 else { continue }
                if brow.share(brow.orange) >= 0.45, cheek.share(cheek.orange) >= 0.43 { evidence[name] = "orange" }
                else if brow.share(brow.dark) >= 0.64, cheek.share(cheek.dark) >= 0.56 { evidence[name] = "black" }
                else if brow.share(brow.white) >= 0.6, cheek.share(cheek.white) >= 0.6 { evidence[name] = "white" }
                else if muzzleOnly, inside.share(inside.warm) >= 0.76 { evidence[name] = "orange" }
            }
        }
        return evidence
    }

    @available(macOS 14.0, *)
    private static func catInstance(_ mask: VNInstanceMaskObservation, at point: CGPoint, width: Int, height: Int) -> Int? {
        let labels = mask.instanceMask
        guard CVPixelBufferGetPixelFormatType(labels) == kCVPixelFormatType_OneComponent8 else { return nil }
        let w = CVPixelBufferGetWidth(labels), h = CVPixelBufferGetHeight(labels)
        let x = min(w - 1, Int(point.x * CGFloat(w) / CGFloat(width)))
        let y = min(h - 1, Int(point.y * CGFloat(h) / CGFloat(height)))
        CVPixelBufferLockBaseAddress(labels, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(labels, .readOnly) }
        guard let pixels = CVPixelBufferGetBaseAddress(labels)?.assumingMemoryBound(to: UInt8.self) else { return nil }
        let index = Int(pixels[y * CVPixelBufferGetBytesPerRow(labels) + x])
        return index != 0 && mask.allInstances.contains(index) ? index : nil
    }

    private struct ColorCounts {
        var total = 0, white = 0, orange = 0, dark = 0, gray = 0, pale = 0, warm = 0, creamWhite = 0, lightCream = 0, brightWhite = 0, ginger = 0

        mutating func add(_ red: Int, _ green: Int, _ blue: Int) {
            total += 1
            let high = max(red, green, blue), low = min(red, green, blue)
            if low >= 65 && high < 177 && high - low <= max(18, high * 17 / 100) { gray += 1 }
            if low >= 170 && high - low <= 38 { brightWhite += 1 }
            if low >= 160 && high - low <= high * 24 / 100 { creamWhite += 1 }
            if low >= 97 && high - low <= max(29, high * 28 / 100) { lightCream += 1 }
            if red >= 95 && red - green >= max(9, red * 8 / 100)
                && green - blue >= max(9, green * 8 / 100) && red - blue >= 24 { ginger += 1 }
            if red >= 78 && red - green >= max(16, red * 14 / 100)
                && green - blue >= max(11, green * 13 / 100) { warm += 1 }
            if low >= 88 && high - low <= max(18, high * 18 / 100) { pale += 1 }
            if low >= 119 && high - low <= max(26, high * 18 / 100) { white += 1 }
            else if red >= 85 && red - green >= max(21, red * 19 / 100)
                && green - blue >= max(12, green * 15 / 100) { orange += 1 }
            else if high < 85 { dark += 1 }
        }

        func share(_ count: Int) -> Double { Double(count) / Double(max(1, total)) }
    }
}

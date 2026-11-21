"""Draw the idle coat-region reference from the combination study's 320px base."""

from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2] / "output" / "coat-combination-study"
BASE = Image.open(ROOT / "base.png").convert("RGBA")
FONT = "/System/Library/Fonts/Hiragino Sans GB.ttc"
PAPER = "#f6efe6"
CARD = "#fffaf3"
TEXT = "#382f2b"
MUTED = "#685952"
LILAC = "#876cac"
TEAL = "#50838e"
BAND = "#a96249"

# Paths use a start point followed by cubic Bézier segments in source pixels.
PANELS = [
    {
        "title": "耳朵",
        "crop": (164, 13, 254, 91),
        "fills": [
            (LILAC, (220, 13), [(241, 12, 254, 19, 254, 43), (255, 73, 238, 86, 222, 78),
                               (202, 74, 199, 66, 198, 55), (195, 42, 210, 18, 220, 13)]),
            (TEAL, (177, 42), [(189, 39, 204, 44, 211, 54), (220, 67, 221, 76, 211, 82),
                              (197, 87, 179, 77, 176, 65), (173, 53, 173, 45, 177, 42)]),
        ],
        "seam": ((195, 49), [(203, 52, 206, 61, 213, 69)]),
        "points": [("耳尖", (224, 24)), ("外耳", (235, 49)), ("内耳", (223, 52)), ("耳根", (203, 67))],
        "note": "外耳和耳根接色时，沿毛发边缘走。",
    },
    {
        "title": "眼周与脸颊",
        "crop": (42, 87, 144, 172),
        "fills": [
            (LILAC, (85, 111), [(87, 96, 101, 89, 111, 90), (127, 90, 141, 100, 139, 113),
                              (138, 117, 131, 111, 125, 107), (112, 96, 96, 103, 93, 115),
                              (91, 122, 82, 119, 85, 111)]),
            (TEAL, (44, 110), [(61, 106, 78, 113, 87, 126), (97, 141, 97, 154, 86, 162),
                             (74, 172, 55, 167, 43, 155), (33, 143, 32, 115, 44, 110)]),
        ],
        "seam": ((85, 113), [(91, 119, 92, 129, 95, 137)]),
        "points": [("上眼缘", (113, 96)), ("外眼角", (91, 121)), ("上颊", (72, 127)), ("下颊", (71, 151))],
        "note": "颊斑顺着脸侧收进外眼角。",
    },
    {
        "title": "下巴与胸口",
        "crop": (90, 144, 213, 227),
        "fills": [
            (LILAC, (123, 147), [(134, 140, 167, 141, 178, 149), (191, 161, 174, 176, 152, 176),
                              (130, 176, 111, 162, 123, 147)]),
            (TEAL, (96, 182), [(112, 162, 178, 161, 200, 178), (225, 198, 183, 222, 153, 226),
                             (127, 224, 76, 205, 96, 182)]),
        ],
        "seam": ((125, 168), [(139, 171, 165, 171, 178, 168)]),
        "points": [("下巴接颈", (150, 155)), ("胸口上缘", (177, 181)), ("胸口下缘", (152, 216))],
        "note": "连片白毛跨过颈线时，把接缝接实。",
    },
    {
        "title": "胸肩交界",
        "crop": (151, 161, 246, 242),
        "fills": [
            (LILAC, (147, 165), [(165, 158, 192, 164, 203, 176), (215, 187, 202, 209, 180, 215),
                              (158, 224, 145, 213, 145, 195), (145, 183, 144, 171, 147, 165)]),
            (TEAL, (194, 173), [(211, 164, 233, 170, 242, 185), (251, 204, 232, 215, 214, 212),
                              (197, 207, 189, 188, 194, 173)]),
        ],
        "seam": ((200, 176), [(203, 184, 205, 194, 199, 203)]),
        "points": [("白胸", (175, 185)), ("肩部", (222, 191)), ("前肢上段", (182, 223))],
        "note": "白毛确实包肩时，胸肩连成一条弧边。",
    },
    {
        "title": "前肢与脚尖",
        "crop": (96, 206, 158, 290),
        "fills": [
            (LILAC, (101, 210), [(109, 202, 135, 202, 142, 212), (150, 225, 153, 249, 144, 262),
                              (136, 272, 105, 266, 100, 253), (96, 241, 96, 218, 101, 210)]),
            (TEAL, (102, 249), [(111, 241, 136, 242, 147, 252), (158, 263, 161, 283, 150, 290),
                              (139, 297, 106, 295, 98, 287), (91, 279, 93, 260, 102, 249)]),
        ],
        "seam": ((104, 253), [(114, 250, 135, 251, 144, 256)]),
        "points": [("前肢下段", (124, 227)), ("前爪", (138, 264)), ("趾尖", (119, 279))],
        "note": "铺到脚底毛发边缘，留好爪部描边。",
    },
    {
        "title": "前肢与侧腰",
        "crop": (48, 195, 149, 283),
        "fills": [
            (LILAC, (52, 208), [(61, 195, 83, 195, 98, 206), (117, 222, 117, 249, 102, 270),
                              (89, 288, 60, 289, 48, 274), (32, 251, 41, 220, 52, 208)]),
            (TEAL, (105, 201), [(115, 193, 136, 193, 146, 205), (155, 225, 155, 260, 146, 275),
                              (138, 286, 111, 286, 104, 273), (96, 254, 95, 216, 105, 201)]),
        ],
        "seam": ((104, 216), [(110, 231, 106, 247, 103, 261)]),
        "points": [("侧腰", (78, 239)), ("前肢上段", (126, 214)), ("前肢下段", (125, 256))],
        "note": "侧腰花纹可伸入重叠区，抬爪时由前肢遮挡。",
    },
]


def sample_path(start, segments):
    result = [start]
    for x1, y1, x2, y2, x3, y3 in segments:
        x0, y0 = result[-1]
        for step in range(1, 25):
            t = step / 24
            u = 1 - t
            result.append((u**3*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t**3*x3,
                           u**3*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t**3*y3))
    return result


def label(draw, xy, value, size, fill=TEXT):
    draw.text(xy, value, font=ImageFont.truetype(FONT, size), fill=fill)


def render_crop(section, max_width, max_height):
    crop = section["crop"]
    width, height = crop[2] - crop[0], crop[3] - crop[1]
    scale = min(max_width / width, max_height / height)
    high_scale = scale * 4
    size = (round(width * high_scale), round(height * high_scale))

    def to_high(xy):
        return tuple(round((v - origin) * high_scale) for v, origin in zip(xy, crop[:2]))

    # The reference keeps the original pixel art. Only the drawn overlay uses
    # smooth curves and rounded bands, so the material remains legible.
    silhouette = BASE.getchannel("A").crop(crop).resize(size, Image.Resampling.BILINEAR)
    core = BASE.crop(crop).resize(size, Image.Resampling.NEAREST)
    core.putalpha(core.getchannel("A").point(lambda a: round(a * .62)))
    scene = Image.new("RGBA", size, CARD)
    scene.alpha_composite(core)
    clip = silhouette.filter(ImageFilter.GaussianBlur(1.3))
    for color, start, curves in section["fills"]:
        mask = Image.new("L", size)
        draw = ImageDraw.Draw(mask)
        path = [to_high(xy) for xy in sample_path(start, curves)]
        draw.polygon(path, fill=68)
        draw.line(path, fill=112, width=4, joint="curve")
        scene.paste(color, (0, 0, *size), ImageChops.multiply(mask, clip))
    band_mask = Image.new("L", size)
    band_draw = ImageDraw.Draw(band_mask)
    seam = [to_high(xy) for xy in sample_path(*section["seam"])]
    band_width = round(6 * high_scale)
    band_draw.line(seam, fill=74, width=band_width, joint="curve")
    radius = band_width // 2
    for x, y in (seam[0], seam[-1]):
        band_draw.ellipse((x-radius, y-radius, x+radius, y+radius), fill=74)
    scene.paste(BAND, (0, 0, *size), ImageChops.multiply(band_mask, clip))
    return scene.resize((round(width * scale), round(height * scale)), Image.Resampling.LANCZOS), scale


def main():
    board = Image.new("RGB", (1254, 870), PAPER)
    draw = ImageDraw.Draw(board)
    label(draw, (26, 17), "花色组件 · 细分与交界", 34)
    label(draw, (28, 66), "大弧线定位毛色范围，棕色带标记可重叠的接色位置。左右可独立绘制。", 16, MUTED)
    for index, section in enumerate(PANELS):
        x, y = 27 + 403 * (index % 3), 108 + 366 * (index // 3)
        draw.rounded_rectangle((x, y, x + 392, y + 346), radius=13, fill=CARD, outline="#e5dacb")
        label(draw, (x + 15, y + 13), section["title"], 23)
        cropped, scale = render_crop(section, 340, 212)
        sx, sy = x + (392 - cropped.width) // 2, y + 55
        board.paste(cropped, (sx, sy))
        for number, (_, point) in enumerate(section["points"], 1):
            px = sx + round((point[0] - section["crop"][0]) * scale)
            py = sy + round((point[1] - section["crop"][1]) * scale)
            draw.ellipse((px-9, py-9, px+9, py+9), fill=CARD, outline="#725c59")
            draw.text((px, py), str(number), font=ImageFont.truetype(FONT, 11), fill=TEXT, anchor="mm")
        for number, (name, _) in enumerate(section["points"], 1):
            label(draw, (x + 15 + 92 * (number-1), y + 275), f"{number} {name}", 13)
        label(draw, (x + 15, y + 312), section["note"], 13, MUTED)
    board.save(ROOT / "细分部位与重叠区.png", optimize=True)


if __name__ == "__main__":
    main()

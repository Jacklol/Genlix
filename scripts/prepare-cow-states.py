from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "public" / "assets" / "cow-2-5d"
SOURCE_DIR = ASSET_DIR / "source"
STATE_DIR = ASSET_DIR / "states"
TAIL_STATE_DIR = ASSET_DIR / "tail-states"

BASE_PATH = SOURCE_DIR / "base-left.png"

# The pose source may redraw the body slightly.  The mask limits each generated
# frame to the head/neck region and keeps the rest of the cow locked to state 00.
POSES = [
    ("00-profile-left.png", BASE_PATH, None),
    (
        "01-left-three-quarter-v2.png",
        SOURCE_DIR / "generated-left-mid-v2.png",
        [
            (110, 0),
            (720, 0),
            (720, 300),
            (675, 390),
            (630, 510),
            (575, 600),
            (505, 585),
            (420, 520),
            (335, 430),
            (110, 430),
        ],
    ),
    (
        "02-front.png",
        SOURCE_DIR / "reference-front.png",
        [
            (110, 0),
            (730, 0),
            (730, 310),
            (690, 410),
            (640, 520),
            (575, 605),
            (505, 585),
            (415, 515),
            (325, 425),
            (110, 425),
        ],
    ),
    (
        "03-right-three-quarter.png",
        SOURCE_DIR / "generated-right-mid.png",
        [
            (110, 0),
            (910, 0),
            (910, 390),
            (820, 430),
            (730, 485),
            (650, 555),
            (575, 610),
            (500, 575),
            (410, 510),
            (330, 420),
            (110, 420),
        ],
    ),
    (
        "04-profile-right.png",
        SOURCE_DIR / "reference-right.png",
        [
            (110, 0),
            (865, 0),
            (865, 390),
            (790, 430),
            (710, 500),
            (640, 570),
            (570, 620),
            (490, 575),
            (405, 505),
            (325, 415),
            (110, 415),
        ],
    ),
]

TAIL_POSES = [
    ("00-tail-rest.png", BASE_PATH, None),
    (
        "01-tail-swat-inward.png",
        SOURCE_DIR / "generated-tail-inward.png",
        [
            [
                (760, 170),
                (1350, 170),
                (1350, 450),
                (1250, 470),
                (1160, 430),
                (760, 430),
            ],
            [
                (1170, 350),
                (1350, 350),
                (1350, 780),
                (1170, 780),
            ],
        ],
    ),
    (
        "02-tail-swat-outward.png",
        SOURCE_DIR / "generated-tail-outward.png",
        [
            [
                (1160, 80),
                (1586, 20),
                (1586, 340),
                (1280, 350),
                (1180, 300),
            ],
            [
                (1170, 330),
                (1350, 330),
                (1350, 780),
                (1170, 780),
            ],
        ],
    ),
]


def load_rgb(path: Path, expected_size: tuple[int, int]) -> Image.Image:
    image = Image.open(path).convert("RGB")
    if image.size != expected_size:
        image = image.resize(expected_size, Image.Resampling.LANCZOS)
    return image


def feathered_mask(
    size: tuple[int, int], polygons: list[list[tuple[int, int]]]
) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    for polygon in polygons:
        draw.polygon(polygon, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(radius=18))


def make_contact_sheet(frames: list[tuple[str, Image.Image]]) -> Image.Image:
    thumb_width = 320
    thumb_height = round(thumb_width * frames[0][1].height / frames[0][1].width)
    label_height = 34
    sheet = Image.new(
        "RGB",
        (thumb_width * len(frames), thumb_height + label_height),
        "white",
    )
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=16)

    for index, (label, frame) in enumerate(frames):
        x = index * thumb_width
        thumb = frame.resize((thumb_width, thumb_height), Image.Resampling.LANCZOS)
        sheet.paste(thumb, (x, 0))
        draw.text((x + 10, thumb_height + 8), label, fill=(35, 35, 35), font=font)

    return sheet


def main() -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    base = Image.open(BASE_PATH).convert("RGB")
    frames: list[tuple[str, Image.Image]] = []

    for filename, source_path, polygon in POSES:
        if polygon is None:
            frame = base.copy()
        else:
            pose = load_rgb(source_path, base.size)
            mask = feathered_mask(base.size, [polygon])
            frame = Image.composite(pose, base, mask)

        frame.save(STATE_DIR / filename, optimize=True)
        frames.append((filename.removesuffix(".png"), frame))

    make_contact_sheet(frames).save(ASSET_DIR / "head-turn-contact-sheet.png", optimize=True)

    TAIL_STATE_DIR.mkdir(parents=True, exist_ok=True)
    tail_frames: list[tuple[str, Image.Image]] = []
    for filename, source_path, polygons in TAIL_POSES:
        if polygons is None:
            frame = base.copy()
        else:
            pose = load_rgb(source_path, base.size)
            mask = feathered_mask(base.size, polygons)
            frame = Image.composite(pose, base, mask)

        frame.save(TAIL_STATE_DIR / filename, optimize=True)
        tail_frames.append((filename.removesuffix(".png"), frame))

    make_contact_sheet(tail_frames).save(
        ASSET_DIR / "tail-reaction-contact-sheet.png", optimize=True
    )


if __name__ == "__main__":
    main()

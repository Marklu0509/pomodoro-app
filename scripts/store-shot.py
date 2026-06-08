#!/usr/bin/env python3
"""Compose a screenshot into a Chrome Web Store-ready 1280x800 PNG.

Usage:
    python3 scripts/store-shot.py INPUT.png OUTPUT.png [--bg "#f1f5f9"] [--scale 0.82]

Centers the screenshot on a soft gradient background with rounded corners and a
subtle drop shadow, so a small popup still looks good at 1280x800.
"""
import argparse
from PIL import Image, ImageDraw, ImageFilter

W, H = 1280, 800


def hex_rgb(s: str):
    s = s.lstrip("#")
    return tuple(int(s[i : i + 2], 16) for i in (0, 2, 4))


def gradient(top, bottom):
    base = Image.new("RGB", (1, H))
    for y in range(H):
        t = y / (H - 1)
        base.putpixel(
            (0, y),
            tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3)),
        )
    return base.resize((W, H))


def rounded(img, radius):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, *img.size], radius, fill=255)
    out = img.convert("RGBA")
    out.putalpha(mask)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("inp")
    ap.add_argument("out")
    ap.add_argument("--bg", default="#eef2f7")
    ap.add_argument("--scale", type=float, default=0.82, help="max height fraction")
    args = ap.parse_args()

    bg_rgb = hex_rgb(args.bg)
    # gentle gradient from a touch lighter to the bg colour
    lighter = tuple(min(255, c + 14) for c in bg_rgb)
    canvas = gradient(lighter, bg_rgb).convert("RGBA")

    shot = Image.open(args.inp).convert("RGBA")
    max_h = int(H * args.scale)
    max_w = int(W * 0.9)
    ratio = min(max_w / shot.width, max_h / shot.height)
    new = (max(1, int(shot.width * ratio)), max(1, int(shot.height * ratio)))
    shot = shot.resize(new, Image.LANCZOS)
    shot = rounded(shot, radius=22)

    x = (W - shot.width) // 2
    y = (H - shot.height) // 2

    # drop shadow
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh = Image.new("RGBA", shot.size, (15, 23, 42, 90))
    sh.putalpha(shot.split()[3].point(lambda a: int(a * 0.35)))
    shadow.paste(sh, (x, y + 14), sh)
    shadow = shadow.filter(ImageFilter.GaussianBlur(26))
    canvas = Image.alpha_composite(canvas, shadow)

    canvas.alpha_composite(shot, (x, y))
    canvas.convert("RGB").save(args.out)
    print(f"wrote {args.out} ({W}x{H})")


if __name__ == "__main__":
    main()

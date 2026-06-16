#!/usr/bin/env python3
"""
Processes the raw birthday-reveal assets into web-optimized files in assets/.

Source files (in repo root):
  4-runners.png / 5-runners.png / 6-runners.png  : the three pack montages (1651x1114)
  gilou.jpg : full photo of Gilou (face bottom-right) -> cropped face
  matth.jpg : selfie of Matth -> cropped face

Outputs (assets/):
  montage-4.jpg / montage-5.jpg / montage-6.jpg
  face-gilou.jpg / face-matth.jpg

Hotspot coordinates (where each non-runner's head sits in the montage) were
derived by diffing the montages and are baked into app.js. They are echoed at
the bottom of this script for reference / re-tuning.
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets")
os.makedirs(OUT, exist_ok=True)


def save_jpg(im, name, quality=85, max_w=None):
    im = im.convert("RGB")
    if max_w and im.width > max_w:
        h = round(im.height * max_w / im.width)
        im = im.resize((max_w, h), Image.LANCZOS)
    path = os.path.join(OUT, name)
    im.save(path, "JPEG", quality=quality, optimize=True, progressive=True)
    kb = os.path.getsize(path) / 1024
    print(f"  {name}: {im.size} {kb:.0f} KB")


def main():
    print("Montages:")
    for n in (4, 5, 6):
        im = Image.open(os.path.join(ROOT, f"{n}-runners.png"))
        save_jpg(im, f"montage-{n}.jpg", quality=85)

    print("Faces:")
    # Gilou: face in lower-right of the Dubai photo
    g = Image.open(os.path.join(ROOT, "gilou.jpg"))
    save_jpg(g.crop((470, 500, 690, 720)), "face-gilou.jpg", quality=90)
    # Matth: centered selfie
    m = Image.open(os.path.join(ROOT, "matth.jpg"))
    save_jpg(m.crop((90, 40, 400, 360)), "face-matth.jpg", quality=90)

    print("\nHotspots (normalized 0..1 of the 1651x1114 montage), for app.js:")
    W, H = 1651, 1114
    def norm(x0, y0, x1, y1):
        return dict(x=round(x0/W, 4), y=round(y0/H, 4),
                    w=round((x1-x0)/W, 4), h=round((y1-y0)/H, 4))
    print("  Gilou (base montage-4):", norm(645, 198, 847, 415))
    print("  Matth (base montage-5):", norm(495, 200, 678, 426))


if __name__ == "__main__":
    main()

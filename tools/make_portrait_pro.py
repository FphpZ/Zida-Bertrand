"""Professional hero portrait: dark tech background matching portfolio theme."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

SRC = Path(r"C:\Users\User\OneDrive\MY_portofolio\siteWeb\image\moi\Portrait.png")
OUT = Path(r"C:\Users\User\OneDrive\MY_portofolio\siteWeb\image\moi\Portrait-pro.png")
BACKUP = Path(r"C:\Users\User\OneDrive\MY_portofolio\siteWeb\image\moi\Portrait-original.png")


def sample_background(img: Image.Image) -> tuple[float, float, float]:
    w, h = img.size
    pts = [
        (10, 10),
        (w - 11, 10),
        (10, 30),
        (w - 11, 30),
        (w // 2, 10),
        (20, 40),
        (w - 21, 40),
        (40, 20),
        (w - 41, 20),
    ]
    samples = [img.getpixel(p) for p in pts]
    r = sum(c[0] for c in samples) / len(samples)
    g = sum(c[1] for c in samples) / len(samples)
    b = sum(c[2] for c in samples) / len(samples)
    return r, g, b


def build_subject_mask(img: Image.Image, bg: tuple[float, float, float]) -> Image.Image:
    w, h = img.size
    px = img.load()
    bg_r, bg_g, bg_b = bg
    mask = Image.new("L", (w, h), 0)
    mp = mask.load()

    for y in range(h):
        for x in range(w):
            r, g, b, _a = px[x, y]
            dr, dg, db = r - bg_r, g - bg_g, b - bg_b
            dist = math.sqrt(dr * dr + dg * dg + db * db)
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            maxc = max(r, g, b)
            minc = min(r, g, b)
            sat = 0.0 if maxc == 0 else (maxc - minc) / maxc

            if dist < 28 and lum > 180:
                alpha = 0
            elif dist < 45 and lum > 170 and sat < 0.22:
                alpha = int(255 * ((dist - 28) / 17))
            elif dist < 70 and lum > 185 and sat < 0.18:
                alpha = int(min(255, 255 * ((dist - 28) / 42)))
            else:
                alpha = 255
            mp[x, y] = alpha

    mask = mask.filter(ImageFilter.GaussianBlur(radius=1.2))
    mask = mask.point(lambda v: 255 if v > 210 else (0 if v < 40 else v))
    mask = mask.filter(ImageFilter.GaussianBlur(radius=2.0))
    return mask


def make_dark_tech_background(w: int, h: int) -> Image.Image:
    bg = Image.new("RGBA", (w, h), (5, 3, 15, 255))

    for y in range(h):
        for x in range(w):
            nx = x / (w - 1)
            ny = y / (h - 1)
            cx, cy = 0.50, 0.42
            d = math.sqrt((nx - cx) ** 2 + (ny - cy) ** 2)
            t = min(1.0, d * 1.35)

            # Soft purple core -> near-black edges (site palette)
            r0, g0, b0 = 28, 18, 72
            r1, g1, b1 = 8, 5, 22
            rr = int(r0 * (1 - t) + r1 * t)
            gg = int(g0 * (1 - t) + g1 * t)
            bb = int(b0 * (1 - t) + b1 * t)

            cyan_w = max(
                0.0,
                1.0 - math.sqrt((nx - 0.78) ** 2 + (ny - 0.72) ** 2) / 0.85,
            )
            rr = min(255, int(rr + 8 * cyan_w))
            gg = min(255, int(gg + 35 * cyan_w))
            bb = min(255, int(bb + 45 * cyan_w))

            vio_w = max(
                0.0,
                1.0 - math.sqrt((nx - 0.22) ** 2 + (ny - 0.28) ** 2) / 0.9,
            )
            rr = min(255, int(rr + 40 * vio_w))
            gg = min(255, int(gg + 15 * vio_w))
            bb = min(255, int(bb + 55 * vio_w))
            bg.putpixel((x, y), (rr, gg, bb, 255))

    # Ambient orbs (violet + cyan)
    orb_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(orb_layer)
    orbs = [
        (int(w * 0.18), int(h * 0.22), int(min(w, h) * 0.18), (167, 139, 250, 55)),
        (int(w * 0.82), int(h * 0.68), int(min(w, h) * 0.22), (34, 211, 238, 40)),
        (int(w * 0.70), int(h * 0.18), int(min(w, h) * 0.12), (139, 92, 246, 45)),
        (int(w * 0.30), int(h * 0.75), int(min(w, h) * 0.14), (56, 189, 248, 28)),
        (int(w * 0.50), int(h * 0.40), int(min(w, h) * 0.28), (91, 33, 182, 35)),
    ]
    for cx, cy, rad, col in orbs:
        for i in range(12, 0, -1):
            f = i / 12
            a = int(col[3] * (f**1.8))
            r = int(rad * (1.15 - f * 0.55))
            od.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(col[0], col[1], col[2], a))

    orb_layer = orb_layer.filter(
        ImageFilter.GaussianBlur(radius=max(8, int(min(w, h) * 0.03)))
    )
    bg = Image.alpha_composite(bg, orb_layer)

    # Faint tech geometry
    line_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ld = ImageDraw.Draw(line_layer)
    rad = int(min(w, h) * 0.38)
    cx, cy = int(w * 0.5), int(h * 0.45)
    for ang in range(0, 360, 60):
        x1 = cx + int(rad * math.cos(math.radians(ang)))
        y1 = cy + int(rad * math.sin(math.radians(ang)))
        x2 = cx + int(rad * math.cos(math.radians(ang + 60)))
        y2 = cy + int(rad * math.sin(math.radians(ang + 60)))
        ld.line(
            [(x1, y1), (x2, y2)],
            fill=(167, 139, 250, 28),
            width=max(1, w // 800),
        )
    for yy in (int(h * 0.15), int(h * 0.88)):
        ld.line(
            [(int(w * 0.12), yy), (int(w * 0.88), yy)],
            fill=(34, 211, 238, 18),
            width=1,
        )
    line_layer = line_layer.filter(ImageFilter.GaussianBlur(radius=1.5))
    bg = Image.alpha_composite(bg, line_layer)

    # Soft vignette
    vig = Image.new("L", (w, h), 0)
    vd = ImageDraw.Draw(vig)
    for i in range(40):
        pad = int(min(w, h) * (i / 40) * 0.35)
        alpha = int(18 * (i / 40))
        vd.rectangle([pad, pad, w - pad, h - pad], outline=alpha)
    vig = vig.filter(ImageFilter.GaussianBlur(radius=max(20, int(min(w, h) * 0.05))))
    dark = Image.new("RGBA", (w, h), (3, 2, 10, 0))
    dark.putalpha(vig.point(lambda v: min(160, int(v * 1.4))))
    bg = Image.alpha_composite(bg, dark)
    return bg


def main() -> None:
    # Prefer untouched original if already processed once
    source = BACKUP if BACKUP.exists() else SRC
    img = Image.open(source).convert("RGBA")
    w, h = img.size
    print(f"source: {source} ({w}x{h})")

    if not BACKUP.exists():
        img.save(BACKUP)
        print(f"backup: {BACKUP}")

    bg_sample = sample_background(img)
    print(f"bg sample RGB: {bg_sample[0]:.1f}, {bg_sample[1]:.1f}, {bg_sample[2]:.1f}")

    mask = build_subject_mask(img, bg_sample)
    print("mask ready")

    bg = make_dark_tech_background(w, h)
    print("background ready")

    sub_rgb = img.convert("RGB")
    sub_rgb = ImageEnhance.Contrast(sub_rgb).enhance(1.08)
    sub_rgb = ImageEnhance.Color(sub_rgb).enhance(1.05)
    sub_rgb = ImageEnhance.Sharpness(sub_rgb).enhance(1.12)
    subject = sub_rgb.convert("RGBA")
    subject.putalpha(mask)

    # Soft contact shadow
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse(
        [int(w * 0.28), int(h * 0.82), int(w * 0.72), int(h * 0.98)],
        fill=(0, 0, 0, 90),
    )
    shadow = shadow.filter(
        ImageFilter.GaussianBlur(radius=max(18, int(min(w, h) * 0.04)))
    )

    # Rim glow behind subject
    glow_mask = mask.filter(
        ImageFilter.GaussianBlur(radius=max(12, int(min(w, h) * 0.025)))
    )
    glow_mask = glow_mask.point(lambda v: min(255, int(v * 1.3)))
    g_cyan = Image.new("RGBA", (w, h), (34, 211, 238, 0))
    g_cyan.putalpha(glow_mask.point(lambda v: int(v * 0.18)))
    g_violet = Image.new("RGBA", (w, h), (167, 139, 250, 0))
    g_violet.putalpha(glow_mask.point(lambda v: int(v * 0.14)))

    result = Image.alpha_composite(bg, shadow)
    result = Image.alpha_composite(result, g_violet)
    result = Image.alpha_composite(result, g_cyan)
    result = Image.alpha_composite(result, subject)

    final = result.convert("RGB")
    final = ImageEnhance.Contrast(final).enhance(1.04)
    final = ImageEnhance.Color(final).enhance(1.03)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    final.save(OUT, "PNG", optimize=True)
    final.save(SRC, "PNG", optimize=True)
    print(f"saved: {OUT} ({OUT.stat().st_size} bytes)")
    print(f"updated: {SRC}")


if __name__ == "__main__":
    main()

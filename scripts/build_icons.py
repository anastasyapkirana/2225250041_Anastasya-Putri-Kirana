"""Buat ikon aplikasi (PNG) dari gambar kalkulator di frontend/assets/brand/calculator-source.png.

Pemakaian:  pip install pillow  lalu  python scripts/build_icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "frontend" / "assets" / "brand" / "calculator-source.png"
OUT = ROOT / "frontend" / "assets" / "icons"
ICE = (220, 238, 255, 255)  # #DCEEFF ice blue
WHITE = (255, 255, 255, 255)


def compose(size: int, *, shape: str, scale: float, bg=ICE) -> Image.Image:
    """Tempel kalkulator di tengah latar (circle / square / none)."""
    big = size * 4
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    if shape == "circle":
        pad = big * 0.02
        d.ellipse([pad, pad, big - pad, big - pad], fill=bg)
    elif shape == "square":
        d.rectangle([0, 0, big, big], fill=bg)
    calc = Image.open(SRC).convert("RGBA")
    side = int(big * scale)
    calc = calc.resize((side, side), Image.LANCZOS)
    canvas.alpha_composite(calc, ((big - side) // 2, (big - side) // 2))
    return canvas.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    compose(192, shape="circle", scale=0.74).save(OUT / "icon-192.png", optimize=True)
    compose(512, shape="circle", scale=0.74).save(OUT / "icon-512.png", optimize=True)
    # maskable: isi penting harus di zona aman (lingkaran 80% di tengah)
    compose(512, shape="square", scale=0.58).save(OUT / "maskable-512.png", optimize=True)
    compose(180, shape="square", scale=0.70).convert("RGB").save(OUT / "apple-touch-icon.png", optimize=True)
    compose(64, shape="none", scale=1.0).save(OUT / "favicon.png", optimize=True)
    print("Ikon dibuat di", OUT)


if __name__ == "__main__":
    main()

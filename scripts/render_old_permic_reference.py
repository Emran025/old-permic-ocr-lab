#!/usr/bin/env python3
"""Render a labeled Old Permic Unicode reference sheet for annotation review."""

from __future__ import annotations

import unicodedata
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


PROJECT_ROOT = Path(__file__).resolve().parents[1]
FONT_PATH = PROJECT_ROOT / "training" / "assets" / "NotoSansOldPermic-Regular.ttf"
OUTPUT_PATH = Path("/home/ubuntu/real-character-assets/old-permic-unicode-reference.png")
latin_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
glyph_font = ImageFont.truetype(str(FONT_PATH), 46)
rows = []
for codepoint in range(0x10350, 0x10376):
    glyph = chr(codepoint)
    name = unicodedata.name(glyph, "")
    if name.startswith("OLD PERMIC LETTER "):
        rows.append((codepoint, glyph, name.removeprefix("OLD PERMIC LETTER ")))

cell_w, cell_h, columns = 250, 88, 4
image = Image.new("RGB", (cell_w * columns, 42 + cell_h * ((len(rows) + columns - 1) // columns)), "#f7f3ea")
draw = ImageDraw.Draw(image)
draw.text((20, 12), "Old Permic Unicode reference — comparison aid, not an annotation source", fill="#2f3f34", font=latin_font)
for index, (codepoint, glyph, name) in enumerate(rows):
    col, row = index % columns, index // columns
    x, y = col * cell_w, 42 + row * cell_h
    draw.rectangle((x + 5, y + 5, x + cell_w - 5, y + cell_h - 5), outline="#cdbf9a", width=1)
    draw.text((x + 20, y + 16), glyph, fill="#203a31", font=glyph_font)
    draw.text((x + 86, y + 20), f"U+{codepoint:04X}", fill="#5a4932", font=latin_font)
    draw.text((x + 86, y + 47), name, fill="#5a4932", font=latin_font)
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
image.save(OUTPUT_PATH)
print(OUTPUT_PATH)

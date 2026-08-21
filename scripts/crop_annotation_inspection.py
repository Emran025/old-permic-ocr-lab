#!/usr/bin/env python3
"""Crop a source image for close annotation inspection without altering the source."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


if len(sys.argv) not in (7, 8):
    raise SystemExit("usage: crop_annotation_inspection.py INPUT OUTPUT LEFT TOP RIGHT BOTTOM [SCALE]")

input_path, output_path = Path(sys.argv[1]), Path(sys.argv[2])
left, top, right, bottom = map(int, sys.argv[3:7])
scale = int(sys.argv[7]) if len(sys.argv) == 8 else 1
if scale < 1:
    raise ValueError("SCALE must be at least 1")
with Image.open(input_path) as image:
    if not (0 <= left < right <= image.width and 0 <= top < bottom <= image.height):
        raise ValueError("crop bounds outside source image")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    crop = image.crop((left, top, right, bottom))
    if scale > 1:
        crop = crop.resize((crop.width * scale, crop.height * scale), Image.Resampling.NEAREST)
    crop.save(output_path)
print(output_path)

#!/usr/bin/env python3
"""Propose ink-run boxes for manual Old Permic glyph review.

It is intentionally conservative: it returns candidate ink groups, not labels.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw


if len(sys.argv) != 4:
    raise SystemExit("usage: propose_glyph_boxes.py INPUT OUTPUT_JSON OUTPUT_PREVIEW")

source_path, json_path, preview_path = map(Path, sys.argv[1:])
with Image.open(source_path) as source:
    rgb = source.convert("RGB")
    grayscale = rgb.convert("L")
    pixels = grayscale.load()
    width, height = grayscale.size
    # Dark ink threshold: deliberately excludes low-contrast parchment noise.
    threshold = 145
    column_counts = [sum(pixels[x, y] < threshold for y in range(height)) for x in range(width)]
    active = [count >= 2 for count in column_counts]
    runs: list[list[int]] = []
    start = None
    for x, is_active in enumerate(active + [False]):
        if is_active and start is None:
            start = x
        elif not is_active and start is not None:
            if x - start >= 3:
                runs.append([start, x])
            start = None
    # Join runs separated by <= 3 px to avoid splitting a single handwritten glyph.
    merged: list[list[int]] = []
    for run in runs:
        if merged and run[0] - merged[-1][1] <= 3:
            merged[-1][1] = run[1]
        else:
            merged.append(run)
    boxes = []
    for left, right in merged:
        ys = [y for x in range(left, right) for y in range(height) if pixels[x, y] < threshold]
        if not ys:
            continue
        top, bottom = max(0, min(ys) - 2), min(height, max(ys) + 3)
        boxes.append({"box_xyxy_px": [left, top, right, bottom], "status": "candidate_ink_group"})
    preview = rgb.copy()
    draw = ImageDraw.Draw(preview)
    for index, item in enumerate(boxes, start=1):
        left, top, right, bottom = item["box_xyxy_px"]
        draw.rectangle((left, top, right, bottom), outline="#e11d48", width=1)
        draw.text((left, max(0, top - 12)), str(index), fill="#e11d48")
    json_path.parent.mkdir(parents=True, exist_ok=True)
    preview_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps({"source": str(source_path), "threshold": threshold, "candidate_ink_groups": boxes}, indent=2), encoding="utf-8")
    preview.save(preview_path)
print(json.dumps({"candidate_ink_groups": len(boxes), "json": str(json_path), "preview": str(preview_path)}))

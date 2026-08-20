#!/usr/bin/env python3
"""Write the shared Unicode Old Permic class map used by real-data annotations."""

from __future__ import annotations

import json
import unicodedata
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = PROJECT_ROOT / "training" / "real_character_dataset" / "class_map.json"


classes = []
for codepoint in range(0x10350, 0x10376):
    glyph = chr(codepoint)
    name = unicodedata.name(glyph, "")
    if name.startswith("OLD PERMIC LETTER "):
        classes.append({"id": len(classes), "label": glyph, "glyph": glyph, "codepoint": f"U+{codepoint:04X}", "unicode_name": name})

assert len(classes) == 38, f"expected 38 classes, got {len(classes)}"
OUTPUT_PATH.write_text(json.dumps({"classes": classes, "source": "Unicode Old Permic base-letter assignments", "synthetic": False}, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"wrote {OUTPUT_PATH}")

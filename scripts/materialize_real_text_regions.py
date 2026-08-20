#!/usr/bin/env python3
"""Create deterministic review crops from hosted Old Permic source images.

This creates candidate regions only. It never assigns a Unicode character label.
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SPEC_PATH = PROJECT_ROOT / "training" / "real_character_dataset" / "review_regions.json"
SOURCE_MANIFEST_PATH = PROJECT_ROOT / "training" / "real_character_dataset" / "source_manifest.json"


def main() -> None:
    raw_root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/home/ubuntu/real-character-assets/raw")
    output_root = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("/home/ubuntu/real-character-assets/crops")
    spec = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
    sources = {item["id"]: item for item in json.loads(SOURCE_MANIFEST_PATH.read_text(encoding="utf-8"))["sources"]}
    if output_root.exists():
        shutil.rmtree(output_root)
    output_root.mkdir(parents=True)
    report = []
    for region in spec["regions"]:
        source = sources[region["source_id"]]
        raw_path = raw_root / source["file"]
        if not raw_path.is_file():
            raise FileNotFoundError(raw_path)
        with Image.open(raw_path) as image:
            left, top, right, bottom = region["box_xyxy"]
            if not (0 <= left < right <= image.width and 0 <= top < bottom <= image.height):
                raise ValueError(f"invalid crop bounds for {region['crop_id']}: {region['box_xyxy']}")
            crop = image.crop((left, top, right, bottom))
            crop_path = output_root / f"{region['crop_id']}.png"
            crop.save(crop_path)
        report.append({
            "crop_id": region["crop_id"],
            "source_id": region["source_id"],
            "crop_file": crop_path.name,
            "box_xyxy": region["box_xyxy"],
            "review_status": "candidate_region",
            "unicode_labels": [],
        })
    (output_root / "candidate_crop_manifest.json").write_text(
        json.dumps({"schema_version": 1, "crops": report}, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({"output": str(output_root), "candidate_crops": len(report)}, ensure_ascii=False))


if __name__ == "__main__":
    main()

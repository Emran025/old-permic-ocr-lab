#!/usr/bin/env python3
"""Export only evidence-backed real Old Permic annotations into YOLO preview assets.

The exporter deliberately refuses to call the output trainable until at least
three distinct manuscript sources have verified glyphs, so that source-level
train/val/test separation can be enforced.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import sys
from collections import defaultdict
from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATASET_ROOT = PROJECT_ROOT / "training" / "real_character_dataset"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    crop_root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/home/ubuntu/real-character-assets/crops")
    output_root = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("/home/ubuntu/real-character-assets/yolo_preview")
    classes = json.loads((DATASET_ROOT / "class_map.json").read_text(encoding="utf-8"))["classes"]
    class_ids = {entry["codepoint"]: entry["id"] for entry in classes}
    rows = [json.loads(line) for line in (DATASET_ROOT / "annotations" / "character_instances.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
    verified = [row for row in rows if row["review_status"] == "verified"]
    grouped: dict[str, list[dict]] = defaultdict(list)
    for row in verified:
        grouped[row["crop_id"]].append(row)
    if output_root.exists():
        shutil.rmtree(output_root)
    (output_root / "images").mkdir(parents=True)
    (output_root / "labels").mkdir(parents=True)
    assets = []
    for crop_id, entries in sorted(grouped.items()):
        source = crop_root / f"{crop_id}.png"
        if not source.is_file():
            raise FileNotFoundError(f"missing crop image: {source}")
        with Image.open(source) as image:
            width, height = image.size
        destination_image = output_root / "images" / source.name
        shutil.copy2(source, destination_image)
        label_lines = []
        for entry in entries:
            left, top, right, bottom = entry["bbox_crop_xyxy_px"]
            if not (0 <= left < right <= width and 0 <= top < bottom <= height):
                raise ValueError(f"invalid box in {entry['instance_id']}")
            class_id = class_ids[entry["unicode_codepoint"]]
            center_x = ((left + right) / 2) / width
            center_y = ((top + bottom) / 2) / height
            box_width = (right - left) / width
            box_height = (bottom - top) / height
            label_lines.append(f"{class_id} {center_x:.8f} {center_y:.8f} {box_width:.8f} {box_height:.8f}")
        destination_label = output_root / "labels" / f"{crop_id}.txt"
        destination_label.write_text("\n".join(label_lines) + "\n", encoding="utf-8")
        assets.append({"crop_id": crop_id, "source_ids": sorted({entry["source_id"] for entry in entries}), "instances": len(entries), "image_sha256": sha256_file(destination_image), "label_sha256": sha256_file(destination_label)})
    source_ids = sorted({entry["source_id"] for entry in verified})
    manifest = {
        "kind": "old-permic-real-character-yolo-preview",
        "verified_instances": len(verified),
        "sources": source_ids,
        "assets": assets,
        "trainable": len(source_ids) >= 3,
        "training_blocker": None if len(source_ids) >= 3 else "Need verified glyphs from at least three distinct sources before source-disjoint train/val/test splits.",
    }
    (output_root / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

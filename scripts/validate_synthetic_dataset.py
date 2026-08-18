#!/usr/bin/env python3
"""Validate a generated Old Permic synthetic YOLO dataset without training a model."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def validate(dataset_root: Path) -> dict[str, int]:
    manifest_path = dataset_root / "manifest.json"
    classes_path = dataset_root / "class_map.json"
    if not manifest_path.is_file() or not classes_path.is_file():
        raise FileNotFoundError("manifest.json and class_map.json are both required.")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("real_manuscripts_included") is not False:
        raise ValueError("Synthetic validator only accepts a dataset without real manuscript images.")
    class_payload = json.loads(classes_path.read_text(encoding="utf-8"))
    classes = class_payload.get("classes", [])
    if not classes or [row.get("id") for row in classes] != list(range(len(classes))):
        raise ValueError("class_map.json must contain sequential class ids starting at zero.")

    totals: dict[str, int] = {}
    for split in ("train", "val", "test"):
        image_dir = dataset_root / "images" / split
        label_dir = dataset_root / "labels" / split
        images = sorted(image_dir.glob("*.png"))
        labels = sorted(label_dir.glob("*.txt"))
        if len(images) != len(labels):
            raise ValueError(f"{split} has {len(images)} images but {len(labels)} labels.")
        for image in images:
            label_path = label_dir / f"{image.stem}.txt"
            if not label_path.is_file():
                raise FileNotFoundError(f"Missing label for {image.name}")
            for number, line in enumerate(label_path.read_text(encoding="utf-8").splitlines(), start=1):
                class_id, *coordinates = line.split()
                if len(coordinates) != 4 or not 0 <= int(class_id) < len(classes):
                    raise ValueError(f"Invalid YOLO record in {label_path}:{number}")
                if not all(0 < float(value) <= 1 for value in coordinates):
                    raise ValueError(f"Non-normalized coordinate in {label_path}:{number}")
        totals[split] = len(images)

    if totals["train"] < 1 or totals["val"] < 1 or totals["test"] < 1:
        raise ValueError("At least one train, validation, and test sample is required for a training-ready synthetic run.")
    return totals


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate an Old Permic synthetic YOLO dataset.")
    parser.add_argument("dataset_root", type=Path)
    args = parser.parse_args()
    totals = validate(args.dataset_root)
    print(json.dumps({"valid": True, "split_counts": totals}, ensure_ascii=False))


if __name__ == "__main__":
    main()

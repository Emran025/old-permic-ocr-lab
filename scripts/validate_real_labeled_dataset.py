#!/usr/bin/env python3
"""Validate a review-ready Old Permic manuscript YOLO dataset before training."""

from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path


SPLITS = ("train", "val", "test")
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}
SOURCE_COLUMNS = {
    "image_file",
    "repository_id",
    "folio_or_page",
    "source_url",
    "rights_basis",
    "old_permic_visible",
    "annotation_status",
    "split",
    "notes",
}
APPROVED_STATUSES = {"approved", "reviewed"}
TRUE_VALUES = {"1", "true", "yes", "نعم"}


def read_json(path: Path, required_name: str) -> dict:
    if not path.is_file():
        raise FileNotFoundError(f"{required_name} is required at the dataset root.")
    try:
        content = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ValueError(f"{required_name} is not valid JSON: {error}") from error
    if not isinstance(content, dict):
        raise ValueError(f"{required_name} must contain a JSON object.")
    return content


def validate_class_map(dataset_root: Path) -> list[dict]:
    class_map = read_json(dataset_root / "class_map.json", "class_map.json")
    classes = class_map.get("classes")
    if not isinstance(classes, list) or not classes:
        raise ValueError("class_map.json must contain a non-empty classes list.")
    ids = [item.get("id") if isinstance(item, dict) else None for item in classes]
    if ids != list(range(len(classes))):
        raise ValueError("class_map.json class ids must be sequential and start at zero.")
    if any(not isinstance(item.get("label"), str) or not item["label"].strip() for item in classes):
        raise ValueError("Every class must contain a non-empty label.")
    return classes


def validate_manifest(dataset_root: Path) -> dict:
    manifest = read_json(dataset_root / "manifest_real.json", "manifest_real.json")
    required = ("dataset_version", "rights_reviewed", "annotations_reviewed")
    missing = [field for field in required if not manifest.get(field)]
    if missing:
        raise ValueError(f"manifest_real.json is missing affirmed fields: {', '.join(missing)}")
    return manifest


def parse_sources(dataset_root: Path) -> dict[str, dict[str, str]]:
    source_path = dataset_root / "sources.csv"
    if not source_path.is_file():
        raise FileNotFoundError("sources.csv is required at the dataset root.")
    with source_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None or not SOURCE_COLUMNS.issubset(reader.fieldnames):
            raise ValueError("sources.csv is missing one or more required columns.")
        rows = list(reader)
    if not rows:
        raise ValueError("sources.csv must contain at least one image record.")

    indexed: dict[str, dict[str, str]] = {}
    page_splits: dict[tuple[str, str], set[str]] = defaultdict(set)
    for row_number, row in enumerate(rows, start=2):
        file_name = (row.get("image_file") or "").strip()
        if not file_name or Path(file_name).name != file_name:
            raise ValueError(f"sources.csv:{row_number} has an invalid image_file.")
        if file_name in indexed:
            raise ValueError(f"sources.csv contains duplicate metadata for {file_name}.")
        if (row.get("split") or "").strip() not in SPLITS:
            raise ValueError(f"sources.csv:{row_number} has an invalid split.")
        if (row.get("old_permic_visible") or "").strip().lower() not in TRUE_VALUES:
            raise ValueError(f"sources.csv:{row_number} must affirm old_permic_visible.")
        status = (row.get("annotation_status") or "").strip().lower()
        if status not in APPROVED_STATUSES:
            raise ValueError(f"sources.csv:{row_number} must have approved or reviewed annotation_status.")
        for field in ("repository_id", "folio_or_page", "source_url", "rights_basis"):
            if not (row.get(field) or "").strip():
                raise ValueError(f"sources.csv:{row_number} is missing {field}.")

        indexed[file_name] = row
        page_splits[((row["repository_id"] or "").strip(), (row["folio_or_page"] or "").strip())].add((row["split"] or "").strip())

    leaked_pages = [f"{repository_id}/{folio}" for (repository_id, folio), splits in page_splits.items() if len(splits) > 1]
    if leaked_pages:
        raise ValueError("A source page appears in more than one split: " + ", ".join(leaked_pages))
    return indexed


def validate_label(label_path: Path, class_count: int) -> int:
    records = [line for line in label_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    if not records:
        raise ValueError(f"{label_path} contains no character annotations.")
    for line_number, line in enumerate(records, start=1):
        fields = line.split()
        if len(fields) != 5:
            raise ValueError(f"{label_path}:{line_number} is not a five-field YOLO record.")
        try:
            class_id = int(fields[0])
            center_x, center_y, width, height = (float(value) for value in fields[1:])
        except ValueError as error:
            raise ValueError(f"{label_path}:{line_number} contains non-numeric values.") from error
        if not 0 <= class_id < class_count:
            raise ValueError(f"{label_path}:{line_number} has a class id outside class_map.json.")
        if not (0 <= center_x <= 1 and 0 <= center_y <= 1 and 0 < width <= 1 and 0 < height <= 1):
            raise ValueError(f"{label_path}:{line_number} has non-normalized YOLO coordinates.")
        if center_x - width / 2 < 0 or center_x + width / 2 > 1 or center_y - height / 2 < 0 or center_y + height / 2 > 1:
            raise ValueError(f"{label_path}:{line_number} has a box outside the image boundary.")
    return len(records)


def validate(dataset_root: Path) -> dict[str, object]:
    dataset_root = dataset_root.resolve()
    classes = validate_class_map(dataset_root)
    validate_manifest(dataset_root)
    source_index = parse_sources(dataset_root)
    image_names: set[str] = set()
    split_counts: dict[str, int] = {}
    annotation_count = 0

    for split in SPLITS:
        image_dir = dataset_root / "images" / split
        label_dir = dataset_root / "labels" / split
        if not image_dir.is_dir() or not label_dir.is_dir():
            raise FileNotFoundError(f"images/{split} and labels/{split} are both required.")
        images = sorted(path for path in image_dir.iterdir() if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES)
        if not images:
            raise ValueError(f"images/{split} must contain at least one manuscript image.")
        for image_path in images:
            if image_path.name in image_names:
                raise ValueError(f"Image filename occurs in more than one split: {image_path.name}")
            image_names.add(image_path.name)
            row = source_index.get(image_path.name)
            if row is None:
                raise ValueError(f"sources.csv has no metadata record for {image_path.name}.")
            if row["split"].strip() != split:
                raise ValueError(f"sources.csv split does not match the image location for {image_path.name}.")
            label_path = label_dir / f"{image_path.stem}.txt"
            if not label_path.is_file():
                raise FileNotFoundError(f"Missing label file for {image_path.name}.")
            annotation_count += validate_label(label_path, len(classes))

        label_stems = {path.stem for path in label_dir.glob("*.txt")}
        image_stems = {path.stem for path in images}
        if label_stems != image_stems:
            raise ValueError(f"labels/{split} does not match images/{split} one-to-one.")
        split_counts[split] = len(images)

    if set(source_index) != image_names:
        unused = sorted(set(source_index) - image_names)
        raise ValueError("sources.csv has rows without a matching dataset image: " + ", ".join(unused))
    return {"valid": True, "split_counts": split_counts, "class_count": len(classes), "annotation_count": annotation_count}


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate a review-ready Old Permic real-manuscript YOLO dataset.")
    parser.add_argument("dataset_root", type=Path)
    args = parser.parse_args()
    print(json.dumps(validate(args.dataset_root), ensure_ascii=False))


if __name__ == "__main__":
    main()

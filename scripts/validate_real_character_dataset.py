#!/usr/bin/env python3
"""Validate the review-first real Old Permic character dataset contract."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / "training" / "real_character_dataset"
SCHEMA = json.loads((ROOT / "annotation_schema.json").read_text(encoding="utf-8"))
CLASS_MAP = json.loads((ROOT / "class_map.json").read_text(encoding="utf-8"))["classes"]
MANIFEST = json.loads((ROOT / "source_manifest.json").read_text(encoding="utf-8"))
REGIONS = json.loads((ROOT / "review_regions.json").read_text(encoding="utf-8"))["regions"]
INSTANCES_PATH = ROOT / "annotations" / "character_instances.jsonl"

assert len(CLASS_MAP) == 38, "Expected all 38 Unicode Old Permic base letters."
assert [entry["id"] for entry in CLASS_MAP] == list(range(38)), "Class ids must be contiguous."
allowed_codepoints = {entry["codepoint"] for entry in CLASS_MAP}
hosted_source_ids = {source["id"] for source in MANIFEST["sources"]}
annotation_units = {unit["id"]: unit for unit in MANIFEST.get("annotation_units", [])}
regions_by_id = {region["crop_id"]: region for region in REGIONS}
for region in REGIONS:
    assert region["source_id"] in hosted_source_ids, f"Unknown hosted source in {region['crop_id']}"
    if "annotation_unit_id" in region:
        unit = annotation_units.get(region["annotation_unit_id"])
        assert unit is not None, f"Unknown annotation unit in {region['crop_id']}"
        assert unit["hosted_source_id"] == region["source_id"], f"Annotation unit/source mismatch in {region['crop_id']}"
instances = [json.loads(line) for line in INSTANCES_PATH.read_text(encoding="utf-8").splitlines() if line.strip()]

for instance in instances:
    for field in SCHEMA["required_fields"]:
        assert instance.get(field) not in (None, ""), f"Missing {field} in {instance.get('instance_id', '<unknown>')}"
    assert instance["crop_id"] in regions_by_id, "Each character box must reference a declared crop."
    assert instance["review_status"] in SCHEMA["review_statuses"], "Unknown review status."
    if instance["review_status"] == "verified":
        unit = annotation_units.get(instance["source_id"])
        assert unit is not None, "Verified labels must reference a declared manuscript annotation unit."
        region = regions_by_id[instance["crop_id"]]
        assert region.get("annotation_unit_id") == instance["source_id"], "Verified label must stay within its declared manuscript unit."
        assert instance["unicode_codepoint"] in allowed_codepoints, "Verified labels must be assigned Old Permic Unicode codepoints."
        assert isinstance(instance["bbox_crop_xyxy_px"], list) and len(instance["bbox_crop_xyxy_px"]) == 4

print(json.dumps({"root": str(ROOT), "candidate_regions": len(REGIONS), "verified_character_instances": sum(row["review_status"] == "verified" for row in instances)}, ensure_ascii=False))

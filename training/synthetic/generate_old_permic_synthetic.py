#!/usr/bin/env python3
"""Generate reproducible Old Permic character-detection samples in YOLO format.

S0 renders one letter per image, S1 renders ordered visual lines, and S2 renders
structured pages. None of these modes use lexical words or manuscript pixels.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import shutil
import unicodedata
from concurrent.futures import ProcessPoolExecutor
from dataclasses import asdict, dataclass
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

DEFAULT_FONT_PATH = Path("/usr/share/fonts/truetype/noto/NotoSansOldPermic-Regular.ttf")
LAYOUTS = ("isolated-glyph", "scattered-glyph", "ordered-lines", "structured-pages")
IMAGE_FORMATS = ("png", "jpeg")
IMAGE_SUFFIXES = {"png": ".png", "jpeg": ".jpg"}


@dataclass(frozen=True)
class Profile:
    name: str
    rotation_degrees: float
    blur_radius: float
    noise_strength: int
    ink_jitter: int
    line_gap: int
    background: tuple[int, int, int]
    ink: tuple[int, int, int]
    isolated_glyph_extent: float
    isolated_center_jitter: int
    background_fragment_count: int
    background_fragment_delta: int


PROFILES: dict[str, Profile] = {
    "unicode-clean": Profile("unicode-clean", 0.0, 0.0, 0, 0, 12, (250, 247, 238), (36, 48, 41), 0.80, 0, 0, 0),
    "controlled-deformation": Profile("controlled-deformation", 3.0, 0.45, 10, 3, 16, (242, 235, 219), (62, 47, 38), 0.42, 0, 18, 10),
    "manuscript-inspired": Profile("manuscript-inspired", 5.0, 0.7, 18, 5, 20, (232, 221, 197), (73, 51, 35), 0.56, 20, 32, 18),
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def old_permic_characters() -> list[dict[str, str]]:
    """Derive the assigned 38 Old Permic base letters from the Unicode database."""
    characters: list[dict[str, str]] = []
    for codepoint in range(0x10350, 0x10376):
        character = chr(codepoint)
        name = unicodedata.name(character, "")
        if name.startswith("OLD PERMIC LETTER "):
            characters.append({"glyph": character, "codepoint": f"U+{codepoint:04X}", "unicode_name": name})
    if len(characters) != 38:
        raise RuntimeError(f"Expected 38 Old Permic base letters, found {len(characters)} in this Python runtime.")
    return characters


def glyph_patch(glyph: str, font: ImageFont.FreeTypeFont, profile: Profile, rng: random.Random) -> Image.Image:
    bbox = font.getbbox(glyph)
    width = max(1, bbox[2] - bbox[0]) + 20
    height = max(1, bbox[3] - bbox[1]) + 20
    patch = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(patch)
    jitter_x = rng.randint(-profile.ink_jitter, profile.ink_jitter)
    jitter_y = rng.randint(-profile.ink_jitter, profile.ink_jitter)
    draw.text((10 - bbox[0] + jitter_x, 10 - bbox[1] + jitter_y), glyph, fill=(*profile.ink, 255), font=font)
    if profile.rotation_degrees:
        patch = patch.rotate(rng.uniform(-profile.rotation_degrees, profile.rotation_degrees), expand=True, resample=Image.Resampling.BICUBIC)
    return patch


def add_background_fragments(image: Image.Image, profile: Profile, rng: random.Random) -> None:
    """Add deterministic paper-like rectangular fragments without introducing labelled foreground objects."""
    if not profile.background_fragment_count:
        return
    draw = ImageDraw.Draw(image)
    for _ in range(profile.background_fragment_count):
        width = rng.randint(max(12, image.width // 28), max(18, image.width // 7))
        height = rng.randint(max(8, image.height // 42), max(14, image.height // 14))
        x = rng.randint(0, max(0, image.width - width))
        y = rng.randint(0, max(0, image.height - height))
        delta = rng.randint(-profile.background_fragment_delta, profile.background_fragment_delta)
        color = tuple(max(0, min(255, channel + delta)) for channel in profile.background)
        draw.rectangle((x, y, x + width, y + height), fill=color)


def isolated_font_size(glyph: str, image_size: int, font_size: int, font_path: Path, profile: Profile) -> int:
    """Scale the first curriculum glyph to a controlled share of the image."""
    reference_font = ImageFont.truetype(str(font_path), font_size)
    bbox = reference_font.getbbox(glyph)
    extent = max(1, bbox[2] - bbox[0], bbox[3] - bbox[1])
    target_extent = min(image_size - max(16, image_size // 20), round(image_size * profile.isolated_glyph_extent))
    return max(font_size, round(font_size * target_extent / extent))


def finalize_image(image: Image.Image, profile: Profile, rng: random.Random) -> Image.Image:
    if profile.blur_radius:
        image = image.filter(ImageFilter.GaussianBlur(profile.blur_radius))
    if profile.noise_strength:
        # One deterministic byte stream plus Pillow channel arithmetic is markedly faster than Python per-pixel loops.
        noise = Image.frombytes("L", image.size, rng.randbytes(image.width * image.height))
        scale = profile.noise_strength / 127.0
        darker = noise.point(lambda value: max(0, round((127 - value) * scale)))
        lighter = noise.point(lambda value: max(0, round((value - 128) * scale)))
        image = Image.merge("RGB", tuple(ImageChops.add(ImageChops.subtract(channel, darker), lighter) for channel in image.split()))
    return image


def normalized_box(x: int, y: int, width: int, height: int, image_size: int) -> tuple[float, float, float, float]:
    return ((x + width / 2) / image_size, (y + height / 2) / image_size, width / image_size, height / image_size)


def render_isolated_glyph_sample(
    characters: list[dict[str, str]], profile: Profile, seed: int, image_size: int, font_size: int, font_path: Path, class_id_override: int | None = None
) -> tuple[Image.Image, list[tuple[int, float, float, float, float]], list[str], dict[str, object]]:
    """Render exactly one labelled character asset (S0)."""
    rng = random.Random(seed)
    image = Image.new("RGB", (image_size, image_size), profile.background)
    add_background_fragments(image, profile, rng)
    class_id = rng.randrange(len(characters)) if class_id_override is None else class_id_override
    glyph = characters[class_id]["glyph"]
    font = ImageFont.truetype(str(font_path), isolated_font_size(glyph, image_size, font_size, font_path, profile))
    patch = glyph_patch(glyph, font, profile, rng)
    max_patch_extent = image_size - max(16, image_size // 20)
    if max(patch.width, patch.height) > max_patch_extent:
        ratio = max_patch_extent / max(patch.width, patch.height)
        patch = patch.resize((max(1, round(patch.width * ratio)), max(1, round(patch.height * ratio))), Image.Resampling.LANCZOS)
    x = (image_size - patch.width) // 2 + rng.randint(-profile.isolated_center_jitter, profile.isolated_center_jitter)
    y = (image_size - patch.height) // 2 + rng.randint(-profile.isolated_center_jitter, profile.isolated_center_jitter)
    x = max(0, min(x, image_size - patch.width))
    y = max(0, min(y, image_size - patch.height))
    image.paste(patch, (x, y), patch)
    center_x, center_y, width, height = normalized_box(x, y, patch.width, patch.height, image_size)
    metadata = {
        "layout_family": "isolated-glyph",
        "curriculum": {
            "isolated_glyph_extent": profile.isolated_glyph_extent,
            "center_jitter": profile.isolated_center_jitter,
            "background_fragment_count": profile.background_fragment_count,
        },
        "page_id": None,
        "reading_order": ["glyph-0"],
        "regions": [],
        "lines": [],
    }
    return finalize_image(image, profile, rng), [(class_id, center_x, center_y, width, height)], [glyph], metadata


def render_scattered_glyph_sample(
    characters: list[dict[str, str]], profile: Profile, seed: int, image_size: int, font_size: int, font_path: Path, class_id_override: int | None = None
) -> tuple[Image.Image, list[tuple[int, float, float, float, float]], list[str], dict[str, object]]:
    """Render one smaller labelled glyph at a deterministic, non-central page position (S0-d)."""
    rng = random.Random(seed)
    image = Image.new("RGB", (image_size, image_size), profile.background)
    add_background_fragments(image, profile, rng)
    class_id = rng.randrange(len(characters)) if class_id_override is None else class_id_override
    glyph = characters[class_id]["glyph"]
    font = ImageFont.truetype(str(font_path), isolated_font_size(glyph, image_size, font_size, font_path, profile))
    patch = glyph_patch(glyph, font, profile, rng)
    max_patch_extent = max(32, round(image_size * (profile.isolated_glyph_extent + 0.08)))
    if max(patch.width, patch.height) > max_patch_extent:
        ratio = max_patch_extent / max(patch.width, patch.height)
        patch = patch.resize((max(1, round(patch.width * ratio)), max(1, round(patch.height * ratio))), Image.Resampling.LANCZOS)
    safe_margin = max(16, image_size // 16)
    x_low, x_high = safe_margin, max(safe_margin, image_size - safe_margin - patch.width)
    y_low, y_high = safe_margin, max(safe_margin, image_size - safe_margin - patch.height)
    # Select one of eight page zones (all except the central one).  This keeps
    # every sample at a varying but visibly non-central location in S0-d.
    zone_col, zone_row = rng.choice(((0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2), (1, 2), (2, 2)))
    x_span = max(0, x_high - x_low)
    y_span = max(0, y_high - y_low)
    x_start = x_low + round(x_span * zone_col / 3)
    x_end = x_low + round(x_span * (zone_col + 1) / 3)
    y_start = y_low + round(y_span * zone_row / 3)
    y_end = y_low + round(y_span * (zone_row + 1) / 3)
    x = rng.randint(min(x_start, x_end), max(x_start, x_end))
    y = rng.randint(min(y_start, y_end), max(y_start, y_end))
    image.paste(patch, (x, y), patch)
    center_x, center_y, width, height = normalized_box(x, y, patch.width, patch.height, image_size)
    metadata = {
        "layout_family": "scattered-glyph",
        "curriculum": {
            "isolated_glyph_extent": profile.isolated_glyph_extent,
            "spatial_policy": "uniform-safe-noncentral-grid-placement",
            "spatial_zone": {"column": zone_col, "row": zone_row},
            "safe_margin_px": safe_margin,
            "background_fragment_count": profile.background_fragment_count,
        },
        "page_id": f"s0d-page-{seed}",
        "reading_order": ["glyph-0"],
        "regions": [{"region_id": "safe-page-field", "role": "synthetic-character-field", "bbox": [0.0, 0.0, 1.0, 1.0]}],
        "lines": [],
    }
    return finalize_image(image, profile, rng), [(class_id, center_x, center_y, width, height)], [glyph], metadata


def render_ordered_line_sample(
    characters: list[dict[str, str]], profile: Profile, seed: int, image_size: int, font_size: int, font_path: Path
) -> tuple[Image.Image, list[tuple[int, float, float, float, float]], list[str], dict[str, object]]:
    """Render visually ordered character lines (S1), without lexical word claims."""
    rng = random.Random(seed)
    image = Image.new("RGB", (image_size, image_size), profile.background)
    labels: list[tuple[int, float, float, float, float]] = []
    sequence: list[str] = []
    font = ImageFont.truetype(str(font_path), font_size)
    x, y = 32, 32
    max_line_bottom = y
    line_records: list[dict[str, object]] = []
    line_index = 0

    for _ in range(rng.randint(20, 34)):
        class_id = rng.randrange(len(characters))
        glyph = characters[class_id]["glyph"]
        patch = glyph_patch(glyph, font, profile, rng)
        if x + patch.width + 32 > image_size:
            x = 32
            y = max_line_bottom + profile.line_gap
            line_index += 1
        if y + patch.height + 32 > image_size:
            break
        image.paste(patch, (x, y), patch)
        center_x, center_y, width, height = normalized_box(x, y, patch.width, patch.height, image_size)
        labels.append((class_id, center_x, center_y, width, height))
        sequence.append(glyph)
        max_line_bottom = max(max_line_bottom, y + patch.height)
        line_records.append({"line_id": f"line-{line_index}", "glyph_index": len(sequence) - 1, "baseline_y": round((y + patch.height) / image_size, 6)})
        x += patch.width + rng.randint(5, 14)
    metadata = {
        "layout_family": "ordered-lines",
        "page_id": None,
        "reading_order": [f"glyph-{index}" for index in range(len(sequence))],
        "regions": [{"region_id": "line-field", "role": "synthetic-text", "bbox": [0.05, 0.05, 0.9, 0.9]}],
        "lines": line_records,
    }
    return finalize_image(image, profile, rng), labels, sequence, metadata


def render_structured_page_sample(
    characters: list[dict[str, str]], profile: Profile, seed: int, image_size: int, font_size: int, font_path: Path
) -> tuple[Image.Image, list[tuple[int, float, float, float, float]], list[str], dict[str, object]]:
    """Render S2 page regions and ordered lines while retaining character-level YOLO boxes."""
    rng = random.Random(seed)
    image = Image.new("RGB", (image_size, image_size), profile.background)
    labels: list[tuple[int, float, float, float, float]] = []
    sequence: list[str] = []
    font = ImageFont.truetype(str(font_path), font_size)
    margin = max(32, image_size // 16)
    gutter = max(18, image_size // 28)
    column_count = 1 if rng.random() < 0.45 else 2
    column_width = (image_size - (2 * margin) - (gutter * (column_count - 1))) // column_count
    page_id = f"page-{seed}"
    regions: list[dict[str, object]] = []
    line_records: list[dict[str, object]] = []
    reading_order: list[str] = []

    for column_index in range(column_count):
        column_x = margin + column_index * (column_width + gutter)
        regions.append(
            {
                "region_id": f"column-{column_index}",
                "role": "synthetic-text-column",
                "bbox": [round(column_x / image_size, 6), round(margin / image_size, 6), round(column_width / image_size, 6), round((image_size - 2 * margin) / image_size, 6)],
            }
        )
        y = margin
        for row_index in range(rng.randint(5, 8)):
            x = column_x
            line_start = len(labels)
            line_top = y
            line_bottom = y
            for _ in range(rng.randint(4, 7)):
                class_id = rng.randrange(len(characters))
                glyph = characters[class_id]["glyph"]
                patch = glyph_patch(glyph, font, profile, rng)
                if x + patch.width > column_x + column_width or y + patch.height > image_size - margin:
                    break
                image.paste(patch, (x, y), patch)
                center_x, center_y, width, height = normalized_box(x, y, patch.width, patch.height, image_size)
                labels.append((class_id, center_x, center_y, width, height))
                sequence.append(glyph)
                x += patch.width + rng.randint(5, 13)
                line_bottom = max(line_bottom, y + patch.height)
            if len(labels) == line_start:
                break
            line_id = f"column-{column_index}-line-{row_index}"
            reading_order.append(line_id)
            line_records.append(
                {
                    "line_id": line_id,
                    "region_id": f"column-{column_index}",
                    "baseline_y": round(line_bottom / image_size, 6),
                    "bbox": [round(column_x / image_size, 6), round(line_top / image_size, 6), round((x - column_x) / image_size, 6), round((line_bottom - line_top) / image_size, 6)],
                    "label_indices": list(range(line_start, len(labels))),
                }
            )
            y = line_bottom + profile.line_gap + rng.randint(1, 8)
            if y >= image_size - margin:
                break
    if not labels:
        raise RuntimeError("Structured-page renderer produced no character labels.")
    metadata = {
        "layout_family": "single-column-page" if column_count == 1 else "multi-column-page",
        "page_id": page_id,
        "reading_order": reading_order,
        "regions": regions,
        "lines": line_records,
    }
    return finalize_image(image, profile, rng), labels, sequence, metadata


def render_sample(
    layout: str, characters: list[dict[str, str]], profile: Profile, seed: int, image_size: int, font_size: int, font_path: Path, class_id_override: int | None = None
) -> tuple[Image.Image, list[tuple[int, float, float, float, float]], list[str], dict[str, object]]:
    if layout == "isolated-glyph":
        return render_isolated_glyph_sample(characters, profile, seed, image_size, font_size, font_path, class_id_override)
    if layout == "scattered-glyph":
        return render_scattered_glyph_sample(characters, profile, seed, image_size, font_size, font_path, class_id_override)
    if layout == "ordered-lines":
        return render_ordered_line_sample(characters, profile, seed, image_size, font_size, font_path)
    if layout == "structured-pages":
        return render_structured_page_sample(characters, profile, seed, image_size, font_size, font_path)
    raise ValueError(f"Unsupported layout: {layout}")


def render_and_write_sample(
    task: tuple[int, str, int, int | None, Path, Profile, int, int, Path, str, str, int, list[dict[str, str]]]
) -> dict[str, object]:
    """Render and save one independent asset; task order, seeds, and names stay deterministic across worker counts."""
    index, split, sample_seed, class_id_override, output_dir, profile, image_size, font_size, font_path, layout, image_format, jpeg_quality, characters = task
    image, labels, sequence, geometry = render_sample(layout, characters, profile, sample_seed, image_size, font_size, font_path, class_id_override)
    stem = f"old_permic_{layout}_{profile.name}_{index:05d}"
    image_suffix = IMAGE_SUFFIXES[image_format]
    image_path = output_dir / "images" / split / f"{stem}{image_suffix}"
    if image_format == "jpeg":
        image.save(image_path, format="JPEG", quality=jpeg_quality, optimize=True, progressive=False, subsampling=0)
    else:
        image.save(image_path, format="PNG", optimize=True)
    with (output_dir / "labels" / split / f"{stem}.txt").open("w", encoding="utf-8") as label_file:
        for class_id, center_x, center_y, width, height in labels:
            label_file.write(f"{class_id} {center_x:.6f} {center_y:.6f} {width:.6f} {height:.6f}\n")
    unit = {
        "isolated-glyph": "S0-glyph-asset",
        "scattered-glyph": "S0-d-scattered-glyph-asset",
        "ordered-lines": "S1-ordered-line",
        "structured-pages": "S2-structured-page",
    }[layout]
    return {
        "asset_id": stem,
        "parent_id": None,
        "unit": unit,
        "partition": split,
        "seed": sample_seed,
        "profile": profile.name,
        "sequence": sequence,
        "class_ids": [record[0] for record in labels],
        "master_glyph_ids": [characters[record[0]]["codepoint"] for record in labels],
        "page_geometry": geometry,
        "image": f"images/{split}/{stem}{image_suffix}",
        "label": f"labels/{split}/{stem}.txt",
    }


def write_dataset(
    output_dir: Path,
    profile: Profile,
    samples: int,
    seed: int,
    image_size: int,
    font_size: int,
    font_path: Path,
    layout: str,
    balanced_classes: bool = False,
    workers: int = 1,
    image_format: str = "png",
    jpeg_quality: int = 75,
) -> dict[str, object]:
    if not font_path.exists():
        raise FileNotFoundError(f"Required font is missing: {font_path}")
    characters = old_permic_characters()
    if balanced_classes and layout not in ("isolated-glyph", "scattered-glyph"):
        raise ValueError("--balanced-classes is available only for single-glyph S0 or S0-d assets.")
    if workers < 1:
        raise ValueError("--workers must be at least 1")
    if image_format not in IMAGE_FORMATS:
        raise ValueError(f"Unsupported image format: {image_format}")
    if not 1 <= jpeg_quality <= 95:
        raise ValueError("JPEG quality must be between 1 and 95")
    if output_dir.exists():
        shutil.rmtree(output_dir)
    split_names = ("train", "val", "test")
    for split in split_names:
        (output_dir / "images" / split).mkdir(parents=True)
        (output_dir / "labels" / split).mkdir(parents=True)

    held_out = max(1, round(samples * 0.1)) if samples >= 3 else 0
    split_counts = {"train": samples - (held_out * 2), "val": held_out, "test": held_out}
    if split_counts["train"] < 1:
        split_counts = {"train": samples, "val": 0, "test": 0}

    def split_for(index: int) -> str:
        if index < split_counts["train"]:
            return "train"
        if index < split_counts["train"] + split_counts["val"]:
            return "val"
        return "test"

    split_class_positions = {split: 0 for split in split_names}
    tasks = []
    for index in range(samples):
        sample_seed = seed + index
        split = split_for(index)
        class_id_override = None
        if balanced_classes:
            class_id_override = split_class_positions[split] % len(characters)
            split_class_positions[split] += 1
        tasks.append((index, split, sample_seed, class_id_override, output_dir, profile, image_size, font_size, font_path, layout, image_format, jpeg_quality, characters))
    if workers == 1:
        asset_records = [render_and_write_sample(task) for task in tasks]
    else:
        with ProcessPoolExecutor(max_workers=workers) as executor:
            asset_records = list(executor.map(render_and_write_sample, tasks, chunksize=32))

    class_map = [{"id": index, "label": record["glyph"], **record} for index, record in enumerate(characters)]
    class_payload = {"classes": class_map, "source": "Unicode Old Permic base-letter assignments", "synthetic": True}
    (output_dir / "class_map.json").write_text(json.dumps(class_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    data_yaml = "path: .\ntrain: images/train\nval: images/val\ntest: images/test\nnames:\n" + "\n".join(f"  {item['id']}: {item['glyph']}" for item in class_map) + "\n"
    (output_dir / "data.yaml").write_text(data_yaml, encoding="utf-8")
    (output_dir / "assets.jsonl").write_text("".join(json.dumps(record, ensure_ascii=False) + "\n" for record in asset_records), encoding="utf-8")
    manifest = {
        "kind": "synthetic-old-permic-character-detection",
        "layout": layout,
        "profile": asdict(profile),
        "seed": seed,
        "samples": samples,
        "image_size": image_size,
        "image_format": image_format,
        "jpeg_quality": jpeg_quality if image_format == "jpeg" else None,
        "font_size": font_size,
        "font": str(font_path),
        "font_sha256": sha256_file(font_path),
        "class_count": len(class_map),
        "split_counts": split_counts,
        "class_balance_policy": "cyclic-per-split" if balanced_classes else "random",
        "generation_workers": workers,
        "lineage_manifest": "assets.jsonl",
        "real_manuscripts_included": False,
        "notes": "Synthetic character-detection data from a font. It contains no historical manuscript pixels and does not prove palaeographic OCR performance.",
    }
    (output_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate reproducible Old Permic synthetic character-detection samples.")
    parser.add_argument("--output", type=Path, required=True, help="Output directory outside the web application project.")
    parser.add_argument("--profile", choices=sorted(PROFILES), default="unicode-clean")
    parser.add_argument("--layout", choices=LAYOUTS, default="isolated-glyph", help="S0 centered glyphs, S0-d scattered glyphs, S1 ordered lines, or S2 structured pages.")
    parser.add_argument("--samples", type=int, default=100)
    parser.add_argument("--balanced-classes", action="store_true", help="Cycle the 38 classes independently inside each single-glyph S0 or S0-d split.")
    parser.add_argument("--seed", type=int, default=10350)
    parser.add_argument("--image-size", type=int, default=640)
    parser.add_argument("--font-size", type=int, default=58)
    parser.add_argument("--image-format", choices=IMAGE_FORMATS, default="png", help="PNG for lossless baselines or JPEG for compact synthetic snapshots.")
    parser.add_argument("--jpeg-quality", type=int, default=75, help="Deterministic JPEG quality when --image-format=jpeg.")
    parser.add_argument("--workers", type=int, default=1, help="Independent rendering workers; output stays deterministic across worker counts.")
    parser.add_argument("--font", type=Path, default=DEFAULT_FONT_PATH, help="Path to a font containing Old Permic Unicode glyphs.")
    args = parser.parse_args()
    if args.samples < 1:
        raise ValueError("--samples must be at least 1")
    manifest = write_dataset(
        args.output, PROFILES[args.profile], args.samples, args.seed, args.image_size, args.font_size, args.font, args.layout,
        args.balanced_classes, args.workers, args.image_format, args.jpeg_quality,
    )
    print(json.dumps(manifest, ensure_ascii=False))


if __name__ == "__main__":
    main()

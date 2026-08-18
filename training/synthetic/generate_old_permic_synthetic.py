#!/usr/bin/env python3
"""Generate reproducible Old Permic Unicode glyph-detection samples in YOLO format.

This generator creates *synthetic* samples only. It never modifies, labels, or
mixes real manuscript images. Every generated page receives a same-name YOLO
label file and a manifest records the seed and generation settings.
"""

from __future__ import annotations

import argparse
import json
import random
import shutil
import unicodedata
from dataclasses import asdict, dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

DEFAULT_FONT_PATH = Path("/usr/share/fonts/truetype/noto/NotoSansOldPermic-Regular.ttf")


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


PROFILES: dict[str, Profile] = {
    "unicode-clean": Profile("unicode-clean", 0.0, 0.0, 0, 0, 12, (250, 247, 238), (36, 48, 41)),
    "controlled-deformation": Profile("controlled-deformation", 3.0, 0.45, 10, 3, 16, (242, 235, 219), (62, 47, 38)),
    "manuscript-inspired": Profile("manuscript-inspired", 5.0, 0.7, 18, 5, 20, (232, 221, 197), (73, 51, 35)),
}


def old_permic_characters() -> list[dict[str, str]]:
    """Derive assigned Old Permic characters from the Unicode database."""
    characters: list[dict[str, str]] = []
    for codepoint in range(0x10350, 0x10380):
        character = chr(codepoint)
        name = unicodedata.name(character, "")
        if name.startswith("OLD PERMIC "):
            characters.append({"glyph": character, "codepoint": f"U+{codepoint:04X}", "unicode_name": name})
    if not characters:
        raise RuntimeError("No assigned Old Permic Unicode characters were found in this Python runtime.")
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


def render_sample(
    characters: list[dict[str, str]],
    profile: Profile,
    seed: int,
    image_size: int,
    font_size: int,
    font_path: Path,
) -> tuple[Image.Image, list[tuple[int, float, float, float, float]], list[str]]:
    rng = random.Random(seed)
    image = Image.new("RGB", (image_size, image_size), profile.background)
    labels: list[tuple[int, float, float, float, float]] = []
    sequence: list[str] = []
    font = ImageFont.truetype(str(font_path), font_size)
    x, y = 32, 32
    max_line_bottom = y

    for _ in range(rng.randint(20, 34)):
        class_id = rng.randrange(len(characters))
        glyph = characters[class_id]["glyph"]
        patch = glyph_patch(glyph, font, profile, rng)
        if x + patch.width + 32 > image_size:
            x = 32
            y = max_line_bottom + profile.line_gap
        if y + patch.height + 32 > image_size:
            break
        image.paste(patch, (x, y), patch)
        labels.append((class_id, (x + patch.width / 2) / image_size, (y + patch.height / 2) / image_size, patch.width / image_size, patch.height / image_size))
        sequence.append(glyph)
        max_line_bottom = max(max_line_bottom, y + patch.height)
        x += patch.width + rng.randint(5, 14)

    if profile.blur_radius:
        image = image.filter(ImageFilter.GaussianBlur(profile.blur_radius))
    if profile.noise_strength:
        pixels = image.load()
        for py in range(image_size):
            for px in range(image_size):
                red, green, blue = pixels[px, py]
                noise = rng.randint(-profile.noise_strength, profile.noise_strength)
                pixels[px, py] = tuple(max(0, min(255, channel + noise)) for channel in (red, green, blue))
    return image, labels, sequence


def write_dataset(output_dir: Path, profile: Profile, samples: int, seed: int, image_size: int, font_size: int, font_path: Path) -> dict[str, object]:
    if not font_path.exists():
        raise FileNotFoundError(f"Required font is missing: {font_path}")
    characters = old_permic_characters()
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

    for index in range(samples):
        sample_seed = seed + index
        image, labels, _ = render_sample(characters, profile, sample_seed, image_size, font_size, font_path)
        stem = f"old_permic_{profile.name}_{index:05d}"
        split = split_for(index)
        image.save(output_dir / "images" / split / f"{stem}.png")
        with (output_dir / "labels" / split / f"{stem}.txt").open("w", encoding="utf-8") as label_file:
            for class_id, center_x, center_y, width, height in labels:
                label_file.write(f"{class_id} {center_x:.6f} {center_y:.6f} {width:.6f} {height:.6f}\n")

    class_map = [{"id": index, "label": record["glyph"], **record} for index, record in enumerate(characters)]
    class_payload = {"classes": class_map, "source": "Unicode Old Permic assignments", "synthetic": True}
    (output_dir / "class_map.json").write_text(json.dumps(class_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    data_yaml = "path: .\ntrain: images/train\nval: images/val\ntest: images/test\nnames:\n" + "\n".join(f"  {item['id']}: {item['glyph']}" for item in class_map) + "\n"
    (output_dir / "data.yaml").write_text(data_yaml, encoding="utf-8")
    manifest = {
        "kind": "synthetic-old-permic-unicode",
        "profile": asdict(profile),
        "seed": seed,
        "samples": samples,
        "image_size": image_size,
        "font_size": font_size,
        "font": str(font_path),
        "class_count": len(class_map),
        "split_counts": split_counts,
        "real_manuscripts_included": False,
        "notes": "Synthetic Unicode glyph pages for staged detector development. Not a palaeographic substitute for real manuscripts.",
    }
    (output_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate reproducible Old Permic synthetic YOLO samples.")
    parser.add_argument("--output", type=Path, required=True, help="Output directory outside the web application project.")
    parser.add_argument("--profile", choices=sorted(PROFILES), default="unicode-clean")
    parser.add_argument("--samples", type=int, default=100)
    parser.add_argument("--seed", type=int, default=10350)
    parser.add_argument("--image-size", type=int, default=640)
    parser.add_argument("--font-size", type=int, default=58)
    parser.add_argument("--font", type=Path, default=DEFAULT_FONT_PATH, help="Path to a font containing Old Permic Unicode glyphs.")
    args = parser.parse_args()
    if args.samples < 1:
        raise ValueError("--samples must be at least 1")
    manifest = write_dataset(args.output, PROFILES[args.profile], args.samples, args.seed, args.image_size, args.font_size, args.font)
    print(json.dumps(manifest, ensure_ascii=False))


if __name__ == "__main__":
    main()

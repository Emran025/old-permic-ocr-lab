import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const roots: string[] = [];

afterEach(() => {
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true });
});

describe("synthetic Old Permic glyph assets", () => {
  it("creates S0 isolated letter images with one YOLO label and a reproducible lineage record", () => {
    const root = mkdtempSync(join(tmpdir(), "old-permic-s0-"));
    roots.push(root);
    const generator = join(process.cwd(), "training", "synthetic", "generate_old_permic_synthetic.py");
    const font = "/usr/share/fonts/truetype/noto/NotoSansOldPermic-Regular.ttf";
    execFileSync("python3", [generator, "--output", root, "--samples", "10", "--seed", "10350", "--layout", "isolated-glyph", "--font", font], { encoding: "utf8" });

    const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
    const classMap = JSON.parse(readFileSync(join(root, "class_map.json"), "utf8"));
    const records = readFileSync(join(root, "assets.jsonl"), "utf8").trim().split("\n").map((row) => JSON.parse(row));
    const labels = ["train", "val", "test"].flatMap((split) =>
      readdirSync(join(root, "labels", split)).map((name) => readFileSync(join(root, "labels", split, name), "utf8").trim()),
    );

    expect(manifest).toMatchObject({ layout: "isolated-glyph", class_count: 38, lineage_manifest: "assets.jsonl" });
    expect(manifest.font_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(classMap.classes).toHaveLength(38);
    expect(records).toHaveLength(10);
    expect(records.every((record) => record.unit === "S0-glyph-asset" && record.sequence.length === 1 && record.class_ids.length === 1)).toBe(true);
    expect(labels).toHaveLength(10);
    expect(labels.every((label) => label.split("\n").length === 1 && label.split(" ").length === 5)).toBe(true);
  });

  it("cycles all 38 character classes inside every S0 split when balanced generation is requested", () => {
    const root = mkdtempSync(join(tmpdir(), "old-permic-balanced-s0-"));
    roots.push(root);
    const generator = join(process.cwd(), "training", "synthetic", "generate_old_permic_synthetic.py");
    const font = "/usr/share/fonts/truetype/noto/NotoSansOldPermic-Regular.ttf";
    execFileSync("python3", [generator, "--output", root, "--samples", "380", "--seed", "10350", "--layout", "isolated-glyph", "--balanced-classes", "--font", font], { encoding: "utf8" });

    const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
    expect(manifest.class_balance_policy).toBe("cyclic-per-split");
    for (const split of ["train", "val", "test"]) {
      const classIds = readdirSync(join(root, "labels", split)).map((name) => Number(readFileSync(join(root, "labels", split, name), "utf8").trim().split(" ")[0]));
      expect(new Set(classIds).size).toBe(38);
    }
  });

  it("keeps the internal S0 curriculum large and centered before reducing it under controlled deformation", () => {
    const cleanRoot = mkdtempSync(join(tmpdir(), "old-permic-s0-clean-curriculum-"));
    const deformedRoot = mkdtempSync(join(tmpdir(), "old-permic-s0-deformed-curriculum-"));
    roots.push(cleanRoot, deformedRoot);
    const generator = join(process.cwd(), "training", "synthetic", "generate_old_permic_synthetic.py");
    const font = "/usr/share/fonts/truetype/noto/NotoSansOldPermic-Regular.ttf";
    for (const [root, profile] of [[cleanRoot, "unicode-clean"], [deformedRoot, "controlled-deformation"]] as const) {
      execFileSync("python3", [generator, "--output", root, "--samples", "1", "--seed", "10350", "--layout", "isolated-glyph", "--profile", profile, "--font", font], { encoding: "utf8" });
    }
    const firstLabel = (root: string) => {
      const split = readdirSync(join(root, "labels")).find((name) => readdirSync(join(root, "labels", name)).length > 0)!;
      return readFileSync(join(root, "labels", split, readdirSync(join(root, "labels", split))[0]), "utf8").trim().split(" ").map(Number);
    };
    const [, cleanX, cleanY, cleanWidth, cleanHeight] = firstLabel(cleanRoot);
    const [, , , deformedWidth, deformedHeight] = firstLabel(deformedRoot);
    const deformedManifest = JSON.parse(readFileSync(join(deformedRoot, "manifest.json"), "utf8"));
    expect(Math.max(cleanWidth, cleanHeight)).toBeGreaterThan(0.7);
    expect(cleanX).toBeCloseTo(0.5, 2);
    expect(cleanY).toBeCloseTo(0.5, 2);
    expect(Math.max(deformedWidth, deformedHeight)).toBeLessThan(Math.max(cleanWidth, cleanHeight));
    expect(deformedManifest.profile.background_fragment_count).toBeGreaterThan(0);
  });

  it("creates S0-d scattered single-glyph assets with smaller boxes and non-fixed page positions", () => {
    const root = mkdtempSync(join(tmpdir(), "old-permic-s0d-scattered-"));
    roots.push(root);
    const generator = join(process.cwd(), "training", "synthetic", "generate_old_permic_synthetic.py");
    const font = "/usr/share/fonts/truetype/noto/NotoSansOldPermic-Regular.ttf";
    execFileSync("python3", [generator, "--output", root, "--samples", "24", "--seed", "20350", "--layout", "scattered-glyph", "--profile", "controlled-deformation", "--balanced-classes", "--image-size", "448", "--image-format", "jpeg", "--jpeg-quality", "70", "--font", font], { encoding: "utf8" });

    const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
    const records = readFileSync(join(root, "assets.jsonl"), "utf8").trim().split("\n").map((row) => JSON.parse(row));
    const boxes = ["train", "val", "test"].flatMap((split) =>
      readdirSync(join(root, "labels", split)).map((name) => readFileSync(join(root, "labels", split, name), "utf8").trim().split(" ").map(Number)),
    );

    expect(manifest.layout).toBe("scattered-glyph");
    expect(manifest).toMatchObject({ image_size: 448, image_format: "jpeg", jpeg_quality: 70 });
    expect(records.every((record) => record.unit === "S0-d-scattered-glyph-asset" && record.sequence.length === 1)).toBe(true);
    expect(records.every((record) => record.image.endsWith(".jpg"))).toBe(true);
    const images = ["train", "val", "test"].flatMap((split) => readdirSync(join(root, "images", split)).map((name) => join(root, "images", split, name)));
    expect(images.every((image) => readFileSync(image).subarray(0, 2).equals(Buffer.from([0xff, 0xd8])))).toBe(true);
    expect(images.reduce((total, image) => total + statSync(image).size, 0)).toBeLessThan(1_000_000);
    expect(records.every((record) => record.page_geometry.curriculum.spatial_policy === "uniform-safe-noncentral-grid-placement")).toBe(true);
    expect(boxes.every(([, , , width, height]) => Math.max(width, height) < 0.55)).toBe(true);
    expect(Math.max(...boxes.map(([, x]) => x)) - Math.min(...boxes.map(([, x]) => x))).toBeGreaterThan(0.25);
    expect(Math.max(...boxes.map(([, , y]) => y)) - Math.min(...boxes.map(([, , y]) => y))).toBeGreaterThan(0.25);
  });

  it("reproduces the optimized controlled-deformation images byte-for-byte from the same seed", () => {
    const firstRoot = mkdtempSync(join(tmpdir(), "old-permic-fast-noise-first-"));
    const secondRoot = mkdtempSync(join(tmpdir(), "old-permic-fast-noise-second-"));
    roots.push(firstRoot, secondRoot);
    const generator = join(process.cwd(), "training", "synthetic", "generate_old_permic_synthetic.py");
    const font = "/usr/share/fonts/truetype/noto/NotoSansOldPermic-Regular.ttf";
    execFileSync("python3", [generator, "--output", firstRoot, "--samples", "4", "--seed", "20350", "--layout", "isolated-glyph", "--profile", "controlled-deformation", "--font", font, "--workers", "1"], { encoding: "utf8" });
    execFileSync("python3", [generator, "--output", secondRoot, "--samples", "4", "--seed", "20350", "--layout", "isolated-glyph", "--profile", "controlled-deformation", "--font", font, "--workers", "2"], { encoding: "utf8" });
    for (const split of ["train", "val", "test"]) {
      const files = readdirSync(join(firstRoot, "images", split));
      for (const file of files) {
        expect(readFileSync(join(firstRoot, "images", split, file))).toEqual(readFileSync(join(secondRoot, "images", split, file)));
      }
    }
  });
});

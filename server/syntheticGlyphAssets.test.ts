import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
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
});

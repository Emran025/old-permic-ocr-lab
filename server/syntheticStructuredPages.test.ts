import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const roots: string[] = [];

function generate(root: string) {
  const generator = join(process.cwd(), "training", "synthetic", "generate_old_permic_synthetic.py");
  execFileSync(
    "python3",
    [generator, "--output", root, "--layout", "structured-pages", "--profile", "manuscript-inspired", "--samples", "6", "--seed", "30350", "--font", "/usr/share/fonts/truetype/noto/NotoSansOldPermic-Regular.ttf"],
    { encoding: "utf8" },
  );
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true });
});

describe("synthetic Old Permic structured pages", () => {
  it("creates reproducible S2 pages with character boxes and page/line lineage", () => {
    const first = mkdtempSync(join(tmpdir(), "old-permic-s2-a-"));
    const second = mkdtempSync(join(tmpdir(), "old-permic-s2-b-"));
    roots.push(first, second);
    generate(first);
    generate(second);

    const manifest = JSON.parse(readFileSync(join(first, "manifest.json"), "utf8"));
    const records = readFileSync(join(first, "assets.jsonl"), "utf8").trim().split("\n").map((row) => JSON.parse(row));
    const imageRelativePaths = ["train", "val", "test"].flatMap((split) => readdirSync(join(first, "images", split)).map((name) => join("images", split, name)));
    const labels = ["train", "val", "test"].flatMap((split) => readdirSync(join(first, "labels", split)).map((name) => readFileSync(join(first, "labels", split, name), "utf8").trim()));

    expect(manifest).toMatchObject({ layout: "structured-pages", class_count: 38, lineage_manifest: "assets.jsonl" });
    expect(records).toHaveLength(6);
    expect(records.every((record) => record.unit === "S2-structured-page" && record.page_geometry.page_id && record.page_geometry.lines.length > 0 && record.master_glyph_ids.length === record.class_ids.length)).toBe(true);
    expect(labels.every((label) => label.split("\n").length > 1 && label.split("\n").every((row) => row.split(" ").length === 5))).toBe(true);
    for (const relativePath of imageRelativePaths) {
      expect(readFileSync(join(first, relativePath)).equals(readFileSync(join(second, relativePath)))).toBe(true);
    }
    expect(readFileSync(join(first, "assets.jsonl"), "utf8")).toEqual(readFileSync(join(second, "assets.jsonl"), "utf8"));
  });
});

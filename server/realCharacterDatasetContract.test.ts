import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "training/real_character_dataset");

describe("real character dataset contract", () => {
  it("keeps hosted primary sources, candidate regions, Unicode classes, and evidence-backed labels separate", async () => {
    const [sources, classMap, regions, instances, exporter] = await Promise.all([
      readFile(resolve(root, "source_manifest.json"), "utf8").then(JSON.parse),
      readFile(resolve(root, "class_map.json"), "utf8").then(JSON.parse),
      readFile(resolve(root, "review_regions.json"), "utf8").then(JSON.parse),
      readFile(resolve(root, "annotations/character_instances.jsonl"), "utf8"),
      readFile(resolve(process.cwd(), "scripts/export_verified_real_yolo.py"), "utf8"),
    ]);

    expect(sources.sources).toHaveLength(13);
    expect(sources.excluded).toContainEqual(expect.objectContaining({ id: "trinity-zuryanskaya-full-icon" }));
    expect(classMap.classes).toHaveLength(38);
    expect(classMap.classes.map((entry: { id: number }) => entry.id)).toEqual([...Array(38).keys()]);
    expect(regions.regions).toHaveLength(12);
    const verified = instances.trim().split("\n").map((line) => JSON.parse(line));
    expect(verified).toHaveLength(17);
    expect(verified.every((entry: { review_status: string }) => entry.review_status === "verified")).toBe(true);
    expect(verified.map((entry: { unicode_codepoint: string }) => entry.unicode_codepoint)).toEqual([
      "U+10350", "U+10362", "U+10350", "U+1035D", "U+10354", "U+10351", "U+10354", "U+10352",
      "U+10350", "U+1035C", "U+10359", "U+1035D",
      "U+1035A", "U+10359", "U+1035B", "U+10357", "U+10359",
    ]);
    expect(new Set(verified.map((entry: { source_id: string }) => entry.source_id))).toEqual(new Set([
      "volok-11-f271v", "likh-360-f274", "egor-326-f162",
    ]));
    const annotationUnitIds = new Set(sources.annotation_units.map((entry: { id: string }) => entry.id));
    expect(verified.every((entry: { source_id: string }) => annotationUnitIds.has(entry.source_id))).toBe(true);
    expect(sources.annotation_units.every((entry: { manuscript_split_group?: string }) => Boolean(entry.manuscript_split_group))).toBe(true);
    expect(regions.regions.find((entry: { crop_id: string }) => entry.crop_id === "volok11-f271v-text")).toMatchObject({
      annotation_unit_id: "volok-11-f271v",
    });
    expect(exporter).toContain("source_split_eligible = len(manuscript_groups) >= 3");
    expect(exporter).toContain("classes_without_three_source_coverage");
    expect(exporter).toContain("source-disjoint train/val/test splits");
  });
});

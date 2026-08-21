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
    expect(verified).toHaveLength(12);
    expect(verified.every((entry: { review_status: string }) => entry.review_status === "verified")).toBe(true);
    expect(verified.map((entry: { unicode_codepoint: string }) => entry.unicode_codepoint)).toEqual([
      "U+10350", "U+10362", "U+10350", "U+1035D", "U+10354", "U+10351", "U+10354", "U+10352",
      "U+10350", "U+1035C", "U+10359", "U+1035D",
    ]);
    expect(new Set(verified.map((entry: { source_id: string }) => entry.source_id))).toEqual(new Set([
      "volok-11-f271v", "likh-360-f274",
    ]));
    expect(exporter).toContain("len(source_ids) >= 3");
    expect(exporter).toContain("source-disjoint train/val/test splits");
  });
});

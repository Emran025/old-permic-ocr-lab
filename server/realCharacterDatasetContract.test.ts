import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "training/real_character_dataset");

describe("real character dataset contract", () => {
  it("keeps hosted primary sources, candidate regions, and Unicode classes separate from unverified labels", async () => {
    const [sources, classMap, regions, instances] = await Promise.all([
      readFile(resolve(root, "source_manifest.json"), "utf8").then(JSON.parse),
      readFile(resolve(root, "class_map.json"), "utf8").then(JSON.parse),
      readFile(resolve(root, "review_regions.json"), "utf8").then(JSON.parse),
      readFile(resolve(root, "annotations/character_instances.jsonl"), "utf8"),
    ]);

    expect(sources.sources).toHaveLength(13);
    expect(sources.excluded).toContainEqual(expect.objectContaining({ id: "trinity-zuryanskaya-full-icon" }));
    expect(classMap.classes).toHaveLength(38);
    expect(classMap.classes.map((entry: { id: number }) => entry.id)).toEqual([...Array(38).keys()]);
    expect(regions.regions).toHaveLength(12);
    expect(instances.trim()).toBe("");
  });
});

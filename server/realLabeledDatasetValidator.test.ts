import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const roots: string[] = [];

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), "old-permic-real-dataset-"));
  roots.push(root);
  for (const split of ["train", "val", "test"]) {
    mkdirSync(join(root, "images", split), { recursive: true });
    mkdirSync(join(root, "labels", split), { recursive: true });
    const imageName = `${split}_fixture.png`;
    writeFileSync(join(root, "images", split, imageName), Buffer.from("fixture-image"));
    writeFileSync(join(root, "labels", split, `${split}_fixture.txt`), "0 0.5 0.5 0.4 0.4\n");
  }
  writeFileSync(join(root, "class_map.json"), JSON.stringify({ classes: [{ id: 0, label: "fixture-class" }] }));
  writeFileSync(join(root, "manifest_real.json"), JSON.stringify({ dataset_version: "fixture", rights_reviewed: true, annotations_reviewed: true }));
  writeFileSync(
    join(root, "sources.csv"),
    [
      "image_file,repository_id,folio_or_page,source_url,rights_basis,old_permic_visible,annotation_status,split,notes",
      "train_fixture.png,fixture-repository,1,https://example.test/train,fixture-rights,true,approved,train,fixture only",
      "val_fixture.png,fixture-repository,2,https://example.test/val,fixture-rights,true,approved,val,fixture only",
      "test_fixture.png,fixture-repository,3,https://example.test/test,fixture-rights,true,approved,test,fixture only",
    ].join("\n"),
  );
  return root;
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true });
});

describe("real labeled Old Permic dataset validator", () => {
  it("accepts a structurally complete reviewed fixture and rejects source-page leakage", () => {
    const root = createFixture();
    const validator = join(process.cwd(), "scripts", "validate_real_labeled_dataset.py");
    const valid = JSON.parse(execFileSync("python3", [validator, root], { encoding: "utf8" }));
    expect(valid).toMatchObject({ valid: true, split_counts: { train: 1, val: 1, test: 1 }, class_count: 1, annotation_count: 3 });

    const sourcesPath = join(root, "sources.csv");
    writeFileSync(
      sourcesPath,
      [
        "image_file,repository_id,folio_or_page,source_url,rights_basis,old_permic_visible,annotation_status,split,notes",
        "train_fixture.png,fixture-repository,shared,https://example.test/train,fixture-rights,true,approved,train,fixture only",
        "val_fixture.png,fixture-repository,shared,https://example.test/val,fixture-rights,true,approved,val,fixture only",
        "test_fixture.png,fixture-repository,3,https://example.test/test,fixture-rights,true,approved,test,fixture only",
      ].join("\n"),
    );
    expect(() => execFileSync("python3", [validator, root], { encoding: "utf8", stdio: "pipe" })).toThrow(/more than one split/);
  });
});

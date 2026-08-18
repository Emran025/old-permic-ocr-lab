import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("synthetic generation notebook", () => {
  it("keeps staged Jupyter cells wired to the real Python generator", () => {
    const notebookPath = new URL("../training/notebooks/old_permic_synthetic_generation.ipynb", import.meta.url);
    const notebook = JSON.parse(readFileSync(notebookPath, "utf8")) as { nbformat: number; cells: Array<{ cell_type: string; source: string[] }> };
    const code = notebook.cells.filter((cell) => cell.cell_type === "code").flatMap((cell) => cell.source).join("\n");
    expect(notebook.nbformat).toBe(4);
    expect(code).toContain("from training.synthetic.generate_old_permic_synthetic import PROFILES, write_dataset");
    expect(code).toContain("layout='isolated-glyph'");
    expect(code).toContain("layout='ordered-lines'");
    expect(code).toContain("layout='structured-pages'");
  });
});

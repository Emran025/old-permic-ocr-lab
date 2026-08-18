import { describe, expect, it } from "vitest";
import { generatorNotebookCells, generatorNotebookSource, incrementalWorkflow } from "./generatorNotebook";

describe("generator notebook data", () => {
  it("is grounded in the Python generator and retains S0/S1/S2 stage cells", () => {
    expect(generatorNotebookSource.path).toBe("training/synthetic/generate_old_permic_synthetic.py");
    expect(generatorNotebookCells.map((cell) => cell.phase)).toEqual(expect.arrayContaining(["S0", "S1", "S2"]));
    expect(generatorNotebookCells.find((cell) => cell.phase === "S0")?.code).toContain("render_isolated_glyph_sample");
    expect(generatorNotebookCells.find((cell) => cell.phase === "S2")?.code).toContain("render_structured_page_sample");
    expect(incrementalWorkflow).toHaveLength(4);
  });
});

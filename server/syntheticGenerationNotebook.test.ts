import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("synthetic generation notebook", () => {
  it("keeps staged Jupyter cells wired to the real Python generator", () => {
    const notebookPath = new URL("../training/notebooks/old_permic_synthetic_generation.ipynb", import.meta.url);
    const notebook = JSON.parse(readFileSync(notebookPath, "utf8")) as { nbformat: number; cells: Array<{ cell_type: string; source: string[] }> };
    const code = notebook.cells.filter((cell) => cell.cell_type === "code").flatMap((cell) => cell.source).join("\n");
    expect(notebook.nbformat).toBe(4);
    expect(code).toContain("from training.synthetic.generate_old_permic_synthetic import PROFILES, write_dataset");
    expect(code).toContain('"layout": "isolated-glyph"');
    expect(code).toContain('"layout": "ordered-lines"');
    expect(code).toContain('"layout": "structured-pages"');
    expect(code).toContain("from ultralytics import YOLO");
    expect(code).toContain("evaluation_model.val");
    expect(code).toContain('"workers": 6');
    expect(code).toContain("torch.cuda.is_available()");
    expect(code).toContain('"Pillow==11.3.0"');
    expect(code).toContain("import PIL");
  });

  it("keeps the Colab checkpoint, evaluation, and gated publication workflow explicit", () => {
    const notebookPath = new URL("../training/notebooks/old_permic_synthetic_generation.ipynb", import.meta.url);
    const notebook = JSON.parse(readFileSync(notebookPath, "utf8")) as { cells: Array<{ cell_type: string; source: string[] }> };
    const code = notebook.cells.filter((cell) => cell.cell_type === "code").flatMap((cell) => cell.source).join("\n");
    const prose = notebook.cells.filter((cell) => cell.cell_type === "markdown").flatMap((cell) => cell.source).join("\n");

    expect(code).toContain("from google.colab import drive");
    expect(code).toContain('"git", "clone"');
    expect(code).toContain("USE_COLAB_SECRET_FALLBACK = False");
    expect(code).toContain('userdata.get("GITHUB_WRITE_TOKEN")');
    expect(code).toContain("sync_latest_checkpoint");
    expect(code).toContain("assert_resume_is_compatible");
    expect(code).toContain("save_period=1");
    expect(code).toContain("evaluation_model.val");
    expect(code).toContain("release.json");
    expect(code).toContain("PUBLISH_RELEASE = False");
    expect(code).toContain("MAX_GITHUB_WEIGHT_BYTES");
    expect(code).toContain('"latest.json"');
    expect(code).toContain('"publication_status": "published"');
    expect(code).not.toContain("github_read_token");
    expect(prose).toContain("لا تُرفع");
    expect(prose).toContain("لا تثبت أداء OCR على مخطوطات تاريخية");
  });
});

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
    expect(code).toContain("# 9) Snapshot كامل وقابل للاستئناف من GitHub");
    expect(code).toContain("import os");
    expect(code).toContain("FORCE_REGENERATE_DATASET = False");
    expect(code).toContain("BATCH_CANDIDATES = (8, 6, 4)");
    expect(code).toContain("report_gpu_memory");
    expect(code).toContain("torch.cuda.empty_cache()");
    expect(code).toContain("SNAPSHOT_RESTORED_FROM_GITHUB");
    expect(code).toContain("bootstrap_dataset_snapshot()");
    expect(code).toContain("copy_dataset_snapshot");
  });

  it("keeps the Colab checkpoint, evaluation, and gated publication workflow explicit", () => {
    const notebookPath = new URL("../training/notebooks/old_permic_synthetic_generation.ipynb", import.meta.url);
    const notebook = JSON.parse(readFileSync(notebookPath, "utf8")) as { cells: Array<{ cell_type: string; source: string[] }> };
    const code = notebook.cells.filter((cell) => cell.cell_type === "code").flatMap((cell) => cell.source).join("\n");
    const prose = notebook.cells.filter((cell) => cell.cell_type === "markdown").flatMap((cell) => cell.source).join("\n");

    expect(code).toContain('"git", "clone"');
    expect(code).toContain('CHECKPOINT_BRANCH = "colab-checkpoints"');
    expect(code).toContain("publish_latest_checkpoint");
    expect(code).toContain("restore_latest_checkpoint_from_github");
    expect(code).toContain("--force-with-lease");
    expect(code).toContain("USE_COLAB_SECRET_FALLBACK = False");
    expect(code).toContain('userdata.get("GITHUB_WRITE_TOKEN")');
    expect(code).toContain("sync_latest_checkpoint");
    expect(code).toContain("assert_resume_is_compatible");
    expect(code).toContain("last_pt_sha256");
    expect(code).toContain("save_period=1");
    expect(code).toContain("dataset_snapshot.json");
    expect(code).toContain("GITHUB_WRITE_TOKEN");
    expect(code).toContain("legacy_checkpoint");
    expect(code).toContain("قُبل اختلاف manifest بعد تحقق الفئات وسجل الأصول وهوية snapshot");
    expect(code).toContain("evaluation_model.val");
    expect(code).toContain("release.json");
    expect(code).toContain("PUBLISH_RELEASE = False");
    expect(code).toContain("MAX_GITHUB_WEIGHT_BYTES");
    expect(code).toContain('"latest.json"');
    expect(code).toContain('"publication_status": "published"');
    expect(code).not.toContain("github_read_token");
    expect(code).not.toContain("from google.colab import drive");
    expect(code).not.toContain("restore-public-drive-folder");
    expect(code).not.toContain("RUN_WORKSPACE_BACKUP");
    expect(code).not.toContain("workspace_cache");
    expect(prose).toContain("لا تُرفع");
    expect(prose).toContain("لا يربط الدفتر Google Drive");
    expect(prose).toContain("لا تثبت أداء OCR على مخطوطات تاريخية");
  });
});

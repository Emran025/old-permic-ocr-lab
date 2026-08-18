import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const notebook = resolve(projectRoot, "training/notebooks/old_permic_synthetic_generation.ipynb");
const outputDir = "/home/ubuntu/webdev-static-assets";
const outputName = "old-permic-synthetic-generation-notebook";

if (!existsSync(notebook)) {
  throw new Error(`Missing notebook: ${notebook}`);
}

mkdirSync(outputDir, { recursive: true });
execFileSync("jupyter", ["nbconvert", "--to", "html", "--template", "lab", "--output", outputName, "--output-dir", outputDir, notebook], {
  stdio: "inherit",
});

console.log(`Rendered ${notebook} to ${resolve(outputDir, `${outputName}.html`)}`);

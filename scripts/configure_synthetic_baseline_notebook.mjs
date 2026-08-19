import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const notebookPath = resolve(import.meta.dirname, "../training/notebooks/old_permic_synthetic_generation.ipynb");
const notebook = JSON.parse(readFileSync(notebookPath, "utf8"));

function sourceText(cell) {
  return Array.isArray(cell.source) ? cell.source.join("") : "";
}

function addWorkers(fragment) {
  const cell = notebook.cells.find((item) => item.cell_type === "code" && sourceText(item).includes(fragment));
  if (!cell) throw new Error(`Missing notebook cell: ${fragment}`);
  const source = sourceText(cell);
  if (!source.includes("workers=GENERATION_WORKERS")) {
    cell.source = source.replace("balanced_classes=True,\n", "balanced_classes=True,\n    workers=GENERATION_WORKERS,\n").split(/(?<=\n)/);
  }
}

const setupCell = notebook.cells.find((item) => item.cell_type === "code" && sourceText(item).includes("PROJECT_ROOT = Path.cwd()"));
if (!setupCell) throw new Error("Missing project setup cell");
const setupSource = sourceText(setupCell);
if (!setupSource.includes("GENERATION_WORKERS")) {
  setupCell.source = setupSource.replace("VALIDATOR_PATH = PROJECT_ROOT / 'scripts' / 'validate_synthetic_dataset.py'\n", "VALIDATOR_PATH = PROJECT_ROOT / 'scripts' / 'validate_synthetic_dataset.py'\nGENERATION_WORKERS = 6  # لا يغير البذور أو الصور؛ يسرع كتابة دفعات الحروف المستقلة.\n").split(/(?<=\n)/);
}

addWorkers("manifest_s0 = write_dataset");
addWorkers("manifest_s0d1 = write_dataset");

if (!notebook.cells.some((cell) => cell.metadata?.oldPermicRole === "baseline-generation-record")) {
  notebook.cells.splice(2, 0, {
    cell_type: "markdown",
    id: "baselinegenerationrecord",
    metadata: { oldPermicRole: "baseline-generation-record" },
    source: [
      "## سجل baseline الصناعي الحالي\n",
      "\n",
      "تُستخدم S0-v2 النظيفة وS0-d1 المشوّهة كحزم منفصلة متوازنة: 7,600 صورة لكل حزمة، و6,080/760/760 للـ train/val/test، مع 160/20/20 مثالًا لكل من الحروف الـ38. يتم تشغيل S0-d1 بستة عمال مستقلين؛ لا يغير ذلك البذور أو الصور الناتجة. هذه الحزم baseline صناعي فقط ولا تعني دقة على مخطوطات تاريخية.\n",
    ],
  });
}

if (!notebook.cells.some((cell) => cell.metadata?.oldPermicRole === "baseline-artifact-record")) {
  const trainingGateIndex = notebook.cells.findIndex((cell) => cell.metadata?.oldPermicRole === "training-gate");
  if (trainingGateIndex < 0) throw new Error("Missing unified training gate");
  notebook.cells.splice(trainingGateIndex, 0,
    {
      cell_type: "markdown",
      id: "baselineartifactrecord",
      metadata: { oldPermicRole: "baseline-artifact-record" },
      source: [
        "## سجل الحزم المقبولة للتجربة\n",
        "\n",
        "لا تدمج S0 النظيفة وS0-d1 تلقائيًا في تجربة واحدة. ابدأ بـ S0-v2 النظيفة، واحفظ المقاييس، ثم نفّذ S0-d1 بوصفها تجربة منفصلة قابلة للمقارنة.\n",
      ],
    },
    {
      cell_type: "code",
      id: "baselineartifacts",
      execution_count: null,
      metadata: { oldPermicRole: "baseline-artifact-record" },
      outputs: [],
      source: [
        "# 7) سجل baseline المتولد فعليًا. عدّل المسار فقط عند نقل الحزم إلى Drive أو Colab.\n",
        "BASELINE_RECORD = {\n",
        "    'S0-v2-unicode-clean': {'seed': 10350, 'samples': 7600, 'workers': 6, 'profile': 'unicode-clean'},\n",
        "    'S0-d1-controlled-deformation': {'seed': 20350, 'samples': 7600, 'workers': 6, 'profile': 'controlled-deformation'},\n",
        "}\n",
        "SELECTED_BASELINE = 'S0-v2-unicode-clean'  # ابدأ بهذه الحزمة فقط.\n",
        "print('الحزمة المختارة:', SELECTED_BASELINE, BASELINE_RECORD[SELECTED_BASELINE])\n",
        "print('الحالة: baseline صناعي؛ لا يمثل أداء OCR على مخطوطات حقيقية.')\n",
      ],
    },
  );
}

if (!notebook.cells.some((cell) => cell.metadata?.oldPermicRole === "gpu-preflight")) {
  const trainingRunIndex = notebook.cells.findIndex((cell) => cell.metadata?.oldPermicRole === "training-run");
  if (trainingRunIndex < 0) throw new Error("Missing unified training run cell");
  notebook.cells.splice(trainingRunIndex, 0,
    {
      cell_type: "code",
      id: "gpupreflight",
      execution_count: null,
      metadata: { oldPermicRole: "gpu-preflight" },
      outputs: [],
      source: [
        "# 10) فحص GPU إلزامي قبل تدريب baseline الكبير. شغّل هذه الخلية في Colab أو بيئة GPU.\n",
        "import torch\n",
        "print('PyTorch:', torch.__version__)\n",
        "print('CUDA متاح:', torch.cuda.is_available())\n",
        "if torch.cuda.is_available():\n",
        "    print('GPU:', torch.cuda.get_device_name(0))\n",
        "assert torch.cuda.is_available(), 'لا يوجد GPU في هذه البيئة. نفّذ الدفتر في Colab GPU أو جهاز محلي مزود بـ CUDA؛ لا تشغّل التدريب الكبير على CPU هنا.'\n",
      ],
    },
  );
}

writeFileSync(notebookPath, `${JSON.stringify(notebook, null, 1)}\n`, "utf8");
console.log(`Configured baseline cells: ${notebookPath}`);

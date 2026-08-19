import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const notebookPath = resolve(import.meta.dirname, "../training/notebooks/old_permic_synthetic_generation.ipynb");

function lines(text) {
  return `${text.trim()}\n`.split(/(?<=\n)/);
}

function markdown(id, source, role) {
  return { cell_type: "markdown", id, metadata: { oldPermicRole: role }, source: lines(source) };
}

function code(id, source, role) {
  return { cell_type: "code", id, metadata: { oldPermicRole: role }, execution_count: null, outputs: [], source: lines(source) };
}

const cells = [
  markdown("title-governance", `
# مختبر Colab الموحد لتوليد وتدريب OCR البرمية القديمة

هذا هو **الدفتر التنفيذي الوحيد** لمسار Colab. يبدأ باستنساخ مشروع البحث، ثم يستخدم مولد الصور الحقيقي لإنتاج بيانات الحروف الصناعية، ويتحقق من كل حزمة، ويدرّب YOLO، ويحفظ نقاط الاستئناف، ويقيّم تقسيم test مستقلًا، ويبني إصدارًا موثقًا قابلًا للعرض في الموقع.

> **حد علمي ثابت:** صور Unicode المصنوعة من الخط تحقق من سلامة خط الأنابيب واكتشاف الحروف المرسومة بالخط. لا تثبت أداء OCR على مخطوطات تاريخية. لا يُنشر أي وزن أو مقياس أو وصف أداء قبل أن تنتجه خلايا هذا الدفتر وأن يسجل في "release.json".

## ترتيب التشغيل

1. شغّل خلايا البيئة والاستنساخ وGoogle Drive مرة واحدة لكل جلسة Colab.
2. ابدأ بـ **S0 فقط**. راجع التقرير والصورة ذات الصناديق قبل تفعيل S0-d1، ثم S1، ثم S2. لا تمزج مراحل المنهج تلقائيًا.
3. شغّل التدريب من الصفر في baseline مستقل لكل مرحلة مقبولة. تحفظ الخلية checkpoint في Drive بعد كل حفظ نموذج.
4. شغّل تقييم test وبناء الإصدار. لا تفعّل خلية النشر إلى GitHub ما لم تكن النتائج مكتملة ومراجَعة.
`, "governance"),

  markdown("architecture-contract", `
## عقد الأصول والنتائج

| نوع الأصل | المكان أثناء التدريب | ما ينشر إلى GitHub |
|---|---|---|
| المشروع والمولد والخط | نسخة مؤقتة في Colab | كود المصدر فقط |
| البيانات الصناعية الكاملة | قرص Colab، ثم Drive اختياريًا | **لا تُرفع** |
| "last.pt" وملف الاستئناف | Google Drive بعد كل حفظ | لا يُرفعان دوريًا |
| "best.pt" وONNX | Drive بعد تقييم test | اختياريًا، بعد حد الحجم وقرار نشر صريح |
| "class_map.json" و"data_contract.json" و"metrics.json" و"release.json" | مساحة التشغيل وDrive | نعم، لأنها صغيرة وقابلة للتحقق |
| معاينات ومخططات التقييم | مساحة التشغيل | صور محددة ومرتبطة بالإصدار فقط |

لا يحمل GitHub أي token داخل الملفات. تطلب الخلايا الحساسة token مخفيًا في وقت التنفيذ عبر "getpass"، وتزيله من remote بعد الاستنساخ أو الدفع.
`, "artifact-contract"),

  code("environment-gpu", `
# 1) بيئة Colab وفحص GPU إلزامي. لا تغيّر هذه الخلية إلى تدريب CPU.
%pip install -q --upgrade "ultralytics>=8.3,<9" pyyaml matplotlib pillow

import sys
import subprocess
from pathlib import Path

import torch
import ultralytics

print("Python:", sys.version.split()[0])
print("PyTorch:", torch.__version__)
print("Ultralytics:", ultralytics.__version__)
print("CUDA متاح:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))
    subprocess.run(["nvidia-smi", "--query-gpu=name,memory.total,driver_version", "--format=csv,noheader"], check=False)

assert torch.cuda.is_available(), (
    "لا يوجد GPU. في Colab اختر Runtime > Change runtime type > T4 GPU أو GPU متاح، ثم أعد تشغيل هذه الخلية."
)
`, "environment-gpu"),

  markdown("github-public-boundary", `
## GitHub العام: القراءة بلا سر، والنشر بوابة مستقلة

المستودع الآن عام، لذلك تستنسخ خلية البيئة المشروع من GitHub مباشرةً بلا token وبلا بيانات اعتماد. ويبقى الموقع قادرًا على قراءة وصف الإصدار المنشور دون token خادمي.

أما الدفع إلى GitHub فهو عملية كتابة مستقلة ومغلقة افتراضيًا. تستخدم خلية النشر جلسة Git المصرح بها داخل Colab. إذا لم تكن جلسة shell مخولة للدفع رغم تسجيل الدخول في واجهة Colab، فالبديل الآمن هو **Colab Secret** باسم "GITHUB_WRITE_TOKEN" بصلاحية كتابة محدودة للمستودع فقط؛ لا يكتب الدفتر السر في خلية أو ملف أو commit ولا يحتاجه للقراءة.
`, "github-public-security"),

  code("clone-public-project", `
# 2) استنساخ نظيف للمشروع العام. لا يحتاج token للقراءة ولا يكتب أي بيانات اعتماد إلى git remote.
import shutil

REPO_OWNER = "Emran025"
REPO_NAME = "old-permic-ocr-lab"
REPO_BRANCH = "main"
REPO_URL = f"https://github.com/{REPO_OWNER}/{REPO_NAME}.git"
WORKTREE = Path("/content/old-permic-ocr-lab")
WORKSPACE = Path("/content/old-permic-ocr-workspace")

if WORKTREE.exists():
    shutil.rmtree(WORKTREE)
WORKSPACE.mkdir(parents=True, exist_ok=True)

subprocess.run(["git", "clone", "--depth", "1", "--branch", REPO_BRANCH, REPO_URL, str(WORKTREE)], check=True)
PROJECT_ROOT = WORKTREE
GENERATOR_PATH = PROJECT_ROOT / "training" / "synthetic" / "generate_old_permic_synthetic.py"
VALIDATOR_PATH = PROJECT_ROOT / "scripts" / "validate_synthetic_dataset.py"
FONT_PATH = PROJECT_ROOT / "training" / "assets" / "NotoSansOldPermic-Regular.ttf"

assert GENERATOR_PATH.is_file(), GENERATOR_PATH
assert VALIDATOR_PATH.is_file(), VALIDATOR_PATH
assert FONT_PATH.is_file(), FONT_PATH
print("استنسخ المشروع عند:", PROJECT_ROOT)
print("commit:", subprocess.check_output(["git", "-C", str(PROJECT_ROOT), "rev-parse", "HEAD"], text=True).strip())
`, "clone-project"),

  code("drive-and-integrity", `
# 3) ربط Drive لحفظ الاستئناف، ثم تثبيت بصمات المصدر والخط.
from google.colab import drive
import hashlib
import json
import time

drive.mount("/content/drive", force_remount=False)
DRIVE_ROOT = Path("/content/drive/MyDrive/OldPermicOCRLab")
DRIVE_STATE_ROOT = DRIVE_ROOT / "training_state"
DRIVE_DATA_ROOT = DRIVE_ROOT / "synthetic_cache"
DRIVE_STATE_ROOT.mkdir(parents=True, exist_ok=True)
DRIVE_DATA_ROOT.mkdir(parents=True, exist_ok=True)

def sha256_file(path, block_size=1024 * 1024):
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for block in iter(lambda: stream.read(block_size), b""):
            digest.update(block)
    return digest.hexdigest()

SOURCE_COMMIT = subprocess.check_output(["git", "-C", str(PROJECT_ROOT), "rev-parse", "HEAD"], text=True).strip()
FONT_SHA256 = sha256_file(FONT_PATH)
EXPECTED_FONT_SHA256 = "f2eb57a47f62d490cb8a5efab95124f15b8941968cb03af780b939bae3b73006"
assert FONT_SHA256 == EXPECTED_FONT_SHA256, "بصمة الخط لا تطابق الخط المعتمد للمشروع."
print(json.dumps({"source_commit": SOURCE_COMMIT, "font_sha256": FONT_SHA256, "drive_root": str(DRIVE_ROOT)}, ensure_ascii=False, indent=2))
`, "drive-integrity"),

  markdown("curriculum", `
## المنهج الصناعي الحرفي

كل عينة تحوي حروفًا برمية مستقلة ومربعات YOLO للحرف؛ لا يولد الدفتر كلمات أو معجمًا. لا يعدو الانتقال إلى S1 وS2 تغييرًا في التنظيم البصري، بينما تبقى وحدة التوسيم حرفًا.

| المرحلة | الغاية | المدخل الافتراضي | قاعدة التقدم |
|---|---|---|---|
| S0 | حرف واحد كبير ومتمركز | "unicode-clean" | فحص فئات ووسوم ومعاينة قبل التدريب |
| S0-d1 | متانة أولية دون خط تاريخي | "controlled-deformation" | تجربة منفصلة عن S0 |
| S1 | أسطر محارف منظمة | "manuscript-inspired" | لا تبدأ قبل قبول S0-d1 |
| S2 | صفحات بعمود أو عمودين | "manuscript-inspired" | لا تبدأ قبل مراجعة S1 |
`, "curriculum"),

  code("generation-config", `
# 4) اختر مرحلة واحدة فقط لكل تشغيل. لا تدمج النتائج تلقائيًا.
import sys
sys.path.insert(0, str(PROJECT_ROOT))
from training.synthetic.generate_old_permic_synthetic import PROFILES, write_dataset

CURRICULUM = {
    "S0": {
        "profile": "unicode-clean", "layout": "isolated-glyph", "samples": 7600,
        "seed": 10350, "image_size": 640, "font_size": 58, "balanced_classes": True, "workers": 6,
    },
    "S0-d1": {
        "profile": "controlled-deformation", "layout": "isolated-glyph", "samples": 7600,
        "seed": 20350, "image_size": 640, "font_size": 58, "balanced_classes": True, "workers": 6,
    },
    "S1": {
        "profile": "manuscript-inspired", "layout": "ordered-lines", "samples": 1000,
        "seed": 30350, "image_size": 640, "font_size": 46, "balanced_classes": False, "workers": 2,
    },
    "S2": {
        "profile": "manuscript-inspired", "layout": "structured-pages", "samples": 600,
        "seed": 40350, "image_size": 640, "font_size": 38, "balanced_classes": False, "workers": 2,
    },
}

STAGE = "S0"  # غيّرها يدويًا بعد قبول المرحلة السابقة فقط.
assert STAGE in CURRICULUM
GENERATION = CURRICULUM[STAGE]
DATASET_ROOT = WORKSPACE / "synthetic" / STAGE
print(json.dumps({"stage": STAGE, "output": str(DATASET_ROOT), **GENERATION}, ensure_ascii=False, indent=2))
`, "generation-config"),

  code("generate-and-validate", `
# 5) التوليد الحتمي ثم تحقق مستقل. تعيد الدالة بناء مجلد المرحلة، فلا تشغّلها فوق تجربة تريد الاحتفاظ بها.
manifest = write_dataset(
    output_dir=DATASET_ROOT,
    profile=PROFILES[GENERATION["profile"]],
    samples=GENERATION["samples"],
    seed=GENERATION["seed"],
    image_size=GENERATION["image_size"],
    font_size=GENERATION["font_size"],
    font_path=FONT_PATH,
    layout=GENERATION["layout"],
    balanced_classes=GENERATION["balanced_classes"],
    workers=GENERATION["workers"],
)
subprocess.run([sys.executable, str(VALIDATOR_PATH), str(DATASET_ROOT)], check=True)
print(json.dumps(manifest, ensure_ascii=False, indent=2))
`, "generate-validate"),

  code("dataset-contract", `
# 6) عقد بيانات غير قابل للالتباس: الفئات، البذور، بصمة الخط، وبصمات manifests.
import yaml
from collections import Counter

CLASS_MAP_PATH = DATASET_ROOT / "class_map.json"
MANIFEST_PATH = DATASET_ROOT / "manifest.json"
ASSETS_PATH = DATASET_ROOT / "assets.jsonl"
class_map = json.loads(CLASS_MAP_PATH.read_text(encoding="utf-8"))
classes = class_map.get("classes", [])
class_ids = [item["id"] for item in classes]
assert classes and class_ids == list(range(len(classes))), "class_map.json غير متسق."
CLASS_NAMES = [item["label"] for item in classes]

split_summary = {}
for split in ("train", "val", "test"):
    image_dir, label_dir = DATASET_ROOT / "images" / split, DATASET_ROOT / "labels" / split
    images, labels = sorted(image_dir.glob("*.png")), sorted(label_dir.glob("*.txt"))
    assert images and len(images) == len(labels), f"خلل عددي في {split}."
    class_counts = Counter()
    for label_path in labels:
        for row in label_path.read_text(encoding="utf-8").splitlines():
            if not row.strip():
                continue
            class_id, *coords = row.split()
            assert len(coords) == 4 and 0 <= int(class_id) < len(CLASS_NAMES)
            assert all(0.0 <= float(value) <= 1.0 for value in coords)
            class_counts[int(class_id)] += 1
    split_summary[split] = {"images": len(images), "labels": len(labels), "boxes": sum(class_counts.values())}

DATA_YAML = DATASET_ROOT / "data.yaml"
DATA_YAML.write_text(yaml.safe_dump({
    "path": str(DATASET_ROOT), "train": "images/train", "val": "images/val", "test": "images/test",
    "nc": len(CLASS_NAMES), "names": CLASS_NAMES,
}, allow_unicode=True, sort_keys=False), encoding="utf-8")

DATA_CONTRACT = {
    "contract_version": 1,
    "kind": "old-permic-character-detection",
    "source_commit": SOURCE_COMMIT,
    "stage": STAGE,
    "dataset_root": str(DATASET_ROOT),
    "class_map_sha256": sha256_file(CLASS_MAP_PATH),
    "manifest_sha256": sha256_file(MANIFEST_PATH),
    "assets_sha256": sha256_file(ASSETS_PATH),
    "font_sha256": FONT_SHA256,
    "class_count": len(CLASS_NAMES),
    "splits": split_summary,
    "real_manuscripts_included": False,
}
CONTRACT_PATH = DATASET_ROOT / "data_contract.json"
CONTRACT_PATH.write_text(json.dumps(DATA_CONTRACT, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(DATA_CONTRACT, ensure_ascii=False, indent=2))
`, "dataset-contract"),

  code("visual-qa", `
# 7) مراجعة بصرية حتمية لعينة ووسومها. لا تتابع التدريب قبل فحص الصورة المعروضة.
from PIL import Image, ImageDraw
import matplotlib.pyplot as plt

PREVIEW_SPLIT = "train"
preview_image_path = sorted((DATASET_ROOT / "images" / PREVIEW_SPLIT).glob("*.png"))[0]
preview_label_path = DATASET_ROOT / "labels" / PREVIEW_SPLIT / f"{preview_image_path.stem}.txt"
image = Image.open(preview_image_path).convert("RGB")
draw = ImageDraw.Draw(image)
for row in preview_label_path.read_text(encoding="utf-8").splitlines():
    class_id, xc, yc, width, height = row.split()
    xc, yc, width, height = map(float, (xc, yc, width, height))
    x1, y1 = int((xc - width / 2) * image.width), int((yc - height / 2) * image.height)
    x2, y2 = int((xc + width / 2) * image.width), int((yc + height / 2) * image.height)
    draw.rectangle((x1, y1, x2, y2), outline=(176, 120, 47), width=max(2, image.width // 500))
    draw.text((x1, max(0, y1 - 18)), CLASS_NAMES[int(class_id)], fill=(176, 120, 47))
plt.figure(figsize=(10, 10))
plt.imshow(image)
plt.axis("off")
plt.title(f"{STAGE}: تحقق بصري قبل التدريب")
plt.show()
`, "visual-qa"),

  markdown("training-gate", `
## بوابة التدريب

ابدأ baseline بـS0 وحدها. قارن S0-d1 كتجربة منفصلة، ثم انقل نفس بروتوكول التجربة إلى S1 وS2. لا تعني نتيجة جيدة على هذه البيانات المصنوعة أن النموذج يتعرف على مخطوطات أصلية. لا تستخدم warm start من لغة أخرى ما لم تسجل التجربة، تعيد بناء رأس الكشف، وتقارنها بخط أساس من الصفر.
`, "training-gate"),

  code("training-config", `
# 8) إعداد تجربة واحدة قابلة للمقارنة. اضبط الاسم بدل الكتابة فوق تجربة سابقة.
from datetime import datetime, timezone

MODEL_YAML = "yolov8n.yaml"
INITIALIZATION = "from_scratch"
assert INITIALIZATION == "from_scratch", "warm start يحتاج بروتوكول تجربة منفصل ولا يستخدم في baseline."
EPOCHS = 100
IMAGE_SIZE = 960
BATCH_SIZE = 4
WORKERS = 2
DEVICE = 0
SEED = 20260819
EXPERIMENT_NAME = f"old_permic_{STAGE.lower().replace('-', '_')}_baseline_v1"
RUNS_ROOT = WORKSPACE / "runs"
RUN_DIR = RUNS_ROOT / EXPERIMENT_NAME
STATE_DIR = DRIVE_STATE_ROOT / EXPERIMENT_NAME
STATE_DIR.mkdir(parents=True, exist_ok=True)
DRIVE_LAST_PT = STATE_DIR / "last.pt"
DRIVE_RESULTS_CSV = STATE_DIR / "results.csv"
DRIVE_STATE_JSON = STATE_DIR / "resume_state.json"
DRIVE_CONTRACT_JSON = STATE_DIR / "data_contract.json"

print(json.dumps({"experiment": EXPERIMENT_NAME, "epochs": EPOCHS, "imgsz": IMAGE_SIZE, "batch": BATCH_SIZE, "stage": STAGE}, ensure_ascii=False, indent=2))
`, "training-config"),

  code("checkpoint-tools", `
# 9) أدوات حفظ ذري واستئناف متحقق منه. لا تحفظ token في هذه الملفات.
def atomic_copy(source, destination):
    source, destination = Path(source), Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name + ".part")
    shutil.copy2(source, temporary)
    assert temporary.stat().st_size == source.stat().st_size
    os.replace(temporary, destination)

def atomic_json(destination, payload):
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name + ".part")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(temporary, destination)

def current_resume_contract():
    return {
        "contract_version": 1,
        "experiment_name": EXPERIMENT_NAME,
        "source_commit": SOURCE_COMMIT,
        "stage": STAGE,
        "class_map_sha256": DATA_CONTRACT["class_map_sha256"],
        "manifest_sha256": DATA_CONTRACT["manifest_sha256"],
        "assets_sha256": DATA_CONTRACT["assets_sha256"],
        "model_yaml": MODEL_YAML,
        "initialization": INITIALIZATION,
    }

def sync_latest_checkpoint(trainer):
    local_last = Path(trainer.last)
    if not local_last.is_file():
        return
    atomic_copy(local_last, DRIVE_LAST_PT)
    local_results = Path(trainer.save_dir) / "results.csv"
    if local_results.is_file():
        atomic_copy(local_results, DRIVE_RESULTS_CSV)
    atomic_copy(CONTRACT_PATH, DRIVE_CONTRACT_JSON)
    state = current_resume_contract() | {
        "last_pt_sha256": sha256_file(DRIVE_LAST_PT),
        "saved_after_epoch": int(trainer.epoch) + 1,
        "saved_at_utc": datetime.now(timezone.utc).isoformat(),
    }
    atomic_json(DRIVE_STATE_JSON, state)

def assert_resume_is_compatible():
    assert DRIVE_LAST_PT.is_file() and DRIVE_STATE_JSON.is_file() and DRIVE_CONTRACT_JSON.is_file()
    saved = json.loads(DRIVE_STATE_JSON.read_text(encoding="utf-8"))
    for key, value in current_resume_contract().items():
        assert saved.get(key) == value, f"لا يستأنف التدريب: اختلاف {key}."
    assert saved.get("last_pt_sha256") == sha256_file(DRIVE_LAST_PT), "تلف أو تبدل last.pt في Drive."
    assert json.loads(DRIVE_CONTRACT_JSON.read_text(encoding="utf-8"))["class_map_sha256"] == DATA_CONTRACT["class_map_sha256"]
`, "checkpoint-tools"),

  code("training-run", `
# 10) التدريب أو الاستئناف. يحفظ Ultralytics كل epoch ثم تنسخ callback آخر حالة إلى Drive.
from ultralytics import YOLO

if DRIVE_LAST_PT.is_file() and DRIVE_STATE_JSON.is_file() and DRIVE_CONTRACT_JSON.is_file():
    assert_resume_is_compatible()
    model = YOLO(str(DRIVE_LAST_PT))
    model.add_callback("on_model_save", sync_latest_checkpoint)
    results = model.train(resume=True)
else:
    model = YOLO(MODEL_YAML)
    model.add_callback("on_model_save", sync_latest_checkpoint)
    results = model.train(
        data=str(DATA_YAML), epochs=EPOCHS, imgsz=IMAGE_SIZE, batch=BATCH_SIZE, device=DEVICE,
        workers=WORKERS, project=str(RUNS_ROOT), name=EXPERIMENT_NAME, exist_ok=True,
        pretrained=False, seed=SEED, deterministic=True, plots=True, save=True, save_period=1,
    )

RUN_DIR = Path(model.trainer.save_dir) if getattr(model, "trainer", None) else RUN_DIR
BEST_PT = RUN_DIR / "weights" / "best.pt"
assert BEST_PT.is_file(), f"لم يعثر على best.pt في {BEST_PT}"
atomic_copy(BEST_PT, STATE_DIR / "best.pt")
print("اكتمل التدريب أو الاستئناف. أفضل وزن:", BEST_PT)
`, "training-run"),

  code("test-evaluation", `
# 11) تقييم test مستقل وبناء قياسات قابلة للنشر. لا تتجاوز هذه الخلية عند إصدار النتائج.
evaluation_model = YOLO(str(BEST_PT))
metrics = evaluation_model.val(data=str(DATA_YAML), split="test", imgsz=IMAGE_SIZE, batch=BATCH_SIZE, device=DEVICE, plots=True)

def metric_value(path, default=None):
    value = metrics
    for part in path.split("."):
        value = getattr(value, part, None)
        if value is None:
            return default
    return float(value)

METRICS_PAYLOAD = {
    "schema_version": 1,
    "experiment_name": EXPERIMENT_NAME,
    "evaluated_at_utc": datetime.now(timezone.utc).isoformat(),
    "dataset_contract": DATA_CONTRACT,
    "weights": {"best_pt_sha256": sha256_file(BEST_PT), "best_pt_bytes": BEST_PT.stat().st_size},
    "test_metrics": {
        "map50_95": metric_value("box.map"),
        "map50": metric_value("box.map50"),
        "map75": metric_value("box.map75"),
        "precision": metric_value("box.mp"),
        "recall": metric_value("box.mr"),
    },
    "interpretation": "synthetic baseline only; it is not an OCR claim for historical Old Permic manuscripts.",
}
METRICS_PATH = RUN_DIR / "metrics.json"
atomic_json(METRICS_PATH, METRICS_PAYLOAD)
atomic_copy(METRICS_PATH, STATE_DIR / "metrics.json")
print(json.dumps(METRICS_PAYLOAD, ensure_ascii=False, indent=2))
`, "test-evaluation"),

  code("package-release", `
# 12) تصدير ONNX وبناء release.json صغير وصريح. لا يدفع هذه الخلية أي ملف إلى GitHub.
EXPORT_ONNX = True
onnx_path = None
if EXPORT_ONNX:
    onnx_path = Path(evaluation_model.export(format="onnx", imgsz=IMAGE_SIZE))

PUBLISHED_ROOT = RUN_DIR / "published"
PUBLISHED_ROOT.mkdir(parents=True, exist_ok=True)
atomic_copy(CLASS_MAP_PATH, PUBLISHED_ROOT / "class_map.json")
atomic_copy(CONTRACT_PATH, PUBLISHED_ROOT / "data_contract.json")
atomic_copy(METRICS_PATH, PUBLISHED_ROOT / "metrics.json")

release_assets = []
for source, relpath, kind in [
    (PUBLISHED_ROOT / "class_map.json", "class_map.json", "class_map"),
    (PUBLISHED_ROOT / "data_contract.json", "data_contract.json", "data_contract"),
    (PUBLISHED_ROOT / "metrics.json", "metrics.json", "metrics"),
    (BEST_PT, "weights/best.pt", "pytorch_weight"),
]:
    release_assets.append({"path": relpath, "kind": kind, "sha256": sha256_file(source), "bytes": source.stat().st_size})
if onnx_path and onnx_path.is_file():
    release_assets.append({"path": "weights/best.onnx", "kind": "onnx_weight", "sha256": sha256_file(onnx_path), "bytes": onnx_path.stat().st_size})

release_id = f"{EXPERIMENT_NAME}-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
RELEASE = {
    "schema_version": 1,
    "release_id": release_id,
    "created_at_utc": datetime.now(timezone.utc).isoformat(),
    "publication_status": "evaluated-not-published",
    "source_commit": SOURCE_COMMIT,
    "model_scope": "synthetic-old-permic-character-baseline",
    "real_manuscript_ocr_validated": False,
    "metrics_file": "metrics.json",
    "data_contract_file": "data_contract.json",
    "class_map_file": "class_map.json",
    "assets": release_assets,
    "required_before_web_inference": ["matching_class_map", "server-side_weight_loading", "integration_test"],
}
RELEASE_PATH = PUBLISHED_ROOT / "release.json"
atomic_json(RELEASE_PATH, RELEASE)
atomic_copy(RELEASE_PATH, STATE_DIR / "release.json")
print(json.dumps(RELEASE, ensure_ascii=False, indent=2))
`, "package-release"),

  markdown("publishing-gate", `
## بوابة النشر إلى GitHub

النشر **مغلق افتراضيًا**. عند تفعيله، تنشر الخلية وصف الإصدار، القياسات، العقد، خريطة الفئات، عددًا محدودًا من صور المعاينة، ووزنًا فقط إذا كان أصغر من الحد المحدد. لا تنشر dataset أو "last.pt" أو ملفات Drive أو token. تحاول الخلية أولًا الدفع بجلسة GitHub المصرح بها في Colab. إن تطلبت shell مصادقة منفصلة، فعّل بديل Colab Secret باسم "GITHUB_WRITE_TOKEN" بصلاحية **Contents: Write** للمستودع نفسه فقط.
`, "publishing-gate"),

  code("publish-release", `
# 13) نشر إصدار مكتمل ومحدود إلى GitHub. اتركه False حتى تراجع النتائج.
PUBLISH_RELEASE = False
PUBLISH_BRANCH = "colab-results"
MAX_GITHUB_WEIGHT_BYTES = 90 * 1024 * 1024
USE_COLAB_SECRET_FALLBACK = False

if PUBLISH_RELEASE:
    repo_publish_dir = PROJECT_ROOT / "artifacts" / "published" / release_id
    repo_publish_dir.mkdir(parents=True, exist_ok=False)
    published_assets = []
    for filename, kind in (("metrics.json", "metrics"), ("data_contract.json", "data_contract"), ("class_map.json", "class_map")):
        atomic_copy(PUBLISHED_ROOT / filename, repo_publish_dir / filename)
        published_path = repo_publish_dir / filename
        published_assets.append({"path": filename, "kind": kind, "sha256": sha256_file(published_path), "bytes": published_path.stat().st_size})

    preview_candidates = [RUN_DIR / "results.png", RUN_DIR / "confusion_matrix.png", RUN_DIR / "PR_curve.png"]
    preview_dir = repo_publish_dir / "previews"
    for preview in preview_candidates:
        if preview.is_file():
            atomic_copy(preview, preview_dir / preview.name)
            published_path = preview_dir / preview.name
            published_assets.append({"path": str(published_path.relative_to(repo_publish_dir)), "kind": "preview", "sha256": sha256_file(published_path), "bytes": published_path.stat().st_size})

    weights_dir = repo_publish_dir / "weights"
    web_weight = None
    if BEST_PT.stat().st_size <= MAX_GITHUB_WEIGHT_BYTES:
        atomic_copy(BEST_PT, weights_dir / "best.pt")
        published_path = weights_dir / "best.pt"
        web_weight = {"path": str(published_path.relative_to(repo_publish_dir)), "kind": "pytorch_weight", "sha256": sha256_file(published_path), "bytes": published_path.stat().st_size}
        published_assets.append(web_weight)
    if onnx_path and onnx_path.is_file() and onnx_path.stat().st_size <= MAX_GITHUB_WEIGHT_BYTES:
        atomic_copy(onnx_path, weights_dir / "best.onnx")
        published_path = weights_dir / "best.onnx"
        published_assets.append({"path": str(published_path.relative_to(repo_publish_dir)), "kind": "onnx_weight", "sha256": sha256_file(published_path), "bytes": published_path.stat().st_size})

    public_release = RELEASE | {
        "publication_status": "published",
        "published_at_utc": datetime.now(timezone.utc).isoformat(),
        "assets": published_assets,
        "web_weight": web_weight,
    }
    atomic_json(repo_publish_dir / "release.json", public_release)
    atomic_json(PUBLISHED_ROOT / "release.json", public_release)

    latest_pointer = {
        "schema_version": 1,
        "release_id": release_id,
        "release_path": str((repo_publish_dir / "release.json").relative_to(PROJECT_ROOT)),
        "release_sha256": sha256_file(repo_publish_dir / "release.json"),
    }
    latest_pointer_path = PROJECT_ROOT / "artifacts" / "published" / "latest.json"
    atomic_json(latest_pointer_path, latest_pointer)

    subprocess.run(["git", "-C", str(PROJECT_ROOT), "switch", "-C", PUBLISH_BRANCH], check=True)
    subprocess.run([
        "git", "-C", str(PROJECT_ROOT), "add",
        str(repo_publish_dir.relative_to(PROJECT_ROOT)),
        str(latest_pointer_path.relative_to(PROJECT_ROOT)),
    ], check=True)
    subprocess.run(["git", "-C", str(PROJECT_ROOT), "config", "user.name", "Old Permic Colab"], check=True)
    subprocess.run(["git", "-C", str(PROJECT_ROOT), "config", "user.email", "colab@local.invalid"], check=True)
    subprocess.run(["git", "-C", str(PROJECT_ROOT), "commit", "-m", f"artifacts: publish {release_id}"], check=True)
    push = subprocess.run(["git", "-C", str(PROJECT_ROOT), "push", "origin", f"HEAD:{PUBLISH_BRANCH}"], text=True, capture_output=True)
    if push.returncode != 0 and USE_COLAB_SECRET_FALLBACK:
        from base64 import b64encode
        from google.colab import userdata
        github_write_token = userdata.get("GITHUB_WRITE_TOKEN")
        assert github_write_token, "لم يعثر Colab على Secret باسم GITHUB_WRITE_TOKEN."
        write_authorization = b64encode(f"x-access-token:{github_write_token}".encode("utf-8")).decode("ascii")
        push = subprocess.run([
            "git", "-C", str(PROJECT_ROOT), "-c", f"http.extraHeader=AUTHORIZATION: basic {write_authorization}",
            "push", "origin", f"HEAD:{PUBLISH_BRANCH}"
        ], text=True, capture_output=True)
        del github_write_token, write_authorization
    if push.returncode != 0:
        raise RuntimeError("تعذر دفع الإصدار من shell. تحقق من جلسة GitHub في Colab أو فعّل USE_COLAB_SECRET_FALLBACK مع Colab Secret محدود الكتابة؛ لا تضع token داخل الدفتر.")
    print("نُشر الإصدار إلى فرع GitHub:", PUBLISH_BRANCH)
else:
    print("النشر مغلق. راجع metrics.json وrelease.json ثم غيّر PUBLISH_RELEASE إلى True فقط عند القبول.")
`, "publish-release"),

  code("inference-smoke", `
# 14) اختبار inference محلي على صورة اختبار اصطناعية. لا يغير حالة الموقع ولا يدعي OCR للمخطوطات.
sample_image = sorted((DATASET_ROOT / "images" / "test").glob("*.png"))[0]
prediction = evaluation_model.predict(source=str(sample_image), conf=0.25, iou=0.5, device=DEVICE, verbose=False)[0]
print({"sample": sample_image.name, "detections": len(prediction.boxes)})
prediction.show()
`, "inference-smoke"),

  markdown("handoff", `
## ما يفعله الموقع بعد النشر

يفحص الموقع ملف "release.json" للإصدار المنشور دوريًا. لا يستورد dataset، ولا يعلن وجود نموذج جاهز لمجرد ظهور commit. يبقى الاستدلال في واجهة الرفع معلقًا حتى تُحمّل الخدمة وزنًا متحققًا، وتطابق "class_map.json"، وتجتاز اختبار التكامل. يظل وسم الإصدار في هذه المرحلة **synthetic baseline** ما لم يثبت غير ذلك ببيانات مخطوطات حقيقية موسومة وتقسيم test مستقل.
`, "handoff"),
];

const notebook = {
  cells,
  metadata: {
    kernelspec: { display_name: "Python 3 (Colab)", language: "python", name: "python3" },
    language_info: { name: "python", version: "3.11" },
    oldPermicNotebook: {
      schema_version: 2,
      role: "single-source-colab-generation-training-release-workflow",
      generated_by: "scripts/rebuild_colab_notebook.mjs",
    },
  },
  nbformat: 4,
  nbformat_minor: 5,
};

writeFileSync(notebookPath, `${JSON.stringify(notebook, null, 1)}\n`, "utf8");
console.log(`Rebuilt Colab notebook with ${cells.length} cells: ${notebookPath}`);

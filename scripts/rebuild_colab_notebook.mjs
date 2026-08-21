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

1. شغّل خلايا البيئة والاستنساخ وإعداد حفظ GitHub مرة واحدة لكل جلسة Colab.
2. ابدأ بـ **S0 فقط**. راجع التقرير والصورة ذات الصناديق قبل تفعيل S0-d1، ثم S1، ثم S2. لا تمزج مراحل المنهج تلقائيًا.
3. شغّل التدريب من الصفر في baseline مستقل لكل مرحلة مقبولة. تحفظ callback آخر checkpoint إلى فرع GitHub مخصص بعد **كل epoch**.
4. شغّل تقييم test وبناء الإصدار. لا تفعّل خلية نشر إصدار الموقع ما لم تكن النتائج مكتملة ومراجَعة.
`, "governance"),

  markdown("architecture-contract", `
## عقد الأصول والنتائج

| نوع الأصل | المكان أثناء التدريب | ما ينشر إلى GitHub |
|---|---|---|
| المشروع والمولد والخط | نسخة مؤقتة في Colab | كود المصدر فقط |
| البيانات الصناعية الكاملة | قرص Colab المؤقت | **لا تُرفع** |
| "last.pt" وملف الاستئناف | فرع "colab-checkpoints" بعد كل epoch | نعم، كأحدث snapshot فقط للاستئناف |
| "best.pt" وONNX | مساحة التشغيل بعد تقييم test | اختياريًا، بعد حد الحجم وقرار نشر صريح |
| "class_map.json" و"data_contract.json" و"metrics.json" و"release.json" | مساحة التشغيل وفرع checkpoints عند الحاجة | نعم، لأنها صغيرة وقابلة للتحقق |
| معاينات ومخططات التقييم | مساحة التشغيل | صور محددة ومرتبطة بالإصدار فقط |

لا يحمل GitHub أي token داخل الملفات. تطلب الخلايا الحساسة token مخفيًا في وقت التنفيذ عبر "getpass"، وتزيله من remote بعد الاستنساخ أو الدفع.
`, "artifact-contract"),

  code("environment-gpu", `
# 1) بيئة Colab وفحص GPU إلزامي. لا تغيّر هذه الخلية إلى تدريب CPU.
# يثبت Pillow 11.3.0 بدل الترقية غير المقيدة لمنع اختلاط ملفات PIL الداخلية في جلسات Colab الحديثة.
%pip install -q --upgrade "ultralytics>=8.3,<9" pyyaml matplotlib "Pillow==11.3.0"

import os
import sys
import subprocess
from pathlib import Path

# تجزئة الذاكرة في جلسات Colab الطويلة قد تترك مساحات غير متجاورة؛ هذا الإعداد
# يقلل ذلك قبل أول استخدام لـCUDA ولا يزيد الذاكرة المطلوبة وحده.
os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")

import torch
import ultralytics
import PIL

print("Python:", sys.version.split()[0])
print("PyTorch:", torch.__version__)
print("Ultralytics:", ultralytics.__version__)
print("Pillow:", PIL.__version__)
print("CUDA متاح:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))
    subprocess.run(["nvidia-smi", "--query-gpu=name,memory.total,driver_version", "--format=csv,noheader"], check=False)

assert torch.cuda.is_available(), (
    "لا يوجد GPU. في Colab اختر Runtime > Change runtime type > T4 GPU أو GPU متاح، ثم أعد تشغيل هذه الخلية."
)
`, "environment-gpu"),

  markdown("github-public-boundary", `
## GitHub العام: القراءة بلا سر، وcheckpoint بعد كل epoch

المستودع الآن عام، لذلك تستنسخ خلية البيئة المشروع من GitHub مباشرةً بلا token وبلا بيانات اعتماد. ويبقى الموقع قادرًا على قراءة وصف الإصدار المنشور دون token خادمي.

بعد كل epoch، تنسخ callback فقط "last.pt" و"results.csv" و"data_contract.json" و"resume_state.json" إلى فرع "colab-checkpoints"، ثم تدفع **أحدث snapshot واحد** باستخدام "--force-with-lease" حتى لا ينتفخ تاريخ المستودع بنسخة وزن جديدة لكل epoch. لا ترفع البيانات الصناعية أو أي token.

تستخدم الخلية جلسة Git المصرح بها داخل Colab. إذا لم تكن جلسة shell مخولة للدفع رغم تسجيل الدخول في واجهة Colab، فالبديل الآمن هو **Colab Secret** باسم "GITHUB_WRITE_TOKEN" بصلاحية كتابة محدودة للمستودع فقط؛ لا يكتب الدفتر السر في خلية أو ملف أو commit ولا يحتاجه للقراءة.
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
CHECKPOINT_REPO = Path("/content/old-permic-checkpoints")
CHECKPOINT_BRANCH = "colab-checkpoints"

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

  code("github-checkpoint-integrity", `
# 3) تثبيت بصمات المصدر والخط وإعداد فرع GitHub الذي يحفظ آخر checkpoint.
import hashlib
import json
import time

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
print(json.dumps({"source_commit": SOURCE_COMMIT, "font_sha256": FONT_SHA256, "checkpoint_branch": CHECKPOINT_BRANCH}, ensure_ascii=False, indent=2))
`, "github-integrity"),

  markdown("curriculum", `
## المنهج الصناعي الحرفي

كل عينة تحوي حروفًا برمية مستقلة ومربعات YOLO للحرف؛ لا يولد الدفتر كلمات أو معجمًا. لا يعدو الانتقال إلى S1 وS2 تغييرًا في التنظيم البصري، بينما تبقى وحدة التوسيم حرفًا.

| المرحلة | الغاية | المدخل الافتراضي | قاعدة التقدم |
|---|---|---|---|
| S0 | حرف واحد كبير ومتمركز | "unicode-clean" | فحص فئات ووسوم ومعاينة قبل التدريب |
| S0-d1 | محرف أصغر في موضع صفحة متغير مع تشويه مضبوط | "controlled-deformation" + "scattered-glyph" | تجربة منفصلة عن S0؛ لا تكرر تمركز S0 |
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
        "seed": 10350, "image_size": 640, "font_size": 48, "balanced_classes": True, "workers": 6,
    },
    "S0-d1": {
        "profile": "controlled-deformation", "layout": "scattered-glyph", "samples": 7600,
        "seed": 20350, "image_size": 640, "font_size": 36, "balanced_classes": True, "workers": 6,
    },
    "S1": {
        "profile": "manuscript-inspired", "layout": "ordered-lines", "samples": 1000,
        "seed": 30350, "image_size": 640, "font_size": 38, "balanced_classes": False, "workers": 2,
    },
    "S2": {
        "profile": "manuscript-inspired", "layout": "structured-pages", "samples": 600,
        "seed": 40350, "image_size": 640, "font_size": 28, "balanced_classes": False, "workers": 2,
    },
}

STAGE = "S0"  # غيّرها يدويًا بعد قبول المرحلة السابقة فقط.
assert STAGE in CURRICULUM
GENERATION = CURRICULUM[STAGE]
DATASET_ROOT = WORKSPACE / "synthetic" / STAGE
EXPERIMENT_NAME = f"old_permic_{STAGE.lower().replace('-', '_')}_baseline_v2_batch8"
CHECKPOINT_ROOT_NAME = "checkpoints"
SNAPSHOT_SCHEMA_VERSION = 2
SNAPSHOT_IDENTITY = {
    "schema_version": SNAPSHOT_SCHEMA_VERSION,
    "experiment_name": EXPERIMENT_NAME,
    "stage": STAGE,
    "generation": GENERATION,
    "font_sha256": FONT_SHA256,
    "generator_sha256": sha256_file(GENERATOR_PATH),
}
print(json.dumps({"stage": STAGE, "output": str(DATASET_ROOT), **GENERATION}, ensure_ascii=False, indent=2))
`, "generation-config"),

  code("restore-dataset-snapshot", `
# 4a) استعادة snapshot البيانات قبل التوليد. القراءة عامة؛ لا تحتاج token.
# إذا لم يوجد snapshot متوافق، ستنشئ الخلية التالية البيانات حتميًا للمرة الأولى.
SNAPSHOT_RESTORED_FROM_GITHUB = False

def clone_checkpoint_branch_readonly():
    if CHECKPOINT_REPO.exists():
        shutil.rmtree(CHECKPOINT_REPO)
    probe = subprocess.run(["git", "ls-remote", "--heads", REPO_URL, CHECKPOINT_BRANCH], text=True, capture_output=True)
    if not probe.stdout.strip():
        print("لا يوجد فرع checkpoint بعد؛ ستنشأ أول snapshot بعد أول epoch.")
        return False
    subprocess.run(["git", "clone", "--depth", "1", "--branch", CHECKPOINT_BRANCH, REPO_URL, str(CHECKPOINT_REPO)], check=True)
    return True

def atomic_copytree(source, destination):
    source, destination = Path(source), Path(destination)
    temporary = destination.with_name(destination.name + ".restore-part")
    if temporary.exists():
        shutil.rmtree(temporary)
    shutil.copytree(source, temporary, ignore=shutil.ignore_patterns("*.cache", "*.part", "__pycache__"))
    if destination.exists():
        shutil.rmtree(destination)
    os.replace(temporary, destination)

if clone_checkpoint_branch_readonly():
    SNAPSHOT_EXPERIMENT_DIR = CHECKPOINT_REPO / CHECKPOINT_ROOT_NAME / EXPERIMENT_NAME
    SNAPSHOT_DATASET_DIR = SNAPSHOT_EXPERIMENT_DIR / "dataset"
    SNAPSHOT_META_PATH = SNAPSHOT_EXPERIMENT_DIR / "dataset_snapshot.json"
    if SNAPSHOT_DATASET_DIR.is_dir() and SNAPSHOT_META_PATH.is_file():
        snapshot_meta = json.loads(SNAPSHOT_META_PATH.read_text(encoding="utf-8"))
        if snapshot_meta.get("identity") == SNAPSHOT_IDENTITY:
            atomic_copytree(SNAPSHOT_DATASET_DIR, DATASET_ROOT)
            SNAPSHOT_RESTORED_FROM_GITHUB = True
            print(f"استُعيد snapshot بيانات {STAGE} من GitHub: {snapshot_meta['tree']['file_count']} ملفًا.")
        else:
            print(
                "وُجد snapshot غير مطابق للمرحلة أو المولد أو الخط؛ "
                "لن يُستعاد ولن يُحذف. ستنشئ المرحلة الحالية بياناتها الحتمية المستقلة."
            )
    else:
        print("لا توجد بيانات snapshot متوافقة بعد؛ سيجري التوليد الحتمي المحلي.")
`, "restore-dataset-snapshot"),

  code("generate-and-validate", `
# 5) التوليد الحتمي أو إعادة استعمال cache مستعاد ثم تحقق مستقل.
# لا تفعّل FORCE_REGENERATE_DATASET فوق cache تريد الاحتفاظ بها أو استرجاعها.
FORCE_REGENERATE_DATASET = False
CACHED_MANIFEST_PATH = DATASET_ROOT / "manifest.json"

if CACHED_MANIFEST_PATH.is_file() and not FORCE_REGENERATE_DATASET:
    manifest = json.loads(CACHED_MANIFEST_PATH.read_text(encoding="utf-8"))
    print("استعمال cache مرحلة مستعاد/موجود:", DATASET_ROOT)
else:
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

ابدأ baseline بـS0 وحدها. بعد قبولها، تبدأ S0-d1 من وزن S0 المؤرشف لكن ببياناتها وoptimizer وcheckpoint منفصلة؛ هذا تكييف مرحلي وليس resume لـS0. ينطبق العقد نفسه على S1 وS2 بعد اكتمال المرحلة السابقة. لا تعني نتيجة جيدة على هذه البيانات المصنوعة أن النموذج يتعرف على مخطوطات أصلية. لا تستخدم warm start من لغة أخرى ما لم تسجل التجربة، تعيد بناء رأس الكشف، وتقارنها بخط أساس من الصفر.
`, "training-gate"),

  code("training-config", `
# 8) إعداد تجربة واحدة قابلة للمقارنة. اضبط الاسم بدل الكتابة فوق تجربة سابقة.
from datetime import datetime, timezone

MODEL_YAML = "yolov8n.yaml"
TRAINING_PLANS = {
    # S0 المرجعية المؤرشفة: لا تُعدل لضمان بقاء المقارنة التاريخية ممكنة.
    "S0": {"epochs": 100, "batch_candidates": (8, 6, 4), "eval_batch_size": 8, "experiment_name": "old_permic_s0_baseline_v2_batch8"},
    # S0-d أصغر ومحرف واحد موزع على الصفحة؛ يختبر batch 32 أولًا ثم يرجع آليًا فقط عند OOM.
    "S0-d1": {"epochs": 60, "batch_candidates": (32, 24, 16, 12, 8), "eval_batch_size": 16, "experiment_name": "old_permic_s0_d1_scattered_v1_batch32_e60"},
    # S1/S2 تظل منظمة بصريًا بعقودها الخاصة، مع خطط ذاكرة مستقلة عن S0-d.
    "S1": {"epochs": 70, "batch_candidates": (16, 12, 8, 6, 4), "eval_batch_size": 8, "experiment_name": "old_permic_s1_lines_v1_batch16_e70"},
    "S2": {"epochs": 80, "batch_candidates": (12, 8, 6, 4), "eval_batch_size": 6, "experiment_name": "old_permic_s2_pages_v1_batch12_e80"},
}
TRAINING_PLAN = TRAINING_PLANS[STAGE]
STAGE_INITIALIZATION = {
    "S0": None,
    # هذه البصمة تثبت وزن S0 المؤرشف عند epoch 100 ولا تعتمد على آخر فرع متحرك.
    "S0-d1": {
        "source_stage": "S0",
        "source_experiment": "old_permic_s0_baseline_v2_batch8",
        "source_branch": "s0-epoch100-checkpoint",
        "required_epochs": 100,
        "expected_last_pt_sha256": "db7ce494805f3c49505e30736eaec086c49f919b4192ad752c67c14c8a445bb2",
    },
    "S1": {
        "source_stage": "S0-d1",
        "source_experiment": "old_permic_s0_d1_scattered_v1_batch32_e60",
        "source_branch": "colab-checkpoints",
        "required_epochs": 60,
        "expected_last_pt_sha256": None,
    },
    "S2": {
        "source_stage": "S1",
        "source_experiment": "old_permic_s1_lines_v1_batch16_e70",
        "source_branch": "colab-checkpoints",
        "required_epochs": 70,
        "expected_last_pt_sha256": None,
    },
}
INITIALIZATION_SPEC = STAGE_INITIALIZATION[STAGE]
INITIALIZATION = "from_scratch" if INITIALIZATION_SPEC is None else f"warm_start_from_{INITIALIZATION_SPEC['source_stage']}"
EPOCHS = TRAINING_PLAN["epochs"]
IMAGE_SIZE = 960
BATCH_CANDIDATES = TRAINING_PLAN["batch_candidates"]
EVAL_BATCH_SIZE = TRAINING_PLAN["eval_batch_size"]
WORKERS = min(4, os.cpu_count() or 2)
AMP = True
DATASET_CACHE = False
DEVICE = 0
SEED = 20260819
EXPERIMENT_NAME = TRAINING_PLAN["experiment_name"]
RUNS_ROOT = WORKSPACE / "runs"
RUN_DIR = RUNS_ROOT / EXPERIMENT_NAME
STATE_DIR = WORKSPACE / "training_state" / EXPERIMENT_NAME
STATE_DIR.mkdir(parents=True, exist_ok=True)
LOCAL_LAST_PT = STATE_DIR / "last.pt"
LOCAL_RESULTS_CSV = STATE_DIR / "results.csv"
LOCAL_STATE_JSON = STATE_DIR / "resume_state.json"
LOCAL_CONTRACT_JSON = STATE_DIR / "data_contract.json"
INITIALIZATION_SOURCE_PT = STATE_DIR / "initialization_source.pt"
INITIALIZATION_WEIGHT_SHA256 = None

print(json.dumps({
    "experiment": EXPERIMENT_NAME, "training_plan": TRAINING_PLAN, "epochs": EPOCHS, "imgsz": IMAGE_SIZE,
    "batch_candidates": BATCH_CANDIDATES, "eval_batch": EVAL_BATCH_SIZE,
    "workers": WORKERS, "amp": AMP, "stage": STAGE, "initialization": INITIALIZATION,
    "initialization_spec": INITIALIZATION_SPEC,
}, ensure_ascii=False, indent=2))
`, "training-config"),

  code("checkpoint-tools", `
# 9) Snapshot كامل وقابل للاستئناف من GitHub. لا يكتب secret في ملف أو remote.
from base64 import b64encode

CHECKPOINT_ROOT = CHECKPOINT_REPO / CHECKPOINT_ROOT_NAME
CHECKPOINT_EXPERIMENT_DIR = CHECKPOINT_ROOT / EXPERIMENT_NAME
CHECKPOINT_DATASET_DIR = CHECKPOINT_EXPERIMENT_DIR / "dataset"
CHECKPOINT_DATASET_META = CHECKPOINT_EXPERIMENT_DIR / "dataset_snapshot.json"

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

def tree_summary(root):
    files, total_bytes = 0, 0
    for path in Path(root).rglob("*"):
        if path.is_file() and path.suffix != ".cache":
            files += 1
            total_bytes += path.stat().st_size
    return {"file_count": files, "bytes": total_bytes}

def copy_dataset_snapshot(source, destination):
    source, destination = Path(source), Path(destination)
    temporary = destination.with_name(destination.name + ".snapshot-part")
    if temporary.exists():
        shutil.rmtree(temporary)
    shutil.copytree(source, temporary, ignore=shutil.ignore_patterns("*.cache", "*.part", "__pycache__"))
    if destination.exists():
        shutil.rmtree(destination)
    os.replace(temporary, destination)

SNAPSHOT_REGENERATED_FOR_CURRENT_STAGE = False

def snapshot_meta_from_dataset():
    return {
        "schema_version": SNAPSHOT_SCHEMA_VERSION,
        "identity": SNAPSHOT_IDENTITY,
        "tree": tree_summary(DATASET_ROOT),
        "manifest_sha256": sha256_file(DATASET_ROOT / "manifest.json"),
        "class_map_sha256": sha256_file(DATASET_ROOT / "class_map.json"),
        "assets_sha256": sha256_file(DATASET_ROOT / "assets.jsonl"),
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
    }

def snapshot_matches_training_contract(meta):
    """يسمح بتبدل بصمة كود المولد فقط إذا كانت ملفات بيانات التدريب نفسها حرفيًا."""
    identity = meta.get("identity", {})
    return (
        identity.get("experiment_name") == EXPERIMENT_NAME
        and identity.get("stage") == STAGE
        and meta.get("manifest_sha256") == DATA_CONTRACT["manifest_sha256"]
        and meta.get("class_map_sha256") == DATA_CONTRACT["class_map_sha256"]
        and meta.get("assets_sha256") == DATA_CONTRACT["assets_sha256"]
    )

def remove_incompatible_training_artifacts():
    # لا يحمل وزنًا أو عقدًا يخص بيانات فعلية مختلفة إلى تجربة المرحلة الجديدة.
    for name in ("last.pt", "results.csv", "data_contract.json", "resume_state.json"):
        stale = CHECKPOINT_EXPERIMENT_DIR / name
        if stale.exists():
            stale.unlink()
    latest = CHECKPOINT_ROOT / "latest.json"
    if latest.is_file():
        latest_payload = json.loads(latest.read_text(encoding="utf-8"))
        if latest_payload.get("experiment_name") == EXPERIMENT_NAME:
            latest.unlink()

def current_resume_contract():
    return {
        "schema_version": SNAPSHOT_SCHEMA_VERSION,
        "experiment_name": EXPERIMENT_NAME,
        "stage": STAGE,
        "class_map_sha256": DATA_CONTRACT["class_map_sha256"],
        "manifest_sha256": DATA_CONTRACT["manifest_sha256"],
        "assets_sha256": DATA_CONTRACT["assets_sha256"],
        "model_yaml": MODEL_YAML,
        "initialization": INITIALIZATION,
        "initialization_spec": INITIALIZATION_SPEC,
    }

def prepare_initialization_weight():
    """يجلب وزن المرحلة المقبولة السابقة للتهيئة فقط، ولا ينسخ optimizer أو حالة resume."""
    global INITIALIZATION_WEIGHT_SHA256
    if INITIALIZATION_SPEC is None:
        return None
    initialization_repo = Path("/content/old-permic-initialization-source")
    if initialization_repo.exists():
        shutil.rmtree(initialization_repo)
    source_branch = INITIALIZATION_SPEC["source_branch"]
    subprocess.run([
        "git", "clone", "--depth", "1", "--branch", source_branch, REPO_URL, str(initialization_repo)
    ], check=True)
    source_dir = initialization_repo / CHECKPOINT_ROOT_NAME / INITIALIZATION_SPEC["source_experiment"]
    source_state_path = source_dir / "resume_state.json"
    source_last_path = source_dir / "last.pt"
    source_contract_path = source_dir / "data_contract.json"
    assert source_state_path.is_file() and source_last_path.is_file() and source_contract_path.is_file(), (
        f"لا توجد حالة مكتملة للمرحلة المصدر {INITIALIZATION_SPEC['source_stage']} في فرع {source_branch}."
    )
    source_state = json.loads(source_state_path.read_text(encoding="utf-8"))
    assert source_state.get("stage") == INITIALIZATION_SPEC["source_stage"]
    assert source_state.get("experiment_name") == INITIALIZATION_SPEC["source_experiment"]
    assert int(source_state.get("saved_after_epoch", 0)) >= INITIALIZATION_SPEC["required_epochs"], (
        "وزن المرحلة السابقة غير مكتمل؛ لا يبدأ التكييف قبل الوصول إلى epochs المعتمدة."
    )
    actual_sha = sha256_file(source_last_path)
    assert source_state.get("last_pt_sha256") == actual_sha, "تلف وزن التهيئة أو تبدل عن حالة GitHub."
    expected_sha = INITIALIZATION_SPEC.get("expected_last_pt_sha256")
    if expected_sha:
        assert actual_sha == expected_sha, "وزن S0 المؤرشف لا يطابق البصمة المعتمدة عند epoch 100."
    source_contract = json.loads(source_contract_path.read_text(encoding="utf-8"))
    assert source_contract.get("class_map_sha256") == DATA_CONTRACT["class_map_sha256"], "تختلف خريطة الفئات بين وزن التهيئة والمرحلة الجديدة."
    atomic_copy(source_last_path, INITIALIZATION_SOURCE_PT)
    INITIALIZATION_WEIGHT_SHA256 = actual_sha
    print(json.dumps({
        "initialization": INITIALIZATION,
        "source_stage": INITIALIZATION_SPEC["source_stage"],
        "source_branch": source_branch,
        "source_epoch": source_state["saved_after_epoch"],
        "source_last_pt_sha256": actual_sha,
    }, ensure_ascii=False, indent=2))
    return INITIALIZATION_SOURCE_PT

def remote_checkpoint_branch_exists():
    probe = subprocess.run(["git", "ls-remote", "--heads", REPO_URL, CHECKPOINT_BRANCH], text=True, capture_output=True)
    return bool(probe.stdout.strip())

def ensure_checkpoint_repo():
    if not (CHECKPOINT_REPO / ".git").is_dir():
        if CHECKPOINT_REPO.exists():
            shutil.rmtree(CHECKPOINT_REPO)
        if remote_checkpoint_branch_exists():
            subprocess.run(["git", "clone", "--depth", "1", "--branch", CHECKPOINT_BRANCH, REPO_URL, str(CHECKPOINT_REPO)], check=True)
        else:
            subprocess.run(["git", "clone", "--depth", "1", REPO_URL, str(CHECKPOINT_REPO)], check=True)
            subprocess.run(["git", "-C", str(CHECKPOINT_REPO), "switch", "--orphan", CHECKPOINT_BRANCH], check=True)
            subprocess.run(["git", "-C", str(CHECKPOINT_REPO), "rm", "-rf", "."], check=False)
    subprocess.run(["git", "-C", str(CHECKPOINT_REPO), "config", "user.name", "Old Permic Colab"], check=True)
    subprocess.run(["git", "-C", str(CHECKPOINT_REPO), "config", "user.email", "colab@local.invalid"], check=True)

def github_write_header():
    from google.colab import userdata
    token = userdata.get("GITHUB_WRITE_TOKEN")
    assert token, "يلزم Colab Secret باسم GITHUB_WRITE_TOKEN بصلاحية Contents: Write لحفظ كل epoch."
    header = b64encode(f"x-access-token:{token}".encode("utf-8")).decode("ascii")
    del token
    return f"AUTHORIZATION: basic {header}"

def push_checkpoint_branch():
    authorization = github_write_header()
    try:
        push = subprocess.run([
            "git", "-C", str(CHECKPOINT_REPO), "-c", f"http.extraHeader={authorization}",
            "push", "--set-upstream", "--force-with-lease", "origin", f"HEAD:{CHECKPOINT_BRANCH}",
        ], text=True, capture_output=True)
    finally:
        del authorization
    if push.returncode != 0:
        raise RuntimeError(
            "فشل دفع snapshot إلى GitHub؛ لم يُخفَ الخطأ ولم يبدأ تدريب جديد. "
            f"شغّل جلسة واحدة فقط للتجربة ثم أعد المحاولة.\n{push.stderr}"
        )

def ensure_dataset_snapshot():
    global SNAPSHOT_REGENERATED_FOR_CURRENT_STAGE
    if CHECKPOINT_DATASET_META.is_file() and CHECKPOINT_DATASET_DIR.is_dir():
        meta = json.loads(CHECKPOINT_DATASET_META.read_text(encoding="utf-8"))
        if meta.get("identity") == SNAPSHOT_IDENTITY:
            return meta
        stale_stage = meta.get("identity", {}).get("stage", "?")
        keep_resume = snapshot_matches_training_contract(meta)
        if keep_resume:
            print(
                f"تغيرت هوية snapshot أو كود المولد ({stale_stage})، لكن manifest وخريطة الفئات "
                f"وسجل الأصول متطابقة مع {STAGE}؛ سيُعاد بناء snapshot البيانات فقط مع الاحتفاظ "
                "بـlast.pt وresume_state.json للاستئناف."
            )
        else:
            print(
                f"snapshot البيانات الموجود يخص مرحلة أو إعدادًا مختلفًا ({stale_stage})؛ "
                f"سيُعاد توليد {STAGE} حتميًا ثم سيُستبدل snapshotها على GitHub."
            )
            remove_incompatible_training_artifacts()
        copy_dataset_snapshot(DATASET_ROOT, CHECKPOINT_DATASET_DIR)
        meta = snapshot_meta_from_dataset()
        atomic_json(CHECKPOINT_DATASET_META, meta)
        SNAPSHOT_REGENERATED_FOR_CURRENT_STAGE = True
        print(f"أُعيد إنشاء snapshot بيانات {STAGE}: {meta['tree']['file_count']} ملفًا، {meta['tree']['bytes']} بايت.")
        return meta
    copy_dataset_snapshot(DATASET_ROOT, CHECKPOINT_DATASET_DIR)
    meta = snapshot_meta_from_dataset()
    atomic_json(CHECKPOINT_DATASET_META, meta)
    print(f"أُنشئ snapshot بيانات {STAGE}: {meta['tree']['file_count']} ملفًا، {meta['tree']['bytes']} بايت.")
    return meta

def commit_and_push_checkpoint_tree(message):
    subprocess.run(["git", "-C", str(CHECKPOINT_REPO), "add", CHECKPOINT_ROOT_NAME], check=True)
    has_commit = subprocess.run(["git", "-C", str(CHECKPOINT_REPO), "rev-parse", "--verify", "HEAD"], capture_output=True).returncode == 0
    subprocess.run(
        ["git", "-C", str(CHECKPOINT_REPO), "commit", "--amend", "-m", message] if has_commit
        else ["git", "-C", str(CHECKPOINT_REPO), "commit", "-m", message],
        check=True,
    )
    push_checkpoint_branch()

def bootstrap_dataset_snapshot():
    ensure_checkpoint_repo()
    existed = CHECKPOINT_DATASET_META.is_file() and CHECKPOINT_DATASET_DIR.is_dir()
    meta = ensure_dataset_snapshot()
    if not existed or SNAPSHOT_REGENERATED_FOR_CURRENT_STAGE:
        commit_and_push_checkpoint_tree(f"dataset snapshot: {EXPERIMENT_NAME}")
        print("دُفع snapshot بيانات المرحلة المتحقق إلى GitHub قبل التدريب.")
    return meta

def publish_latest_checkpoint(state):
    ensure_checkpoint_repo()
    dataset_meta = ensure_dataset_snapshot()
    atomic_copy(LOCAL_LAST_PT, CHECKPOINT_EXPERIMENT_DIR / "last.pt")
    atomic_copy(LOCAL_CONTRACT_JSON, CHECKPOINT_EXPERIMENT_DIR / "data_contract.json")
    if LOCAL_RESULTS_CSV.is_file():
        atomic_copy(LOCAL_RESULTS_CSV, CHECKPOINT_EXPERIMENT_DIR / "results.csv")
    state = state | {"dataset_snapshot": dataset_meta}
    atomic_json(CHECKPOINT_EXPERIMENT_DIR / "resume_state.json", state)
    atomic_json(CHECKPOINT_ROOT / "latest.json", {
        "schema_version": SNAPSHOT_SCHEMA_VERSION,
        "experiment_name": EXPERIMENT_NAME,
        "stage": STAGE,
        "checkpoint_path": str(CHECKPOINT_EXPERIMENT_DIR.relative_to(CHECKPOINT_REPO)),
        "saved_after_epoch": state["saved_after_epoch"],
        "last_pt_sha256": state["last_pt_sha256"],
        "dataset_snapshot": dataset_meta,
    })
    commit_and_push_checkpoint_tree(f"checkpoint: {EXPERIMENT_NAME} epoch {state['saved_after_epoch']}")
    print(f"دُفع snapshot الكامل بعد epoch {state['saved_after_epoch']} إلى GitHub/{CHECKPOINT_BRANCH}.")

def sync_latest_checkpoint(trainer):
    local_last = Path(trainer.last)
    assert local_last.is_file(), f"لم ينشئ YOLO last.pt بعد: {local_last}"
    atomic_copy(local_last, LOCAL_LAST_PT)
    local_results = Path(trainer.save_dir) / "results.csv"
    if local_results.is_file():
        atomic_copy(local_results, LOCAL_RESULTS_CSV)
    atomic_copy(CONTRACT_PATH, LOCAL_CONTRACT_JSON)
    state = current_resume_contract() | {
        "last_pt_sha256": sha256_file(LOCAL_LAST_PT),
        "initialization_weight_sha256": INITIALIZATION_WEIGHT_SHA256,
        "saved_after_epoch": int(trainer.epoch) + 1,
        "saved_at_utc": datetime.now(timezone.utc).isoformat(),
    }
    atomic_json(LOCAL_STATE_JSON, state)
    publish_latest_checkpoint(state)

def report_gpu_memory(trainer):
    if torch.cuda.is_available():
        device_index = torch.cuda.current_device()
        print(json.dumps({
            "epoch": int(trainer.epoch) + 1,
            "gpu_reserved_gib": round(torch.cuda.memory_reserved(device_index) / (1024 ** 3), 2),
            "gpu_peak_gib": round(torch.cuda.max_memory_allocated(device_index) / (1024 ** 3), 2),
            "gpu_total_gib": round(torch.cuda.get_device_properties(device_index).total_memory / (1024 ** 3), 2),
        }, ensure_ascii=False))

def add_training_callbacks(model):
    model.add_callback("on_model_save", sync_latest_checkpoint)
    model.add_callback("on_train_epoch_end", report_gpu_memory)

def restore_latest_checkpoint_from_github():
    ensure_checkpoint_repo()
    remote_state = CHECKPOINT_EXPERIMENT_DIR / "resume_state.json"
    remote_last = CHECKPOINT_EXPERIMENT_DIR / "last.pt"
    remote_contract = CHECKPOINT_EXPERIMENT_DIR / "data_contract.json"
    if not (remote_state.is_file() and remote_last.is_file() and remote_contract.is_file()):
        return False
    saved = json.loads(remote_state.read_text(encoding="utf-8"))
    legacy_checkpoint = saved.get("schema_version", saved.get("contract_version", 1)) == 1
    for key, value in current_resume_contract().items():
        if legacy_checkpoint and key in ("schema_version", "manifest_sha256"):
            continue  # manifest يضم metadata متغيرًا؛ تتحقق أدناه هوية snapshot الفعلية بدلًا منه.
        assert saved.get(key) == value, f"لا يستأنف التدريب: اختلاف {key}."
    assert saved.get("last_pt_sha256") == sha256_file(remote_last), "تلف أو تبدل last.pt في GitHub."
    remote_data_contract = json.loads(remote_contract.read_text(encoding="utf-8"))
    for key in ("class_map_sha256", "assets_sha256"):
        assert remote_data_contract.get(key) == DATA_CONTRACT[key], f"عقد البيانات المستعاد يختلف في {key}."
    if remote_data_contract.get("manifest_sha256") != DATA_CONTRACT["manifest_sha256"]:
        assert legacy_checkpoint, "اختلاف manifest في checkpoint حديث يمنع الاستئناف."
        snapshot_meta = json.loads(CHECKPOINT_DATASET_META.read_text(encoding="utf-8"))
        assert snapshot_meta.get("identity") == SNAPSHOT_IDENTITY, "هوية snapshot البيانات لا تطابق التجربة القديمة."
        assert snapshot_meta.get("class_map_sha256") == DATA_CONTRACT["class_map_sha256"]
        assert snapshot_meta.get("assets_sha256") == DATA_CONTRACT["assets_sha256"]
        assert snapshot_meta.get("manifest_sha256") == DATA_CONTRACT["manifest_sha256"]
        print("ترحيل checkpoint v1: قُبل اختلاف manifest بعد تحقق الفئات وسجل الأصول وهوية snapshot.")
    atomic_copy(remote_last, LOCAL_LAST_PT)
    atomic_copy(remote_contract, LOCAL_CONTRACT_JSON)
    if (CHECKPOINT_EXPERIMENT_DIR / "results.csv").is_file():
        atomic_copy(CHECKPOINT_EXPERIMENT_DIR / "results.csv", LOCAL_RESULTS_CSV)
    atomic_json(LOCAL_STATE_JSON, saved)
    print(f"استُعيد checkpoint epoch {saved['saved_after_epoch']} من GitHub/{CHECKPOINT_BRANCH}.")
    return True

def assert_resume_is_compatible():
    assert LOCAL_LAST_PT.is_file() and LOCAL_STATE_JSON.is_file() and LOCAL_CONTRACT_JSON.is_file()
    saved = json.loads(LOCAL_STATE_JSON.read_text(encoding="utf-8"))
    assert saved.get("last_pt_sha256") == sha256_file(LOCAL_LAST_PT), "تلف أو تبدل last.pt المحلي."
`, "checkpoint-tools"),

  markdown("github-handoff", `
## الاستئناف الكامل من GitHub

لا يربط الدفتر Google Drive. قبل التوليد، يحاول استعادة snapshot بيانات المرحلة من فرع "colab-checkpoints". إن لم يكن موجودًا، يولّد البيانات حتميًا ثم يدفعها إلى GitHub **قبل التدريب**. في كل epoch يدفع أيضًا "last.pt" و"results.csv" و"data_contract.json" و"resume_state.json"؛ لا يبدأ من الصفر بصمت عند فشل الاستعادة أو الدفع. إذا اختلفت بصمة كود المولد فقط بينما تطابقت \`manifest\` وخريطة الفئات وسجل الأصول، يعيد snapshot البيانات ولا يحذف \`last.pt\` أو \`resume_state.json\`.

يحفظ GitHub **آخر snapshot واحدًا** في الفرع المخصص عبر تعديل commit نفسه ثم الدفع بـ"--force-with-lease". يحتوي هذا snapshot على الصور والوسوم وملفات العقد للمرحلة، حتى يمكن للحساب التالي استعادة data.yaml نفسه ووزن الاستئناف نفسه. لا تبدأ جلستين تدفعان إلى التجربة نفسها في الوقت نفسه.
`, "github-handoff"),

  code("backup-workspace-to-drive", `
# 9a) نسخ workspace إلى Drive. اجعل القيمة True عند الحاجة فقط؛ لا تشغّلها تلقائيًا مع Run all.
RUN_WORKSPACE_BACKUP = False
BACKUP_ROOT = DRIVE_ROOT / "workspace_backup"
BACKUP_PAYLOAD_ROOT = BACKUP_ROOT / "payload"
BACKUP_WORKSPACE_ROOT = BACKUP_PAYLOAD_ROOT / "old-permic-ocr-workspace"
BACKUP_STATE_ROOT = BACKUP_PAYLOAD_ROOT / "training_state"
BACKUP_MANIFEST_PATH = BACKUP_ROOT / "latest_backup.json"
BACKUP_LOCK_PATH = BACKUP_ROOT / ".backup-in-progress"

def rsync_tree(source, destination):
    source, destination = Path(source), Path(destination)
    assert source.is_dir(), f"لا يوجد مصدر للنسخ: {source}"
    destination.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        "rsync", "-a", "--partial", "--human-readable", "--info=progress2",
        "--exclude=*.part", "--exclude=*.tmp", "--exclude=__pycache__",
        f"{source}/", f"{destination}/",
    ], check=True)

def tree_summary(root):
    root = Path(root)
    file_count, total_bytes = 0, 0
    for path in root.rglob("*"):
        if path.is_file():
            file_count += 1
            total_bytes += path.stat().st_size
    return {"relative_root": root.name, "file_count": file_count, "bytes": total_bytes}

def optional_fingerprint(path):
    path = Path(path)
    if not path.is_file():
        return None
    return {"sha256": sha256_file(path), "bytes": path.stat().st_size}

if RUN_WORKSPACE_BACKUP:
    BACKUP_ROOT.mkdir(parents=True, exist_ok=True)
    if BACKUP_LOCK_PATH.exists():
        raise RuntimeError(f"يوجد نسخ احتياطي جارٍ أو متوقف: {BACKUP_LOCK_PATH}")
    BACKUP_LOCK_PATH.write_text(datetime.now(timezone.utc).isoformat(), encoding="utf-8")
    try:
        rsync_tree(WORKSPACE, BACKUP_WORKSPACE_ROOT)
        rsync_tree(DRIVE_STATE_ROOT, BACKUP_STATE_ROOT)
        backup_manifest = {
            "schema_version": 1,
            "status": "complete",
            "created_at_utc": datetime.now(timezone.utc).isoformat(),
            "source_commit": SOURCE_COMMIT,
            "stage": STAGE,
            "payload": {
                "workspace": "payload/old-permic-ocr-workspace",
                "training_state": "payload/training_state",
            },
            "workspace": tree_summary(BACKUP_WORKSPACE_ROOT),
            "training_state": tree_summary(BACKUP_STATE_ROOT),
            "critical_files": {
                "dataset_manifest": optional_fingerprint(DATASET_ROOT / "manifest.json"),
                "dataset_contract": optional_fingerprint(CONTRACT_PATH),
                "last_pt": optional_fingerprint(DRIVE_LAST_PT),
                "resume_state": optional_fingerprint(DRIVE_STATE_JSON),
            },
        }
        atomic_json(BACKUP_MANIFEST_PATH, backup_manifest)
        print(json.dumps(backup_manifest, ensure_ascii=False, indent=2))
        print("اكتملت المرآة. يمكن إعادة تشغيل الخلية لاحقًا؛ rsync يعيد استعمال الملفات المكتملة.")
    finally:
        BACKUP_LOCK_PATH.unlink(missing_ok=True)
else:
    print("النسخ الاحتياطي مغلق. غيّر RUN_WORKSPACE_BACKUP إلى True عند الحاجة.")
`, "backup-workspace-to-drive"),

  code("restore-workspace-from-drive", `
# 9b) استرجاع workspace على حساب/جهاز آخر قبل التوليد والتدريب.
# غيّر RESTORE_SOURCE_ROOT إذا نزّلت workspace_backup إلى مسار مؤقت من Drive مشترك.
RESTORE_WORKSPACE_FROM_BACKUP = False
RESTORE_SOURCE_ROOT = DRIVE_ROOT / "workspace_backup"
ALLOW_WORKSPACE_REPLACE = False

if RESTORE_WORKSPACE_FROM_BACKUP:
    restore_root = Path(RESTORE_SOURCE_ROOT)
    restore_manifest_path = restore_root / "latest_backup.json"
    assert restore_manifest_path.is_file(), f"لا يوجد manifest للاسترجاع: {restore_manifest_path}"
    restore_manifest = json.loads(restore_manifest_path.read_text(encoding="utf-8"))
    assert restore_manifest.get("status") == "complete", "لا يجوز استرجاع نسخة غير مكتملة."
    payload = restore_manifest["payload"]
    backup_workspace = restore_root / payload["workspace"]
    backup_state = restore_root / payload["training_state"]
    assert backup_workspace.is_dir() and backup_state.is_dir(), "محتوى النسخة الاحتياطية ناقص."

    if WORKSPACE.exists() and any(WORKSPACE.iterdir()):
        assert ALLOW_WORKSPACE_REPLACE, "Workspace الحالي غير فارغ. راجعه ثم غيّر ALLOW_WORKSPACE_REPLACE إلى True للاستبدال."
        shutil.rmtree(WORKSPACE)
    WORKSPACE.mkdir(parents=True, exist_ok=True)
    rsync_tree(backup_workspace, WORKSPACE)
    if backup_state.resolve() != DRIVE_STATE_ROOT.resolve():
        rsync_tree(backup_state, DRIVE_STATE_ROOT)

    backup_commit = restore_manifest.get("source_commit")
    if backup_commit and backup_commit != SOURCE_COMMIT:
        subprocess.run(["git", "-C", str(PROJECT_ROOT), "fetch", "--depth", "1", "origin", backup_commit], check=True)
        subprocess.run(["git", "-C", str(PROJECT_ROOT), "checkout", "--detach", backup_commit], check=True)
        SOURCE_COMMIT = subprocess.check_output(["git", "-C", str(PROJECT_ROOT), "rev-parse", "HEAD"], text=True).strip()
    restored_manifest = WORKSPACE / "synthetic" / restore_manifest["stage"] / "manifest.json"
    expected = restore_manifest.get("critical_files", {}).get("dataset_manifest")
    assert restored_manifest.is_file(), f"لم يستعد manifest البيانات: {restored_manifest}"
    if expected:
        assert sha256_file(restored_manifest) == expected["sha256"], "بصمة manifest المستعاد لا تطابق النسخة الاحتياطية."
    print(json.dumps({"restored_stage": restore_manifest["stage"], "source_commit": SOURCE_COMMIT, "workspace": str(WORKSPACE)}, ensure_ascii=False, indent=2))
else:
    print("الاسترجاع مغلق. على حساب جديد اضبط RESTORE_WORKSPACE_FROM_BACKUP=True قبل التوليد.")
`, "restore-workspace-from-drive"),

  code("restore-public-drive-folder", `
# 9c) تنزيل نسخة workspace_cache من رابط Drive عام مباشرةً إلى Colab ثم استعادتها.
# الصق رابط المجلد الأعلى الذي يحتوي workspace_cache، لا رابط ملف فردي.
DOWNLOAD_PUBLIC_DRIVE_BACKUP = False
PUBLIC_DRIVE_FOLDER_URL = ""
PUBLIC_BACKUP_CHILD_NAME = "workspace_cache"
PUBLIC_DOWNLOAD_ROOT = Path("/content/old-permic-public-transfer")
ALLOW_PUBLIC_WORKSPACE_REPLACE = False

if DOWNLOAD_PUBLIC_DRIVE_BACKUP:
    import io
    import re
    from google.colab import auth
    import google.auth
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseDownload

    folder_match = re.search(r"/folders/([A-Za-z0-9_-]+)", PUBLIC_DRIVE_FOLDER_URL)
    assert folder_match, "الصق رابط مجلد Google Drive عامًا بصيغة drive.google.com/drive/folders/..."
    public_root_id = folder_match.group(1)
    auth.authenticate_user()
    credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/drive.readonly"])
    public_drive = build("drive", "v3", credentials=credentials, cache_discovery=False)
    folder_mime = "application/vnd.google-apps.folder"

    def public_children(parent_id):
        children, page_token = [], None
        while True:
            response = public_drive.files().list(
                q=f"'{parent_id}' in parents and trashed = false",
                spaces="drive",
                fields="nextPageToken,files(id,name,mimeType,size)",
                pageToken=page_token,
                pageSize=1000,
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
            ).execute()
            children.extend(response.get("files", []))
            page_token = response.get("nextPageToken")
            if not page_token:
                return children

    root_children = public_children(public_root_id)
    matching = [item for item in root_children if item["name"] == PUBLIC_BACKUP_CHILD_NAME and item["mimeType"] == folder_mime]
    assert len(matching) == 1, f"لم يعثر على مجلد {PUBLIC_BACKUP_CHILD_NAME} مرة واحدة داخل الرابط العام."
    remote_backup = matching[0]
    local_backup = PUBLIC_DOWNLOAD_ROOT / PUBLIC_BACKUP_CHILD_NAME

    def download_public_tree(remote_folder_id, local_folder):
        local_folder.mkdir(parents=True, exist_ok=True)
        for item in public_children(remote_folder_id):
            local_path = local_folder / item["name"]
            if item["mimeType"] == folder_mime:
                download_public_tree(item["id"], local_path)
                continue
            expected_size = int(item.get("size") or 0)
            if local_path.is_file() and local_path.stat().st_size == expected_size:
                continue
            partial_path = local_path.with_name(local_path.name + ".part")
            local_path.parent.mkdir(parents=True, exist_ok=True)
            request = public_drive.files().get_media(fileId=item["id"], supportsAllDrives=True)
            with partial_path.open("wb") as stream:
                downloader = MediaIoBaseDownload(stream, request, chunksize=8 * 1024 * 1024)
                completed = False
                while not completed:
                    status, completed = downloader.next_chunk()
                    if status:
                        print(f"{local_path.relative_to(PUBLIC_DOWNLOAD_ROOT)}: {int(status.progress() * 100)}%")
            assert partial_path.stat().st_size == expected_size, f"حجم غير صحيح بعد تنزيل {local_path.name}"
            os.replace(partial_path, local_path)

    def restore_public_tree(source, destination):
        source, destination = Path(source), Path(destination)
        assert source.is_dir(), f"لا يوجد مصدر للاسترجاع: {source}"
        destination.mkdir(parents=True, exist_ok=True)
        subprocess.run([
            "rsync", "-a", "--partial", "--human-readable", "--info=progress2",
            "--exclude=*.part", "--exclude=*.tmp", "--exclude=__pycache__",
            f"{source}/", f"{destination}/",
        ], check=True)

    download_public_tree(remote_backup["id"], local_backup)
    public_workspace = local_backup / "workspace"
    public_state = local_backup / "training_state"
    assert public_workspace.is_dir() and public_state.is_dir(), "النسخة العامة لا تضم workspace وtraining_state المطلوبين."
    resume_candidates = sorted(public_state.glob("*/resume_state.json"), key=lambda path: path.stat().st_mtime, reverse=True)
    assert resume_candidates, "لم يعثر على resume_state.json في النسخة العامة."
    downloaded_resume = json.loads(resume_candidates[0].read_text(encoding="utf-8"))
    downloaded_last_pt = resume_candidates[0].with_name("last.pt")
    assert downloaded_last_pt.is_file(), "لم يعثر على last.pt بجوار resume_state.json."
    assert downloaded_resume.get("last_pt_sha256") == sha256_file(downloaded_last_pt), "بصمة last.pt العامة غير مطابقة لـresume_state.json."
    downloaded_stage = downloaded_resume["stage"]
    downloaded_manifest = public_workspace / "synthetic" / downloaded_stage / "manifest.json"
    assert downloaded_manifest.is_file(), "لم يعثر على manifest مرحلة البيانات في النسخة العامة."
    assert downloaded_resume.get("manifest_sha256") == sha256_file(downloaded_manifest), "بصمة manifest العامة غير مطابقة لحالة الاستئناف."

    if WORKSPACE.exists() and any(WORKSPACE.iterdir()):
        assert ALLOW_PUBLIC_WORKSPACE_REPLACE, "Workspace الحالي غير فارغ. راجعه ثم غيّر ALLOW_PUBLIC_WORKSPACE_REPLACE إلى True للاستبدال."
        shutil.rmtree(WORKSPACE)
    WORKSPACE.mkdir(parents=True, exist_ok=True)
    restore_public_tree(public_workspace, WORKSPACE)
    restore_public_tree(public_state, DRIVE_STATE_ROOT)

    public_commit = downloaded_resume.get("source_commit")
    if public_commit and public_commit != SOURCE_COMMIT:
        subprocess.run(["git", "-C", str(PROJECT_ROOT), "fetch", "--depth", "1", "origin", public_commit], check=True)
        subprocess.run(["git", "-C", str(PROJECT_ROOT), "checkout", "--detach", public_commit], check=True)
        SOURCE_COMMIT = subprocess.check_output(["git", "-C", str(PROJECT_ROOT), "rev-parse", "HEAD"], text=True).strip()
    print(json.dumps({
        "public_folder_id": public_root_id,
        "restored_stage": downloaded_stage,
        "experiment_name": downloaded_resume.get("experiment_name"),
        "source_commit": SOURCE_COMMIT,
        "download_root": str(PUBLIC_DOWNLOAD_ROOT),
    }, ensure_ascii=False, indent=2))
else:
    print("تنزيل الرابط العام مغلق. الصق الرابط ثم غيّر DOWNLOAD_PUBLIC_DRIVE_BACKUP إلى True عند الانتقال إلى حساب آخر.")
`, "restore-public-drive-folder"),

  code("training-run", `
# 10) التدريب أو الاستئناف. تحفَظ آخر حالة إلى GitHub بعد كل epoch.
from ultralytics import YOLO

RESTORE_LATEST_GITHUB_CHECKPOINT = True
bootstrap_dataset_snapshot()
restored_checkpoint = RESTORE_LATEST_GITHUB_CHECKPOINT and restore_latest_checkpoint_from_github()
initialization_weight = None if restored_checkpoint else prepare_initialization_weight()
TRAINING_ALREADY_COMPLETE = False

if restored_checkpoint:
    assert_resume_is_compatible()
    restored_state = json.loads(LOCAL_STATE_JSON.read_text(encoding="utf-8"))
    restored_epoch = int(restored_state["saved_after_epoch"])
    TRAINING_ALREADY_COMPLETE = restored_epoch >= EPOCHS
    if TRAINING_ALREADY_COMPLETE:
        print(
            f"checkpoint عند epoch {restored_epoch}/{EPOCHS} مكتمل؛ "
            "لن يُستدعى resume=True. انتقل الآن إلى خلية test-evaluation ثم build-release."
        )

def is_cuda_oom(error):
    message = str(error).lower()
    return "out of memory" in message or "cuda error: out of memory" in message

if TRAINING_ALREADY_COMPLETE:
    model = YOLO(str(LOCAL_LAST_PT))
    results = None
    RUN_DIR = STATE_DIR
    # لا يضمن snapshot بعد كل epoch وجود best.pt؛ last.pt النهائي هو الوزن الموثق للتقييم فقط.
    BEST_PT = LOCAL_LAST_PT
else:
    last_oom = None
    for EFFECTIVE_BATCH_SIZE in BATCH_CANDIDATES:
        try:
            print(f"بدء التدريب مع batch={EFFECTIVE_BATCH_SIZE}؛ candidates={BATCH_CANDIDATES}")
            model = YOLO(str(LOCAL_LAST_PT)) if restored_checkpoint else YOLO(str(initialization_weight) if initialization_weight else MODEL_YAML)
            add_training_callbacks(model)
            if restored_checkpoint:
                results = model.train(
                    resume=True, batch=EFFECTIVE_BATCH_SIZE, workers=WORKERS,
                    amp=AMP, cache=DATASET_CACHE,
                )
            else:
                results = model.train(
                    data=str(DATA_YAML), epochs=EPOCHS, imgsz=IMAGE_SIZE, batch=EFFECTIVE_BATCH_SIZE, device=DEVICE,
                    workers=WORKERS, amp=AMP, cache=DATASET_CACHE, project=str(RUNS_ROOT), name=EXPERIMENT_NAME,
                    exist_ok=True, pretrained=bool(initialization_weight), seed=SEED, deterministic=True, plots=True, save=True, save_period=1,
                )
            break
        except RuntimeError as error:
            if not is_cuda_oom(error) or EFFECTIVE_BATCH_SIZE == BATCH_CANDIDATES[-1]:
                raise
            last_oom = error
            torch.cuda.empty_cache()
            print(f"نفدت الذاكرة مع batch={EFFECTIVE_BATCH_SIZE}؛ إعادة المحاولة آليًا بحجم أصغر.")
    else:
        raise RuntimeError(f"فشلت كل أحجام batch: {BATCH_CANDIDATES}") from last_oom

    RUN_DIR = Path(model.trainer.save_dir) if getattr(model, "trainer", None) else RUN_DIR
    BEST_PT = RUN_DIR / "weights" / "best.pt"
assert BEST_PT.is_file(), f"لم يعثر على best.pt في {BEST_PT}"
atomic_copy(BEST_PT, STATE_DIR / "best.pt")
print("اكتمل التدريب أو الاستئناف، أو جرى تجهيز الوزن النهائي للتقييم:", BEST_PT)
`, "training-run"),

  code("test-evaluation", `
# 11) تقييم test مستقل وبناء قياسات قابلة للنشر. لا تتجاوز هذه الخلية عند إصدار النتائج.
evaluation_model = YOLO(str(BEST_PT))
metrics = evaluation_model.val(data=str(DATA_YAML), split="test", imgsz=IMAGE_SIZE, batch=EVAL_BATCH_SIZE, device=DEVICE, plots=True)

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

النشر **مغلق افتراضيًا**. أما فرع "colab-checkpoints" فيُحدَّث تلقائيًا أثناء التدريب بآخر "last.pt" وبيانات الاستئناف فقط. عند تفعيل هذه الخلية، تنشر وصف إصدار مكتمل ومراجع: القياسات، العقد، خريطة الفئات، عددًا محدودًا من صور المعاينة، ووزنًا فقط إذا كان أصغر من الحد المحدد. لا تنشر dataset أو token. تحاول الخلية أولًا الدفع بجلسة GitHub المصرح بها في Colab. إن تطلبت shell مصادقة منفصلة، فعّل بديل Colab Secret باسم "GITHUB_WRITE_TOKEN" بصلاحية **Contents: Write** للمستودع نفسه فقط.
`, "publishing-gate"),

  code("publish-release", `
# 13) نشر إصدار مكتمل ومحدود إلى GitHub. اتركه False حتى تراجع النتائج.
PUBLISH_RELEASE = False
PUBLISH_BRANCH = "colab-results"
MAX_GITHUB_WEIGHT_BYTES = 90 * 1024 * 1024
# عند فشل جلسة Colab الكتابية، جرّب Secret اختياريًا ولا تخزنه في remote أو ملف.
USE_COLAB_SECRET_FALLBACK = True

if PUBLISH_RELEASE:
    import shutil
    repo_publish_dir = PROJECT_ROOT / "artifacts" / "published" / release_id
    # تتيح إعادة محاولة خلية النشر في الجلسة ذاتها بعد فشل دفع سابق؛ لا تلمس أي checkpoint.
    if repo_publish_dir.exists():
        shutil.rmtree(repo_publish_dir)
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
    fallback_error = None
    if push.returncode != 0 and USE_COLAB_SECRET_FALLBACK:
        try:
            from base64 import b64encode
            from google.colab import userdata
            github_write_token = userdata.get("GITHUB_WRITE_TOKEN")
            assert github_write_token, "لم يعثر Colab على Secret باسم GITHUB_WRITE_TOKEN."
            write_authorization = b64encode(f"x-access-token:{github_write_token}".encode("utf-8")).decode("ascii")
            push = subprocess.run([
                "git", "-C", str(PROJECT_ROOT), "-c", f"http.extraHeader=AUTHORIZATION: basic {write_authorization}",
                "push", "origin", f"HEAD:{PUBLISH_BRANCH}"
            ], text=True, capture_output=True)
        except Exception as error:
            fallback_error = f"{type(error).__name__}: {error}"
        finally:
            if "github_write_token" in locals(): del github_write_token
            if "write_authorization" in locals(): del write_authorization
    if push.returncode != 0:
        git_detail = "\n".join(part for part in (push.stderr.strip(), push.stdout.strip()) if part).strip()[-2000:] or "لم يعرض Git تفاصيل إضافية."
        fallback_detail = f"\nتفاصيل Secret البديل: {fallback_error}" if fallback_error else ""
        raise RuntimeError(
            "فشل دفع الإصدار إلى GitHub؛ لم يُنشر release.json ولم يمس ذلك checkpoint التدريب. "
            "تحقق من أن GITHUB_WRITE_TOKEN موجود في Colab ومفعّل له Notebook access، وأنه fine-grained للمستودع "
            "Emran025/old-permic-ocr-lab بصلاحية Contents: Write. لا تضع token داخل الدفتر."
            f"\nتفاصيل Git: {git_detail}{fallback_detail}"
        )
    print("نُشر الإصدار إلى فرع GitHub:", PUBLISH_BRANCH)
else:
    print("النشر مغلق. راجع metrics.json وrelease.json ثم غيّر PUBLISH_RELEASE إلى True فقط عند القبول.")
`, "publish-release"),

  markdown("real-manuscript-finetune", `
## تكييف البيانات الحقيقية المراجعة

تُنشأ حزمة البيانات من تبويب **الوسم** في الموقع، ثم تُنزّل بصيغة ZIP وتُرفع يدويًا إلى جلسة Colab. لا ينقل هذا الدفتر صور المخطوطات إلى GitHub؛ يحتفظ GitHub فقط بوزن الاستئناف والعقد والمقاييس إذا شُغّل التكييف.

> لا تُفعّل خلايا هذا القسم لمجرد وجود صور. لا بد من أن تجتاز الحزمة المدقق، وتحتوي تقسيمات train/val/test مستقلة، وتملك خريطة فئات مطابقة، وأن يراجع الباحث حقوق كل صورة وقراءة كل صندوق. التكييف ينطلق من **وزن صناعي محفوظ ومحدد** ولا يثبت تلقائيًا OCR للمخطوطات التاريخية.
`, "real-manuscript-finetune"),

  code("real-data-preflight", `
# 15) استيراد ZIP صادر من الموقع والتحقق منه قبل أي تكييف. اترك التشغيل مغلقًا حتى ترفع الحزمة إلى Colab.
import zipfile

PREPARE_REAL_MANUSCRIPT_DATA = False
REAL_DATA_ARCHIVE = Path("/content/old_permic_real_labeled_v1.zip")
REAL_EXTRACT_ROOT = WORKSPACE / "real_labeled_import"
REAL_VALIDATOR_PATH = PROJECT_ROOT / "scripts" / "validate_real_labeled_dataset.py"
MIN_REAL_IMAGES_PER_SPLIT = 1
MIN_REAL_BOXES = 10
MIN_REAL_SOURCE_PAGES = 3

if PREPARE_REAL_MANUSCRIPT_DATA:
    assert REAL_DATA_ARCHIVE.is_file(), (
        "ارفع ZIP الذي صدرته من تبويب الوسم إلى /content ثم اضبط REAL_DATA_ARCHIVE. "
        "لا تستخدم صورًا أو labels غير مراجعة."
    )
    if REAL_EXTRACT_ROOT.exists():
        shutil.rmtree(REAL_EXTRACT_ROOT)
    REAL_EXTRACT_ROOT.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(REAL_DATA_ARCHIVE) as archive:
        archive.extractall(REAL_EXTRACT_ROOT)
    candidate_roots = [path.parent for path in REAL_EXTRACT_ROOT.rglob("class_map.json")]
    assert len(candidate_roots) == 1, "يجب أن يحتوي ZIP على جذر حزمة بيانات واحدة فقط."
    REAL_DATA_ROOT = candidate_roots[0]
    subprocess.run([sys.executable, str(REAL_VALIDATOR_PATH), str(REAL_DATA_ROOT)], check=True)

    REAL_CLASS_MAP_PATH = REAL_DATA_ROOT / "class_map.json"
    REAL_MANIFEST_PATH = REAL_DATA_ROOT / "manifest_real.json"
    real_class_map = json.loads(REAL_CLASS_MAP_PATH.read_text(encoding="utf-8"))
    REAL_CLASS_NAMES = [item["label"] for item in real_class_map["classes"]]
    assert REAL_CLASS_NAMES == CLASS_NAMES, (
        "خريطة فئات الحزمة الحقيقية لا تطابق ترتيب Unicode الصناعي. "
        "لا يجوز بدء تكييف بترتيب فئات مختلف."
    )
    REAL_SPLIT_SUMMARY, real_box_count, source_pages = {}, 0, set()
    for split in ("train", "val", "test"):
        image_paths = sorted((REAL_DATA_ROOT / "images" / split).glob("*"))
        image_paths = [path for path in image_paths if path.suffix.lower() in (".png", ".jpg", ".jpeg", ".tif", ".tiff")]
        assert len(image_paths) >= MIN_REAL_IMAGES_PER_SPLIT, f"لا توجد صور كافية في {split}."
        for image_path in image_paths:
            label_path = REAL_DATA_ROOT / "labels" / split / f"{image_path.stem}.txt"
            real_box_count += len([row for row in label_path.read_text(encoding="utf-8").splitlines() if row.strip()])
    import csv
    with (REAL_DATA_ROOT / "sources.csv").open("r", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            source_pages.add((row["repository_id"], row["folio_or_page"]))
    assert real_box_count >= MIN_REAL_BOXES, f"عدد صناديق المحارف الحقيقية أقل من الحد الموثق ({MIN_REAL_BOXES})."
    assert len(source_pages) >= MIN_REAL_SOURCE_PAGES, f"يجب أن تمثل الحزمة {MIN_REAL_SOURCE_PAGES} صفحات/مصادر مستقلة على الأقل."

    REAL_DATA_YAML = REAL_DATA_ROOT / "data.yaml"
    REAL_DATA_YAML.write_text(yaml.safe_dump({
        "path": str(REAL_DATA_ROOT), "train": "images/train", "val": "images/val", "test": "images/test",
        "nc": len(REAL_CLASS_NAMES), "names": REAL_CLASS_NAMES,
    }, allow_unicode=True, sort_keys=False), encoding="utf-8")
    REAL_DATA_CONTRACT = {
        "contract_version": 1,
        "kind": "old-permic-reviewed-real-character-detection",
        "source_commit": SOURCE_COMMIT,
        "class_map_sha256": sha256_file(REAL_CLASS_MAP_PATH),
        "manifest_real_sha256": sha256_file(REAL_MANIFEST_PATH),
        "class_count": len(REAL_CLASS_NAMES),
        "source_page_count": len(source_pages),
        "box_count": real_box_count,
        "real_manuscripts_included": True,
    }
    REAL_CONTRACT_PATH = REAL_DATA_ROOT / "data_contract_real.json"
    atomic_json(REAL_CONTRACT_PATH, REAL_DATA_CONTRACT)
    print(json.dumps({"dataset_root": str(REAL_DATA_ROOT), **REAL_DATA_CONTRACT}, ensure_ascii=False, indent=2))
else:
    print("استيراد البيانات الحقيقية مغلق. نزّل ZIP من الموقع ثم غيّر PREPARE_REAL_MANUSCRIPT_DATA إلى True.")
`, "real-data-preflight"),

  code("real-manuscript-finetune-run", `
# 16) تكييف اختياري من آخر وزن صناعي محفوظ. لا ينشر هذا القسم أي ادعاء أو وزن للموقع.
RUN_REAL_MANUSCRIPT_FINETUNE = False
SYNTHETIC_BASE_EXPERIMENT = "old_permic_s0_baseline_v2_batch8"
REAL_FINETUNE_EPOCHS = 40
REAL_FINETUNE_BATCH_CANDIDATES = (8, 6, 4, 2)
REAL_FINETUNE_IMAGE_SIZE = 960
REAL_FINETUNE_NAME = f"old_permic_real_finetune_from_{SYNTHETIC_BASE_EXPERIMENT}"
REAL_STATE_DIR = WORKSPACE / "training_state" / REAL_FINETUNE_NAME
REAL_RUNS_ROOT = WORKSPACE / "runs_real"
REAL_CHECKPOINT_DIR = CHECKPOINT_ROOT / REAL_FINETUNE_NAME
REAL_LOCAL_LAST_PT = REAL_STATE_DIR / "last.pt"
REAL_LOCAL_CONTRACT = REAL_STATE_DIR / "data_contract_real.json"
REAL_LOCAL_STATE = REAL_STATE_DIR / "resume_state.json"
REAL_STATE_DIR.mkdir(parents=True, exist_ok=True)

def restore_real_checkpoint():
    remote_state = REAL_CHECKPOINT_DIR / "resume_state.json"
    remote_last = REAL_CHECKPOINT_DIR / "last.pt"
    remote_contract = REAL_CHECKPOINT_DIR / "data_contract_real.json"
    if not (remote_state.is_file() and remote_last.is_file() and remote_contract.is_file()):
        return False
    saved = json.loads(remote_state.read_text(encoding="utf-8"))
    remote_data_contract = json.loads(remote_contract.read_text(encoding="utf-8"))
    for key in ("class_map_sha256", "manifest_real_sha256"):
        assert remote_data_contract.get(key) == REAL_DATA_CONTRACT[key], f"لا يستأنف التكييف: اختلاف {key}."
    assert saved.get("last_pt_sha256") == sha256_file(remote_last), "بصمة last.pt الحقيقي غير مطابقة."
    atomic_copy(remote_last, REAL_LOCAL_LAST_PT)
    atomic_copy(remote_contract, REAL_LOCAL_CONTRACT)
    atomic_json(REAL_LOCAL_STATE, saved)
    print(f"استُعيد checkpoint تكييف البيانات الحقيقية بعد epoch {saved['saved_after_epoch']}.")
    return True

def sync_real_checkpoint(trainer):
    local_last = Path(trainer.last)
    assert local_last.is_file(), "لم ينشئ YOLO last.pt لتكييف البيانات الحقيقية."
    atomic_copy(local_last, REAL_LOCAL_LAST_PT)
    atomic_copy(REAL_CONTRACT_PATH, REAL_LOCAL_CONTRACT)
    state = {
        "schema_version": 1,
        "experiment_name": REAL_FINETUNE_NAME,
        "base_synthetic_experiment": SYNTHETIC_BASE_EXPERIMENT,
        "class_map_sha256": REAL_DATA_CONTRACT["class_map_sha256"],
        "manifest_real_sha256": REAL_DATA_CONTRACT["manifest_real_sha256"],
        "last_pt_sha256": sha256_file(REAL_LOCAL_LAST_PT),
        "saved_after_epoch": int(trainer.epoch) + 1,
        "saved_at_utc": datetime.now(timezone.utc).isoformat(),
    }
    atomic_json(REAL_LOCAL_STATE, state)
    atomic_copy(REAL_LOCAL_LAST_PT, REAL_CHECKPOINT_DIR / "last.pt")
    atomic_copy(REAL_LOCAL_CONTRACT, REAL_CHECKPOINT_DIR / "data_contract_real.json")
    atomic_json(REAL_CHECKPOINT_DIR / "resume_state.json", state)
    atomic_json(CHECKPOINT_ROOT / "real_latest.json", {
        "schema_version": 1, "experiment_name": REAL_FINETUNE_NAME,
        "checkpoint_path": str(REAL_CHECKPOINT_DIR.relative_to(CHECKPOINT_REPO)),
        "saved_after_epoch": state["saved_after_epoch"], "last_pt_sha256": state["last_pt_sha256"],
    })
    commit_and_push_checkpoint_tree(f"real checkpoint: {REAL_FINETUNE_NAME} epoch {state['saved_after_epoch']}")

if RUN_REAL_MANUSCRIPT_FINETUNE:
    assert PREPARE_REAL_MANUSCRIPT_DATA, "شغّل خلية استيراد وتحقق البيانات الحقيقية أولًا."
    assert REAL_DATA_YAML.is_file() and REAL_CONTRACT_PATH.is_file()
    ensure_checkpoint_repo()
    restored_real = restore_real_checkpoint()
    if not restored_real:
        SYNTHETIC_BASE_LAST_PT = CHECKPOINT_ROOT / SYNTHETIC_BASE_EXPERIMENT / "last.pt"
        assert SYNTHETIC_BASE_LAST_PT.is_file(), (
            "لا يوجد الوزن الصناعي المحدد في GitHub checkpoint. غيّر SYNTHETIC_BASE_EXPERIMENT إلى تجربة مكتملة "
            "ولا تستبدله بوزن غير موثق."
        )
        model = YOLO(str(SYNTHETIC_BASE_LAST_PT))
    else:
        model = YOLO(str(REAL_LOCAL_LAST_PT))
    model.add_callback("on_model_save", sync_real_checkpoint)
    last_oom = None
    for batch_size in REAL_FINETUNE_BATCH_CANDIDATES:
        try:
            if restored_real:
                results = model.train(resume=True, batch=batch_size, workers=WORKERS, amp=AMP, cache=False)
            else:
                results = model.train(
                    data=str(REAL_DATA_YAML), epochs=REAL_FINETUNE_EPOCHS, imgsz=REAL_FINETUNE_IMAGE_SIZE,
                    batch=batch_size, device=DEVICE, workers=WORKERS, amp=AMP, cache=False,
                    project=str(REAL_RUNS_ROOT), name=REAL_FINETUNE_NAME, exist_ok=True,
                    pretrained=True, seed=SEED, deterministic=True, plots=True, save=True, save_period=1,
                )
            break
        except RuntimeError as error:
            if not is_cuda_oom(error) or batch_size == REAL_FINETUNE_BATCH_CANDIDATES[-1]:
                raise
            last_oom = error
            torch.cuda.empty_cache()
            print(f"نفدت الذاكرة مع batch={batch_size}؛ تجربة حجم أصغر.")
    else:
        raise RuntimeError("فشلت جميع أحجام batch لتكييف البيانات الحقيقية.") from last_oom
    REAL_RUN_DIR = Path(model.trainer.save_dir)
    REAL_BEST_PT = REAL_RUN_DIR / "weights" / "best.pt"
    assert REAL_BEST_PT.is_file(), "لم يعثر على best.pt لتكييف البيانات الحقيقية."
    print("اكتمل تكييف مرشح للتقييم؛ لا تنشر أو تربط الموقع قبل تقييم test مستقل:", REAL_BEST_PT)
else:
    print("تكييف البيانات الحقيقية مغلق. راجع الحزمة والحقوق، ثم غيّر RUN_REAL_MANUSCRIPT_FINETUNE إلى True.")
`, "real-manuscript-finetune-run"),

  code("real-manuscript-test-evaluation", `
# 17) تقييم test مستقل لتجربة حقيقية؛ منفصل عن إصدار الموقع ومغلق افتراضيًا.
RUN_REAL_MANUSCRIPT_EVALUATION = False
if RUN_REAL_MANUSCRIPT_EVALUATION:
    assert RUN_REAL_MANUSCRIPT_FINETUNE, "شغّل تكييف البيانات الحقيقية أولًا في الجلسة نفسها أو أضف مسار استعادة مكتملًا."
    real_evaluation_model = YOLO(str(REAL_BEST_PT))
    real_metrics = real_evaluation_model.val(
        data=str(REAL_DATA_YAML), split="test", imgsz=REAL_FINETUNE_IMAGE_SIZE,
        batch=min(REAL_FINETUNE_BATCH_CANDIDATES), device=DEVICE, plots=True,
    )
    REAL_METRICS = {
        "schema_version": 1, "experiment_name": REAL_FINETUNE_NAME,
        "evaluated_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset_contract": REAL_DATA_CONTRACT,
        "weights": {"best_pt_sha256": sha256_file(REAL_BEST_PT)},
        "test_metrics": {"map50_95": float(real_metrics.box.map), "map50": float(real_metrics.box.map50), "precision": float(real_metrics.box.mp), "recall": float(real_metrics.box.mr)},
        "interpretation": "reviewed real-manuscript fine-tuning experiment; requires scholarly review before any OCR claim or web release.",
    }
    atomic_json(REAL_RUN_DIR / "real_metrics.json", REAL_METRICS)
    print(json.dumps(REAL_METRICS, ensure_ascii=False, indent=2))
else:
    print("تقييم البيانات الحقيقية مغلق. لا توجد مقاييس أو إصدار حقيقي مُدّعى به.")
`, "real-manuscript-test-evaluation"),

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

const removedDriveCells = new Set([
  "backup-workspace-to-drive",
  "restore-workspace-from-drive",
  "restore-public-drive-folder",
]);
const notebook = {
  cells: cells.filter((cell) => !removedDriveCells.has(cell.id)),
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

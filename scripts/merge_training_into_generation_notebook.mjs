import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const targetPath = resolve(projectRoot, "training/notebooks/old_permic_synthetic_generation.ipynb");
const notebook = JSON.parse(readFileSync(targetPath, "utf8"));

const markdown = (id, source) => ({ cell_type: "markdown", id, metadata: { oldPermicRole: id }, source: source.map((line) => `${line}\n`) });
const code = (id, source) => ({ cell_type: "code", id, execution_count: null, metadata: { oldPermicRole: id }, outputs: [], source: source.map((line) => `${line}\n`) });

notebook.cells.forEach((cell, index) => {
  if (!cell.id) cell.id = `opcell${String(index + 1).padStart(2, "0")}`;
});

if (!notebook.cells.some((cell) => cell.metadata?.oldPermicRole === "training-gate")) {
  notebook.cells.push(
    markdown("training-gate", [
      "## بوابة التدريب: تضاف بعد قبول حزمة التوليد",
      "هذه الخلايا جزء من الدفتر نفسه. لا تبدأها قبل فحص S0/S0-d1 أو المرحلة التي قبلتها، ولا تربط أي وزن بواجهة الويب قبل قياس test مستقل وخريطة فئات مطابقة.",
    ]),
    code("training-environment", [
      "# 7) ثبّت بيئة التدريب عند العمل في Colab أو بيئة GPU نظيفة.",
      "# !pip install -q ultralytics pyyaml matplotlib",
      "from pathlib import Path",
      "import json, shutil, time",
      "import yaml",
      "from ultralytics import YOLO",
      "",
      "DATA_MODE = 'synthetic_unicode'  # لا تغيّر إلى real_labeled قبل توفر وسوم حقيقية معتمدة.",
      "YOLO_DATASET_ROOT = S0_OUTPUT if DATA_MODE == 'synthetic_unicode' else Path('/path/to/real_labeled_dataset')",
      "assert YOLO_DATASET_ROOT.is_dir(), f'حزمة البيانات غير موجودة: {YOLO_DATASET_ROOT}'",
      "RUNS_ROOT = PROJECT_ROOT / 'artifacts' / 'training_runs'",
      "RUNS_ROOT.mkdir(parents=True, exist_ok=True)",
    ]),
    code("training-validation", [
      "# 8) تحقق من خريطة الفئات والوسوم، ثم اكتب data.yaml من مصدر الحقيقة class_map.json.",
      "CLASS_MAP_PATH = YOLO_DATASET_ROOT / 'class_map.json'",
      "class_map = json.loads(CLASS_MAP_PATH.read_text(encoding='utf-8'))",
      "classes = class_map.get('classes', [])",
      "assert classes, 'خريطة الفئات لا تحتوي classes.'",
      "class_ids = [item['id'] for item in classes]",
      "assert class_ids == list(range(len(classes))), 'يجب أن تكون class ids متتابعة من 0.'",
      "CLASS_NAMES = [item['label'] for item in classes]",
      "for split in ('train', 'val', 'test'):",
      "    image_dir = YOLO_DATASET_ROOT / 'images' / split",
      "    label_dir = YOLO_DATASET_ROOT / 'labels' / split",
      "    assert image_dir.is_dir() and label_dir.is_dir(), f'تقسيم مفقود: {split}'",
      "    for label_path in label_dir.glob('*.txt'):",
      "        for line_number, row in enumerate(label_path.read_text(encoding='utf-8').splitlines(), start=1):",
      "            if not row.strip():",
      "                continue",
      "            class_id, *coords = row.split()",
      "            assert len(coords) == 4 and 0 <= int(class_id) < len(CLASS_NAMES), f'وسم غير صالح: {label_path}:{line_number}'",
      "            assert all(0 <= float(value) <= 1 for value in coords), f'إحداثيات غير مطبعة: {label_path}:{line_number}'",
      "DATA_YAML = YOLO_DATASET_ROOT / 'data.yaml'",
      "DATA_YAML.write_text(yaml.safe_dump({'path': str(YOLO_DATASET_ROOT), 'train': 'images/train', 'val': 'images/val', 'test': 'images/test', 'nc': len(CLASS_NAMES), 'names': CLASS_NAMES}, allow_unicode=True, sort_keys=False), encoding='utf-8')",
      "print('الفئات:', len(CLASS_NAMES), 'data:', DATA_YAML)",
    ]),
    code("training-config", [
      "# 9) إعداد تجربة واحدة قابلة للمقارنة. لا تغيّر أكثر من متغير مفترض في التجربة الواحدة.",
      "MODEL_YAML = 'yolov8n.yaml'",
      "EXPERIMENT_NAME = 'old_permic_s0_v1'",
      "EPOCHS = 100",
      "IMAGE_SIZE = 960",
      "BATCH_SIZE = 4",
      "WORKERS = 2",
      "DEVICE = 0",
      "INITIALIZATION = 'from_scratch'",
      "assert INITIALIZATION == 'from_scratch', 'لا تستخدم warm start قبل توثيق إعادة بناء رأس الكشف.'",
    ]),
    code("training-run", [
      "# 10) التدريب من الصفر. لا يعني نجاح الخلية أداءً على المخطوطات الحقيقية.",
      "model = YOLO(MODEL_YAML)",
      "results = model.train(data=str(DATA_YAML), epochs=EPOCHS, imgsz=IMAGE_SIZE, batch=BATCH_SIZE, device=DEVICE, workers=WORKERS, project=str(RUNS_ROOT), name=EXPERIMENT_NAME, pretrained=False, seed=20260818, deterministic=True, plots=True, save=True)",
      "RUN_DIR = RUNS_ROOT / EXPERIMENT_NAME",
      "BEST_PT = RUN_DIR / 'weights' / 'best.pt'",
      "assert BEST_PT.is_file(), f'لم يُعثر على best.pt: {BEST_PT}'",
    ]),
    code("training-evaluation", [
      "# 11) اختبار مستقل قبل أي ربط للواجهة.",
      "evaluation_model = YOLO(str(BEST_PT))",
      "metrics = evaluation_model.val(data=str(DATA_YAML), split='test', imgsz=IMAGE_SIZE, batch=BATCH_SIZE, device=DEVICE, plots=True)",
      "print('اكتمل تقييم test. راجع المقاييس والأخطاء قبل اعتماد الوزن.')",
      "print('لا تربط BEST_PT بواجهة الويب إلا مع class_map.json المطابق ونتيجة test محفوظة.')",
    ]),
  );
}

writeFileSync(targetPath, `${JSON.stringify(notebook, null, 1)}\n`, "utf8");
console.log(`Unified notebook written: ${targetPath}`);

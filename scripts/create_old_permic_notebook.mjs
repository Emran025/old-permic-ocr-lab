import fs from 'node:fs';
import path from 'node:path';

const outputPath = path.resolve('training/notebooks/old_permic_yolo_training.ipynb');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const markdown = (source) => ({ cell_type: 'markdown', metadata: {}, source: source.trim().split('\n').map((line) => `${line}\n`) });
const code = (source) => ({ cell_type: 'code', execution_count: null, metadata: {}, outputs: [], source: source.trim().split('\n').map((line) => `${line}\n`) });

const notebook = {
  cells: [
    markdown(`
# تدريب YOLO للبرمية القديمة

هذا الدفتر هو تكييف مباشر لمسار YOLO السابق: يثبت البيئة، يربط Google Drive، يفك أرشيف البيانات محليًا، يتحقق من الوسوم، ينشئ ملف البيانات، يدرب أو يستأنف، يقيّم، ثم يفتح واجهة اختبار. تغيرت هنا فقط الأشياء المقيدة باللغة: خريطة الفئات، مسارات المشروع، ملف البيانات، والواجهة.

> لا يحتوي الدفتر بيانات أو أوزانًا للبرمية القديمة. لا تشغل التدريب قبل إدخال صور حقيقية مرفقة بوسوم مراجَعة وخريطة فئات معتمدة.`),
    code(`
# 1) تثبيت المكتبات والتحقق من بيئة التدريب.
!pip install -q ultralytics gradio pyyaml

import sys
import torch
import ultralytics

print('Python:', sys.version.split()[0])
print('PyTorch:', torch.__version__)
print('Ultralytics:', ultralytics.__version__)
print('CUDA متاح:', torch.cuda.is_available())
if torch.cuda.is_available():
    print('GPU:', torch.cuda.get_device_name(0))

assert torch.cuda.is_available(), (
    'فعّل GPU من Runtime > Change runtime type > T4 GPU، ثم أعد تشغيل الخلية.'
)
`),
    markdown(`
## الخطوة 2: ربط البيانات

حمّل إلى Google Drive أرشيفًا واحدًا بالهيكل الموضح في README. تُفك الصور داخل بيئة Colab المحلية لتجنب القراءة المستمرة من Drive، بينما تبقى نقاط الاستئناف في Drive.`),
    code(`
from google.colab import drive
from pathlib import Path
import json, os, shutil, zipfile

drive.mount('/content/drive', force_remount=False)

DRIVE_PROJECT_ROOT = Path('/content/drive/MyDrive/OldPermic_YOLO_Project')
DRIVE_EXPORT_DIR = DRIVE_PROJECT_ROOT / 'dataset_exports'
DRIVE_TRAINING_STATE_DIR = DRIVE_PROJECT_ROOT / 'training_state'
DRIVE_TRAINING_STATE_DIR.mkdir(parents=True, exist_ok=True)

# اترك القيمة None عند وجود أرشيف واحد فقط في dataset_exports.
ARCHIVE_NAME = None
LOCAL_ROOT = Path('/content/old_permic_yolo')
LOCAL_ROOT.mkdir(parents=True, exist_ok=True)
YOLO_DATASET_ROOT = LOCAL_ROOT / 'dataset'

assert DRIVE_EXPORT_DIR.is_dir(), f'مجلد التصدير غير موجود: {DRIVE_EXPORT_DIR}'
archives = sorted(p for p in DRIVE_EXPORT_DIR.glob('*.zip') if p.is_file())
assert archives, f'لا يوجد أرشيف ZIP في: {DRIVE_EXPORT_DIR}'
if ARCHIVE_NAME is None:
    assert len(archives) == 1, 'يوجد أكثر من أرشيف؛ عيّن ARCHIVE_NAME صراحةً.'
    DRIVE_ARCHIVE = archives[0]
else:
    DRIVE_ARCHIVE = DRIVE_EXPORT_DIR / ARCHIVE_NAME
    assert DRIVE_ARCHIVE.is_file(), f'الأرشيف المحدد غير موجود: {DRIVE_ARCHIVE}'

print('الأرشيف المختار:', DRIVE_ARCHIVE)
print('الحجم بالبايت:', DRIVE_ARCHIVE.stat().st_size)
`),
    code(`
# 3) فك الأرشيف بأمان والتحقق من بنيته.
def safe_extract(zip_path, destination):
    destination = destination.resolve()
    with zipfile.ZipFile(zip_path) as zf:
        for member in zf.infolist():
            target = (destination / member.filename).resolve()
            assert str(target).startswith(str(destination)), f'مسار غير آمن في ZIP: {member.filename}'
        zf.extractall(destination)

if YOLO_DATASET_ROOT.exists():
    shutil.rmtree(YOLO_DATASET_ROOT)
YOLO_DATASET_ROOT.mkdir(parents=True)
safe_extract(DRIVE_ARCHIVE, YOLO_DATASET_ROOT)

# يسمح الدفتر بأرشيف يضم مجلدًا علويًا واحدًا أو محتوى البيانات مباشرة.
children = [p for p in YOLO_DATASET_ROOT.iterdir()]
if not (YOLO_DATASET_ROOT / 'images').exists() and len(children) == 1 and children[0].is_dir():
    YOLO_DATASET_ROOT = children[0]

for split in ('train', 'val', 'test'):
    assert (YOLO_DATASET_ROOT / 'images' / split).is_dir(), f'images/{split} غير موجود.'
    assert (YOLO_DATASET_ROOT / 'labels' / split).is_dir(), f'labels/{split} غير موجود.'
CLASS_MAP_PATH = YOLO_DATASET_ROOT / 'class_map.json'
assert CLASS_MAP_PATH.is_file(), 'ضع class_map.json في جذر الأرشيف.'
print('جذر البيانات:', YOLO_DATASET_ROOT)
`),
    markdown(`
## الخطوة 4: اعتماد خريطة الفئات
ملف class_map.json هو مصدر الحقيقة الوحيد لترتيب الفئات. لا تكتب قائمة الحروف داخل هذه الخلية. يجب أن تحتوي كل فئة على معرّف id متتابع، وlabel، وتمثيل Unicode أو نقل صوتي موثق عند توافره.`),
    code(`
from collections import Counter
import yaml

class_map = json.loads(CLASS_MAP_PATH.read_text(encoding='utf-8'))
classes = class_map.get('classes', [])
assert classes, 'خريطة الفئات لا تحتوي classes.'
class_ids = [item['id'] for item in classes]
assert class_ids == list(range(len(classes))), 'يجب أن تكون class ids متتابعة من 0.'
CLASS_NAMES = [item['label'] for item in classes]
assert all(name and 'REPLACE' not in name for name in CLASS_NAMES), 'استبدل القيم المؤقتة في class_map.json.'

split_counts = {}
for split in ('train', 'val', 'test'):
    image_dir = YOLO_DATASET_ROOT / 'images' / split
    label_dir = YOLO_DATASET_ROOT / 'labels' / split
    images = sorted([p for p in image_dir.iterdir() if p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.tif', '.tiff'}])
    labels = sorted(label_dir.glob('*.txt'))
    assert images, f'لا توجد صور في {split}.'
    split_counts[split] = {'images': len(images), 'labels': len(labels)}
    for label_path in labels:
        for line_number, row in enumerate(label_path.read_text(encoding='utf-8').splitlines(), start=1):
            if not row.strip():
                continue
            values = row.split()
            assert len(values) == 5, f'{label_path}:{line_number} ليس بتنسيق YOLO.'
            class_id, *coords = values
            assert 0 <= int(class_id) < len(CLASS_NAMES), f'فئة خارج المدى في {label_path}:{line_number}'
            assert all(0 <= float(value) <= 1 for value in coords), f'إحداثيات غير مطبعة في {label_path}:{line_number}'

DATA_YAML = YOLO_DATASET_ROOT / 'data.yaml'
DATA_YAML.write_text(yaml.safe_dump({
    'path': str(YOLO_DATASET_ROOT),
    'train': 'images/train',
    'val': 'images/val',
    'test': 'images/test',
    'nc': len(CLASS_NAMES),
    'names': CLASS_NAMES,
}, allow_unicode=True, sort_keys=False), encoding='utf-8')

print('الفئات:', len(CLASS_NAMES))
print('التقسيم:', split_counts)
print(DATA_YAML.read_text(encoding='utf-8'))
`),
    code(`
# 5) معاينة عيّنة ووسومها قبل التدريب.
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw

preview_image_path = next((YOLO_DATASET_ROOT / 'images' / 'train').glob('*'))
preview_label_path = YOLO_DATASET_ROOT / 'labels' / 'train' / f'{preview_image_path.stem}.txt'
image = Image.open(preview_image_path).convert('RGB')
draw = ImageDraw.Draw(image)
if preview_label_path.exists():
    for row in preview_label_path.read_text(encoding='utf-8').splitlines():
        class_id, xc, yc, width, height = row.split()
        xc, yc, width, height = map(float, (xc, yc, width, height))
        x1, y1 = int((xc - width / 2) * image.width), int((yc - height / 2) * image.height)
        x2, y2 = int((xc + width / 2) * image.width), int((yc + height / 2) * image.height)
        draw.rectangle((x1, y1, x2, y2), outline=(176, 120, 47), width=max(2, image.width // 500))
        draw.text((x1, max(0, y1 - 16)), CLASS_NAMES[int(class_id)], fill=(176, 120, 47))

plt.figure(figsize=(16, 8))
plt.imshow(image)
plt.axis('off')
plt.title('تحقق بصري: لا تبدأ التدريب قبل مراجعة الصناديق والفئات')
plt.show()
`),
    markdown(`
## الخطوة 6: إعداد التجربة والاستئناف

القيمة الافتراضية هي تدريب من الصفر، وهو الخيار الآمن عند تغيير اللغة والفئات. لا تنقل رأس الكشف من الغورموخي وتفسره كبرمية قديمة. يمكن تجربة warm start لاحقًا كاختبار تقني فقط بعد توثيق أثره وإعادة بناء رأس الكشف.`),
    code(`
from ultralytics import YOLO
import hashlib, time

MODEL_YAML = 'yolov8n.yaml'
INITIALIZATION = 'from_scratch'  # البدائل: from_scratch أو warm_start
WARM_START_CHECKPOINT = None     # مسار وزن اختياري؛ لا يغيّر أسماء البرمية القديمة.
EXPERIMENT_NAME = 'old_permic_yolo_v1'
EPOCHS = 100
IMAGE_SIZE = 960
BATCH_SIZE = 4
WORKERS = 2
DEVICE = 0

RUNS_ROOT = LOCAL_ROOT / 'runs'
RUN_DIR = RUNS_ROOT / EXPERIMENT_NAME
DRIVE_LAST_PT = DRIVE_TRAINING_STATE_DIR / f'{EXPERIMENT_NAME}_last.pt'
DRIVE_RESULTS_CSV = DRIVE_TRAINING_STATE_DIR / f'{EXPERIMENT_NAME}_results.csv'
DRIVE_MANIFEST = DRIVE_TRAINING_STATE_DIR / f'{EXPERIMENT_NAME}_manifest.json'

def sha256_file(file_path, block_size=1024 * 1024):
    digest = hashlib.sha256()
    with open(file_path, 'rb') as stream:
        for block in iter(lambda: stream.read(block_size), b''):
            digest.update(block)
    return digest.hexdigest()

def atomic_copy(source, destination):
    source, destination = Path(source), Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name + '.part')
    shutil.copy2(source, temporary)
    assert temporary.stat().st_size == source.stat().st_size
    os.replace(temporary, destination)

print('الوضع:', INITIALIZATION)
print('عدد فئات البرمية القديمة:', len(CLASS_NAMES))
`),
    code(`
# 7) التدريب أو الاستئناف مع حفظ متحقق منه في Drive.
def sync_latest_checkpoint(trainer):
    local_last = Path(trainer.last)
    if not local_last.is_file():
        return
    atomic_copy(local_last, DRIVE_LAST_PT)
    local_results = Path(trainer.save_dir) / 'results.csv'
    if local_results.is_file():
        atomic_copy(local_results, DRIVE_RESULTS_CSV)
    manifest = {
        'experiment_name': EXPERIMENT_NAME,
        'class_map_sha256': sha256_file(CLASS_MAP_PATH),
        'last_pt_sha256': sha256_file(DRIVE_LAST_PT),
        'saved_after_epoch': int(trainer.epoch) + 1,
        'saved_at_unix': time.time(),
    }
    temporary = DRIVE_MANIFEST.with_name(DRIVE_MANIFEST.name + '.part')
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    os.replace(temporary, DRIVE_MANIFEST)

if DRIVE_LAST_PT.is_file() and DRIVE_MANIFEST.is_file():
    manifest = json.loads(DRIVE_MANIFEST.read_text(encoding='utf-8'))
    assert manifest['class_map_sha256'] == sha256_file(CLASS_MAP_PATH), 'تغير ترتيب خريطة الفئات؛ لا تستأنف هذا checkpoint.'
    model = YOLO(str(DRIVE_LAST_PT))
    model.add_callback('on_model_save', sync_latest_checkpoint)
    results = model.train(resume=True)
else:
    if INITIALIZATION == 'warm_start':
        assert WARM_START_CHECKPOINT, 'حدد وزنًا فقط إذا قبلت اختبار warm start.'
        model = YOLO(WARM_START_CHECKPOINT)
    else:
        model = YOLO(MODEL_YAML)
    model.add_callback('on_model_save', sync_latest_checkpoint)
    results = model.train(
        data=str(DATA_YAML), epochs=EPOCHS, imgsz=IMAGE_SIZE, batch=BATCH_SIZE,
        device=DEVICE, workers=WORKERS, project=str(RUNS_ROOT), name=EXPERIMENT_NAME,
        pretrained=False if INITIALIZATION == 'from_scratch' else True,
        seed=20260818, deterministic=True, plots=True, save=True, save_period=-1,
    )
`),
    markdown(`
## الخطوة 8: التقييم والتصدير

لا تعتمد واجهة الويب أو أي نتيجة بحثية قبل تقييم منفصل على تقسيم test ومراجعة الأخطاء على صور غير مرئية أثناء التدريب.`),
    code(`
BEST_PT = RUN_DIR / 'weights' / 'best.pt'
assert BEST_PT.is_file(), f'لم يُعثر على best.pt: {BEST_PT}'
evaluation_model = YOLO(str(BEST_PT))
metrics = evaluation_model.val(data=str(DATA_YAML), split='test', imgsz=IMAGE_SIZE, batch=BATCH_SIZE, device=DEVICE, plots=True)
print('اكتمل تقييم test. راجع الرسوم والنتائج داخل:', RUN_DIR)
export_path = evaluation_model.export(format='onnx', imgsz=IMAGE_SIZE)
print('مسار تصدير ONNX:', export_path)
`),
    markdown(`
## الخطوة 9: واجهة Gradio للاختبار المحلي

هذه الواجهة لا تعني أن النموذج منشور في تطبيق الويب. هي اختبار محلي أو Colab للوزن الناتج. تعيد النتائج بترتيب أفقي للصناديق لتكوين نص مبدئي، ويجب مراجعة هذا الترتيب يدويًا عند وجود أعمدة أو أسطر متعددة.`),
    code(`
import gradio as gr
import numpy as np

inference_model = YOLO(str(BEST_PT))
def predict_old_permic(image, confidence, iou_threshold, max_detections):
    if image is None:
        return None, [], ''
    prediction = inference_model.predict(source=image, conf=float(confidence), iou=float(iou_threshold), imgsz=IMAGE_SIZE, max_det=int(max_detections), device=DEVICE, verbose=False)[0]
    annotated = prediction.plot(labels=True, conf=True, line_width=2)
    rows = []
    if prediction.boxes is not None and len(prediction.boxes):
        xyxy = prediction.boxes.xyxy.detach().cpu().numpy()
        scores = prediction.boxes.conf.detach().cpu().numpy()
        ids = prediction.boxes.cls.detach().cpu().numpy().astype(int)
        items = []
        for box, score, class_id in zip(xyxy, scores, ids):
            label = CLASS_NAMES[int(class_id)]
            x1, y1, x2, y2 = [round(float(value), 1) for value in box]
            rows.append([label, int(class_id), round(float(score), 4), x1, y1, x2, y2])
            items.append((y1, x1, label))
        extracted_text = ''.join(label for _, _, label in sorted(items))
    else:
        extracted_text = ''
    return annotated, rows, extracted_text

with gr.Blocks(title='مختبر OCR للبرمية القديمة') as demo:
    gr.Markdown('# تجربة YOLO للبرمية القديمة\nارفع صورة، وحدد العتبات، ثم راجع الصناديق والنص قبل استعماله بحثيًا.')
    with gr.Row():
        with gr.Column():
            input_image = gr.Image(type='numpy', label='صورة البرمية القديمة')
            confidence = gr.Slider(0.05, 0.95, value=0.25, step=0.05, label='حد الثقة')
            iou_threshold = gr.Slider(0.05, 0.95, value=0.45, step=0.05, label='حد IoU')
            max_detections = gr.Slider(1, 300, value=100, step=1, label='الحد الأقصى للكشفات')
            run_button = gr.Button('تشغيل الكشف', variant='primary')
        with gr.Column():
            output_image = gr.Image(type='numpy', label='الصورة مع الصناديق')
            output_table = gr.Dataframe(headers=['الفئة', 'id', 'confidence', 'x1', 'y1', 'x2', 'y2'], interactive=False)
            output_text = gr.Textbox(label='النص المستخرج مبدئيًا')
    run_button.click(predict_old_permic, [input_image, confidence, iou_threshold, max_detections], [output_image, output_table, output_text])
demo.launch(share=True, debug=True)
`)
  ],
  metadata: {
    kernelspec: { display_name: 'Python 3', name: 'python3' },
    language_info: { name: 'python' },
    colab: { gpuType: 'T4', provenance: [] }
  },
  nbformat: 4,
  nbformat_minor: 5
};

fs.writeFileSync(outputPath, `${JSON.stringify(notebook, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath}`);

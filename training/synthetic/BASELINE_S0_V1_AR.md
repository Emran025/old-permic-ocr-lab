# حزمة S0 الأساسية المتوازنة — الإصدار 1

هذه الحزمة هي **خط البداية للتدريب الحرفي** لكاشف البرمية القديمة. لا تحتوي إلا صورًا صناعية مولدة من `Noto Sans Old Permic Regular`، ولا تحتوي مخطوطات تاريخية أو كلمات أو تراكيب لغوية مزعومة.

| خاصية | القيمة |
|---|---:|
| تخطيط التوليد | `isolated-glyph` (S0) |
| profile | `unicode-clean` |
| عدد الفئات | 38 حرف Unicode للبرمية القديمة |
| العدد الكلي | 7,600 صورة |
| train | 6,080 صورة؛ 160 لكل فئة |
| val | 760 صورة؛ 20 لكل فئة |
| test | 760 صورة؛ 20 لكل فئة |
| البذرة الأساسية | `10350` |
| حجم الصورة | 640×640 |
| سياسة التوازن | `cyclic-per-split` |
| بصمة الخط SHA-256 | `f2eb57a47f62d490cb8a5efab95124f15b8941968cb03af780b939bae3b73006` |

## أمر إعادة الإنتاج

```bash
python3 training/synthetic/generate_old_permic_synthetic.py \
  --output /path/to/s0_unicode_clean \
  --layout isolated-glyph \
  --profile unicode-clean \
  --samples 7600 \
  --balanced-classes \
  --seed 10350 \
  --font /path/to/NotoSansOldPermic-Regular.ttf

python3 scripts/validate_synthetic_dataset.py /path/to/s0_unicode_clean
```

ينتج المولد مجلدات `images/{train,val,test}` و`labels/{train,val,test}`، إضافة إلى `class_map.json` و`data.yaml` و`manifest.json` و`assets.jsonl`. كل صورة S0 تحمل حرفًا واحدًا فقط، ويحمل ملف الوسم المقابل سطر YOLO واحدًا. يسجل `assets.jsonl` حرف Unicode والفئة والبذرة والمسار، ويسجل `manifest.json` بصمة الخط وسياسة التوازن.

> **حد صلاحية واضح:** هذه الحزمة مناسبة لفهم كاشف الحروف، واختبار خط التدريب، والتحقق من توازن الفئات. لا تثبت دقة OCR على مخطوطات البرمية القديمة، ولا يجوز استخدامها بديلًا عن تقييم مستقل على صور حقيقية موسومة.

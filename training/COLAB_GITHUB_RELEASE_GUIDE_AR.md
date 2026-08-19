# دليل تشغيل Colab والنشر العام لمختبر OCR البرمية القديمة

## الغرض وحدود الادعاء

الدفتر `training/notebooks/old_permic_synthetic_generation.ipynb` هو مصدر التنفيذ الوحيد لمسار التوليد والتدريب. يولّد محارف Old Permic مستقلة من الخط، ويتحقق من وسوم YOLO، ويدرّب baseline، ويحفظ نقاط الاستئناف، ثم ينشر **وصف إصدار صغيرًا ومتحققًا منه**. لا يجعل نجاح baseline الصناعي نموذج OCR صالحًا تلقائيًا للمخطوطات التاريخية.

> لا ترفع ملفات `images/` أو `labels/` أو `assets.jsonl` أو `last.pt` إلى GitHub. تبقى حزم البيانات الكبيرة وملفات الاستئناف في Google Drive. ينشر فقط وصف الإصدار وقياساته وخريطة الفئات والعقد ومعاينات محدودة، والوزن عندما يمر حد الحجم والسياسة في الدفتر.

## تشغيل الدفتر من Colab

| الخطوة | الإجراء | ناتج التحقق |
|---|---|---|
| 1 | افتح ملف IPYNB من الرابط العام للمستودع في Colab، ثم اختر Runtime يعمل بـGPU. | خلية البيئة تطبع GPU وتفشل صراحة إن لم يتوفر CUDA. |
| 2 | شغّل خلايا الاستنساخ العام وGoogle Drive وفحص بصمة الخط. | يستنسخ المشروع بلا token قراءة، وتطابق بصمة الخط `f2eb…73006`. |
| 3 | ابدأ بمرحلة `S0` فقط. | ينشئ المولد 7,600 عينة متوازنة، ثم يمرر المدقق المستقل. |
| 4 | راجع المعاينة البصرية للصناديق. | لا تنتقل إلى التدريب إن كانت المحارف أو المربعات غير سليمة. |
| 5 | شغّل baseline S0. | تحفظ callback نسخة `last.pt` و`results.csv` وعقد الاستئناف في Drive بعد كل حفظ نموذج. |
| 6 | شغّل تقييم `test` وبناء `release.json`. | يسجل `metrics.json` على تقسيم مستقل؛ وتظل الحالة `evaluated-not-published`. |
| 7 | راجع النتائج ثم فعّل `PUBLISH_RELEASE = True`. | ينشئ فرع `colab-results` و`artifacts/published/latest.json` فقط للإصدار المقبول. |

لا تدمج S0 وS0-d1 تلقائيًا. شغّل S0-d1 كتجربة مستقلة بعد تسجيل خط أساس S0، ثم طبق المنهج ذاته على S1 وS2. التدرج تنظيم بصري وتعليمي؛ تبقى وحدة التدريب والتوسيم **حرفًا** لا كلمة ولا معجمًا.

## نسخ مساحة العمل واسترجاعها بين جلسات Colab

يوجد في الدفتر بعد أدوات checkpoint خليتان يدويتان لا تعملان ضمن التسلسل المعتاد: `backup-workspace-to-drive` و`restore-workspace-from-drive`. تضع خلية النسخ مرآة قابلة للاستئناف في المسار التالي، ولا تكتب `latest_backup.json` إلا بعد انتهاء نسخ مساحة العمل وحالة التدريب.

```text
/content/drive/MyDrive/OldPermicOCRLab/workspace_backup/
├── latest_backup.json
└── payload/
    ├── old-permic-ocr-workspace/  # synthetic cache وruns
    └── training_state/            # last.pt وresume_state وresults.csv
```

لتنفيذ نسخ فوري من **Terminal** أثناء التدريب، مع إمكان إعادة نفس الأمر بعد الانقطاع، استخدم الآتي. لا يحذف هذا الأمر أي ملف في Drive؛ ويستبعد الملفات المؤقتة غير المكتملة فقط.

```bash
mkdir -p /content/drive/MyDrive/OldPermicOCRLab/workspace_cache/{workspace,training_state} && \
rsync -a --partial --append-verify --info=progress2 \
  --exclude='*.part' --exclude='*.tmp' \
  /content/old-permic-ocr-workspace/ \
  /content/drive/MyDrive/OldPermicOCRLab/workspace_cache/workspace/ && \
rsync -a --partial --append-verify --info=progress2 \
  /content/drive/MyDrive/OldPermicOCRLab/training_state/ \
  /content/drive/MyDrive/OldPermicOCRLab/workspace_cache/training_state/
```

عند العمل من حساب أو جهاز آخر، انقل مجلد `workspace_backup` أو `workspace_cache` إلى Drive الحساب الجديد أو نزّله إلى قرص Colab. في حالة `workspace_backup` اضبط `RESTORE_SOURCE_ROOT` على مساره، ثم اجعل `RESTORE_WORKSPACE_FROM_BACKUP = True` وشغّل خلية الاسترجاع قبل خلية التوليد. إذا كان cache مستعادًا، اترك `FORCE_REGENERATE_DATASET = False`؛ سيتحقق الدفتر منه بدل مسحه وإعادة توليده. إذا كان `source_commit` للنسخة مختلفًا، تعيد خلية الاسترجاع المشروع تلقائيًا إلى commit المطابق قبل أن تسمح لآلية الاستئناف بالتحقق من `last.pt`.

أما إذا استخدمت أمر Terminal السريع أعلاه، فاستعمل **هذا الاسترجاع المطابق** على الحساب الثاني بعد تشغيل خلايا البيئة والاستنساخ وربط Drive، وقبل خلية التوليد. ينسخ الأمر cache وحالة التدريب إلى المسارات التي يقرأها الدفتر، ثم يعيد المشروع إلى commit المسجل في `resume_state.json` كي لا ترفض آلية الاستئناف اختلاف المصدر.

```bash
rsync -a --partial --append-verify --info=progress2 \
  /content/drive/MyDrive/OldPermicOCRLab/workspace_cache/workspace/ \
  /content/old-permic-ocr-workspace/ && \
rsync -a --partial --append-verify --info=progress2 \
  /content/drive/MyDrive/OldPermicOCRLab/workspace_cache/training_state/ \
  /content/drive/MyDrive/OldPermicOCRLab/training_state/ && \
RESTORED_COMMIT=$(grep -o '"source_commit": "[^"]*"' /content/drive/MyDrive/OldPermicOCRLab/training_state/*/resume_state.json | head -n 1 | cut -d'"' -f4) && \
test -n "$RESTORED_COMMIT" && \
git -C /content/old-permic-ocr-lab fetch --depth 1 origin "$RESTORED_COMMIT" && \
git -C /content/old-permic-ocr-lab checkout --detach "$RESTORED_COMMIT"
```

بعد نجاحه، أعد تشغيل خلية **Drive وبصمة الخط** لتحديث `SOURCE_COMMIT` في الذاكرة، ثم شغّل خلية إعداد المرحلة، وخلية التوليد مع `FORCE_REGENERATE_DATASET = False`، ثم عقد البيانات، وإعداد التدريب، وأدوات checkpoint، وأخيرًا خلية التدريب. إذا ظهرت أكثر من مجلد تجربة داخل `training_state`، اختر المقصود بتعيين `EXPERIMENT_NAME` نفسه المسجل داخل `resume_state.json` قبل تشغيل خلية التدريب.

> لا تجعل Drive عامًا إلا إذا كنت تقبل أن يتمكن كل من يملك الرابط من تنزيل البيانات والوزن. لا توجد حاجة لجعل النسخة عامة عند النقل بين حسابات تملكها؛ مشاركة المجلد مباشرة أو إضافته كاختصار في Drive الحساب الثاني أقل تعرضًا.

## كيف يعمل الإصدار المنشور

| الملف | دوره | شرط قبول الموقع |
|---|---|---|
| `artifacts/published/latest.json` | مؤشر للإصدار الأحدث | `release_id` و`release_path` وSHA-256 لملف الإصدار. |
| `<release>/release.json` | تعريف الإصدار وسياقه العلمي | الحالة `published` والنطاق `synthetic-old-permic-character-baseline`. |
| `<release>/metrics.json` | مقاييس `test` الفعلية | SHA-256 يطابق ما أعلنه `release.json`. |
| `<release>/data_contract.json` | بصمات البيانات والخط والفئات | SHA-256 يطابق ما أعلنه `release.json`. |
| `<release>/class_map.json` | تسلسل الفئات والحروف | موجود في الإصدار؛ لا يستخدمه الموقع للاستدلال بعد. |
| `release.json → web_weight` | مرجع اختياري للوزن القابل للعرض | إما `null` أو asset موجود بالمسار والحجم وSHA-256 نفسهم؛ غيابه لا يعني وجود نموذج حي. |

يقارن الخادم بصمة `latest.json` مع `release.json`، ثم يتحقق من بصمات metrics والعقد وخريطة الفئات، ومن أن أي `web_weight` معلن يطابق أصلًا منشورًا بالفعل، قبل حفظ metadata في قاعدة البيانات. ولا ينزّل الموقع حزمة البيانات الصناعية أو يدعي أن خدمة الاستدلال نشطة.

## GitHub: ما يحتاج سرًا وما لا يحتاجه

بما أن المستودع عام، لا يحتاج أي من الآتي إلى secret: استنساخ المشروع داخل Colab، أو قراءة الموقع لـ`latest.json` وملفات الإصدار العامة، أو عرض الدفتر. تحاول خلية النشر أولًا `git push` من جلسة GitHub المصرح بها في Colab.

إذا فشل الدفع من shell رغم تسجيل الدخول في واجهة Colab، استخدم البديل التالي فقط:

1. في GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. اختر المالك `Emran025` وحدد **Only select repositories** ثم `old-permic-ocr-lab` فقط.
3. امنح **Repository permissions → Contents: Write** فقط، وحدد انتهاء قصيرًا مثل 7 أو 30 يومًا.
4. في Colab افتح تبويب **Secrets**، وأضف اسم `GITHUB_WRITE_TOKEN` والصق القيمة هناك. لا تضف السر إلى الدفتر أو Git أو متغيرات الواجهة.
5. في خلية النشر فقط غيّر `USE_COLAB_SECRET_FALLBACK = True` بعد فشل جلسة Git المصرح بها، ثم شغّل الخلية مجددًا.
6. احذف أو ألغ token بعد اكتمال النشر إذا لم يعد مطلوبًا.

توصي GitHub بـfine-grained tokens عندما يكون ذلك ممكنًا، لأنها تقيد المالك والمستودعات والصلاحيات. كما تؤكد أن tokens تعامل ككلمات مرور؛ فلا ترسلها عبر المحادثة ولا تحفظ في مصدر المشروع.[1]

## تفعيل فحص الموقع كل خمس دقائق

المزامنة خادمـية وتستخدم Heartbeat؛ لا تعتمد على `setInterval` أو أي مؤقت داخل Node. المسار `/api/scheduled/github-release-sync` يرفض غير نداءات cron، ويبحث عن صف الحالة بواسطة `taskUid`، ويعيد JSON عند الخطأ ليظهر في سجل التحقيق. cron هو `0 */5 * * * *` (UTC)، أي كل خمس دقائق عند الثانية صفر.

> يجب أولًا حفظ checkpoint ثم نشر الموقع من واجهة Manus؛ لا يصل Heartbeat إلى خادم التطوير المحلي.

بعد النشر، ينشئ مسؤول المشروع المهمة ويحتفظ بالمعرف الناتج في صف الحالة. التنفيذ الإداري المقصود هو:

```bash
manus-heartbeat create \
  --name old-permic-github-release-sync \
  --cron "0 */5 * * * *" \
  --path /api/scheduled/github-release-sync \
  --description "Check the public Old Permic Colab release manifest every five minutes"
```

بعد ظهور `task_uid`، يُحفظ في `training_sync_states.scheduleCronTaskUid` للصف الذي مفتاحه `github-public-release-sync`. عند ذلك فقط يعتبر callback مملوكًا للمهمة ويبدأ الفحص. يمكن استعراض التنفيذ أو إيقافه أو تعديله من لوحة Schedules أو بواسطة `manus-heartbeat list`, `logs`, و`update`.[2]

## تفسير الواجهة

لوحة **حالة إصدار التدريب المنشور** تعرض metadata متحققًا منه؛ وهي لا تقول إن نموذجًا متصلًا بواجهة OCR. لا يُفعّل الاستدلال الفعلي إلا بعد تحميل وزن متوافق مع `class_map.json` في خدمة الموقع، وتوحيد إحداثيات الكشف، واجتياز اختبار تكاملي. وحتى ذلك الحين يبقى الوصف الصادق: **Baseline صناعي، غير مثبت على المخطوطات التاريخية**.

## المراجع

[1]: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens "Managing your personal access tokens — GitHub Docs"
[2]: https://docs.github.com/en/webhooks "Webhooks and events — GitHub Docs"

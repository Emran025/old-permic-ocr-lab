# Runbook إصدار التدريب والمزامنة العامة

## نطاق هذا الدليل

هذا الدليل يصف الانتقال من تشغيل Colab إلى **إصدار baseline صناعي منشور ومتحقق منه** في المختبر. وهو لا يصف نشر تطبيق الويب ولا تدريبًا تاريخيًا على المخطوطات؛ هذان مساران منفصلان. يعتمد مسار القراءة على مستودع GitHub العام، لذلك لا يوجد token قراءة في الموقع أو في الدفتر.

## حالة الإصدار

| الحالة | مالك القرار | ما يجب وجوده | ما يمكن أن يعرضه الموقع |
|---|---|---|---|
| `generated` | Colab | dataset متحقق و`data_contract.json` | لا شيء؛ لم يبدأ التدريب. |
| `training` | Colab | `last.pt` و`resume_state.json` في Drive | لا شيء؛ لا توجد نتيجة نهائية. |
| `evaluated-not-published` | الباحث | `best.pt` و`metrics.json` من تقسيم test | لا شيء؛ لا يقرأ الموقع ملفات غير منشورة. |
| `published` | الباحث بعد المراجعة | `release.json` و`latest.json` وبصمات متطابقة في `colab-results` | لوحة metadata فقط، موسومة baseline صناعي. |
| `web-inference-ready` | فريق التطبيق | وزن متحقق وخدمة استدلال واختبار تكاملي | غير متاح حاليًا؛ لا تنتقل إليه تلقائيًا. |

> لا تُحوّل حالة `published` إلى ادعاء تعرف على مخطوطات حقيقية. تظل `real_manuscript_ocr_validated: false` في كل إصدار يصدر من بيانات Unicode الصناعية فقط.

## بوابة نشر من Colab

لا تُشغّل خلية النشر قبل تحقق الشروط التالية: أن يكون تقييم `test` قد اكتمل، وأن يطابق `data_contract.json` الفئات والخط والـmanifest المستخدم في التدريب، وأن تكون لوحة المعاينات وسجل التجربة مراجعين. بعد ذلك فقط غيّر `PUBLISH_RELEASE = True`.

تكتب الخلية فرع `colab-results` بالطريقة التالية:

| المسار | سبب النشر | حد الحماية |
|---|---|---|
| `artifacts/published/<release-id>/release.json` | تعريف الإصدار | بصمة يتحقق منها `latest.json`. |
| `metrics.json` و`data_contract.json` و`class_map.json` | شفافية القياس والعقد | يتحقق الخادم من SHA-256 لكل ملف. |
| `previews/*` | مراجعة بصرية اختيارية | محددة وليست حزمة البيانات الكاملة. |
| `weights/best.pt` أو `best.onnx` | وزن اختياري للعرض اللاحق | لا ينسخ إن تجاوز 90 MiB؛ لا يفعّل استدلال الموقع وحده. |
| `latest.json` | المؤشر الوحيد للإصدار الجاري | يطابق `release_id` ومسار وبصمة `release.json`. |

يحمل `release.json` حقل `web_weight`. قيمته `null` عندما لا يوجد وزن منشور، أو object يطابق asset موزعًا فعلًا من حيث المسار والحجم والبصمة. يرفض الخادم أي إصدار يعلن وزنًا لا يوجد في قائمة الأصول؛ وهذا يمنع تحول metadata إلى حالة نموذج مزعومة.

## إنشاء فحص Heartbeat بعد نشر الموقع

لا تنشأ مهمة Heartbeat أثناء التطوير، إذ لا يستطيع منفذ المهام الوصول إلى خادم preview. بعد حفظ checkpoint ونشر الموقع، ينشئ مسؤول المشروع مهمة project-level بالمسار الآتي:

```bash
manus-heartbeat create \
  --name old-permic-github-release-sync \
  --cron "0 */5 * * * *" \
  --path /api/scheduled/github-release-sync \
  --description "Verify the public Old Permic Colab release manifest every five minutes"
```

يعاد من الأمر `task_uid`. يحفظ المشغل هذا المعرف في `training_sync_states.scheduleCronTaskUid` للصف ذي `stateKey = github-public-release-sync`. لا يقبل endpoint أي cron لا يجد صفه بهذا الـUID، ويعيد `{ ok: true, skipped: "orphan" }` لتجنب إعادة المحاولة غير المفيدة. هذه المطابقة تمنع أي حمولة HTTP من اختيار إصدار أو مشروع بدلًا من نظام Heartbeat.

| نتيجة فحص Heartbeat | أثر قاعدة البيانات | أثر الواجهة |
|---|---|---|
| لا يوجد `latest.json` | يسجل `lastCheckedAt` من دون خطأ | «لا يوجد إصدار منشور بعد». |
| pointer وmanifest سليمين | upsert لإصدار metadata و`lastSuccessAt` | تعرض لوحة الإصدار والمقاييس كما هي. |
| بصمة أو أصل مطلوب غير مطابق | `lastError` فقط، ولا يكتب إصدارًا جديدًا | تحذير للباحث، من دون ادعاء نموذج. |
| UID غير معروف | لا يتغير شيء | لا أثر؛ المهمة يتيمة. |

## التحقق والتشغيل الآمن

بعد تفعيل المهمة، افحص أول تشغيل من سجل المهام. يجب أن تكون الاستجابة `synced` أو `no_release`. لا تعامل `no_release` كعطل؛ هي الحالة الصحيحة قبل نشر أول تجربة. إذا ظهرت رسالة بصمة، لا تعدل قاعدة البيانات يدويًا لإخفائها؛ أصلح محتوى الإصدار في Colab ثم انشر إصدارًا جديدًا.

تتحقق واجهة الدفتر أيضًا من API كل خمس دقائق **حين تكون الصفحة مفتوحة** لتحسين العرض، لكن مصدر التحديث الموثوق هو Heartbeat الخادمي. لا تستخدم `setInterval` أو `node-cron` داخل الخادم لأن بيئة الاستضافة قد تتوقف عند الخمول.

## الاسترداد

إذا أصبحت خلية النشر أو إصدار GitHub غير صحيح، اترك `latest.json` على آخر إصدار سليم أو انشر release جديدًا بمعرف جديد؛ لا تعدل عقد إصدار سابق. يظل `last.pt` وبيان الاستئناف في Drive لاستكمال التدريب، وتبقى نقاط checkpoint الخاصة بالمشروع لاستعادة كود الويب. عند التوقف المقصود للمزامنة، أوقف مهمة Heartbeat بواسطة `manus-heartbeat update --task-uid <uid> --enable=false` بدل حذف سجلات الإصدار.

## المراجع

[1]: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens "Managing your personal access tokens — GitHub Docs"
[2]: https://docs.github.com/en/webhooks "Webhooks and events — GitHub Docs"

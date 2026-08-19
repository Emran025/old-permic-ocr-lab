# مراجع GitHub للأسرار وصلاحيات النشر

## القراءة من المستودع العام

لا تحتاج آلية الموقع إلى token لقراءة `latest.json` وملفات الإصدار من مستودع GitHub العام. لذلك تعتمد المزامنة الدورية على روابط raw العامة، وتتحقق من SHA-256 للـpointer و`release.json` وملفات metrics والعقد قبل حفظ metadata.

## بديل النشر عند عدم كفاية جلسة Colab

توصي وثائق GitHub باستخدام **fine-grained personal access tokens** بدل token الكلاسيكي عندما يكون ذلك ممكنًا. يمكن تقييد token بمالك واحد ومستودعات محددة وصلاحيات دقيقة. عند الحاجة إلى دفع إصدار من Colab، يقيد token بالمسـتودع `Emran025/old-permic-ocr-lab` فقط، ويمنح `Contents: Write` فقط، مع انتهاء قصير المدة. يجب معاملته ككلمة مرور: لا يوضع في خلايا الدفتر أو ملفات Git أو سجل التنفيذ. [1]

يمكن حفظ هذا البديل باسم `GITHUB_WRITE_TOKEN` في لوحة **Secrets** في Colab، وتفعيل `USE_COLAB_SECRET_FALLBACK = True` فقط إذا فشل `git push` من الجلسة المصرح بها. لا يحتاج الاستنساخ أو قراءة الموقع هذا السر.

## المراجع

[1]: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens "Managing your personal access tokens — GitHub Docs"
[2]: https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens "Permissions required for fine-grained personal access tokens — GitHub Docs"

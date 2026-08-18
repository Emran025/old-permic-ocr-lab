export type HostedPrimarySource = {
  id: string;
  title: string;
  subtitle: string;
  period: string;
  imageUrl: string;
  sourceUrl: string;
  holdingInstitution: string;
  catalogueRecord: string;
  rights: string;
  resolutionNote: string;
  trainingStatus: string;
  description: string;
  alt: string;
  wide?: boolean;
};

export type CorpusDisplaySource = HostedPrimarySource & {
  corpusRole: "primary-text" | "contextual";
};

export type ExternalPrimarySource = {
  id: string;
  title: string;
  manuscript: string;
  location: string;
  pageReference: string;
  href: string;
  visibleContent: string;
  rightsNote: string;
  trainingStatus: string;
};

const articlePdf = "https://ural-altai.ru/userfiles/files/publications/Uralaltai-43-8-35.pdf";
const articleExcerptRights = "صورة وفّرها الباحث من ملف المقالة المرفق. تُعرض للتوثيق والبحث مع الإسناد؛ تُراجع حقوق إعادة الاستخدام قبل إدخالها في مجموعة تدريب أو نشرها خارج هذا المختبر.";

export const hostedPrimarySources: HostedPrimarySource[] = [
  {
    id: "zyryanskaya-trinity-inscription",
    title: "شريط نقش الثالوث الزيرياني",
    subtitle: "نص برمي قديم ظاهر على أيقونة الثالوث",
    period: "القرن 14",
    imageUrl: "/manus-storage/zyryanskaya-trinity-inscription-preview_2e47a56f.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Zyryanskaya_trinity_text.jpg",
    holdingInstitution: "متحف-محمية فولوغدا؛ نسخة التفصيل عبر Wikimedia Commons.",
    catalogueRecord: "أيقونة «الثالوث الزيرياني»؛ شريط النقش السفلي بالبرمية القديمة.",
    rights: "ملكية عامة أو لا قيود معروفة بحسب صفحة الملف في ويكيميديا كومنز.",
    resolutionNote: "نسخة تصفح مشتقة من صورة عالية الدقة؛ افتح المصدر الأصلي للملف الكامل.",
    trainingStatus: "مادة أولية مرشحة للوسم اليدوي بعد مراجعة القراءة وتحديد مناطق النص.",
    description: "صورة نص أصلي بالبرمية القديمة، وليست جدول حروف أو شرحًا لغويًا.",
    alt: "شريط نقش برمي قديم على أيقونة الثالوث الزيرياني",
    wide: true,
  },
  {
    id: "abur-komi-inscription",
    title: "وثيقة Abur مصغّرة",
    subtitle: "صورة لنص برمي قديم حر الإتاحة",
    period: "غير مؤرخ في وصف الملف",
    imageUrl: "/manus-storage/abur-komi-inscription_5efc4f26.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Abur_komi_inscription.jpg",
    holdingInstitution: "المصدر المادي غير محدد في صفحة الملف؛ الإتاحة عبر Wikimedia Commons.",
    catalogueRecord: "Abur komi inscription.jpg؛ ملف 300×299 بكسل.",
    rights: "ملكية عامة أو لا قيود معروفة بحسب صفحة الملف في ويكيميديا كومنز.",
    resolutionNote: "دقة منخفضة (300×299)؛ مناسبة للتصفح أو تجربة وسم أولية فقط.",
    trainingStatus: "ليست كافية لتدريب OCR بمفردها؛ تحتاج إلى توثيق مصدر ومراجعة وسوم قبل إدخالها في البيانات.",
    description: "شاهد بصري أولي صغير لنص برمي قديم، لا بديلًا عن مسح مخطوطة عالي الدقة.",
    alt: "وثيقة قصيرة مكتوبة بالبرمية القديمة",
  },
  {
    id: "trinity-zuryanskaya-full-icon",
    title: "الثالوث الزيرياني — اللوحة الكاملة",
    subtitle: "السياق الأصلي الذي يحمل شريط النقش البرمي",
    period: "القرن 14",
    imageUrl: "/manus-storage/trinity-zuryanskaya-full-icon_07cc4900.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Trinity_Zuryanskaya.jpg",
    holdingInstitution: "متحف-محمية فولوغدا؛ صورة الإتاحة عبر Wikimedia Commons.",
    catalogueRecord: "أيقونة «الثالوث الزيرياني»، صورة كاملة بدقة أصلية 3190×5218 بكسل.",
    rights: "نسخ فوتوغرافي أمين لعمل في الملكية العامة؛ موسوم Public Domain Mark في صفحة الملف.",
    resolutionNote: "نسخة تصفح بعرض 960 بكسل؛ افتح المصدر الأصلي للصورة الكاملة.",
    trainingStatus: "صورة سياقية أولية؛ للتدريب يُستخدم شريط النقش المكبر مع وسوم محارف، لا اللوحة كاملة.",
    description: "تعرض وعاء النقش التاريخي الكامل؛ شريط النص المكبر هو الأنسب لتحديد مناطق الكتابة.",
    alt: "أيقونة الثالوث الزيرياني الكاملة من القرن الرابع عشر",
  },
  {
    id: "egor-326-figures-1-2",
    title: "حواشي Egor. 326 — الشكلان 1–2",
    subtitle: "موضعان لنص برمي قديم في مخطوطة غريغوريوس الكبير",
    period: "القرن 15",
    imageUrl: "/manus-storage/egor326_fig1-2_6e2f6539.png",
    sourceUrl: `${articlePdf}#page=3`,
    holdingInstitution: "المكتبة الحكومية الروسية، مجموعة إيغوروف Egor. 326.",
    catalogueRecord: "الورقتان 359v و162؛ الشكلان 1–2 في المقالة المرفقة، ص. 3.",
    rights: articleExcerptRights,
    resolutionNote: "صورة مرفقة كما قدّمها الباحث؛ لا قص أو تعديل في العرض.",
    trainingStatus: "مصدر أولي قوي لوسم منطقة النص؛ لا تُعتمد قراءة أو مربعات قبل مراجعة بشرية.",
    description: "فوتوكوبيتان لموضعين تظهر فيهما كتابة برمية قديمة فعلية داخل مخطوطة أصلية.",
    alt: "موضعان لكتابة برمية قديمة في مخطوطة Egor 326",
    wide: true,
  },
  {
    id: "likh-360-f274-figure-3",
    title: "Likh. 360، ورقة 274 — الشكل 3",
    subtitle: "نص برمي قديم متصل واسع المساحة",
    period: "1486",
    imageUrl: "/manus-storage/likh360_f274_fig3_5c8088ee.png",
    sourceUrl: `${articlePdf}#page=6`,
    holdingInstitution: "SPbII RAS، مجموعة ن. ب. ليخاتشوف، رقم 360.",
    catalogueRecord: "ورقة 274؛ الشكل 3 في المقالة المرفقة، ص. 6.",
    rights: articleExcerptRights,
    resolutionNote: "صورة مرفقة كما قدّمها الباحث، وهي الأقرب إلى نص برمي متصل في هذا الفهرس.",
    trainingStatus: "مرشح مهم لوسم السطر أو الكلمة لاحقًا؛ يتطلب اعتماد قراءة مرجعية قبل توصيف المحارف.",
    description: "نص برمي قديم متصل على مخطوطة أصلية، مع قيمة عالية لفهم انتظام الكتابة قبل تدريب النموذج.",
    alt: "نص برمي قديم متصل من مخطوطة Likhachev 360 ورقة 274",
  },
  {
    id: "likh-360-f5v-6-figure-5",
    title: "Likh. 360، الورقتان 5v–6 — الشكل 5",
    subtitle: "فتحتان مخطوطيتان مع سطر برمي ظاهر",
    period: "1486",
    imageUrl: "/manus-storage/likh360_f5v6_fig5_6c1b7efd.png",
    sourceUrl: `${articlePdf}#page=9`,
    holdingInstitution: "SPbII RAS، مجموعة ن. ب. ليخاتشوف، رقم 360.",
    catalogueRecord: "الورقتان 5v–6؛ الشكل 5، ص. 9.",
    rights: articleExcerptRights,
    resolutionNote: "صورة مرفقة كما هي؛ تكشف علاقة السطر البرمي بصفحة المخطوطة الكاملة.",
    trainingStatus: "مرشح لوسم السطر أو الكلمة بعد عزل منطقة البرمية عن السياق السلافي.",
    description: "فتحتان من مخطوطة أصلية يظهر في إحداهما سطر برمي في الجزء السفلي.",
    alt: "فتحتان من مخطوطة Likhachev 360 مع سطر برمي قديم",
    wide: true,
  },
  {
    id: "likh-360-f66v-figure-6",
    title: "Likh. 360، ورقة 66v — الشكل 6",
    subtitle: "صفحة مخطوطة بموضع كتابة هامشية",
    period: "1486",
    imageUrl: "/manus-storage/likh360_f66v_fig6_cf2f0d3f.png",
    sourceUrl: `${articlePdf}#page=12`,
    holdingInstitution: "SPbII RAS، مجموعة ن. ب. ليخاتشوف، رقم 360.",
    catalogueRecord: "ورقة 66v؛ الشكل 6، ص. 12.",
    rights: articleExcerptRights,
    resolutionNote: "صورة مرفقة كما هي؛ تحتفظ بحدود الصفحة وسياق الهامش.",
    trainingStatus: "تحدد منطقة البرمية يدويًا قبل أي وسم، ولا تُقرأ آليًا في هذه المرحلة.",
    description: "صفحة مخطوطة أصلية تُظهر موضع كتابة برمية قديمة إضافية يحتاج فحصًا بشريًا قبل التوسيم.",
    alt: "صفحة مخطوطة Likhachev 360 ورقة 66v",
  },
  {
    id: "likh-360-f213-figure-7",
    title: "Likh. 360، ورقة 213 — الشكل 7",
    subtitle: "موضع كتابة برمية في صفحة مخطوطة",
    period: "1486",
    imageUrl: "/manus-storage/likh360_f213_fig7_385977d8.png",
    sourceUrl: `${articlePdf}#page=13`,
    holdingInstitution: "SPbII RAS، مجموعة ن. ب. ليخاتشوف، رقم 360.",
    catalogueRecord: "ورقة 213؛ الشكل 7، ص. 13.",
    rights: articleExcerptRights,
    resolutionNote: "صورة مرفقة كما قدّمها الباحث؛ لا تُعدّل أو تقتطع داخل المكتبة.",
    trainingStatus: "تُراجع منطقة الكتابة البرمية أولًا، ثم تُوسم يدويًا إذا أُقرّت القراءة.",
    description: "صورة فوتوغرافية لصفحة مخطوطة أصلية مع موضع كتابة برمية مميز.",
    alt: "صفحة مخطوطة Likhachev 360 ورقة 213",
    wide: true,
  },
  {
    id: "likh-360-f215-figure-8",
    title: "Likh. 360، ورقة 215 — الشكل 8",
    subtitle: "صفحة مخطوطة وموضع هامشي برمي",
    period: "1486",
    imageUrl: "/manus-storage/likh360_f215_fig8_57be05d0.png",
    sourceUrl: `${articlePdf}#page=13`,
    holdingInstitution: "SPbII RAS، مجموعة ن. ب. ليخاتشوف، رقم 360.",
    catalogueRecord: "ورقة 215؛ الشكل 8، ص. 13.",
    rights: articleExcerptRights,
    resolutionNote: "صورة مرفقة كما هي وبإسنادها الظاهر في الشكل.",
    trainingStatus: "تصلح لاختبار كشف الموضع فقط بعد اعتماد الخبير لمنطقة البرمية.",
    description: "صفحة مخطوطة أصلية مع علامة كتابة هامشية برمية منفصلة عن المتن السلافي.",
    alt: "صفحة مخطوطة Likhachev 360 ورقة 215",
  },
  {
    id: "likh-360-f217v-figure-9",
    title: "Likh. 360، ورقة 217v — الشكل 9",
    subtitle: "كتابة برمية هامشية قرب أسفل الصفحة",
    period: "1486",
    imageUrl: "/manus-storage/likh360_f217v_fig9_124bf968.png",
    sourceUrl: `${articlePdf}#page=14`,
    holdingInstitution: "SPbII RAS، مجموعة ن. ب. ليخاتشوف، رقم 360.",
    catalogueRecord: "ورقة 217v؛ الشكل 9، ص. 14.",
    rights: articleExcerptRights,
    resolutionNote: "صورة مرفقة كما هي، مع بقاء المنطقة البرمية ضمن سياق الصفحة.",
    trainingStatus: "مادة لكشف منطقة هامشية لاحقًا؛ لا تدخل البيانات التدريبية من دون وسم معتمد.",
    description: "صفحة مخطوطة أصلية يظهر فيها موضع كتابة برمية في الهامش السفلي.",
    alt: "صفحة مخطوطة Likhachev 360 ورقة 217v",
  },
  {
    id: "volok-9-11-figures-10-11",
    title: "Volok. 9 وVolok. 11 — الشكلان 10–11",
    subtitle: "سطران برميان منفصلان من مخطوطتين",
    period: "القرن 15",
    imageUrl: "/manus-storage/volok9f285v_volok11f271v_fig10-11_b23a3566.png",
    sourceUrl: `${articlePdf}#page=16`,
    holdingInstitution: "المكتبة الحكومية الروسية، Volok. 9، ورقة 285v؛ وVolok. 11، ورقة 271v.",
    catalogueRecord: "الشكلان 10–11، ص. 16.",
    rights: articleExcerptRights,
    resolutionNote: "صورة مرفقة كما هي تضم سطرين من مصدرين محفوظين منفصلين.",
    trainingStatus: "عينات مناسبة مستقبلًا لوسم السطر أو الكلمة بعد اعتماد النص والحقوق.",
    description: "سطران برميان قديمان منفصلان بصريًا عن المتن، ضمن مخطوطتين أصليتين.",
    alt: "سطران برميان من مخطوطتي Volok 9 وVolok 11",
    wide: true,
  },
  {
    id: "volok-11-f268-figure-12",
    title: "Volok. 11، ورقة 268 — الشكل 12",
    subtitle: "هامش برمي قديم إلى يمين المتن السلافي",
    period: "القرن 15",
    imageUrl: "/manus-storage/volok11f268_fig12_5b631f2b.png",
    sourceUrl: `${articlePdf}#page=17`,
    holdingInstitution: "المكتبة الحكومية الروسية، Volok. 11.",
    catalogueRecord: "ورقة 268؛ الشكل 12، ص. 17.",
    rights: articleExcerptRights,
    resolutionNote: "صورة مرفقة كما هي؛ يظهر الهامش البرمي في الطرف الأيمن للصفحة.",
    trainingStatus: "ممتازة لتمارين كشف منطقة النص قبل تسمية المحارف، مع مراجعة بشرية.",
    description: "صفحة مخطوطة أصلية تجمع المتن السلافي مع هامش برمي قديم واضح.",
    alt: "هامش برمي قديم على ورقة 268 من Volok 11",
  },
  {
    id: "volok-11-f268v-figure-13",
    title: "Volok. 11، ورقة 268v — الشكل 13",
    subtitle: "هامش برمي قديم على يسار الصفحة",
    period: "القرن 15",
    imageUrl: "/manus-storage/volok11f268v_fig13_b819261f.png",
    sourceUrl: `${articlePdf}#page=17`,
    holdingInstitution: "المكتبة الحكومية الروسية، Volok. 11.",
    catalogueRecord: "ورقة 268v؛ الشكل 13، ص. 17.",
    rights: articleExcerptRights,
    resolutionNote: "صورة مرفقة كما هي؛ يحافظ العرض على الهامش والسياق الكاملين.",
    trainingStatus: "مرشح ممتاز لوسم مربع منطقة هامشية مستقل عن المتن السلافي.",
    description: "صفحة مخطوطة أصلية يظهر فيها نص برمي في الهامش الأيسر بلون مختلف عن المتن.",
    alt: "هامش برمي قديم على ورقة 268v من Volok 11",
  },
  {
    id: "uvar-264-figure-14",
    title: "Uvar. 264-1°، الأوراق 23–30 — الشكل 14",
    subtitle: "تجميعة مواضع أسطر برمية قديمة",
    period: "القرن 15",
    imageUrl: "/manus-storage/uvar264_fig14_8a50ee0b.png",
    sourceUrl: `${articlePdf}#page=19`,
    holdingInstitution: "متحف التاريخ الحكومي، Uvar. 264-1°.",
    catalogueRecord: "الأوراق 23–30؛ الشكل 14، ص. 19.",
    rights: articleExcerptRights,
    resolutionNote: "صورة مرفقة كما هي؛ تجمع مواضع نصية من المخطوطة الأصلية.",
    trainingStatus: "تصلح لاحقًا لوسم السطر أو الكلمة بعد فصل كل قصاصة واعتماد النص المرجعي.",
    description: "تجميعة فوتوكوبيات لأسطر ومواضع كتابة برمية قديمة على مخطوطة أصلية.",
    alt: "تجميعة أسطر برمية قديمة من Uvar 264",
    wide: true,
  },
];

export const primaryTextSources: CorpusDisplaySource[] = hostedPrimarySources
  .filter((source) => source.id !== "trinity-zuryanskaya-full-icon")
  .map((source) => ({ ...source, corpusRole: "primary-text" }));

export const contextualSources: CorpusDisplaySource[] = hostedPrimarySources
  .filter((source) => source.id === "trinity-zuryanskaya-full-icon")
  .map((source) => ({ ...source, corpusRole: "contextual" }));

export const externalPrimarySources: ExternalPrimarySource[] = [
  {
    id: "volok-437",
    title: "هامشا Volok. 437",
    manuscript: "مخطوطة سلافية من القرن 15 تضم هوامش بالبرمية القديمة",
    location: "المكتبة الحكومية الروسية، Volok. 437؛ الورقتان 8r و29r.",
    pageReference: "المقالة: PDF ص. 9 و12، الشكلان 1–2.",
    href: "https://www.digitalniknihovna.cz/knav/view/uuid:5eb9ffc1-6939-4983-b7ee-ec90fa70b6bc?article=uuid:742232dc-d6be-43f1-a129-06cc8df6bb43",
    visibleContent: "صورتان لموضع الهامشين الأصليين مع دراسة وقراءة مرافقة.",
    rightsNote: "العارض متاح للمشاهدة؛ لا تُعاد تضمين صوره في التطبيق إلى أن تتضح حقوق إعادة الاستخدام.",
    trainingStatus: "مادة أصلية مناسبة للتوسيم البحثي عند تأكيد الإذن؛ لا تدخل مجموعة YOLO آليًا.",
  },
];

export const primaryCorpusSummary = {
  hostedCount: primaryTextSources.length,
  externalCount: externalPrimarySources.length,
  totalCount: primaryTextSources.length + externalPrimarySources.length,
  trainingBoundary: "لا تدخل أي مادة تدريب YOLO قبل تحقق الحقوق واعتماد القراءة والوسوم وتقسيم البيانات.",
} as const;

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

export const hostedPrimarySources: HostedPrimarySource[] = [
  {
    id: "zyryanskaya-trinity-inscription",
    title: "شريط نقش الثالوث الزيرياني",
    subtitle: "نص برمي قديم ظاهر على أيقونة الثالوث",
    period: "القرن 14",
    imageUrl: "/manus-storage/zyryanskaya-trinity-inscription-preview_2e47a56f.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Zyryanskaya_trinity_text.jpg",
    holdingInstitution: "متحف-محمية فولوغدا (القطعة الأصلية)؛ نسخة التفصيل عبر Wikimedia Commons.",
    catalogueRecord: "أيقونة «الثالوث الزيرياني»؛ شريط النقش السفلي بالبرمية القديمة.",
    rights: "ملكية عامة أو لا قيود معروفة بحسب صفحة الملف في ويكيميديا كومنز.",
    resolutionNote: "نسخة تصفح مشتقة من صورة عالية الدقة؛ افتح المصدر الأصلي للملف الكامل.",
    trainingStatus: "مادة أولية مرشحة للوسم اليدوي بعد مراجعة القراءة وتحديد مناطق النص.",
    description: "هذه صورة نص أصلي بالبرمية القديمة وليست جدول حروف أو شرحًا لغويًا. تستخدم للمشاهدة والتوسيم البحثي مع الاحتفاظ بإسناد الأيقونة ومؤسسة حفظها.",
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
    description: "تحتوي الصورة على نص ظاهر بالبرمية القديمة. أدرجت بوصفها شاهدًا بصريًا أوليًا صغيرًا، لا بديلًا عن مسح مخطوطة عالي الدقة.",
    alt: "وثيقة قصيرة مكتوبة بالبرمية القديمة",
  },
];

export const externalPrimarySources: ExternalPrimarySource[] = [
  {
    id: "egor-326",
    title: "حواشي Egor. 326",
    manuscript: "«أربعون عظة على الإنجيل» لغريغوريوس الكبير",
    location: "المكتبة الحكومية الروسية، مجموعة إيغوروف Egor. 326، الأوراق 359v و162.",
    pageReference: "PDF ص. 3، الشكلان 1–2.",
    href: "https://ural-altai.ru/userfiles/files/publications/Uralaltai-43-8-35.pdf#page=3",
    visibleContent: "فوتوكوبيتان لنص/كلمة بالبرمية القديمة داخل مخطوطة من القرن 15.",
    rightsNote: "تُفتح من مقالة الناشر؛ لا يعاد استضافة فوتوكوبيات المخطوطة داخل التطبيق حتى يتحقق الترخيص.",
    trainingStatus: "مرشح للوسم فقط بعد الحصول على إذن مناسب ومراجعة حدود مناطق النص.",
  },
  {
    id: "likh-360",
    title: "كتابات Likh. 360",
    manuscript: "«كلمات إسحاق السرياني»",
    location: "SPbII RAS، مجموعة ن. ب. ليخاتشوف Likh. 360، مخطوطة مؤرخة سنة 1486.",
    pageReference: "PDF ص. 6 ثم ص. 8–14، الأشكال 3–9.",
    href: "https://ural-altai.ru/userfiles/files/publications/Uralaltai-43-8-35.pdf#page=6",
    visibleContent: "صور حواشٍ وكتابات برمية قديمة على صفحات مخطوطة أصلية.",
    rightsNote: "صور منشورة في مقالة مفتوحة للمشاهدة؛ لا تُعاد استضافتها ضمن التطبيق بلا تحقق حقوقي.",
    trainingStatus: "مصدر غني محتمل للوسم اليدوي، مع ضرورة فصل الأسطر/الهوامش والتحقق من الإذن.",
  },
  {
    id: "volok-9-11",
    title: "كتابات Volok. 9 وVolok. 11",
    manuscript: "مجلدات من نصوص الكتاب المقدس في تقليد إنجيل غينادي",
    location: "المكتبة الحكومية الروسية، Volok. 9 (ورقة 285v) وVolok. 11 (الأوراق 271v و268 و268v).",
    pageReference: "PDF ص. 16–17، الأشكال 10–13.",
    href: "https://ural-altai.ru/userfiles/files/publications/Uralaltai-43-8-35.pdf#page=16",
    visibleContent: "فوتوكوبيات لكتابات برمية قديمة على مخطوطات كتابية من القرن 15.",
    rightsNote: "المشاهدة متاحة من المقالة؛ إعادة الاستضافة تحتاج تحقق ترخيص صور المخطوطات.",
    trainingStatus: "مرشح للوسم بعد تدقيق كل شكل وتوثيق منشئ الصورة والمؤسسة الحافظة.",
  },
  {
    id: "uvar-264",
    title: "حاشية Uvar. 264-1°",
    manuscript: "«الأريوباغيتيكا»",
    location: "متحف التاريخ الحكومي، Uvar. 264-1°، الأوراق 23–30.",
    pageReference: "PDF ص. 19، الشكل 14.",
    href: "https://ural-altai.ru/userfiles/files/publications/Uralaltai-43-8-35.pdf#page=19",
    visibleContent: "صورة موضع كلمة برمية قديمة في حاشية مخطوطة.",
    rightsNote: "مصدر مشاهدة خارجي؛ لا تُنسخ الصورة إلى التدريب أو التطبيق بلا تحقق حقوقي.",
    trainingStatus: "عينة صغيرة محتملة للتوسيم، وليست مجموعة تدريب مكتملة.",
  },
  {
    id: "volok-437",
    title: "هامشا Volok. 437",
    manuscript: "مخطوطة سلافية من القرن 15 تضم هوامش بالبرمية القديمة",
    location: "المكتبة الحكومية الروسية، Volok. 437؛ الورقتان 8r و29r.",
    pageReference: "المقالة: PDF ص. 9 و12، الشكلان 1–2.",
    href: "https://www.digitalniknihovna.cz/knav/view/uuid:5eb9ffc1-6939-4983-b7ee-ec90fa70b6bc?article=uuid:742232dc-d6be-43f1-a129-06cc8df6bb43",
    visibleContent: "صورتان لموضع الهامشين الأصليين مع دراسة وقراءة مرافقة.",
    rightsNote: "العارض متاح للمشاهدة؛ لا يُعاد تضمين صوره في التطبيق إلى أن تتضح حقوق إعادة الاستخدام.",
    trainingStatus: "مادة أصلية مناسبة للتوسيم البحثي عند تأكيد الإذن؛ لا تدخل مجموعة YOLO آليًا.",
  },
];

export const primaryCorpusSummary = {
  hostedCount: hostedPrimarySources.length,
  externalCount: externalPrimarySources.length,
  totalCount: hostedPrimarySources.length + externalPrimarySources.length,
  trainingBoundary: "لا تدخل أي مادة تدريب YOLO قبل تحقق الحقوق واعتماد القراءة والوسوم وتقسيم البيانات.",
} as const;

export type SourceGalleryItem = {
  id: string;
  title: string;
  subtitle: string;
  year: string;
  holdingInstitution: string;
  catalogueRecord: string;
  sourceType: string;
  imageUrl: string;
  sourceUrl: string;
  sourceLabel: string;
  rights: string;
  rightsCategory: "public_domain";
  description: string;
  alt: string;
  wide?: boolean;
};

const TRINITY_CATALOGUE = {
  holdingInstitution: "متحف-محمية فولوغدا (القطعة الأصلية)؛ صورة التفصيل عبر Wikimedia Commons.",
  catalogueRecord: "أيقونة «الثالوث الزيرياني»؛ شريط النقش السفلي.",
  sourceType: "مصدر أولي: نقش على أيقونة",
};

const SAVVAITOV_CATALOGUE = {
  holdingInstitution: "مكتبة فولوغدا الرقمية (نسخة المسح).",
  catalogueRecord: "P. I. Savvaitov، موسكو، 1873؛ صفحات مصورة من PDF.",
  sourceType: "طبعة تاريخية مصوّرة",
};

const LYTKIN_CATALOGUE = {
  holdingInstitution: "Internet Archive (نسخة المسح المتاحة للطبعة التاريخية).",
  catalogueRecord: "G. S. Lytkin، 1889؛ صفحات من قسم «الكتابة الزيريانية القديمة».",
  sourceType: "طبعة تاريخية مصوّرة",
};

export const sourceGalleryItems: SourceGalleryItem[] = [
  {
    id: "zyryanskaya-trinity-inscription",
    ...TRINITY_CATALOGUE,
    title: "شريط نقش الثالوث الزيرياني",
    subtitle: "نقش بالبرمية القديمة على أيقونة الثالوث",
    year: "القرن 14",
    imageUrl: "/manus-storage/zyryanskaya-trinity-inscription-preview_2e47a56f.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Zyryanskaya_trinity_text.jpg",
    sourceLabel: "Wikimedia Commons",
    rights: "ملكية عامة / لا قيود معروفة بحسب صفحة الملف.",
    rightsCategory: "public_domain",
    description: "صورة تفصيلية للنقش السفلي في أيقونة الثالوث الزيرياني. تُعرض هنا بوصفها مصدرًا أوليًا للتصفح، لا كتفريغ أو قراءة نهائية.",
    alt: "شريط كتابة قديمة على أيقونة الثالوث الزيرياني",
    wide: true,
  },
  {
    id: "savvaitov-title",
    ...SAVVAITOV_CATALOGUE,
    title: "صفحة عنوان طبعة ساففايتوف",
    subtitle: "عن التقاويم الخشبية الزيريانية والأبجدية البرمية",
    year: "1873",
    imageUrl: "/manus-storage/savvaitov-1873-01_a627b43e.jpg",
    sourceUrl: "https://www.booksite.ru/fulltext/zyrya/index.htm",
    sourceLabel: "مكتبة فولوغدا الرقمية",
    rights: "العمل التاريخي في الملكية العامة بحكم العمر؛ المسح الرقمي من مكتبة فولوغدا.",
    rightsCategory: "public_domain",
    description: "واجهة الطبعة المصوّرة التي تجمع مواد عن التقاويم والأبجدية البرمية القديمة.",
    alt: "صفحة عنوان طبعة ساففايتوف 1873",
  },
  {
    id: "savvaitov-opening",
    ...SAVVAITOV_CATALOGUE,
    title: "افتتاح الدراسة المصوّرة",
    subtitle: "التمهيد الزخرفي للطبعة",
    year: "1873",
    imageUrl: "/manus-storage/savvaitov-1873-02_55889f41.jpg",
    sourceUrl: "https://www.booksite.ru/fulltext/zyrya/index.htm",
    sourceLabel: "مكتبة فولوغدا الرقمية",
    rights: "العمل التاريخي في الملكية العامة بحكم العمر؛ المسح الرقمي من مكتبة فولوغدا.",
    rightsCategory: "public_domain",
    description: "صفحة افتتاحية من المسح التاريخي، مفيدة لفهم سياق نشر المادة البصرية في القرن التاسع عشر.",
    alt: "صفحة افتتاحية مزخرفة من طبعة ساففايتوف 1873",
  },
  {
    id: "savvaitov-script-sample",
    ...SAVVAITOV_CATALOGUE,
    title: "مثال مكتوب بالأبجدية البرمية",
    subtitle: "صفحة من طبعة ساففايتوف",
    year: "1873",
    imageUrl: "/manus-storage/savvaitov-1873-03_573450ed.jpg",
    sourceUrl: "https://www.booksite.ru/fulltext/zyrya/index.htm",
    sourceLabel: "مكتبة فولوغدا الرقمية",
    rights: "العمل التاريخي في الملكية العامة بحكم العمر؛ المسح الرقمي من مكتبة فولوغدا.",
    rightsCategory: "public_domain",
    description: "تتضمن الصفحة مثالًا مرسومًا للكتابة البرمية في سياق شرح تاريخي، ولذلك تُعرض منفصلة عن صور المخطوطات الأصلية.",
    alt: "صفحة تاريخية فيها مثال على كتابة برمية قديمة",
  },
  {
    id: "savvaitov-calendar-annotations-1",
    ...SAVVAITOV_CATALOGUE,
    title: "تقاويم وعلامات تقليدية",
    subtitle: "الصفحة 3 في تسلسل الطبعة",
    year: "1873",
    imageUrl: "/manus-storage/savvaitov-1873-04_0c9ff822.jpg",
    sourceUrl: "https://www.booksite.ru/fulltext/zyrya/index.htm",
    sourceLabel: "مكتبة فولوغدا الرقمية",
    rights: "العمل التاريخي في الملكية العامة بحكم العمر؛ المسح الرقمي من مكتبة فولوغدا.",
    rightsCategory: "public_domain",
    description: "صفحة توثيقية في التقاويم الزيريانية؛ تفيد في دراسة الاستقبال البصري للنظام الكتابي، وليست نصًا مخصصًا لتدريب OCR.",
    alt: "صفحة من تقويم زيرياني مصور في طبعة 1873",
  },
  {
    id: "savvaitov-calendar-annotations-2",
    ...SAVVAITOV_CATALOGUE,
    title: "تقاويم وعلامات تقليدية",
    subtitle: "الصفحة 4 في تسلسل الطبعة",
    year: "1873",
    imageUrl: "/manus-storage/savvaitov-1873-05_44040f76.jpg",
    sourceUrl: "https://www.booksite.ru/fulltext/zyrya/index.htm",
    sourceLabel: "مكتبة فولوغدا الرقمية",
    rights: "العمل التاريخي في الملكية العامة بحكم العمر؛ المسح الرقمي من مكتبة فولوغدا.",
    rightsCategory: "public_domain",
    description: "استمرار للمواد التوثيقية عن العلامات والتقاويم في الطبعة العامة.",
    alt: "صفحة إضافية من تقويم زيرياني مصور في طبعة 1873",
  },
  {
    id: "lytkin-section-title",
    ...LYTKIN_CATALOGUE,
    title: "بداية قسم الكتابة الزيريانية القديمة",
    subtitle: "طبعة ليتكين المصوّرة",
    year: "1889",
    imageUrl: "/manus-storage/lytkin-1889-036_bac1c8d9.jpg",
    sourceUrl: "https://archive.org/details/zyrianska1889",
    sourceLabel: "Internet Archive",
    rights: "العمل التاريخي في الملكية العامة بحكم العمر؛ المسح متاح من Internet Archive.",
    rightsCategory: "public_domain",
    description: "صفحة فاتحة لقسم مخصص للكتابة الزيريانية/البرمية القديمة داخل طبعة ليتكين.",
    alt: "صفحة بداية قسم الكتابة الزيريانية القديمة في طبعة ليتكين 1889",
  },
  {
    id: "lytkin-script-page-1",
    ...LYTKIN_CATALOGUE,
    title: "الكتابة الزيريانية القديمة",
    subtitle: "متابعة قسم الطبعة المصوّرة",
    year: "1889",
    imageUrl: "/manus-storage/lytkin-1889-037_799f6e9b.jpg",
    sourceUrl: "https://archive.org/details/zyrianska1889",
    sourceLabel: "Internet Archive",
    rights: "العمل التاريخي في الملكية العامة بحكم العمر؛ المسح متاح من Internet Archive.",
    rightsCategory: "public_domain",
    description: "صفحة تاريخية من القسم الباليوغرافي، تُقرأ مع سياق الطبعة الكاملة والرابط إلى العارض الأصلي.",
    alt: "صفحة من قسم الكتابة الزيريانية القديمة في طبعة ليتكين 1889",
  },
  {
    id: "lytkin-script-page-2",
    ...LYTKIN_CATALOGUE,
    title: "مواد تاريخية عن أبجدية Abur",
    subtitle: "متابعة قسم الطبعة المصوّرة",
    year: "1889",
    imageUrl: "/manus-storage/lytkin-1889-038_b02db39e.jpg",
    sourceUrl: "https://archive.org/details/zyrianska1889",
    sourceLabel: "Internet Archive",
    rights: "العمل التاريخي في الملكية العامة بحكم العمر؛ المسح متاح من Internet Archive.",
    rightsCategory: "public_domain",
    description: "وثيقة تاريخية للتصفح والمقارنة؛ لا تحل محل مخطوطة محفوظة أو طبعة نقدية حديثة.",
    alt: "صفحة من مواد أبجدية Abur في طبعة ليتكين 1889",
  },
  {
    id: "lytkin-script-page-3",
    ...LYTKIN_CATALOGUE,
    title: "تكملة القسم الباليوغرافي",
    subtitle: "طبعة ليتكين المصوّرة",
    year: "1889",
    imageUrl: "/manus-storage/lytkin-1889-039_2c92d6af.jpg",
    sourceUrl: "https://archive.org/details/zyrianska1889",
    sourceLabel: "Internet Archive",
    rights: "العمل التاريخي في الملكية العامة بحكم العمر؛ المسح متاح من Internet Archive.",
    rightsCategory: "public_domain",
    description: "صورة من الامتداد الأول للقسم الخاص بالكتابة الزيريانية القديمة في طبعة 1889.",
    alt: "صفحة من القسم الباليوغرافي في طبعة ليتكين 1889",
  },
];

export const externalSourceLinks = [
  {
    title: "أيقونة الثالوث الزيرياني، اللوحة الكاملة",
    note: "تُعرض في القاعدة الأكاديمية، لكن حقوق إعادة النشر داخل التطبيق غير متحققة.",
    href: "https://icons.pstgu.ru/icon/2555",
  },
  {
    title: "حواشٍ برمية قديمة: Grinščenko & Ponarjadov 2021",
    note: "مقال مفتوح يتضمن صور مخطوطات؛ يُفتح في موقع الناشر ولا يعاد تخزين صوره هنا.",
    href: "https://ural-altai.ru/userfiles/files/publications/Uralaltai-43-8-35.pdf",
  },
  {
    title: "هوامش Volok. 437: Lytvynenko & Grishchenko 2022",
    note: "عارض صفحات للمقالة والنص الكامل؛ لا يُعاد تضمين الصور داخل التطبيق إلى حين تحقق الترخيص.",
    href: "https://www.digitalniknihovna.cz/knav/view/uuid:5eb9ffc1-6939-4983-b7ee-ec90fa70b6bc?article=uuid:742232dc-d6be-43f1-a129-06cc8df6bb43",
  },
];

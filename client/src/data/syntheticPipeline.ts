export type SyntheticStage = {
  id: string;
  title: string;
  goal: string;
  layout: "isolated-glyph" | "scattered-glyph" | "ordered-lines" | "structured-pages" | "gated";
  profile: string;
  controls: string[];
  gate: string;
  status: "ready" | "gated";
  previewUrl?: string;
  previewRun?: { samples: number; seed: number };
  galleryUrls?: string[];
};

export const syntheticStages: SyntheticStage[] = [
  {
    id: "s0-unicode-clean",
    title: "S0 · حرف مفرد نظيف",
    goal: "إنشاء مثيل بصري واحد لحرف برمي واحد في كل صورة للتحقق من خريطة الفئات ووسم YOLO الحرفي.",
    layout: "isolated-glyph",
    profile: "unicode-clean",
    controls: ["حرف واحد لكل صورة", "بذرة ثابتة", "Noto Sans Old Permic", "مربع YOLO واحد"],
    gate: "ينجح الفحص المرئي وتظهر الفئات الـ38 في كل تقسيم قبل أي تدريب baseline.",
    status: "ready",
    previewUrl: "/manus-storage/old-permic-s0-isolated-glyph-preview_bc66411c.png",
    previewRun: { samples: 6, seed: 10350 },
    galleryUrls: ["/manus-storage/s0-v1-class-00_83f6c8a7.png", "/manus-storage/s0-v1-class-01_608dda91.png", "/manus-storage/s0-v1-class-02_fa14cb52.png", "/manus-storage/s0-v1-class-03_0dc327e9.png", "/manus-storage/s0-v1-class-04_8cb1c5b4.png", "/manus-storage/s0-v1-class-05_73be1afe.png"],
  },
  {
    id: "s0-controlled-deformation",
    title: "S0-d · محرف أصغر متناثر بضبط",
    goal: "تعليم الكاشف محرفًا واحدًا أصغر في مواضع صفحة متغيرة، مع تشويه مضبوط ومن دون كلمات أو صور مخطوطات.",
    layout: "scattered-glyph",
    profile: "controlled-deformation",
    controls: ["حرف واحد أصغر لكل صورة", "موضع صفحة عشوائي آمن", "تدوير حرفي محدود", "ضجيج ببذرة قابلة للإعادة"],
    gate: "تسجل كل تجربة profile والبذرة والمعلمات في manifest مستقل.",
    status: "ready",
    previewUrl: "/manus-storage/old_permic_scattered-glyph_controlled-deformation_00000_db39f2fe.png",
    previewRun: { samples: 6, seed: 20350 },
    galleryUrls: ["/manus-storage/old_permic_scattered-glyph_controlled-deformation_00000_db39f2fe.png", "/manus-storage/old_permic_scattered-glyph_controlled-deformation_00001_d9e47b5d.png", "/manus-storage/old_permic_scattered-glyph_controlled-deformation_00002_e1279596.png", "/manus-storage/old_permic_scattered-glyph_controlled-deformation_00003_fe979d06.png", "/manus-storage/old_permic_scattered-glyph_controlled-deformation_00004_de32b40e.png", "/manus-storage/old_permic_scattered-glyph_controlled-deformation_00005_008d95a3.png"],
  },
  {
    id: "s1-ordered-lines",
    title: "S1 · أسطر حروف منظمة",
    goal: "ترتيب حروف متعددة على أسطر بصرية مع وسوم منفصلة لكل حرف؛ لا تفترض هذه المرحلة كلمات أو معجمًا.",
    layout: "ordered-lines",
    profile: "manuscript-inspired",
    controls: ["ترتيب بصري لا لغوي", "لون ورق", "ضجيج أعلى", "تباعد سطور متغير"],
    gate: "تراجع كثافة الحروف والتفاف السطر قبل الانتقال إلى صفحات صناعية منظمة S2.",
    status: "ready",
    previewUrl: "/manus-storage/old-permic-s1-lines-preview_53a3a118.png",
    previewRun: { samples: 6, seed: 30350 },
    galleryUrls: ["/manus-storage/s1-lines-00_512b8f15.png", "/manus-storage/s1-lines-01_65b6b1d2.png", "/manus-storage/s1-lines-02_98dc67f3.png", "/manus-storage/s1-lines-03_db3dc4ee.png", "/manus-storage/s1-lines-04_75da2c13.png", "/manus-storage/s1-lines-05_30bf36ac.png"],
  },
  {
    id: "s2-structured-pages",
    title: "S2 · صفحات صناعية منظمة",
    goal: "تركيب أسطر حروف داخل مناطق صفحة ذات عمود واحد أو عمودين، مع مربع YOLO مستقل لكل حرف وسجل للصفحة والسطر وترتيب القراءة.",
    layout: "structured-pages",
    profile: "manuscript-inspired",
    controls: ["صفحة أحادية/متعددة الأعمدة", "ترتيب قراءة مسجل", "مربعات حرفية مستقلة", "lineage للصفحة والسطر"],
    gate: "تتطابق صور الصفحة ووسومها وسجل النسب حرفيًا عند إعادة التوليد بالبذرة نفسها.",
    status: "ready",
    previewUrl: "/manus-storage/old-permic-s2-structured-page-preview_1d9ce770.png",
    previewRun: { samples: 6, seed: 40350 },
    galleryUrls: ["/manus-storage/s2-pages-00_1c89f436.png", "/manus-storage/s2-pages-01_b9ded7c3.png", "/manus-storage/s2-pages-02_c01cded3.png", "/manus-storage/s2-pages-03_8dc40335.png", "/manus-storage/s2-pages-04_e01cbca6.png", "/manus-storage/s2-pages-05_110aadc8.png"],
  },
  {
    id: "real-data-adaptation",
    title: "تكييف على مخطوطات حقيقية",
    goal: "دمج قصاصات برمية حقيقية بعد الإذن والقراءة والوسم المتحقق منه.",
    layout: "gated",
    profile: "gated",
    controls: ["حقوق متحققة", "قراءة مرجعية", "مربعات معتمدة", "تقسيم حسب المصدر"],
    gate: "يتطلب corpus حقيقيًا موسومًا؛ لا ينفذ تلقائيًا داخل المختبر.",
    status: "gated",
  },
];

export const syntheticPipelineBoundary = "الصور الصناعية تدرب كاشف الحروف من الخط: S0 لحرف مفرد، ثم S1 للأسطر المنظمة، ثم S2 للصفحات المنظمة. لا تمثل هذه المرحلة كلمات أو خطًا تاريخيًا؛ تبقى صلاحية OCR النهائية مرهونة ببيانات برمية قديمة حقيقية وموسومة.";

export const syntheticUnicodeFacts = {
  assignedClassCount: 38,
  font: "Noto Sans Old Permic",
  generatorPath: "training/synthetic/generate_old_permic_synthetic.py",
  initialLayout: "isolated-glyph",
  labelFormat: "YOLO: class_id center_x center_y width height",
} as const;

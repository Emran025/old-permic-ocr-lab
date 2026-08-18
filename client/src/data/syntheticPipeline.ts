export type SyntheticStage = {
  id: string;
  title: string;
  goal: string;
  layout: "isolated-glyph" | "ordered-lines" | "structured-pages" | "gated";
  profile: string;
  controls: string[];
  gate: string;
  status: "ready" | "gated";
  previewUrl?: string;
  previewRun?: { samples: number; seed: number };
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
  },
  {
    id: "s0-controlled-deformation",
    title: "S0 · حرف مفرد مشوّه بضبط",
    goal: "تعليم الكاشف متانة أولية للحرف الواحد من دون إخفاء مصدر أي تغيير بصري.",
    layout: "isolated-glyph",
    profile: "controlled-deformation",
    controls: ["حرف واحد لكل صورة", "تدوير حرفي محدود", "اهتزاز حبر", "ضجيج ببذرة قابلة للإعادة"],
    gate: "تسجل كل تجربة profile والبذرة والمعلمات في manifest مستقل.",
    status: "ready",
    previewUrl: "/manus-storage/old-permic-s0-controlled-preview_eb425574.png",
    previewRun: { samples: 6, seed: 20350 },
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

export type SyntheticStage = {
  id: string;
  title: string;
  goal: string;
  profile: string;
  controls: string[];
  gate: string;
  status: "ready" | "gated";
  previewUrl?: string;
  previewRun?: { samples: number; seed: number };
};

export const syntheticStages: SyntheticStage[] = [
  {
    id: "unicode-clean",
    title: "Unicode نظيف",
    goal: "التحقق من خريطة الفئات وصيغة YOLO والرسم بالخط الداعم للبرمية القديمة.",
    profile: "unicode-clean",
    controls: ["بذرة ثابتة", "Noto Sans Old Permic", "خلفية موحدة", "مربعات حرفية تلقائية"],
    gate: "ينجح الفحص المرئي والاختبار المصغر قبل أي تدريب baseline.",
    status: "ready",
    previewUrl: "/manus-storage/unicode-clean_9e57de84.png",
    previewRun: { samples: 12, seed: 10350 },
  },
  {
    id: "controlled-deformation",
    title: "تشويه صناعي مضبوط",
    goal: "تعليم النموذج متانة أولية من دون إخفاء مصدر كل تغير.",
    profile: "controlled-deformation",
    controls: ["تدوير حرفي محدود", "اهتزاز حبر", "ضباب خفيف", "ضجيج ببذرة قابلة للإعادة"],
    gate: "تسجل كل تجربة profile والبذرة والمعلمات في manifest مستقل.",
    status: "ready",
    previewUrl: "/manus-storage/controlled-deformation_6788cee9.png",
    previewRun: { samples: 6, seed: 20350 },
  },
  {
    id: "manuscript-inspired",
    title: "تقريب مخطوطي محدود",
    goal: "تقليص فجوة المجال قبل إدخال صور حقيقية، لا تقليدها أو استبدالها.",
    profile: "manuscript-inspired",
    controls: ["لون ورق", "ضجيج أعلى", "ضباب مضبوط", "تباعد سطور متغير"],
    gate: "لا ينتقل إلى التدريب الفعلي إلا بعد مقارنة ببيانات حقيقية موسومة ومقسمة مستقلًا.",
    status: "ready",
    previewUrl: "/manus-storage/manuscript-inspired_55ffd65c.png",
    previewRun: { samples: 6, seed: 30350 },
  },
  {
    id: "real-data-adaptation",
    title: "تكييف على مخطوطات حقيقية",
    goal: "دمج قصاصات برمية حقيقية بعد الإذن والقراءة والوسم المتحقق منه.",
    profile: "gated",
    controls: ["حقوق متحققة", "قراءة مرجعية", "مربعات معتمدة", "تقسيم حسب المصدر"],
    gate: "يتطلب corpus حقيقيًا موسومًا؛ لا ينفذ تلقائيًا داخل المختبر.",
    status: "gated",
  },
];

export const syntheticPipelineBoundary = "الصور الصناعية تختبر بنية النموذج ولا تمثل شكل الخط التاريخي؛ تبقى صلاحية النموذج النهائية مرهونة ببيانات برمية قديمة حقيقية وموسومة.";

export const syntheticUnicodeFacts = {
  assignedClassCount: 38,
  font: "Noto Sans Old Permic",
  generatorPath: "training/synthetic/generate_old_permic_synthetic.py",
  labelFormat: "YOLO: class_id center_x center_y width height",
} as const;

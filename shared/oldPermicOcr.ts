export type OldPermicDetection = {
  classId: number;
  label: string;
  confidence: number;
  /** Coordinates are normalized to the source image as values from 0 to 100. */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type PixelDetection = Omit<OldPermicDetection, "x1" | "y1" | "x2" | "y2"> & {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export function normalizeDetection(
  detection: PixelDetection,
  imageWidth: number,
  imageHeight: number,
): OldPermicDetection {
  if (imageWidth <= 0 || imageHeight <= 0) {
    throw new Error("Image dimensions must be positive.");
  }
  const toPercent = (value: number, denominator: number) => Math.min(100, Math.max(0, (value / denominator) * 100));
  return {
    ...detection,
    x1: toPercent(detection.x1, imageWidth),
    y1: toPercent(detection.y1, imageHeight),
    x2: toPercent(detection.x2, imageWidth),
    y2: toPercent(detection.y2, imageHeight),
  };
}

export type AnalysisStatus = "pending" | "model_not_configured" | "completed" | "failed";

export const MODEL_STATUS = {
  available: false,
  engine: "YOLO",
  message:
    "لم يُربط بعد وزن YOLO مدرّب للبرمية القديمة. يمكن حفظ الصورة ومراجعتها، لكن لا يمكن إنتاج كشف موثوق قبل توفير النموذج.",
} as const;

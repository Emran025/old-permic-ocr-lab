export type DetectionForLayout = {
  label: string;
  confidence: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export function readingOrder(detections: DetectionForLayout[]) {
  return [...detections].sort((a, b) => {
    const aCenterY = (a.y1 + a.y2) / 2;
    const bCenterY = (b.y1 + b.y2) / 2;
    if (Math.abs(aCenterY - bCenterY) > 18) return aCenterY - bCenterY;
    return a.x1 - b.x1;
  });
}

export function extractedReadingText(detections: DetectionForLayout[]) {
  return readingOrder(detections)
    .map((detection) => detection.label)
    .join("");
}

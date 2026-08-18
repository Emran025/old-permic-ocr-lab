import type { DetectionForLayout } from "@/lib/analysisLayout";

export default function DetectionCanvas({
  imageUrl,
  detections,
  alt,
}: {
  imageUrl: string;
  detections: DetectionForLayout[];
  alt: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#171b17] shadow-[0_24px_48px_rgba(33,42,34,0.18)]">
      <img src={imageUrl} alt={alt} className="block max-h-[620px] w-full object-contain" />
      <div className="pointer-events-none absolute inset-0">
        {detections.map((detection, index) => (
          <div
            key={`${detection.label}-${index}-${detection.x1}`}
            className="absolute border-2 border-[#e4a965] bg-[#e4a965]/10 shadow-[0_0_0_1px_rgba(43,75,64,0.28)]"
            style={{
              left: `${detection.x1}%`,
              top: `${detection.y1}%`,
              width: `${Math.max(0, detection.x2 - detection.x1)}%`,
              height: `${Math.max(0, detection.y2 - detection.y1)}%`,
            }}
          >
            <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-[#2b4b40] px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {detection.label} · {Math.round(detection.confidence * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

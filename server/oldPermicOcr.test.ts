import { describe, expect, it } from "vitest";
import { parseImageDataUrl, safeFileName } from "./oldPermicOcr";
import { normalizeDetection } from "../shared/oldPermicOcr";
import { decodeYoloV8Output, nonMaximumSuppress } from "./onnxOldPermicInference";

describe("old permic OCR upload helpers", () => {
  it("accepts an image PNG data URL", () => {
    const payload = "data:image/png;base64,aGVsbG8=";
    const result = parseImageDataUrl(payload);
    expect(result.mimeType).toBe("image/png");
    expect(result.buffer.toString()).toBe("hello");
  });

  it("rejects a non-image data URL", () => {
    expect(() => parseImageDataUrl("data:text/plain;base64,aGVsbG8=")).toThrow("اختر صورة PNG أو JPG أو WebP صالحة.");
  });

  it("normalizes a storage-safe filename", () => {
    expect(safeFileName("نقش قديم (1).png")).toBe("-1-.png");
  });

  it("normalizes pixel boxes to the percentage contract used by the web overlay", () => {
    expect(
      normalizeDetection(
        { classId: 0, label: "glyph", confidence: 0.91, x1: 10, y1: 20, x2: 50, y2: 70 },
        100,
        100,
      ),
    ).toMatchObject({ x1: 10, y1: 20, x2: 50, y2: 70 });
  });

  it("decodes YOLOv8 class scores and maps letterboxed pixels back to the source image", () => {
    const predictions = 2;
    const values = new Float32Array(42 * predictions);
    values[0] = 480; values[predictions] = 480; values[2 * predictions] = 240; values[3 * predictions] = 120;
    values[4 * predictions] = 0.1; values[5 * predictions] = 0.1;
    values[(4 + 3) * predictions] = 0.91;
    const detections = decodeYoloV8Output(values, predictions, Array.from({ length: 38 }, (_, index) => `g${index}`), { width: 480, height: 480, scale: 2, left: 0, top: 0 }, 0.25, 0.45);
    expect(detections).toHaveLength(1);
    expect(detections[0]).toMatchObject({ classId: 3, label: "g3", x1: 180, y1: 210, x2: 300, y2: 270 });
    expect(detections[0]?.confidence).toBeCloseTo(0.91, 6);
  });

  it("suppresses overlapping candidates only inside the same glyph class", () => {
    const candidates = [
      { classId: 1, label: "A", confidence: 0.9, x1: 10, y1: 10, x2: 50, y2: 50 },
      { classId: 1, label: "A", confidence: 0.8, x1: 12, y1: 12, x2: 52, y2: 52 },
      { classId: 2, label: "B", confidence: 0.7, x1: 12, y1: 12, x2: 52, y2: 52 },
    ];
    expect(nonMaximumSuppress(candidates, 0.45)).toHaveLength(2);
  });
});

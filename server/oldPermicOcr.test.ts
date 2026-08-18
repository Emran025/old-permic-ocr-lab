import { describe, expect, it } from "vitest";
import { parseImageDataUrl, safeFileName } from "./oldPermicOcr";
import { normalizeDetection } from "../shared/oldPermicOcr";

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
});

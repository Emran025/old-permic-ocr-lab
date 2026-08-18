import { describe, expect, it } from "vitest";
import { extractedReadingText, readingOrder } from "./analysisLayout";

describe("analysis reading order", () => {
  const detections = [
    { label: "C", confidence: 0.9, x1: 10, y1: 42, x2: 20, y2: 54 },
    { label: "B", confidence: 0.9, x1: 34, y1: 8, x2: 44, y2: 20 },
    { label: "A", confidence: 0.9, x1: 4, y1: 8, x2: 14, y2: 20 },
  ];

  it("sorts regions from the top line and then left to right", () => {
    expect(readingOrder(detections).map((item) => item.label)).toEqual(["A", "B", "C"]);
  });

  it("builds an extracted sequence from the ordered detections", () => {
    expect(extractedReadingText(detections)).toBe("ABC");
  });
});

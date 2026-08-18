import { describe, expect, it } from "vitest";
import { syntheticTrainingGallery, syntheticTrainingSummary } from "./syntheticTrainingGallery";

describe("synthetic training gallery", () => {
  it("keeps one browsable sample for every balanced S0 character class outside the primary corpus", () => {
    expect(syntheticTrainingGallery).toHaveLength(38);
    expect(new Set(syntheticTrainingGallery.map((item) => item.classId)).size).toBe(38);
    expect(syntheticTrainingGallery.every((item) => item.imageUrl.startsWith("/manus-storage/") && item.split === "train")).toBe(true);
    expect(syntheticTrainingSummary).toMatchObject({ totalImages: 7600, trainImages: 6080, validationImages: 760, testImages: 760, classes: 38 });
    expect(syntheticTrainingSummary.trainingBoundary).toContain("لا تدخل corpus المخطوطات");
  });
});

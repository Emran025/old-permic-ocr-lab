import { describe, expect, it } from "vitest";
import { syntheticPipelineBoundary, syntheticStages } from "./syntheticPipeline";

describe("synthetic Old Permic pipeline", () => {
  it("keeps Unicode stages reproducible and blocks real-data adaptation until annotation", () => {
    expect(syntheticStages).toHaveLength(4);
    expect(syntheticStages.slice(0, 3).every((stage) => stage.status === "ready" && stage.controls.length >= 4)).toBe(true);
    expect(syntheticStages.at(-1)).toMatchObject({ id: "real-data-adaptation", status: "gated" });
    expect(syntheticPipelineBoundary).toContain("بيانات برمية قديمة حقيقية");
  });
});

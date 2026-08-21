import { describe, expect, it } from "vitest";
import { syntheticPipelineBoundary, syntheticStages } from "./syntheticPipeline";

describe("synthetic Old Permic pipeline", () => {
  it("starts with centered S0 then scattered S0-d, then ordered lines, and blocks real-data adaptation until annotation", () => {
    expect(syntheticStages).toHaveLength(5);
    expect(syntheticStages.slice(0, 4).every((stage) => stage.status === "ready" && stage.controls.length >= 4)).toBe(true);
    expect(syntheticStages.at(0)).toMatchObject({ layout: "isolated-glyph" });
    expect(syntheticStages.at(1)).toMatchObject({ layout: "scattered-glyph" });
    expect(syntheticStages.at(2)).toMatchObject({ layout: "ordered-lines" });
    expect(syntheticStages.at(3)).toMatchObject({ layout: "structured-pages" });
    expect(syntheticStages.slice(0, 4).every((stage) => stage.galleryUrls?.length === 6)).toBe(true);
    expect(syntheticStages.at(-1)).toMatchObject({ id: "real-data-adaptation", status: "gated" });
    expect(syntheticPipelineBoundary).toContain("حرف مفرد");
  });
});

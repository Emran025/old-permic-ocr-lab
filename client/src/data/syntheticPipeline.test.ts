import { describe, expect, it } from "vitest";
import { syntheticPipelineBoundary, syntheticStages } from "./syntheticPipeline";

describe("synthetic Old Permic pipeline", () => {
  it("starts with isolated character assets, then ordered lines, and blocks real-data adaptation until annotation", () => {
    expect(syntheticStages).toHaveLength(5);
    expect(syntheticStages.slice(0, 4).every((stage) => stage.status === "ready" && stage.controls.length >= 4)).toBe(true);
    expect(syntheticStages.slice(0, 2).every((stage) => stage.layout === "isolated-glyph")).toBe(true);
    expect(syntheticStages.at(2)).toMatchObject({ layout: "ordered-lines" });
    expect(syntheticStages.at(3)).toMatchObject({ layout: "structured-pages" });
    expect(syntheticStages.at(-1)).toMatchObject({ id: "real-data-adaptation", status: "gated" });
    expect(syntheticPipelineBoundary).toContain("حرف مفرد");
  });
});

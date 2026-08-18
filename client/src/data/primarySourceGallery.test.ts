import { describe, expect, it } from "vitest";
import { contextualSources, externalPrimarySources, hostedPrimarySources, primaryCorpusSummary, primaryTextSources } from "./primarySourceGallery";

describe("primary-text corpus catalogue", () => {
  it("contains only primary-text records with traceable holding and rights notes", () => {
    expect(hostedPrimarySources).toHaveLength(14);
    expect(primaryTextSources).toHaveLength(13);
    expect(contextualSources).toHaveLength(1);
    expect(externalPrimarySources).toHaveLength(1);
    expect(hostedPrimarySources.every((item) => item.sourceUrl.startsWith("https://"))).toBe(true);
    expect(hostedPrimarySources.every((item) => item.trainingStatus.length > 25)).toBe(true);
    expect(externalPrimarySources.every((item) => item.href.startsWith("https://") && item.visibleContent.length > 25)).toBe(true);
    expect(externalPrimarySources.every((item) => item.location.length > 20 && item.rightsNote.length > 20 && item.manuscript.length > 10)).toBe(true);
    expect(hostedPrimarySources.every((item) => item.holdingInstitution.length > 15 && item.rights.length > 15)).toBe(true);
    expect(primaryTextSources.every((item) => item.corpusRole === "primary-text" && item.description.includes("برمي"))).toBe(true);
    expect(contextualSources.every((item) => item.corpusRole === "contextual")).toBe(true);
    expect(primaryCorpusSummary).toMatchObject({ hostedCount: 13, externalCount: 1, totalCount: 14 });
    expect(primaryCorpusSummary.trainingBoundary).toContain("YOLO");
  });
});

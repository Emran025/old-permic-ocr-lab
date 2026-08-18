import { describe, expect, it } from "vitest";
import { externalPrimarySources, hostedPrimarySources, primaryCorpusSummary } from "./primarySourceGallery";

describe("primary-text corpus catalogue", () => {
  it("contains only primary-text records with traceable holding and rights notes", () => {
    expect(hostedPrimarySources).toHaveLength(3);
    expect(externalPrimarySources).toHaveLength(5);
    expect(hostedPrimarySources.every((item) => item.sourceUrl.startsWith("https://"))).toBe(true);
    expect(hostedPrimarySources.every((item) => item.trainingStatus.includes("تدريب") || item.trainingStatus.includes("وسم"))).toBe(true);
    expect(externalPrimarySources.every((item) => item.href.startsWith("https://") && item.visibleContent.length > 25)).toBe(true);
    expect(externalPrimarySources.every((item) => item.location.length > 20 && item.rightsNote.length > 20 && item.manuscript.length > 10)).toBe(true);
    expect(hostedPrimarySources.every((item) => item.holdingInstitution.length > 15 && item.rights.length > 15)).toBe(true);
    expect(primaryCorpusSummary).toMatchObject({ hostedCount: 3, externalCount: 5, totalCount: 8 });
    expect(primaryCorpusSummary.trainingBoundary).toContain("YOLO");
  });
});

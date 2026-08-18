import { describe, expect, it } from "vitest";
import { sourceGalleryItems } from "./sourceGallery";

describe("source gallery catalogue", () => {
  it("contains distinct, attributed public-domain images", () => {
    expect(sourceGalleryItems).toHaveLength(10);
    expect(new Set(sourceGalleryItems.map((item) => item.id)).size).toBe(sourceGalleryItems.length);
    expect(sourceGalleryItems.every((item) => item.imageUrl.startsWith("/manus-storage/"))).toBe(true);
    expect(sourceGalleryItems.every((item) => item.sourceUrl.startsWith("https://"))).toBe(true);
    expect(sourceGalleryItems.every((item) => item.rightsCategory === "public_domain")).toBe(true);
    expect(sourceGalleryItems.every((item) => item.holdingInstitution.length > 8)).toBe(true);
    expect(sourceGalleryItems.every((item) => item.catalogueRecord.length > 8)).toBe(true);
    expect(sourceGalleryItems.every((item) => item.sourceType.length > 4)).toBe(true);
  });
});

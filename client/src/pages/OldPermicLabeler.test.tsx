import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import OldPermicLabeler, { cropTileFilename, displayedBox, OLD_PERMIC_CLASSES, rotatePoint, unrotatePoint } from "./OldPermicLabeler";

vi.mock("@/components/ResearchHeader", () => ({ default: () => <header>التنقل</header> }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    annotation: {
      workspace: { useQuery: () => ({ data: undefined, refetch: vi.fn() }) },
      upload: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      importSource: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      save: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      exportReviewReady: { useQuery: () => ({ data: undefined, refetch: vi.fn(), isFetching: false }) },
    },
  },
}));

describe("OldPermicLabeler", () => {
  it("keeps a local YOLO labeling surface restricted to the Old Permic class inventory", () => {
    const markup = renderToStaticMarkup(<OldPermicLabeler />);
    expect(OLD_PERMIC_CLASSES).toHaveLength(38);
    expect(OLD_PERMIC_CLASSES[0]).toMatchObject({ id: 0, glyph: "𐍐", codepoint: "U+10350" });
    expect(OLD_PERMIC_CLASSES.at(-1)).toMatchObject({ id: 37, glyph: "𐍵", codepoint: "U+10375" });
    expect(markup).toContain("ورشة وسم البرمية القديمة");
    expect(markup).toContain("YOLO Detection");
    expect(markup).toContain("تُحفظ الصور المرفوعة");
    expect(markup).toContain("تقتصر القائمة على 38 محرفًا");
    expect(markup).toContain("لا تدخل صورة إلى حزمة التدريب");
    expect(markup).toContain("تصدير المراجَع");
    expect(markup).toContain("300%");
    expect(markup).toContain('max="400"');
    expect(markup).toContain("تقطيع قبل الإضافة");
    expect(markup).toContain("ارسم المقاطع المطلوبة");
  });

  it("maps rotated display coordinates back to the original YOLO coordinate space", () => {
    const original = { x: 20, y: 30 };
    expect(rotatePoint(original, "90")).toEqual({ x: 70, y: 20 });
    expect(unrotatePoint({ x: 70, y: 20 }, "90")).toEqual(original);
    expect(displayedBox({ id: "box", classId: 0, x: 20, y: 30, width: 10, height: 20 }, "90")).toEqual({ x: 50, y: 20, width: 20, height: 10 });
  });

  it("names persisted crop tiles deterministically without retaining the large original image", () => {
    expect(cropTileFilename("Likh 360 fol. 66v.png", 0)).toBe("Likh-360-fol.-66v-tile-01.webp");
    expect(cropTileFilename("مخطوطة كبيرة.jpg", 11)).toBe("old-permic-image-tile-12.webp");
  });
});

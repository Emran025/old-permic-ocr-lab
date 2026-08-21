import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import OldPermicLabeler, { OLD_PERMIC_CLASSES } from "./OldPermicLabeler";

vi.mock("@/components/ResearchHeader", () => ({ default: () => <header>التنقل</header> }));

describe("OldPermicLabeler", () => {
  it("keeps a local YOLO labeling surface restricted to the Old Permic class inventory", () => {
    const markup = renderToStaticMarkup(<OldPermicLabeler />);
    expect(OLD_PERMIC_CLASSES).toHaveLength(38);
    expect(OLD_PERMIC_CLASSES[0]).toMatchObject({ id: 0, glyph: "𐍐", codepoint: "U+10350" });
    expect(OLD_PERMIC_CLASSES.at(-1)).toMatchObject({ id: 37, glyph: "𐍵", codepoint: "U+10375" });
    expect(markup).toContain("ورشة وسم البرمية القديمة");
    expect(markup).toContain("YOLO Detection");
    expect(markup).toContain("لا يتم رفع الصور");
    expect(markup).toContain("classes.txt");
    expect(markup).toContain("تقتصر القائمة على 38 محرفًا");
  });
});

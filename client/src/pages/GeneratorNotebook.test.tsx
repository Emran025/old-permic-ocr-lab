import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GeneratorNotebook from "./GeneratorNotebook";

vi.mock("@/components/ResearchHeader", () => ({ default: () => <header>التنقل</header> }));

describe("GeneratorNotebook page", () => {
  it("renders source-grounded Python cells and the incremental workflow", () => {
    const markup = renderToStaticMarkup(<GeneratorNotebook />);
    expect(markup).toContain("دفتر توليد الصور");
    expect(markup).toContain("render_isolated_glyph_sample");
    expect(markup).toContain("render_ordered_line_sample");
    expect(markup).toContain("render_structured_page_sample");
    expect(markup).toContain("وزن موثوق واحد للواجهة");
  });
});

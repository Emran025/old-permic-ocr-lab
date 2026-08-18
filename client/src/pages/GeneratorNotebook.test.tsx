import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GeneratorNotebook from "./GeneratorNotebook";

vi.mock("@/components/ResearchHeader", () => ({ default: () => <header>التنقل</header> }));

describe("GeneratorNotebook page", () => {
  it("embeds the real staged Jupyter notebook rather than manually rendered code", () => {
    const markup = renderToStaticMarkup(<GeneratorNotebook />);
    expect(markup).toContain("دفتر توليد الصور");
    expect(markup).toContain("/manus-storage/old-permic-synthetic-generation-notebook_d1303168.html");
    expect(markup).toContain("old_permic_synthetic_generation.ipynb");
    expect(markup).toContain("دفتر Jupyter فعلي");
  });
});

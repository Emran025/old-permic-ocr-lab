import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { syntheticStages, syntheticUnicodeFacts } from "@/data/syntheticPipeline";
import SyntheticLab from "./SyntheticLab";

vi.mock("@/components/ResearchHeader", () => ({ default: () => <header>التنقل</header> }));
vi.mock("wouter", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));

describe("SyntheticLab page", () => {
  it("renders the staged previews and blocks real-manuscript training", () => {
    const markup = renderToStaticMarkup(<SyntheticLab />);
    expect(markup).toContain("مختبر البيانات الصناعية");
    expect(markup).toContain(String(syntheticUnicodeFacts.assignedClassCount));
    syntheticStages.slice(0, 3).forEach((stage) => expect(markup).toContain(stage.title));
    expect(markup).toContain("غير مضمنة");
    expect(markup).toContain("الانتقال إلى البيانات الحقيقية");
  });
});

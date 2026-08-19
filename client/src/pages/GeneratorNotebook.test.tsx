import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GeneratorNotebook from "./GeneratorNotebook";

vi.mock("@/components/ResearchHeader", () => ({ default: () => <header>التنقل</header> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    trainingRelease: {
      status: {
        useQuery: () => ({ data: undefined, isFetching: false, refetch: vi.fn() }),
      },
    },
  },
}));

describe("GeneratorNotebook page", () => {
  it("embeds the real staged Jupyter notebook rather than manually rendered code", () => {
    const markup = renderToStaticMarkup(<GeneratorNotebook />);
    expect(markup).toContain("دفتر التوليد والتدريب");
    expect(markup).toContain("/manus-storage/old-permic-synthetic-generation-notebook_93ebfae4.html");
    expect(markup).toContain("old_permic_synthetic_generation.ipynb");
    expect(markup).toContain("دفتر Jupyter فعلي");
    expect(markup).toContain("حالة إصدار التدريب المنشور");
    expect(markup).toContain("لا يوجد إصدار منشور بعد");
  });
});

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ResearchHeader from "./ResearchHeader";

vi.mock("wouter", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>, useLocation: () => ["/"] }));

describe("ResearchHeader", () => {
  it("keeps the research routes including the generator notebook and omits account controls", () => {
    const markup = renderToStaticMarkup(<ResearchHeader />);
    ["التحليل", "المصادر", "الصناعي", "الوسم", "دفتر التوليد", "السجل"].forEach((label) => expect(markup).toContain(label));
    expect(markup).not.toContain("الوثائق");
    expect(markup).not.toContain("دخول الباحث");
    expect(markup).not.toContain("تسجيل الخروج");
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { externalPrimarySources, hostedPrimarySources, primaryCorpusSummary } from "@/data/primarySourceGallery";
import SourceLibrary from "./SourceLibrary";

vi.mock("@/components/ResearchHeader", () => ({ default: () => <header>التنقل</header> }));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

describe("SourceLibrary page smoke test", () => {
  it("renders the derived corpus count plus primary-text, provenance, rights, and training boundaries", () => {
    const markup = renderToStaticMarkup(<SourceLibrary />);

    expect(markup).toContain("مدوّنة النصوص الأصلية");
    expect(markup).toContain(`>${primaryCorpusSummary.totalCount}<`);
    expect(markup).toContain("جهة الحفظ أو المسح");
    expect(markup).toContain("الحقوق والتدريب");
    expect(markup).toContain("فوتوكوبيات مخطوطات أصلية");
    expect(markup).toContain(primaryCorpusSummary.trainingBoundary);
    hostedPrimarySources.forEach((source) => expect(markup).toContain(source.title));
    externalPrimarySources.forEach((source) => expect(markup).toContain(source.title));
  });
});

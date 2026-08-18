import React from "react";
import ResearchHeader from "@/components/ResearchHeader";
import { generatorNotebookCells, generatorNotebookSource, incrementalWorkflow } from "@/data/generatorNotebook";
import { Badge } from "@/components/ui/badge";
import { BookMarked, Code2, ExternalLink, FileCode2, GitBranch, PlayCircle, ShieldCheck } from "lucide-react";

const phaseColors: Record<string, string> = {
  "الأساس": "bg-[#e9f0e7] text-[#386145]",
  S0: "bg-[#f6ead2] text-[#865829]",
  S1: "bg-[#eee9f7] text-[#5f4b8a]",
  S2: "bg-[#dfecef] text-[#2d6470]",
  "الحزمة": "bg-[#f3ece4] text-[#745632]",
  CLI: "bg-[#e8edf0] text-[#445d67]",
};

export default function GeneratorNotebook() {
  return (
    <div className="min-h-screen bg-[#f8f5ef] text-[#2b332b]" dir="rtl">
      <ResearchHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="grid gap-8 border-b border-[#ddd4c6] pb-10 lg:grid-cols-[1fr_0.62fr] lg:items-end"><div><p className="text-xs font-semibold tracking-[0.18em] text-[#a56b37]">PYTHON GENERATION NOTEBOOK · SOURCE-ALIGNED</p><h1 className="mt-3 font-serif text-4xl tracking-tight text-[#24372e] sm:text-5xl">دفتر توليد الصور</h1><p className="mt-5 max-w-3xl text-sm leading-8 text-[#62675e]">واجهة مراجعة مرتبة كدفتر Jupyter: الخلايا الآتية مقتبسة من مولد Python العامل نفسه، وتُقرأ من الأعلى إلى الأسفل. عند إضافة فرضية جديدة، تُلحق كخلية مرحلة جديدة بدلاً من خلطها مع ما سبق.</p></div><aside className="rounded-3xl border border-[#ded4c5] bg-white p-6 shadow-[0_12px_30px_rgba(52,56,43,0.06)]"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#2b4b40] text-[#f7ebcd]"><FileCode2 className="size-5" /></span><div><p className="text-xs font-semibold tracking-[0.15em] text-[#a56b37]">SOURCE OF TRUTH</p><p className="mt-2 break-all font-mono text-xs leading-6 text-[#435648]">{generatorNotebookSource.path}</p></div></div><a href={generatorNotebookSource.githubUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#b8cab8] bg-[#f7fbf5] px-4 py-3 text-sm font-semibold text-[#2b4b40] transition hover:bg-[#ecf4e9]"><ExternalLink className="size-4" />فتح المصدر على GitHub</a></aside></header>

        <section className="mt-10 rounded-3xl border border-[#dfe1d3] bg-[#eff2e9] p-6 sm:p-8"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#2b4b40] text-[#f7ebcd]"><ShieldCheck className="size-5" /></span><div><p className="text-xs font-semibold tracking-[0.15em] text-[#64735f]">EXECUTION BOUNDARY</p><h2 className="mt-1 text-2xl font-semibold text-[#294338]">عرض الكود، لا تنفيذ صامت في المتصفح</h2><p className="mt-2 max-w-4xl text-sm leading-7 text-[#5f675f]">{generatorNotebookSource.note}</p></div></div></section>

        <div className="mt-12 grid gap-8 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-start"><section className="space-y-7">{generatorNotebookCells.map((cell, index) => <article key={cell.id} id={cell.id} className="scroll-mt-24 overflow-hidden rounded-3xl border border-[#e0d8cb] bg-white shadow-[0_12px_30px_rgba(52,56,43,0.06)]"><div className="flex flex-col gap-4 border-b border-[#eee7da] bg-[#fffdf8] p-6 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#f3ead9] font-mono text-sm font-semibold text-[#855b30]">{String(index + 1).padStart(2, "0")}</span><div><div className="flex flex-wrap items-center gap-2"><Badge className={`border-0 ${phaseColors[cell.phase]}`}>{cell.phase}</Badge><span className="font-mono text-xs text-[#8a7966]">{cell.sourceRange}</span></div><h2 className="mt-3 text-xl font-semibold text-[#2b4b40]">{cell.title}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-[#666c62]">{cell.purpose}</p></div></div><span className="inline-flex items-center gap-2 self-start rounded-full border border-[#dfd3c1] bg-white px-3 py-1.5 font-mono text-[11px] text-[#75634f]"><Code2 className="size-3.5" />Python</span></div><div className="bg-[#182720] p-4 sm:p-6"><pre dir="ltr" className="overflow-x-auto text-left text-[12px] leading-6 text-[#e8efdf] sm:text-[13px]"><code>{cell.code}</code></pre></div></article>)}</section>

          <aside className="space-y-5 xl:sticky xl:top-24"><section className="rounded-3xl border border-[#ddd4c6] bg-white p-5 shadow-[0_10px_24px_rgba(52,56,43,0.05)]"><div className="flex items-center gap-2"><BookMarked className="size-4 text-[#a56b37]" /><h2 className="font-semibold text-[#2b4b40]">خلايا الدفتر</h2></div><nav className="mt-4 space-y-1" aria-label="خلايا دفتر التوليد">{generatorNotebookCells.map((cell, index) => <a key={cell.id} href={`#${cell.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#5d655e] transition hover:bg-[#f4f1ea] hover:text-[#2b4b40]"><span className="font-mono text-xs text-[#a56b37]">{String(index + 1).padStart(2, "0")}</span><span>{cell.title}</span></a>)}</nav></section><section className="rounded-3xl border border-[#cbdaca] bg-[#edf4eb] p-5"><div className="flex items-center gap-2"><GitBranch className="size-4 text-[#3d6a47]" /><h2 className="font-semibold text-[#294338]">مسار التعديل</h2></div><ol className="mt-4 space-y-4">{incrementalWorkflow.map((step) => <li key={step.id} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#2b4b40] font-mono text-[10px] font-semibold text-white">{step.id}</span><div><p className="text-sm font-semibold text-[#38543e]">{step.title}</p><p className="mt-1 text-xs leading-6 text-[#5c6e5f]">{step.detail}</p></div></li>)}</ol></section><section className="rounded-3xl border border-dashed border-[#dbc9ae] bg-[#fff9ed] p-5"><div className="flex items-center gap-2"><PlayCircle className="size-4 text-[#946533]" /><h2 className="font-semibold text-[#6f4f2b]">المرحلة التالية</h2></div><p className="mt-3 text-xs leading-6 text-[#76604a]">ابدأ من خلية S0 النظيفة، ثم دوّن تغييرًا واحدًا فقط في سجل المرحلة اللاحقة قبل إعادة التوليد والتقييم.</p></section></aside>
        </div>
      </main>
    </div>
  );
}

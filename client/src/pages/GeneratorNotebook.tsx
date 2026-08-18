import React from "react";
import ResearchHeader from "@/components/ResearchHeader";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileCode2, NotebookTabs, RefreshCw } from "lucide-react";

const notebookPath = "training/notebooks/old_permic_synthetic_generation.ipynb";
const githubNotebookUrl = `https://github.com/Emran025/old-permic-ocr-lab/blob/main/${notebookPath}`;
const nbviewerUrl = `https://nbviewer.org/github/Emran025/old-permic-ocr-lab/blob/main/${notebookPath}`;

export default function GeneratorNotebook() {
  const [refreshKey, setRefreshKey] = React.useState(0);

  return (
    <div className="min-h-screen bg-[#f8f5ef] text-[#2b332b]" dir="rtl">
      <ResearchHeader />
      <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6 border-b border-[#ddd4c6] pb-8 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold tracking-[0.18em] text-[#a56b37]">JUPYTER NOTEBOOK · SOURCE OF TRUTH</p><h1 className="mt-3 font-serif text-4xl tracking-tight text-[#24372e] sm:text-5xl">دفتر توليد الصور</h1><p className="mt-4 max-w-3xl text-sm leading-8 text-[#62675e]">هذا عارض مباشر لدفتر Jupyter الحقيقي، لا تمثيل يدوي لخلايا الكود. التلوين والبنية والترتيب تأتي من ملف `.ipynb` المحفوظ في المستودع.</p></div><div className="flex flex-wrap gap-3"><a href={githubNotebookUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#c7d3c4] bg-white px-4 py-3 text-sm font-semibold text-[#2b4b40] transition hover:bg-[#f1f7ef]"><FileCode2 className="size-4" />فتح ملف IPYNB</a><a href={nbviewerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#2b4b40] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#213b32]"><ExternalLink className="size-4" />فتح في nbviewer</a></div></header>

        <section className="mt-7 flex flex-col gap-4 rounded-3xl border border-[#dce3d7] bg-[#eff3ea] p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#2b4b40] text-[#f7ebcd]"><NotebookTabs className="size-5" /></span><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-[#dcebd8] text-[#35633f]">دفتر Jupyter فعلي</Badge><span className="font-mono text-xs text-[#617060]">{notebookPath}</span></div><p className="mt-2 text-sm leading-6 text-[#59675d]">بعد أي commit جديد، اضغط تحديث العارض؛ يعكس nbviewer ملف الدفتر الموجود على الفرع الرئيسي.</p></div></div><button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#b7cbb6] bg-white px-4 py-2.5 text-sm font-semibold text-[#2b4b40] transition hover:bg-[#f7fbf5] active:scale-[0.97]"><RefreshCw className="size-4" />تحديث العارض</button></section>

        <section className="mt-7 overflow-hidden rounded-3xl border border-[#d8d1c4] bg-white shadow-[0_16px_34px_rgba(52,56,43,0.08)]"><iframe key={refreshKey} title="دفتر Jupyter لتوليد صور البرمية القديمة" src={nbviewerUrl} className="h-[calc(100vh-230px)] min-h-[760px] w-full bg-white" loading="lazy" referrerPolicy="no-referrer" /></section>
        <p className="mt-4 text-center text-xs leading-6 text-[#777168]">إذا منع المتصفح العرض المضمّن، استخدم زر «فتح في nbviewer». لا ينفذ العارض أي خلية داخل المتصفح.</p>
      </main>
    </div>
  );
}

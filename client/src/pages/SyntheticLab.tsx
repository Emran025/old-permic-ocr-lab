import ResearchHeader from "@/components/ResearchHeader";
import React from "react";
import { syntheticPipelineBoundary, syntheticStages, syntheticUnicodeFacts } from "@/data/syntheticPipeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Braces, CheckCircle2, Code2, Database, FileCode2, LockKeyhole, RotateCw, Sparkles, Wand2 } from "lucide-react";
import { Link } from "wouter";

const runCommand = `python3 ${syntheticUnicodeFacts.generatorPath} \\
  --output /home/ubuntu/old-permic-synthetic-preview \\
  --layout isolated-glyph \\
  --profile unicode-clean --samples 7600 --seed 10350`;

export default function SyntheticLab() {
  return (
    <div className="min-h-screen bg-[#f8f5ef] text-[#2b332b]" dir="rtl">
      <ResearchHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="grid gap-8 border-b border-[#ddd4c6] pb-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#a56b37]">SYNTHETIC DATA STUDIO · REPRODUCIBLE BY DESIGN</p>
            <h1 className="mt-3 font-serif text-4xl tracking-tight text-[#24372e] sm:text-5xl">مختبر البيانات الصناعية</h1>
            <p className="mt-5 max-w-3xl text-sm leading-8 text-[#62675e]">مسار تدريجي لتدريب كاشف حروف قبل لمس المخطوطات الحقيقية: نبدأ بحرف Unicode برمي واحد في كل صورة، ثم نشوه الحرف بصورة قابلة للقياس والإعادة، ثم نرتب حروفًا متعددة في أسطر بصرية من دون افتراض كلمات أو معجم.</p>
          </div>
          <aside className="rounded-3xl border border-[#d9cfbf] bg-[#fffdf8] p-6 shadow-[0_12px_30px_rgba(70,60,44,0.06)]">
            <div className="grid grid-cols-3 divide-x divide-x-reverse divide-[#e9e0d4] text-center">
              <div><p className="text-2xl font-semibold text-[#2b4b40]">{syntheticUnicodeFacts.assignedClassCount}</p><p className="mt-1 text-[11px] leading-5 text-[#746f65]">محرف Unicode معين</p></div>
              <div><p className="text-2xl font-semibold text-[#2b4b40]">4</p><p className="mt-1 text-[11px] leading-5 text-[#746f65]">معاينات مولدة</p></div>
              <div><p className="text-2xl font-semibold text-[#a56b37]">0</p><p className="mt-1 text-[11px] leading-5 text-[#746f65]">صور حقيقية في التدريب</p></div>
            </div>
            <p className="mt-5 rounded-2xl bg-[#f5f0e6] px-4 py-3 text-xs leading-6 text-[#685f52]"><LockKeyhole className="ml-1 inline size-3.5 text-[#a56b37]" />المصدر الحقيقي محفوظ في المدوّنة، وليس ضمن مجموعة التدريب أو المعاينات الصناعية.</p>
          </aside>
        </header>

        <section className="mt-10 rounded-3xl border border-[#dfe1d3] bg-[#eff2e9] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#2b4b40] text-[#f7ebcd]"><Wand2 className="size-5" /></span><div><p className="text-xs font-semibold tracking-[0.16em] text-[#64735f]">BOUNDARY OF THE EXPERIMENT</p><h2 className="mt-1 text-2xl font-semibold text-[#294338]">بيانات صناعية لفهم النظام، لا لمحاكاة التاريخ</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-[#5f675f]">{syntheticPipelineBoundary}</p></div></div><Link href="/sources"><Button variant="outline" className="shrink-0 border-[#a8b39f] bg-white text-[#2b4b40] hover:bg-[#f7faf3]">فتح مصادر المخطوطات <ArrowLeft className="mr-2 size-4" /></Button></Link></div>
        </section>

        <section className="mt-12"><div className="mb-6 flex items-center gap-3"><Sparkles className="size-5 text-[#a56b37]" /><div><p className="text-xs font-semibold tracking-[0.14em] text-[#a56b37]">STAGED DATA GENERATION</p><h2 className="mt-1 text-2xl font-semibold">من الحرف المفرد إلى الصفحة المنظمة</h2></div></div><div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">{syntheticStages.slice(0, 4).map((stage, index) => <article key={stage.id} className="overflow-hidden rounded-3xl border border-[#e0d8cb] bg-white shadow-[0_12px_30px_rgba(52,56,43,0.06)]"><div className="relative aspect-square bg-[#1f2922]"><img src={stage.previewUrl} alt={`معاينة ${stage.title}`} className="size-full object-contain" /><Badge className="absolute right-4 top-4 border-0 bg-[#2b4b40] text-[#fffaf0]">المرحلة {index + 1}</Badge></div><div className="p-6"><div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-semibold text-[#2b4b40]">{stage.title}</h3><p className="mt-2 text-sm leading-7 text-[#61675d]">{stage.goal}</p></div><CheckCircle2 className="mt-1 size-5 shrink-0 text-[#779067]" /></div><div className="mt-5 flex flex-wrap gap-2">{stage.controls.map((control) => <span key={control} className="rounded-full bg-[#f3efe6] px-3 py-1 text-[11px] font-medium text-[#686156]">{control}</span>)}</div><dl className="mt-5 grid gap-2 rounded-2xl bg-[#f7f9f4] p-4 text-xs leading-6 text-[#5b655b]"><div className="flex justify-between gap-4"><dt>Layout</dt><dd className="font-medium text-[#2b4b40]">{stage.layout}</dd></div><div className="flex justify-between gap-4"><dt>Profile</dt><dd className="font-medium text-[#2b4b40]">{stage.profile}</dd></div><div className="flex justify-between gap-4"><dt>المعاينة</dt><dd className="font-medium text-[#2b4b40]">{stage.previewRun?.samples} عينة · seed {stage.previewRun?.seed}</dd></div></dl><p className="mt-4 border-t border-[#ece6da] pt-4 text-xs leading-6 text-[#7b7062]">بوابة المرحلة: {stage.gate}</p></div></article>)}</div></section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><article className="rounded-3xl border border-[#e0d8cb] bg-white p-7"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-[#f2e2c4] text-[#81572e]"><FileCode2 className="size-5" /></span><div><p className="text-xs font-semibold tracking-[0.15em] text-[#a56b37]">GENERATOR CONTRACT</p><h2 className="mt-1 text-xl font-semibold">ما الذي ينتجه الكود؟</h2></div></div><dl className="mt-6 divide-y divide-[#ede7da] text-sm"><div className="flex justify-between gap-4 py-3"><dt className="text-[#777168]">وحدة البداية</dt><dd className="font-medium text-[#2b4b40]">{syntheticUnicodeFacts.initialLayout}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-[#777168]">الخط</dt><dd className="font-medium text-[#2b4b40]">{syntheticUnicodeFacts.font}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-[#777168]">الوسم</dt><dd className="font-medium text-[#2b4b40]">{syntheticUnicodeFacts.labelFormat}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-[#777168]">الملفات</dt><dd className="font-medium text-[#2b4b40]">images · labels · class map · assets · manifest</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-[#777168]">مصادر حقيقية</dt><dd className="font-medium text-[#a56b37]">غير مضمنة</dd></div></dl></article><article className="overflow-hidden rounded-3xl border border-[#273f35] bg-[#1d2c25] p-7 text-[#f7f1e4]"><div className="flex items-center gap-3"><Code2 className="size-5 text-[#d8b780]" /><div><p className="text-xs font-semibold tracking-[0.15em] text-[#d8b780]">REPRODUCIBLE PREVIEW</p><h2 className="mt-1 text-xl font-semibold">تشغيل معاينة S0 الحرفية</h2></div></div><pre dir="ltr" className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-5 text-left text-xs leading-7 text-[#f6ead4]"><code>{runCommand}</code></pre><p className="mt-5 text-sm leading-7 text-[#c9d1c5]">يسجل `manifest.json` البذرة وبصمة الخط وخصائص التشويه، ويسجل `assets.jsonl` lineage لكل عينة. المخرج ليس وزنًا مدرّبًا ولا مقياس دقة.</p></article></section>

        <section className="mt-14 rounded-3xl border border-dashed border-[#d5c8b4] bg-[#fffaf1] p-7 sm:p-9"><div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#efe0c5] text-[#8b6130]"><RotateCw className="size-5" /></span><div><p className="text-xs font-semibold tracking-[0.16em] text-[#a56b37]">NEXT GATED STEP</p><h2 className="mt-2 text-2xl font-semibold">الانتقال إلى البيانات الحقيقية</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[#686057]">لا يُدمج أي من صور المخطوطات الموجودة في الموقع في التدريب إلى أن يعتمد الباحث: خريطة المحارف، القراءة المرجعية، مربعات المناطق، والترخيص. عند اكتمال ذلك، يبقى الفصل حسب المخطوطة والمصدر، لا حسب الصورة فقط.</p></div></div></section>
      </main>
    </div>
  );
}

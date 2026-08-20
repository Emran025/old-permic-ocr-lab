import React from "react";
import ResearchHeader from "@/components/ResearchHeader";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ExternalLink, FileCode2, NotebookTabs, RefreshCw, ServerCog, ShieldCheck } from "lucide-react";

const notebookPath = "training/notebooks/old_permic_synthetic_generation.ipynb";
const githubNotebookUrl = `https://github.com/Emran025/old-permic-ocr-lab/blob/main/${notebookPath}`;
const renderedNotebookUrl = "/manus-storage/old-permic-synthetic-generation-notebook_c7f5feed.html";

function timestamp(value: unknown) {
  if (!value) return "لم يُسجل بعد";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "غير متاح" : date.toLocaleString("ar-SA");
}

function testMetric(metrics: unknown, key: string) {
  if (!metrics || typeof metrics !== "object") return "—";
  const testMetrics = (metrics as { test_metrics?: unknown }).test_metrics;
  if (!testMetrics || typeof testMetrics !== "object") return "—";
  const value = (testMetrics as Record<string, unknown>)[key];
  return typeof value === "number" ? value.toFixed(4) : "—";
}

export default function GeneratorNotebook() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const releaseQuery = trpc.trainingRelease.status.useQuery(undefined, { refetchInterval: 5 * 60 * 1000 });
  const release = releaseQuery.data?.release;
  const sync = releaseQuery.data?.sync;

  const refresh = () => {
    setRefreshKey((key) => key + 1);
    void releaseQuery.refetch();
  };

  return (
    <div className="min-h-screen bg-[#f8f5ef] text-[#2b332b]" dir="rtl">
      <ResearchHeader />
      <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6 border-b border-[#ddd4c6] pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#a56b37]">JUPYTER NOTEBOOK · COLAB SOURCE OF TRUTH</p>
            <h1 className="mt-3 font-serif text-4xl tracking-tight text-[#24372e] sm:text-5xl">دفتر التوليد والتدريب</h1>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-[#62675e]">هذا عارض HTML قياسي مولد من دفتر Jupyter الحقيقي، لا تمثيل يدوي لخلايا الكود. يعرض مسار Colab المتدرج: استعادة أو توليد بيانات S0، التحقق، تدريب بحجم batch متدرج، وحفظ snapshot كامل قابل للاستئناف في GitHub ثم التقييم وإصدار نتائج موثق.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={githubNotebookUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#c7d3c4] bg-white px-4 py-3 text-sm font-semibold text-[#2b4b40] transition hover:bg-[#f1f7ef]"><FileCode2 className="size-4" />فتح ملف IPYNB</a>
            <a href={renderedNotebookUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#2b4b40] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#213b32]"><ExternalLink className="size-4" />فتح العارض في صفحة مستقلة</a>
          </div>
        </header>

        <section className="mt-7 rounded-3xl border border-[#dce3d7] bg-[#eff3ea] p-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#2b4b40] text-[#f7ebcd]"><NotebookTabs className="size-5" /></span>
              <div>
                <div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-[#dcebd8] text-[#35633f]">دفتر Jupyter فعلي</Badge><span className="font-mono text-xs text-[#617060]">{notebookPath}</span></div>
                <p className="mt-2 text-sm leading-6 text-[#59675d]">هذا HTML مولد من الدفتر نفسه ومخزن داخل المشروع؛ بعد تعديل IPYNB يُعاد توليده ورفعه، ثم يحدّث رابط العارض مع commit المرحلة.</p>
              </div>
            </div>
            <button type="button" onClick={refresh} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#b7cbb6] bg-white px-4 py-2.5 text-sm font-semibold text-[#2b4b40] transition hover:bg-[#f7fbf5] active:scale-[0.97]"><RefreshCw className={`size-4 ${releaseQuery.isFetching ? "animate-spin" : ""}`} />تحديث العارض والحالة</button>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-[#d7ded0] bg-white p-5 shadow-[0_12px_28px_rgba(52,56,43,0.06)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#eef2ec] text-[#315442]"><ServerCog className="size-5" /></span>
              <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-serif text-xl text-[#24372e]">حالة إصدار التدريب المنشور</h2>{release ? <Badge className="border-0 bg-[#f7e8c6] text-[#775324]">Baseline صناعي موثق</Badge> : <Badge variant="outline" className="border-[#d9c8aa] bg-[#fffaf1] text-[#846539]">لا يوجد إصدار منشور بعد</Badge>}</div><p className="mt-1 max-w-3xl text-sm leading-6 text-[#657065]">يتحقق الموقع من ملف الإصدار العام كل خمس دقائق بعد تفعيل المهمة المجدولة. لا تعني هذه اللوحة أن وزنًا متصلًا بخدمة OCR؛ إنها تعرض metadata متحققًا منها فقط.</p></div>
            </div>
            <div className="text-xs leading-6 text-[#718070]">آخر فحص: {timestamp(sync?.lastCheckedAt)}<br />آخر مزامنة ناجحة: {timestamp(sync?.lastSuccessAt)}</div>
          </div>

          {release ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-[#f7f8f4] p-4"><p className="text-xs text-[#758070]">معرف الإصدار</p><p className="mt-2 break-all font-mono text-xs text-[#2c493b]">{release.releaseId}</p></div>
              <div className="rounded-2xl bg-[#f7f8f4] p-4"><p className="text-xs text-[#758070]">المصدر</p><p className="mt-2 text-sm font-semibold text-[#2c493b]">{release.modelScope}</p><p className="mt-1 font-mono text-xs text-[#64736a]">{release.sourceCommit.slice(0, 12)}</p></div>
              <div className="rounded-2xl bg-[#f7f8f4] p-4"><p className="text-xs text-[#758070]">test mAP50-95</p><p className="mt-2 font-mono text-xl font-semibold text-[#2c493b]">{testMetric(release.metrics, "map50_95")}</p></div>
              <div className="rounded-2xl bg-[#f7f8f4] p-4"><p className="text-xs text-[#758070]">قيود الاستخدام</p><p className="mt-2 text-sm font-semibold text-[#7a5630]">{release.realManuscriptOcrValidated ? "يتطلب مراجعة إضافية" : "ليس ادعاء OCR للمخطوطات"}</p></div>
            </div>
          ) : <div className="mt-5 rounded-2xl border border-dashed border-[#d7ded0] bg-[#fbfcf9] p-4 text-sm leading-7 text-[#687365]">ينتظر المختبر نشر Colab لأول ملف <span className="font-mono">artifacts/published/latest.json</span>. ستظهر هنا فقط النتائج التي اجتازت اختبار test وبصمات الملف المطلوبة.</div>}
          {sync?.lastError ? <p className="mt-4 rounded-xl bg-[#fff4ee] px-4 py-3 text-xs leading-6 text-[#9a5736]">تعذر آخر فحص: {sync.lastError}</p> : null}
          <div className="mt-4 flex items-center gap-2 text-xs text-[#657365]"><ShieldCheck className="size-4 text-[#48774c]" />لا تُنقل حزم الصور الصناعية الكاملة إلى الموقع أو المستودع من هذه الآلية.</div>
        </section>

        <section className="mt-7 overflow-hidden rounded-3xl border border-[#d8d1c4] bg-white shadow-[0_16px_34px_rgba(52,56,43,0.08)]"><iframe key={refreshKey} title="دفتر Jupyter لتوليد وتدريب البرمية القديمة" src={`${renderedNotebookUrl}?refresh=${refreshKey}`} className="h-[calc(100vh-230px)] min-h-[760px] w-full bg-white" loading="lazy" referrerPolicy="no-referrer" /></section>
        <p className="mt-4 text-center text-xs leading-6 text-[#777168]">لا ينفذ العارض أي خلية داخل المتصفح؛ إنه عرض Jupyter HTML مولد من الدفتر المراجع والمرفوع. يظل الربط الفعلي للاستدلال معلقًا حتى تحميل وزن متحقق منه واجتياز اختبار التكامل.</p>
      </main>
    </div>
  );
}

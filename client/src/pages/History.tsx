import ResearchHeader from "@/components/ResearchHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { CalendarDays, Database, ScanSearch } from "lucide-react";
import { Link } from "wouter";

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function History() {
  const { isAuthenticated, loading } = useAuth();
  const history = trpc.ocr.list.useQuery(undefined, { enabled: isAuthenticated });

  return (
    <div className="min-h-screen bg-[#f8f5ef] text-[#2b332b]" dir="rtl">
      <ResearchHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 border-b border-[#ddd4c6] pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#a56b37]">ANALYSIS ARCHIVE</p>
            <h1 className="mt-2 font-serif text-4xl tracking-tight text-[#24372e]">سجل التحليلات</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#666b60]">كل صورة تُحفظ باسم المستخدم مع حالة النموذج والنتائج التي أعادها الاستدلال الفعلي.</p>
          </div>
          <Link href="/">
            <Button className="bg-[#2b4b40] text-white hover:bg-[#203b32]"><ScanSearch className="ml-2 size-4" />تحليل صورة جديدة</Button>
          </Link>
        </div>

        {!loading && !isAuthenticated ? (
          <section className="mt-10 rounded-3xl border border-dashed border-[#d6c8b6] bg-white/70 p-10 text-center">
            <Database className="mx-auto size-8 text-[#a56b37]" />
            <h2 className="mt-4 text-xl font-semibold">السجل شخصي ومحمي</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-[#6b6b62]">سجّل الدخول لحفظ صور البرمية القديمة ونتائجها واستعادتها لاحقًا.</p>
            <Button onClick={() => startLogin()} className="mt-5 bg-[#a56b37] text-white hover:bg-[#8d592c]">تسجيل الدخول</Button>
          </section>
        ) : history.isLoading ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-72 rounded-3xl" />)}</div>
        ) : history.data?.length ? (
          <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {history.data.map((analysis) => {
              const detections = Array.isArray(analysis.detections) ? analysis.detections : [];
              return (
                <article key={analysis.id} className="overflow-hidden rounded-3xl border border-[#e2dacd] bg-white shadow-[0_12px_30px_rgba(52,56,43,0.06)]">
                  <div className="aspect-[16/10] bg-[#202a23]"><img src={analysis.imageUrl} alt={analysis.originalFilename} className="size-full object-cover" /></div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-semibold">{analysis.originalFilename}</p><Badge variant="outline" className="border-[#d9c8ac] text-[#85572e]">{analysis.status === "completed" ? "مكتمل" : analysis.status === "model_not_configured" ? "بانتظار النموذج" : "قيد المعالجة"}</Badge></div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-[#797a70]"><CalendarDays className="size-3.5" />{formatDate(analysis.createdAt)}</div>
                    <p className="mt-4 min-h-10 rounded-xl bg-[#f4f0e8] px-3 py-2 font-old-permic text-sm text-[#384238]">{analysis.extractedText || "لا يوجد نص مستخرج بعد."}</p>
                    <p className="mt-3 text-xs text-[#85877c]">{detections.length} منطقة كشف محفوظة</p>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="mt-10 rounded-3xl border border-dashed border-[#d6c8b6] bg-white/70 p-10 text-center">
            <ScanSearch className="mx-auto size-8 text-[#a56b37]" />
            <h2 className="mt-4 text-xl font-semibold">لا توجد تحليلات محفوظة</h2>
            <p className="mt-2 text-sm text-[#6b6b62]">ابدأ برفع صورة من صفحة التحليل، وستظهر هنا بعد حفظها.</p>
          </section>
        )}
      </main>
    </div>
  );
}

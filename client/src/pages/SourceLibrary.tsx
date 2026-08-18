import ResearchHeader from "@/components/ResearchHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { externalSourceLinks, sourceGalleryItems, type SourceGalleryItem } from "@/data/sourceGallery";
import { BookOpenText, ExternalLink, Images, Landmark, ShieldCheck, ZoomIn } from "lucide-react";

function SourceDialog({ item }: { item: SourceGalleryItem }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="group block h-full w-full text-right" aria-label={`فتح ${item.title}`}>
          <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#e0d8cb] bg-white text-right shadow-[0_12px_30px_rgba(52,56,43,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_38px_rgba(52,56,43,0.12)]">
            <div className={`relative overflow-hidden bg-[#1f2922] ${item.wide ? "aspect-[3.3/1]" : "aspect-[4/5]"}`}>
              <img src={item.imageUrl} alt={item.alt} className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#152018]/60 via-transparent to-transparent opacity-70" />
              <span className="absolute bottom-3 left-3 inline-flex size-9 items-center justify-center rounded-full bg-[#fffaf0]/90 text-[#2b4b40] shadow-sm"><ZoomIn className="size-4" /></span>
              <Badge className="absolute right-3 top-3 border-0 bg-[#2b4b40]/95 text-[#fffaf0] hover:bg-[#2b4b40]">{item.year}</Badge>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[#a56b37]">{item.sourceLabel.toUpperCase()}</p>
              <h2 className="mt-2 text-base font-semibold leading-7 text-[#25352c]">{item.title}</h2>
              <p className="mt-1 text-xs leading-6 text-[#8a8175]">{item.subtitle}</p>
              <p className="mt-4 text-xs leading-6 text-[#626960]">{item.description}</p>
            </div>
          </article>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto border-[#dfd4c3] bg-[#fffdf8] p-0 sm:rounded-3xl" dir="rtl">
        <div className="grid lg:grid-cols-[1.45fr_0.75fr]">
          <div className="bg-[#1f2922] p-3 sm:p-5"><img src={item.imageUrl} alt={item.alt} className="max-h-[72vh] w-full rounded-2xl object-contain" /></div>
          <div className="p-6 sm:p-8">
            <DialogHeader className="text-right"><p className="text-xs font-semibold tracking-[0.16em] text-[#a56b37]">SOURCE RECORD · {item.year}</p><DialogTitle className="mt-3 font-serif text-3xl text-[#26382e]">{item.title}</DialogTitle><DialogDescription className="mt-3 text-sm leading-7 text-[#666c62]">{item.description}</DialogDescription></DialogHeader>
            <div className="mt-7 space-y-4 text-sm">
              <div className="rounded-2xl bg-[#f2eee5] p-4"><p className="text-xs font-semibold text-[#81572e]">بيانات الحفظ والفهرسة</p><dl className="mt-3 space-y-3 text-sm leading-6 text-[#555e54]"><div><dt className="text-xs font-semibold text-[#7f6547]">نوع المصدر</dt><dd>{item.sourceType}</dd></div><div><dt className="text-xs font-semibold text-[#7f6547]">الحفظ أو منصة المسح</dt><dd>{item.holdingInstitution}</dd></div><div><dt className="text-xs font-semibold text-[#7f6547]">الوصف الفهرسي</dt><dd>{item.catalogueRecord}</dd></div><div><dt className="text-xs font-semibold text-[#7f6547]">المصدر الرقمي</dt><dd>{item.sourceLabel}</dd></div></dl></div>
              <div className="rounded-2xl border border-[#e4d6bd] bg-[#fff9ee] p-4"><p className="flex items-center gap-2 text-xs font-semibold text-[#81572e]"><ShieldCheck className="size-4" />الحقوق والإسناد</p><p className="mt-2 leading-6 text-[#6c604f]">{item.rights}</p></div>
              <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2b4b40] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#213b32]"><ExternalLink className="size-4" />فتح المصدر الأصلي</a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SourceLibrary() {
  const featured = sourceGalleryItems[0];
  const scans = sourceGalleryItems.slice(1);

  return (
    <div className="min-h-screen bg-[#f8f5ef] text-[#2b332b]" dir="rtl">
      <ResearchHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="grid gap-8 border-b border-[#ddd4c6] pb-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div><p className="text-xs font-semibold tracking-[0.18em] text-[#a56b37]">PRIMARY & HISTORICAL VISUAL SOURCES</p><h1 className="mt-3 font-serif text-4xl tracking-tight text-[#24372e] sm:text-5xl">مكتبة المصادر المرئية</h1><p className="mt-5 max-w-3xl text-sm leading-8 text-[#62675e]">تجمع هذه المكتبة صورًا حقيقية من المواد التي تحققت إتاحتها لإعادة العرض. افتح أي بطاقة لمشاهدتها بحجم أكبر، ثم انتقل إلى المصدر الأصلي لتوثيق الاستشهاد أو فحص السياق الكامل.</p></div>
          <div className="rounded-3xl border border-[#e5d7bf] bg-[#fff9ee] p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-[#efd7b1] text-[#7f5429]"><Images className="size-5" /></span><div><p className="text-2xl font-semibold text-[#2b4b40]">10</p><p className="text-xs text-[#756a5c]">صور عامة متاحة للتصفح</p></div></div><p className="mt-4 text-xs leading-6 text-[#776854]">لا تتضمن المكتبة صور المخطوطات أو الأيقونات ذات حقوق إعادة نشر غير متحققة؛ تبقى روابطها الخارجية ظاهرة في الأسفل.</p></div>
        </header>

        <section className="mt-10"><div className="mb-5 flex items-center gap-3"><Landmark className="size-5 text-[#a56b37]" /><div><p className="text-xs font-semibold tracking-[0.14em] text-[#a56b37]">FEATURED PRIMARY SOURCE</p><h2 className="mt-1 text-2xl font-semibold">المصدر الأولي البارز</h2></div></div><div className="max-w-5xl"><SourceDialog item={featured} /></div></section>

        <section className="mt-14"><div className="mb-6 flex items-center gap-3"><BookOpenText className="size-5 text-[#a56b37]" /><div><p className="text-xs font-semibold tracking-[0.14em] text-[#a56b37]">HISTORICAL FACSIMILES</p><h2 className="mt-1 text-2xl font-semibold">طبعات وفاكسيميليات تاريخية</h2></div></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{scans.map((item) => <SourceDialog item={item} key={item.id} />)}</div></section>

        <section className="mt-14 rounded-3xl border border-[#e0d7c8] bg-white p-7 sm:p-9"><div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#edf1e8] text-[#2b4b40]"><ExternalLink className="size-5" /></span><div><p className="text-xs font-semibold tracking-[0.16em] text-[#a56b37]">LINKS ONLY · RIGHTS NOT VERIFIED FOR REHOSTING</p><h2 className="mt-2 text-2xl font-semibold">مصادر مشاهدة خارجية مهمة</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[#666b62]">هذه المواد مفيدة للبحث الباليوغرافي، لكن الصور لا تُخزّن في التطبيق إلى أن يكون ترخيص إعادة النشر واضحًا. تفتح الروابط في مواقعها الأصلية.</p></div></div><div className="mt-7 grid gap-3 md:grid-cols-3">{externalSourceLinks.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="rounded-2xl border border-[#e6ded2] p-4 transition hover:border-[#b58b5b] hover:bg-[#fffaf1]"><p className="font-semibold leading-6 text-[#2c493d]">{link.title}</p><p className="mt-2 text-xs leading-6 text-[#77776e]">{link.note}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#a56b37]">فتح المصدر <ExternalLink className="size-3.5" /></span></a>)}</div></section>
      </main>
    </div>
  );
}

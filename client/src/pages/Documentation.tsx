import ResearchHeader from "@/components/ResearchHeader";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Boxes, ClipboardCheck, FileCode2, Layers3, Sparkles } from "lucide-react";
import { Link } from "wouter";

const stages = [
  { icon: BookOpen, title: "تحديد المصدر", body: "سجّل المؤسسة الحافظة ورقم الحفظ وحقوق الصورة لكل قطعة. افصل التصوير الفوتوغرافي عن النسخ أو الرسوم التاريخية في بياناتك." },
  { icon: Boxes, title: "تعريف الفئات", body: "اعتمد class_map.json واحدًا يربط id ثابتًا بالحرف كما يظهر في المصدر، وقيمة Unicode والنقل الصوتي عندما تكون مراجعة." },
  { icon: ClipboardCheck, title: "وسم الصورة", body: "ارسم صندوقًا لكل وحدة تختار تدريبها: حرف أو كلمة. صدّر ملفات YOLO بقيم id وx_center وy_center وwidth وheight المطَبّعة." },
  { icon: Layers3, title: "تقسيم المصادر", body: "قسّم train وval وtest على مستوى المخطوطة أو القطعة كلما أمكن، حتى لا يختبر النموذج على قصاصات من المصدر الذي تدرب عليه." },
];

export default function Documentation() {
  return (
    <div className="min-h-screen bg-[#f8f5ef] text-[#2b332b]" dir="rtl">
      <ResearchHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#a56b37]">METHODS & DATA</p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight text-[#24372e]">وثائق البرمية القديمة</h1>
          <p className="mt-5 text-base leading-8 text-[#5f655b]">تشرح هذه الصفحة بنية العمل المعتمدة في المشروع: بيانات Unicode صناعية قابلة للإعادة أولًا، ثم كشف مناطق الكتابة الحقيقية، ثم قراءة الفئات وفق خريطة موثقة. ليست بديلًا عن مراجعة الباحث للنقش أو القراءة التاريخية.</p>
        </div>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl bg-[#2b4b40] p-8 text-[#fffaf0] shadow-[0_18px_40px_rgba(43,75,64,0.18)]">
            <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-[#f1d9a8]/15"><Sparkles className="size-5 text-[#f2cb83]" /></span><p className="text-xs font-semibold tracking-[0.16em] text-[#f2cb83]">ABUR STRUCTURE</p></div>
            <h2 className="mt-6 font-serif text-2xl">بنية أبجدية Abur</h2>
            <p className="mt-4 leading-8 text-[#dbe5d9]">البرمية القديمة تُقرأ من اليسار إلى اليمين. وتشير دراسة شجرة الاعتماد للبرمية القديمة إلى 38 حرفًا، خمسة منها مركّبة. لهذا لا تضع هذه الواجهة قائمة فئات مفترضة؛ بل تقرأ ترتيب الفئات من ملف class_map.json الذي يراجعه الباحث وفق المادة التي يريد تعليمها.</p>
            <div className="mt-6 flex flex-wrap gap-2"><Badge className="bg-white/10 text-[#fffaf0] hover:bg-white/10">اتجاه القراءة: يسار ← يمين</Badge><Badge className="bg-white/10 text-[#fffaf0] hover:bg-white/10">دعم Unicode: U+10350–U+1037F</Badge><Badge className="bg-white/10 text-[#fffaf0] hover:bg-white/10">خط العرض: Noto Sans Old Permic</Badge></div>
          </article>
          <article className="rounded-3xl border border-[#e0d7c9] bg-white p-8">
            <FileCode2 className="size-7 text-[#a56b37]" />
            <h2 className="mt-5 text-xl font-semibold">مصدر الحقيقة للفئات</h2>
            <p className="mt-3 text-sm leading-7 text-[#666b61]">يوفّر المشروع قالب class_map.json ولا يضع قائمة حروف ثابتة داخل كود التدريب. ثبات id مهم لأن تغيير ترتيب الفئات بعد إنشاء الوسوم يجعل وزن YOLO ونتائجه غير صالحين للمقارنة.</p>
            <pre dir="ltr" className="mt-5 overflow-x-auto rounded-2xl bg-[#252d27] p-4 text-xs leading-6 text-[#eff6e9]">{`{"classes": [{"id": 0, "label": "…", "unicode": "U+…"}]}`}</pre>
          </article>
        </section>

        <section className="mt-12 rounded-3xl border border-[#d7dfd0] bg-[#eef2e9] p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold tracking-[0.15em] text-[#61775f]">SYNTHETIC-TO-REAL PROTOCOL</p><h2 className="mt-2 text-xl font-semibold text-[#294338]">ابدأ بالنظام قبل المخطوطة</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[#59655a]">ينتج المولد صفحات محارف Unicode مع مربعات YOLO وملف manifest مسجل للبذرة والخط والتشويه. بعد baseline نظيف، يرفع التشويه تدريجيًا. ولا ينتقل المشروع إلى corpus الحقيقي إلا بعد اعتماد الحقوق والقراءة والوسوم وتقسيم المخطوطات.</p></div><Link href="/synthetic" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#2b4b40] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#213b32]">فتح مختبر البيانات الصناعية</Link></div>
        </section>

        <section className="mt-12">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#ead7bc] text-[#805328]"><Layers3 className="size-4" /></span><div><p className="text-xs font-semibold tracking-[0.15em] text-[#a56b37]">YOLO DATA PREPARATION</p><h2 className="mt-1 text-2xl font-semibold">إعداد بيانات التدريب خطوة بخطوة</h2></div></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">{stages.map(({ icon: Icon, title, body }, index) => <article key={title} className="relative rounded-3xl border border-[#e1d9cc] bg-white p-6"><span className="absolute left-6 top-6 grid size-7 place-items-center rounded-full bg-[#f4ede1] text-xs font-bold text-[#a56b37]">{index + 1}</span><Icon className="size-6 text-[#2b4b40]" /><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-[#6b6c63]">{body}</p></article>)}</div>
        </section>

        <section className="mt-12 rounded-3xl border border-[#ded4c3] bg-[#fffdf8] p-8">
          <h2 className="text-xl font-semibold">هيكل أرشيف التدريب المتوقع</h2>
          <pre dir="ltr" className="mt-4 overflow-x-auto rounded-2xl bg-[#f1ece2] p-5 text-xs leading-6 text-[#3d473f]">{`old_permic_dataset.zip\n├── images/{train,val,test}\n├── labels/{train,val,test}\n└── class_map.json`}</pre>
          <p className="mt-5 text-sm leading-7 text-[#676a61]">استخدم دفتر التدريب المكيّف داخل مجلد training في المشروع. يتحقق من كل تقسيم، ويولد data.yaml من خريطة الفئات، ويحفظ بصمة خريطة الفئات مع checkpoint لمنع الاستئناف على ترتيب فئات مختلف.</p>
        </section>
      </main>
    </div>
  );
}

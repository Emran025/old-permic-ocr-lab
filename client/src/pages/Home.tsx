import DetectionCanvas from "@/components/DetectionCanvas";
import ResearchHeader from "@/components/ResearchHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { extractedReadingText, type DetectionForLayout } from "@/lib/analysisLayout";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  Clipboard,
  Copy,
  FileImage,
  ImagePlus,
  Loader2,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { toast } from "sonner";

type PersistedAnalysis = {
  id: number;
  imageUrl: string;
  originalFilename: string;
  status: string;
  extractedText: string | null;
  detections: unknown;
};

function isDetection(value: unknown): value is DetectionForLayout {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return ["label", "confidence", "x1", "y1", "x2", "y2"].every(
    (key) => typeof candidate[key] === (key === "label" ? "string" : "number"),
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [confidence, setConfidence] = useState([0.25]);
  const [iou, setIou] = useState([0.45]);
  const [analysis, setAnalysis] = useState<PersistedAnalysis | null>(null);
  const status = trpc.ocr.modelStatus.useQuery(undefined, { enabled: isAuthenticated });
  const upload = trpc.ocr.upload.useMutation();
  const run = trpc.ocr.run.useMutation();

  const detections = useMemo(() => {
    if (!analysis || !Array.isArray(analysis.detections)) return [];
    return analysis.detections.filter(isDetection);
  }, [analysis]);
  const extractedText = analysis?.extractedText || extractedReadingText(detections);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
      toast.error("استخدم صورة PNG أو JPG أو WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("الحد الأقصى لحجم الصورة هو 5 ميغابايت.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      setPreview(result);
      setDataUrl(result);
      setFileName(file.name);
      setAnalysis(null);
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async () => {
    if (!isAuthenticated) {
      toast.message("سجّل الدخول أولًا لحفظ التحليل في سجلك.");
      startLogin();
      return;
    }
    if (!dataUrl) {
      toast.error("اختر صورة من مخطوطة أو نقش بالبرمية القديمة أولًا.");
      return;
    }
    try {
      const created = await upload.mutateAsync({ filename: fileName, dataUrl });
      const result = await run.mutateAsync({ analysisId: created.id });
      if (result) setAnalysis(result as PersistedAnalysis);
      toast.message("حُفظت الصورة، وفُحصت حالة نموذج البرمية القديمة.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الصورة.");
    }
  };

  const copyText = async () => {
    if (!extractedText) return;
    await navigator.clipboard.writeText(extractedText);
    toast.success("نُسخ النص المستخرج إلى الحافظة.");
  };

  const working = upload.isPending || run.isPending;
  const modelUnavailable = analysis?.status === "model_not_configured" || status.data?.available === false;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f5ef] text-[#2b332b]" dir="rtl">
      <ResearchHeader />
      <main>
        <section className="relative isolate overflow-hidden border-b border-[#e4ddd0] bg-[radial-gradient(circle_at_12%_10%,rgba(207,166,103,0.20),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(77,119,101,0.16),transparent_25%),#f8f5ef]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-20 lg:pt-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dcccae] bg-[#fffaf0]/80 px-3 py-1 text-xs font-semibold text-[#88592e]">
                <Sparkles className="size-3.5" />مختبر توثيق بصري للبرمية القديمة
              </div>
              <h1 className="mt-6 font-serif text-5xl leading-[1.06] tracking-tight text-[#20372d] sm:text-6xl">
                من الأثر إلى <span className="text-[#a56b37]">قراءة قابلة للمراجعة</span>.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#62675e]">
                ارفع صورة لنقش أو مخطوطة بالبرمية القديمة، واحتفظ بها ضمن سجل بحثي. عند ربط وزن YOLO مدرّب، ستظهر مناطق الكشف والثقة والنص المستخرج فوق الصورة نفسها.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-xs text-[#536056]">
                <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#2b7a57]" />سجل شخصي للصور</span>
                <span className="flex items-center gap-2"><ScanLine className="size-4 text-[#2b7a57]" />كشف قابل للتدقيق</span>
                <span className="flex items-center gap-2"><Clipboard className="size-4 text-[#2b7a57]" />نص قابل للنسخ</span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md self-center rounded-[2rem] border border-white/80 bg-[#fffdf8]/85 p-6 shadow-[0_24px_70px_rgba(81,71,47,0.14)] backdrop-blur">
              <div className="absolute -left-3 top-8 rounded-2xl bg-[#2b4b40] px-3 py-2 text-xs text-[#eff6e9] shadow-lg">سياق المصدر محفوظ</div>
              <p className="text-xs font-semibold tracking-[0.16em] text-[#a56b37]">ANALYSIS PRINCIPLE</p>
              <p className="mt-4 font-serif text-2xl text-[#2b4b40]">لا يَستبدل النموذج الباحث.</p>
              <p className="mt-3 text-sm leading-7 text-[#6d7067]">كل صندوق ودرجة ثقة ونص مستخرج يظهر بوصفه اقتراحًا حسابيًا قابلًا للمراجعة، لا قراءة نهائية.</p>
              <div className="mt-6 rounded-2xl bg-[#f1ece2] p-4"><div className="h-2 w-3/4 rounded-full bg-[#d9c9ad]" /><div className="mt-3 h-2 w-full rounded-full bg-[#e3d9c6]" /><div className="mt-3 h-2 w-4/5 rounded-full bg-[#d9c9ad]" /></div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {modelUnavailable && (
            <div className="mb-7 flex gap-3 rounded-2xl border border-[#ead6b9] bg-[#fff8ed] p-4 text-sm text-[#79542d]">
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
              <div><strong>النموذج غير مربوط بعد.</strong><span className="mr-1">{status.data?.message || "سجّل الدخول ثم اربط وزن YOLO مدربًا للبرمية القديمة من خلال خدمة الاستدلال."}</span></div>
            </div>
          )}
          <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl border border-[#e0d8cb] bg-white p-6 shadow-[0_15px_36px_rgba(51,55,43,0.05)] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-semibold tracking-[0.16em] text-[#a56b37]">01 / INPUT</p><h2 className="mt-2 text-2xl font-semibold">رفع الصورة</h2><p className="mt-2 text-sm leading-7 text-[#6d7067]">PNG أو JPG أو WebP، حتى 5 ميغابايت.</p></div>
                <span className="grid size-11 place-items-center rounded-2xl bg-[#edf1e8] text-[#2b4b40]"><ImagePlus className="size-5" /></span>
              </div>
              <label className="mt-7 grid min-h-60 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-[#d4c7b6] bg-[#fdfbf6] p-5 text-center transition hover:border-[#a56b37] hover:bg-[#fffaf0]">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFileChange} className="sr-only" />
                {preview ? <img src={preview} alt="معاينة الصورة المختارة" className="max-h-52 rounded-xl object-contain" /> : <div><FileImage className="mx-auto size-8 text-[#a56b37]" /><p className="mt-4 text-sm font-semibold">اختر صورة من جهازك</p><p className="mt-2 text-xs text-[#89897d]">تظهر المعاينة هنا فورًا</p></div>}
              </label>
              {fileName && <p className="mt-3 truncate text-xs text-[#6b6e64]">{fileName}</p>}
              <div className="mt-7 grid gap-6 sm:grid-cols-2">
                <div><div className="mb-3 flex justify-between text-xs font-semibold"><span>حد الثقة</span><span className="text-[#a56b37]">{confidence[0].toFixed(2)}</span></div><Slider value={confidence} onValueChange={setConfidence} min={0.05} max={0.95} step={0.05} /></div>
                <div><div className="mb-3 flex justify-between text-xs font-semibold"><span>حد IoU</span><span className="text-[#a56b37]">{iou[0].toFixed(2)}</span></div><Slider value={iou} onValueChange={setIou} min={0.05} max={0.95} step={0.05} /></div>
              </div>
              <Button onClick={runAnalysis} disabled={working} className="mt-8 h-12 w-full bg-[#2b4b40] text-white hover:bg-[#203b32]">
                {working ? <><Loader2 className="ml-2 size-4 animate-spin" />جارٍ حفظ الطلب</> : <><ScanLine className="ml-2 size-4" />تحليل البرمية القديمة</>}
              </Button>
              {!isAuthenticated && <p className="mt-3 text-center text-xs leading-6 text-[#8a7560]">سيتطلب التشغيل تسجيل الدخول لحفظ الصورة ونتيجتها في السجل.</p>}
            </section>

            <section className="rounded-3xl border border-[#e0d8cb] bg-white p-6 shadow-[0_15px_36px_rgba(51,55,43,0.05)] sm:p-8">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold tracking-[0.16em] text-[#a56b37]">02 / OUTPUT</p><h2 className="mt-2 text-2xl font-semibold">نتائج الاستدلال</h2><p className="mt-2 text-sm leading-7 text-[#6d7067]">تظهر الصناديق والدرجات فوق المصدر وتبقى مرئية للمراجعة.</p></div><SlidersHorizontal className="size-5 text-[#a56b37]" /></div>
              <div className="mt-7">
                {analysis ? <DetectionCanvas imageUrl={analysis.imageUrl} detections={detections} alt={analysis.originalFilename} /> : preview ? <DetectionCanvas imageUrl={preview} detections={[]} alt="معاينة قبل التحليل" /> : <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-[#d9d0c0] bg-[#fdfbf6] text-center"><div><ScanLine className="mx-auto size-8 text-[#b78b5a]" /><p className="mt-4 text-sm font-semibold">ستظهر الصورة وطبقة الكشف هنا</p><p className="mt-2 text-xs text-[#8b8d83]">لا توجد نتائج نموذج مصطنعة.</p></div></div>}
              </div>
              <div className="mt-6 flex items-center justify-between"><h3 className="text-sm font-semibold">الكشفات المرصودة</h3><Badge variant="outline" className="border-[#d9c8ac] text-[#85572e]">{detections.length} منطقة</Badge></div>
              <div className="mt-3 max-h-40 overflow-auto rounded-2xl border border-[#eee8dd]">
                {detections.length ? detections.map((detection, index) => <div key={`${detection.label}-${index}`} className="flex items-center justify-between border-b border-[#f0eadf] px-4 py-3 text-xs last:border-0"><span className="font-old-permic text-base">{detection.label}</span><span className="text-[#617063]">ثقة {Math.round(detection.confidence * 100)}%</span></div>) : <p className="px-4 py-6 text-center text-xs text-[#87897e]">{analysis?.status === "model_not_configured" ? "الصورة محفوظة، لكن لا يمكن كشف محارف قبل ربط الوزن المدرّب." : "ستظهر كل منطقة مع فئتها ودرجة ثقتها هنا."}</p>}
              </div>
              <div className="mt-6 rounded-2xl bg-[#253b31] p-5 text-[#f9f2e5]">
                <div className="flex items-center justify-between"><div><p className="text-[11px] font-semibold tracking-[0.14em] text-[#e4ba7e]">EXTRACTED TEXT</p><p className="mt-2 text-xs text-[#c9d4c8]">نص مقترح، يُراجع قبل التوثيق.</p></div><Button size="icon" variant="ghost" onClick={copyText} disabled={!extractedText} className="text-[#fffaf0] hover:bg-white/10 hover:text-white"><Copy className="size-4" /><span className="sr-only">نسخ النص</span></Button></div>
                <p className="mt-5 min-h-12 break-all font-old-permic text-2xl leading-8">{extractedText || "—"}</p>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

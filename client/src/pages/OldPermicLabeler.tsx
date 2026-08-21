import ResearchHeader from "@/components/ResearchHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import JSZip from "jszip";
import {
  BoxSelect,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FolderOpen,
  ImagePlus,
  Info,
  MousePointer2,
  Plus,
  ScanLine,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import React, { type ChangeEvent, type DragEvent, type PointerEvent, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type OldPermicClass = { id: number; glyph: string; codepoint: string; name: string };

export const OLD_PERMIC_CLASSES: OldPermicClass[] = [
  ["𐍐", "U+10350", "OLD PERMIC LETTER AN"], ["𐍑", "U+10351", "OLD PERMIC LETTER BUR"], ["𐍒", "U+10352", "OLD PERMIC LETTER GAI"], ["𐍓", "U+10353", "OLD PERMIC LETTER DOI"], ["𐍔", "U+10354", "OLD PERMIC LETTER E"], ["𐍕", "U+10355", "OLD PERMIC LETTER ZHOI"], ["𐍖", "U+10356", "OLD PERMIC LETTER DZHOI"], ["𐍗", "U+10357", "OLD PERMIC LETTER ZATA"], ["𐍘", "U+10358", "OLD PERMIC LETTER DZITA"], ["𐍙", "U+10359", "OLD PERMIC LETTER I"], ["𐍚", "U+1035A", "OLD PERMIC LETTER KOKE"], ["𐍛", "U+1035B", "OLD PERMIC LETTER LEI"], ["𐍜", "U+1035C", "OLD PERMIC LETTER MENOE"], ["𐍝", "U+1035D", "OLD PERMIC LETTER NENOE"], ["𐍞", "U+1035E", "OLD PERMIC LETTER VOOI"], ["𐍟", "U+1035F", "OLD PERMIC LETTER PEEI"], ["𐍠", "U+10360", "OLD PERMIC LETTER REI"], ["𐍡", "U+10361", "OLD PERMIC LETTER SII"], ["𐍢", "U+10362", "OLD PERMIC LETTER TAI"], ["𐍣", "U+10363", "OLD PERMIC LETTER U"], ["𐍤", "U+10364", "OLD PERMIC LETTER CHERY"], ["𐍥", "U+10365", "OLD PERMIC LETTER SHOOI"], ["𐍦", "U+10366", "OLD PERMIC LETTER SHCHOOI"], ["𐍧", "U+10367", "OLD PERMIC LETTER YRY"], ["𐍨", "U+10368", "OLD PERMIC LETTER YERU"], ["𐍩", "U+10369", "OLD PERMIC LETTER O"], ["𐍪", "U+1036A", "OLD PERMIC LETTER OO"], ["𐍫", "U+1036B", "OLD PERMIC LETTER EF"], ["𐍬", "U+1036C", "OLD PERMIC LETTER HA"], ["𐍭", "U+1036D", "OLD PERMIC LETTER TSIU"], ["𐍮", "U+1036E", "OLD PERMIC LETTER VER"], ["𐍯", "U+1036F", "OLD PERMIC LETTER YER"], ["𐍰", "U+10370", "OLD PERMIC LETTER YERI"], ["𐍱", "U+10371", "OLD PERMIC LETTER YAT"], ["𐍲", "U+10372", "OLD PERMIC LETTER IE"], ["𐍳", "U+10373", "OLD PERMIC LETTER YU"], ["𐍴", "U+10374", "OLD PERMIC LETTER YA"], ["𐍵", "U+10375", "OLD PERMIC LETTER IA"],
].map(([glyph, codepoint, name], id) => ({ id, glyph, codepoint, name }));

type BoundingBox = { id: string; classId: number; x: number; y: number; width: number; height: number };
type LabelImage = { id: string; file: File; name: string; exportName: string; url: string; width: number; height: number; boxes: BoundingBox[] };
type DraftBox = { x: number; y: number; endX: number; endY: number };

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function normaliseBox(draft: DraftBox) {
  const x = Math.min(draft.x, draft.endX);
  const y = Math.min(draft.y, draft.endY);
  return { x, y, width: Math.abs(draft.endX - draft.x), height: Math.abs(draft.endY - draft.y) };
}

function yoloLine(box: BoundingBox) {
  const xCenter = (box.x + box.width / 2) / 100;
  const yCenter = (box.y + box.height / 2) / 100;
  return `${box.classId} ${xCenter.toFixed(6)} ${yCenter.toFixed(6)} ${(box.width / 100).toFixed(6)} ${(box.height / 100).toFixed(6)}`;
}

function labelFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "") + ".txt";
}

export default function OldPermicLabeler() {
  const [images, setImages] = useState<LabelImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [activeClassId, setActiveClassId] = useState(0);
  const [tool, setTool] = useState<"select" | "box">("box");
  const [draft, setDraft] = useState<DraftBox | null>(null);
  const [zoom, setZoom] = useState([100]);
  const [labelMode, setLabelMode] = useState<"auto" | "custom" | "fixed">("auto");
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  const activeImage = images.find((image) => image.id === activeImageId) ?? null;
  const activeClass = OLD_PERMIC_CLASSES[activeClassId];
  const boxCount = useMemo(() => images.reduce((total, image) => total + image.boxes.length, 0), [images]);
  const completedCount = useMemo(() => images.filter((image) => image.boxes.length > 0).length, [images]);
  const draftDimensions = draft ? normaliseBox(draft) : null;

  const addFiles = (fileList: FileList | File[]) => {
    const eligibleFiles = Array.from(fileList).filter((file) => imageTypes.has(file.type));
    const rejected = Array.from(fileList).length - eligibleFiles.length;
    if (rejected) toast.error("يدعم المختبر صور PNG وJPG وWebP فقط.");
    if (!eligibleFiles.length) return;

    const start = Date.now();
    const incoming = eligibleFiles.map((file, index) => {
      const url = URL.createObjectURL(file);
      return {
        id: `${start}-${index}-${file.name}`,
        file,
        name: file.name,
        exportName: `${String(index + 1).padStart(3, "0")}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
        url,
        width: 0,
        height: 0,
        boxes: [],
      } satisfies LabelImage;
    });

    setImages((current) => [...current, ...incoming]);
    setActiveImageId((current) => current ?? incoming[0]?.id ?? null);
    incoming.forEach((image) => {
      const nativeImage = new Image();
      nativeImage.onload = () => {
        setImages((current) => current.map((item) => (item.id === image.id ? { ...item, width: nativeImage.naturalWidth, height: nativeImage.naturalHeight } : item)));
      };
      nativeImage.src = image.url;
    });
    toast.success(`أضيفت ${incoming.length} صورة إلى مساحة الوسم المحلية.`);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  };

  const pointerPosition = (event: PointerEvent<HTMLDivElement>) => {
    const rectangle = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rectangle.left) / rectangle.width) * 100),
      y: clamp(((event.clientY - rectangle.top) / rectangle.height) * 100),
    };
  };

  const startBox = (event: PointerEvent<HTMLDivElement>) => {
    if (!activeImage || tool !== "box") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointerPosition(event);
    setDraft({ x: point.x, y: point.y, endX: point.x, endY: point.y });
  };

  const extendBox = (event: PointerEvent<HTMLDivElement>) => {
    if (!draft || tool !== "box") return;
    const point = pointerPosition(event);
    setDraft((current) => (current ? { ...current, endX: point.x, endY: point.y } : null));
  };

  const finishBox = (event: PointerEvent<HTMLDivElement>) => {
    if (!draft || !activeImage || tool !== "box") return;
    const point = pointerPosition(event);
    const dimensions = normaliseBox({ ...draft, endX: point.x, endY: point.y });
    setDraft(null);
    if (dimensions.width < 1 || dimensions.height < 1) return;
    const newBox: BoundingBox = { id: `${Date.now()}-${Math.random()}`, classId: activeClassId, ...dimensions };
    setImages((current) => current.map((image) => (image.id === activeImage.id ? { ...image, boxes: [...image.boxes, newBox] } : image)));
  };

  const removeBox = (boxId: string) => {
    if (!activeImage) return;
    setImages((current) => current.map((image) => (image.id === activeImage.id ? { ...image, boxes: image.boxes.filter((box) => box.id !== boxId) } : image)));
  };

  const clearActiveBoxes = () => {
    if (!activeImage) return;
    setImages((current) => current.map((image) => (image.id === activeImage.id ? { ...image, boxes: [] } : image)));
  };

  const navigate = (direction: -1 | 1) => {
    if (!activeImage || !images.length) return;
    const index = images.findIndex((image) => image.id === activeImage.id);
    const nextIndex = (index + direction + images.length) % images.length;
    setActiveImageId(images[nextIndex]?.id ?? null);
    setDraft(null);
  };

  const exportDataset = async () => {
    if (!images.length) {
      toast.error("أضف صورة واحدة على الأقل قبل التصدير.");
      return;
    }
    const zip = new JSZip();
    zip.file("classes.txt", OLD_PERMIC_CLASSES.map((item) => item.glyph).join("\n") + "\n");
    zip.file("README.txt", [
      "Old Permic character annotations for YOLO Detection.",
      "All images and labels were created locally in the browser.",
      `images: ${images.length}`,
      `boxes: ${boxCount}`,
      `classes: ${OLD_PERMIC_CLASSES.length}`,
    ].join("\n") + "\n");
    images.forEach((image) => {
      zip.file(`images/${image.exportName}`, image.file);
      zip.file(`labels/${labelFilename(image.exportName)}`, image.boxes.map(yoloLine).join("\n") + (image.boxes.length ? "\n" : ""));
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "old-permic-yolo-labels.zip";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
    toast.success("صُدّرت مجموعة YOLO محليًا في ملف ZIP واحد.");
  };

  return (
    <div className="min-h-screen bg-[#f6f3ec] text-[#27352d]" dir="rtl">
      <ResearchHeader />
      <main className="mx-auto max-w-[1720px] px-3 py-4 sm:px-5 lg:px-6">
        <section className="overflow-hidden rounded-[1.6rem] border border-[#d8d0c2] bg-[#fbfaf6] shadow-[0_18px_50px_rgba(47,51,40,0.09)]">
          <header className="flex flex-col gap-4 border-b border-[#ded8ca] bg-[#fffdf9] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#27463b] text-[#f5e9cd] shadow-[0_7px_15px_rgba(39,70,59,0.18)]"><BoxSelect className="size-5" /></span>
              <div><h1 className="text-base font-bold tracking-tight">ورشة وسم البرمية القديمة</h1><p className="mt-0.5 text-[10px] font-semibold tracking-[0.16em] text-[#9a6a38]">OLD PERMIC LABELING WORKSPACE</p></div>
              <Badge variant="outline" className="mr-2 border-[#d9c49c] bg-[#fffaf0] text-[11px] text-[#77542d]">YOLO Detection</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="border-[#ddd3c0] bg-white text-[#48554a]" onClick={() => toast.message("ارفع الصور، اختر محرفًا من الأبجدية البرمية، ثم اسحب صندوقًا فوق كل محرف. التصدير يبقى محليًا.")}><Info className="ml-2 size-3.5" />كيف تعمل؟</Button>
              <Button size="sm" className="bg-[#27463b] text-white hover:bg-[#1f3a30]" onClick={exportDataset}><Download className="ml-2 size-3.5" />تصدير المجموعة</Button>
            </div>
          </header>

          <div className="grid min-h-[720px] xl:grid-cols-[260px_minmax(0,1fr)_310px]" dir="rtl">
            <aside className="order-2 border-t border-[#e4ddd0] bg-[#fcfbf7] xl:order-1 xl:border-l xl:border-t-0" aria-label="الصور المضافة">
              <div className="border-b border-[#e4ddd0] p-4"><p className="text-[10px] font-semibold tracking-[0.16em] text-[#a16d37]">DATASET</p><div className="mt-2 flex items-end justify-between"><h2 className="text-sm font-bold">الصور المضافة</h2><span className="text-xs text-[#8c8b81]">{images.length}</span></div><div className="mt-3 flex gap-2"><Button variant="outline" size="sm" className="h-8 flex-1 border-[#d9d1c2] bg-white text-xs" onClick={() => fileInput.current?.click()}><Upload className="ml-1 size-3.5" />رفع</Button><Button variant="outline" size="icon" className="size-8 border-[#d9d1c2] bg-white" onClick={() => folderInput.current?.click()} aria-label="فتح مجلد"><FolderOpen className="size-3.5" /></Button></div></div>
              <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={onFileChange} className="sr-only" />
              <input ref={folderInput} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={onFileChange} className="sr-only" {...({ webkitdirectory: "", directory: "" } as Record<string, string>)} />
              <div className="max-h-[330px] overflow-auto p-3 xl:max-h-[calc(100vh-390px)]">
                {images.length ? <div className="space-y-2">{images.map((image, index) => <button key={image.id} onClick={() => { setActiveImageId(image.id); setDraft(null); }} className={`flex w-full items-center gap-3 rounded-xl border p-2 text-right transition ${image.id === activeImageId ? "border-[#b8915c] bg-[#fff8eb] shadow-sm" : "border-transparent hover:border-[#e1d7c5] hover:bg-white"}`}><span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#eae6dc]">{image.url ? <img src={image.url} alt="" className="size-full object-cover" /> : <ImagePlus className="size-4" />}{image.boxes.length ? <span className="absolute bottom-0 left-0 rounded-tr-md bg-[#2d6b55] px-1 text-[9px] text-white">{image.boxes.length}</span> : null}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{image.name}</span><span className="mt-1 block text-[10px] text-[#8d8c83]">{index + 1} · {image.width ? `${image.width}×${image.height}` : "جارٍ القراءة"}</span></span></button>)}</div> : <div className="grid min-h-48 place-items-center text-center"><div><ImagePlus className="mx-auto size-6 text-[#b69569]" /><p className="mt-3 text-xs font-semibold">لا توجد صور بعد</p><p className="mt-1 text-[11px] leading-5 text-[#89877d]">ارفع صفحة أو مجلدًا من الصور المتاحة للوسم.</p></div></div>}</div>
              <div className="border-t border-[#e4ddd0] p-4"><p className="text-[10px] font-semibold tracking-[0.14em] text-[#8b704c]">EXPORT FORMAT</p><div className="mt-1 flex items-center gap-2 text-xs font-semibold"><Check className="size-3.5 text-[#2f7258]" />YOLO Detection</div><p className="mt-2 text-[10px] leading-5 text-[#8c8a80]">تُنشأ labels وclasses.txt وصورك في ZIP محلي.</p></div>
            </aside>

            <section className="order-1 flex min-w-0 flex-col bg-[#f7f5ef] xl:order-2" aria-label="مساحة رسم صناديق الوسم">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2dbce] bg-[#faf9f5] px-4 py-3"><div className="flex items-center gap-2"><Button variant={tool === "select" ? "default" : "outline"} size="sm" className={tool === "select" ? "bg-[#27463b] text-white" : "border-[#d9d1c2] bg-white"} onClick={() => setTool("select")}><MousePointer2 className="ml-1 size-3.5" />وسم</Button><Button variant={tool === "box" ? "default" : "outline"} size="sm" className={tool === "box" ? "bg-[#27463b] text-white" : "border-[#d9d1c2] bg-white"} onClick={() => setTool("box")}><BoxSelect className="ml-1 size-3.5" />صندوق</Button><span className="hidden text-xs text-[#8b887e] sm:inline">{activeImage ? activeImage.name : "ANNOTATION / NO IMAGE"}</span></div><div className="flex items-center gap-3 text-xs text-[#77796f]"><span>{activeImage ? `${activeImage.width || "—"} × ${activeImage.height || "—"}` : "—"}</span><span>{tool === "box" ? "اسحب لرسم صندوق" : "وضع التحديد"}</span></div></div>
              <div className="relative flex min-h-[500px] flex-1 items-center justify-center overflow-auto p-5 sm:p-8">
                {activeImage ? <div className="relative w-full max-w-4xl overflow-hidden rounded-xl border border-[#cfc4b0] bg-[#e7e2d8] shadow-[0_10px_28px_rgba(60,58,45,0.12)]" style={{ transform: `scale(${zoom[0] / 100})`, transformOrigin: "center center" }}><div className="relative touch-none select-none" style={{ aspectRatio: activeImage.width && activeImage.height ? `${activeImage.width} / ${activeImage.height}` : "4 / 3" }} onPointerDown={startBox} onPointerMove={extendBox} onPointerUp={finishBox} onPointerCancel={() => setDraft(null)}><img src={activeImage.url} alt={`صورة الوسم ${activeImage.name}`} draggable={false} className="absolute inset-0 size-full object-cover" />{activeImage.boxes.map((box) => { const current = OLD_PERMIC_CLASSES[box.classId]; return <button key={box.id} type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => removeBox(box.id)} className="absolute border-2 border-[#e39a3e] bg-[#f5a947]/10 text-right outline-none transition hover:bg-[#e39a3e]/20 focus:ring-2 focus:ring-[#2d7058]" style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%` }} aria-label={`حذف صندوق ${current?.glyph ?? ""}`}><span className="absolute -top-6 right-0 flex h-5 items-center gap-1 rounded-t bg-[#d58222] px-1.5 font-old-permic text-xs text-white"><span>{current?.glyph}</span><X className="size-3" /></span></button>; })}{draftDimensions ? <div className="pointer-events-none absolute border-2 border-dashed border-[#2d7058] bg-[#4fa07d]/10" style={{ left: `${draftDimensions.x}%`, top: `${draftDimensions.y}%`, width: `${draftDimensions.width}%`, height: `${draftDimensions.height}%` }} /> : null}</div></div> : <div onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className="grid min-h-72 w-full max-w-xl place-items-center rounded-2xl border-2 border-dashed border-[#d5c9b6] bg-[#fffdf9] p-8 text-center shadow-[0_10px_30px_rgba(70,64,50,0.05)]"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl border border-[#e3d5be] bg-[#fff9ef] text-[#a96d31]"><Upload className="size-6" /></span><p className="mt-5 text-xl font-bold">جهّز مساحة الوسم</p><p className="mt-3 max-w-sm text-sm leading-7 text-[#77766e]">ارفع صورة أو اسحب مجموعة صور للبدء في بناء مجموعة محارف برمية قديمة بصيغة YOLO.</p><Button className="mt-6 bg-[#27463b] text-white hover:bg-[#1f3a30]" onClick={() => fileInput.current?.click()}><ImagePlus className="ml-2 size-4" />اختر الصور</Button><p className="mt-4 text-[11px] text-[#8d8b82]">كل المعالجة تبقى محليًا داخل المتصفح</p></div></div>}
              </div>
              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2dbce] bg-[#faf9f5] px-4 py-3"><div className="flex items-center gap-2"><Button variant="ghost" size="sm" className="text-[#875e31] hover:bg-[#fff1dc] hover:text-[#774b20]" onClick={clearActiveBoxes} disabled={!activeImage?.boxes.length}><Trash2 className="ml-1 size-3.5" />مسح الكل</Button><span className="text-xs text-[#8b8a82]">{activeImage?.boxes.length ?? 0} صندوق في الصورة</span></div><div className="flex items-center gap-2"><span className="text-[11px] text-[#8b8a82]">التكبير</span><Slider className="w-24" min={70} max={140} step={5} value={zoom} onValueChange={setZoom} /><span className="w-9 text-xs font-semibold text-[#6c695e]">{zoom[0]}%</span><Button variant="outline" size="sm" className="border-[#d8cdb9] bg-white" onClick={() => navigate(1)} disabled={!activeImage}><ChevronLeft className="ml-1 size-3.5" />التالي</Button></div></footer>
            </section>

            <aside className="order-3 border-t border-[#e4ddd0] bg-[#fcfbf7] xl:border-t-0" aria-label="تفاصيل الوسم">
              <div className="border-b border-[#e4ddd0] p-4"><p className="text-[10px] font-semibold tracking-[0.16em] text-[#a16d37]">INSPECTOR</p><h2 className="mt-2 text-base font-bold">تفاصيل الوسم</h2><div className="mt-4 flex items-center justify-between rounded-xl border border-[#e4dac9] bg-white p-3"><div><p className="text-[10px] text-[#8a887e]">الفئة النشطة</p><p className="mt-1 text-xs font-semibold">{activeClass?.codepoint} · class {activeClassId}</p></div><span className="grid size-11 place-items-center rounded-lg bg-[#b97834] font-old-permic text-2xl text-white">{activeClass?.glyph}</span></div></div>
              <div className="border-b border-[#e4ddd0] p-4"><div className="flex items-center justify-between"><h3 className="text-xs font-bold">أبجدية Old Permic</h3><span className="text-[11px] text-[#8b8a82]">{OLD_PERMIC_CLASSES.length} فئة</span></div><div className="mt-3 grid grid-cols-8 gap-1.5">{OLD_PERMIC_CLASSES.map((item) => <button key={item.id} type="button" title={`${item.codepoint} · ${item.name}`} onClick={() => setActiveClassId(item.id)} className={`grid aspect-square place-items-center rounded-md border font-old-permic text-lg transition ${item.id === activeClassId ? "border-[#2f7058] bg-[#2f7058] text-white shadow-sm" : "border-[#e1d7c7] bg-white text-[#46534b] hover:border-[#b68a55] hover:bg-[#fff9ee]"}`}>{item.glyph}</button>)}</div><p className="mt-3 text-[10px] leading-5 text-[#8a887e]">تقتصر القائمة على 38 محرفًا من مخزون التدريب الصناعي الحالي؛ لا توجد فئات للغات أخرى.</p></div>
              <div className="border-b border-[#e4ddd0] p-4"><p className="text-xs font-bold">سلوك الرسم</p><div className="mt-3 grid grid-cols-3 gap-1 rounded-lg border border-[#e0d5c3] bg-[#f6f2ea] p-1">{(["auto", "custom", "fixed"] as const).map((mode) => <button key={mode} type="button" onClick={() => setLabelMode(mode)} className={`rounded-md px-1 py-2 text-[10px] font-semibold transition ${labelMode === mode ? "bg-white text-[#295544] shadow-sm" : "text-[#817e74]"}`}>{mode === "auto" ? "مناسب للحرف" : mode === "custom" ? "مخصص" : "ثابت"}</button>)}</div><p className="mt-3 text-[10px] leading-5 text-[#8b887f]">{labelMode === "auto" ? "ارسم حدود الحبر الظاهر يدويًا؛ لا تُنشأ صناديق أو قراءات افتراضية." : labelMode === "custom" ? "يمكنك رسم صندوق بالمقاس الذي تراجعه أنت." : "يبقى وضع الرسم متاحًا مع مرجع ثابت للشكل فقط."}</p></div>
              <div className="p-4"><p className="text-xs font-bold">ملخص الصورة</p><dl className="mt-3 divide-y divide-[#eee7da] text-xs">{[["الأبعاد", activeImage?.width ? `${activeImage.width} × ${activeImage.height}` : "—"], ["الصناديق", String(activeImage?.boxes.length ?? 0)], ["التكبير", `${zoom[0]}%`]].map(([label, value]) => <div className="flex justify-between py-2.5" key={label}><dt className="text-[#87867e]">{label}</dt><dd className="font-semibold text-[#4c574e]">{value}</dd></div>)}</dl><div className="mt-4 rounded-xl border-r-2 border-[#2f7058] bg-[#ecf5ef] p-3 text-[10px] leading-5 text-[#3d6654]"><strong>جاهز لـ YOLO</strong><br />تتحول كل حدود إلى إحداثيات normalized عند التنزيل، مع فئة Old Permic المختارة.</div></div>
            </aside>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ddd5c7] bg-[#fffdf9] px-5 py-3 text-[10px] text-[#838179]"><span>محلي · لا يتم رفع الصور</span><span>{boxCount} BOXES / {images.length} IMAGES · {completedCount} موسومة</span><span>Old Permic Labeler · مصمم لمراجعة الباحث</span></footer>
        </section>
      </main>
    </div>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import ResearchHeader from "@/components/ResearchHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { startLogin } from "@/const";
import { primaryTextSources } from "@/data/primarySourceGallery";
import { trpc } from "@/lib/trpc";
import JSZip from "jszip";
import {
  BoxSelect,
  Check,
  ChevronLeft,
  Download,
  FolderOpen,
  ImagePlus,
  Info,
  Loader2,
  MousePointer2,
  Plus,
  RotateCcw,
  RotateCw,
  Save,
  ScanLine,
  ShieldCheck,
  Tags,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import React, { type ChangeEvent, type DragEvent, type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type OldPermicClass = { id: number; glyph: string; codepoint: string; name: string };

export const OLD_PERMIC_CLASSES: OldPermicClass[] = [
  ["𐍐", "U+10350", "OLD PERMIC LETTER AN"], ["𐍑", "U+10351", "OLD PERMIC LETTER BUR"], ["𐍒", "U+10352", "OLD PERMIC LETTER GAI"], ["𐍓", "U+10353", "OLD PERMIC LETTER DOI"], ["𐍔", "U+10354", "OLD PERMIC LETTER E"], ["𐍕", "U+10355", "OLD PERMIC LETTER ZHOI"], ["𐍖", "U+10356", "OLD PERMIC LETTER DZHOI"], ["𐍗", "U+10357", "OLD PERMIC LETTER ZATA"], ["𐍘", "U+10358", "OLD PERMIC LETTER DZITA"], ["𐍙", "U+10359", "OLD PERMIC LETTER I"], ["𐍚", "U+1035A", "OLD PERMIC LETTER KOKE"], ["𐍛", "U+1035B", "OLD PERMIC LETTER LEI"], ["𐍜", "U+1035C", "OLD PERMIC LETTER MENOE"], ["𐍝", "U+1035D", "OLD PERMIC LETTER NENOE"], ["𐍞", "U+1035E", "OLD PERMIC LETTER VOOI"], ["𐍟", "U+1035F", "OLD PERMIC LETTER PEEI"], ["𐍠", "U+10360", "OLD PERMIC LETTER REI"], ["𐍡", "U+10361", "OLD PERMIC LETTER SII"], ["𐍢", "U+10362", "OLD PERMIC LETTER TAI"], ["𐍣", "U+10363", "OLD PERMIC LETTER U"], ["𐍤", "U+10364", "OLD PERMIC LETTER CHERY"], ["𐍥", "U+10365", "OLD PERMIC LETTER SHOOI"], ["𐍦", "U+10366", "OLD PERMIC LETTER SHCHOOI"], ["𐍧", "U+10367", "OLD PERMIC LETTER YRY"], ["𐍨", "U+10368", "OLD PERMIC LETTER YERU"], ["𐍩", "U+10369", "OLD PERMIC LETTER O"], ["𐍪", "U+1036A", "OLD PERMIC LETTER OO"], ["𐍫", "U+1036B", "OLD PERMIC LETTER EF"], ["𐍬", "U+1036C", "OLD PERMIC LETTER HA"], ["𐍭", "U+1036D", "OLD PERMIC LETTER TSIU"], ["𐍮", "U+1036E", "OLD PERMIC LETTER VER"], ["𐍯", "U+1036F", "OLD PERMIC LETTER YER"], ["𐍰", "U+10370", "OLD PERMIC LETTER YERI"], ["𐍱", "U+10371", "OLD PERMIC LETTER YAT"], ["𐍲", "U+10372", "OLD PERMIC LETTER IE"], ["𐍳", "U+10373", "OLD PERMIC LETTER YU"], ["𐍴", "U+10374", "OLD PERMIC LETTER YA"], ["𐍵", "U+10375", "OLD PERMIC LETTER IA"],
].map(([glyph, codepoint, name], id) => ({ id, glyph, codepoint, name }));

type AnnotationStatus = "in_progress" | "needs_review" | "reviewed" | "approved" | "excluded";
type DatasetSplit = "unassigned" | "train" | "val" | "test";
type RotationDegrees = "0" | "90" | "180" | "270";
type BoundingBox = { id: string; classId: number; x: number; y: number; width: number; height: number };
type CropArea = { id: string; x: number; y: number; width: number; height: number };
type CropUpload = { filename: string; dataUrl: string };
type AnnotationRecord = {
  id: number; origin: "source_library" | "upload"; sourceLibraryId: string | null; originalFilename: string; imageUrl: string;
  sourceTitle: string; repositoryId: string; folioOrPage: string; sourceUrl: string; rightsBasis: string;
  oldPermicVisible: boolean; split: DatasetSplit; annotationStatus: AnnotationStatus; boxes: unknown; notes: string | null;
  imageWidth: number | null; imageHeight: number | null; rotationDegrees: RotationDegrees;
};
type LabelImage = Omit<AnnotationRecord, "boxes"> & { boxes: BoundingBox[] };
type DraftBox = { x: number; y: number; endX: number; endY: number };

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
export const CROP_DIALOG_CONTENT_CLASS = "w-[min(96vw,1560px)] max-w-[1560px] max-h-[94vh] overflow-y-auto border-[#d8cdbb] bg-[#fffdf9] p-0 text-[#28372f]";
const statusCopy: Record<AnnotationStatus, string> = {
  in_progress: "قيد الوسم", needs_review: "تحتاج مراجعة", reviewed: "مراجعة", approved: "معتمدة", excluded: "مستبعدة",
};

function clamp(value: number) { return Math.max(0, Math.min(100, value)); }
function normaliseBox(draft: DraftBox) { const x = Math.min(draft.x, draft.endX); const y = Math.min(draft.y, draft.endY); return { x, y, width: Math.abs(draft.endX - draft.x), height: Math.abs(draft.endY - draft.y) }; }
function isBox(value: unknown): value is BoundingBox { if (!value || typeof value !== "object") return false; const box = value as Record<string, unknown>; return typeof box.id === "string" && ["classId", "x", "y", "width", "height"].every((key) => typeof box[key] === "number"); }
function yoloLine(box: BoundingBox) { return `${box.classId} ${((box.x + box.width / 2) / 100).toFixed(6)} ${((box.y + box.height / 2) / 100).toFixed(6)} ${(box.width / 100).toFixed(6)} ${(box.height / 100).toFixed(6)}`; }
function mapRecord(record: AnnotationRecord): LabelImage { return { ...record, boxes: Array.isArray(record.boxes) ? record.boxes.filter(isBox) : [] }; }
function readFileDataUrl(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("تعذر قراءة الصورة.")); reader.readAsDataURL(file); }); }
export function cropTileFilename(originalFilename: string, index: number) { const cleaned = originalFilename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100); const stem = cleaned || "old-permic-image"; return `${stem}-tile-${String(index + 1).padStart(2, "0")}.webp`; }
function dataUrlBytes(dataUrl: string) { const comma = dataUrl.indexOf(","); return comma < 0 ? 0 : Math.floor((dataUrl.length - comma - 1) * 0.75); }
function cropDataUrl(source: string, crop: CropArea) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const sourceX = Math.round((crop.x / 100) * image.naturalWidth);
      const sourceY = Math.round((crop.y / 100) * image.naturalHeight);
      const sourceWidth = Math.max(1, Math.round((crop.width / 100) * image.naturalWidth));
      const sourceHeight = Math.max(1, Math.round((crop.height / 100) * image.naturalHeight));
      let scale = Math.min(1, 3200 / Math.max(sourceWidth, sourceHeight));
      let quality = 0.92;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(sourceWidth * scale));
        canvas.height = Math.max(1, Math.round(sourceHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) { reject(new Error("تعذر تجهيز مساحة القص.")); return; }
        context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/webp", quality);
        if (dataUrlBytes(dataUrl) <= 4_500_000) { resolve(dataUrl); return; }
        scale *= 0.78;
        quality = Math.max(0.58, quality - 0.07);
      }
      reject(new Error("أحد المقاطع ما زال كبيرًا جدًا للحفظ؛ ارسمه بحجم أصغر."));
    };
    image.onerror = () => reject(new Error("تعذر فتح الصورة الكبيرة للتقسيم."));
    image.src = source;
  });
}
function csvField(value: string) { return `"${value.replaceAll("\"", "\"\"")}"`; }
function exportImageName(image: LabelImage) { return `${String(image.id).padStart(5, "0")}_${image.originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_")}`; }
export function rotatePoint(point: { x: number; y: number }, rotation: RotationDegrees) {
  if (rotation === "90") return { x: 100 - point.y, y: point.x };
  if (rotation === "180") return { x: 100 - point.x, y: 100 - point.y };
  if (rotation === "270") return { x: point.y, y: 100 - point.x };
  return point;
}
export function unrotatePoint(point: { x: number; y: number }, rotation: RotationDegrees) {
  if (rotation === "90") return { x: point.y, y: 100 - point.x };
  if (rotation === "180") return { x: 100 - point.x, y: 100 - point.y };
  if (rotation === "270") return { x: 100 - point.y, y: point.x };
  return point;
}
export function displayedBox(box: BoundingBox, rotation: RotationDegrees) {
  const corners = [rotatePoint({ x: box.x, y: box.y }, rotation), rotatePoint({ x: box.x + box.width, y: box.y }, rotation), rotatePoint({ x: box.x, y: box.y + box.height }, rotation), rotatePoint({ x: box.x + box.width, y: box.y + box.height }, rotation)];
  const xs = corners.map((point) => point.x); const ys = corners.map((point) => point.y);
  const x = Math.min(...xs); const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}
function nextRotation(current: RotationDegrees, direction: 1 | -1): RotationDegrees {
  const values: RotationDegrees[] = ["0", "90", "180", "270"];
  return values[(values.indexOf(current) + direction + values.length) % values.length];
}

function RotatedImageCanvas({ src, rotation, alt }: { src: string; rotation: RotationDegrees; alt: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = new Image();
    image.onload = () => {
      const quarterTurn = rotation === "90" || rotation === "270";
      canvas.width = quarterTurn ? image.naturalHeight : image.naturalWidth;
      canvas.height = quarterTurn ? image.naturalWidth : image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) return;
      if (rotation === "90") { context.translate(canvas.width, 0); context.rotate(Math.PI / 2); }
      if (rotation === "180") { context.translate(canvas.width, canvas.height); context.rotate(Math.PI); }
      if (rotation === "270") { context.translate(0, canvas.height); context.rotate(-Math.PI / 2); }
      context.drawImage(image, 0, 0);
    };
    image.src = src;
  }, [rotation, src]);
  return <canvas ref={canvasRef} aria-label={alt} className="absolute inset-0 size-full" />;
}

export default function OldPermicLabeler() {
  const { isAuthenticated } = useAuth();
  const workspace = trpc.annotation.workspace.useQuery(undefined, { enabled: isAuthenticated });
  const reviewReady = trpc.annotation.exportReviewReady.useQuery(undefined, { enabled: isAuthenticated });
  const uploadImage = trpc.annotation.upload.useMutation();
  const importSource = trpc.annotation.importSource.useMutation();
  const saveImage = trpc.annotation.save.useMutation();
  const [images, setImages] = useState<LabelImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<number | null>(null);
  const [activeClassId, setActiveClassId] = useState(0);
  const [tool, setTool] = useState<"select" | "box">("box");
  const [draft, setDraft] = useState<DraftBox | null>(null);
  const [zoom, setZoom] = useState([100]);
  const [showSources, setShowSources] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [cropUpload, setCropUpload] = useState<CropUpload | null>(null);
  const [cropAreas, setCropAreas] = useState<CropArea[]>([]);
  const [cropDraft, setCropDraft] = useState<DraftBox | null>(null);
  const [cropNaturalSize, setCropNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [isSavingCrops, setIsSavingCrops] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const cropInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!workspace.data) return;
    const records = (workspace.data.images as AnnotationRecord[]).map(mapRecord);
    setImages(records);
    setActiveImageId((current) => current && records.some((image) => image.id === current) ? current : records[0]?.id ?? null);
  }, [workspace.data]);

  const activeImage = images.find((image) => image.id === activeImageId) ?? null;
  const activeClass = OLD_PERMIC_CLASSES[activeClassId];
  const boxCount = useMemo(() => images.reduce((total, image) => total + image.boxes.length, 0), [images]);
  const reviewedCount = useMemo(() => images.filter((image) => ["reviewed", "approved"].includes(image.annotationStatus)).length, [images]);
  const inProgressCount = images.length - reviewedCount;
  const draftDimensions = draft ? normaliseBox(draft) : null;

  const requireAuth = () => {
    if (isAuthenticated) return true;
    toast.message("سجّل الدخول أولًا لحفظ مشروع الوسم وبياناته.");
    startLogin();
    return false;
  };

  const replaceImage = (record: AnnotationRecord) => {
    const mapped = mapRecord(record);
    setImages((current) => current.some((image) => image.id === mapped.id) ? current.map((image) => image.id === mapped.id ? mapped : image) : [...current, mapped]);
    setActiveImageId(mapped.id);
  };

  const addFiles = async (fileList: FileList | File[]) => {
    if (!requireAuth()) return;
    const files = Array.from(fileList).filter((file) => imageTypes.has(file.type));
    if (Array.from(fileList).length > files.length) toast.error("يدعم المشروع صور PNG وJPG وWebP فقط.");
    if (!files.length) return;
    try {
      for (const file of files) {
        const record = await uploadImage.mutateAsync({ filename: file.name, dataUrl: await readFileDataUrl(file) });
        replaceImage(record as AnnotationRecord);
      }
      await workspace.refetch();
      setShowSources(false);
      toast.success(`أضيفت ${files.length} صورة إلى مشروع الوسم.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر حفظ الصورة في مشروع الوسم."); }
  };

  const openCropFile = async (file: File) => {
    if (!requireAuth()) return;
    if (!imageTypes.has(file.type)) { toast.error("يدعم التقسيم صور PNG وJPG وWebP فقط."); return; }
    try {
      setCropUpload({ filename: file.name, dataUrl: await readFileDataUrl(file) });
      setCropAreas([]);
      setCropDraft(null);
      setCropNaturalSize(null);
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر قراءة الصورة للتقسيم."); }
  };

  const closeCropDialog = () => {
    if (isSavingCrops) return;
    setCropUpload(null);
    setCropAreas([]);
    setCropDraft(null);
    setCropNaturalSize(null);
  };

  const cropPointerPosition = (event: PointerEvent<HTMLDivElement>) => {
    const rectangle = event.currentTarget.getBoundingClientRect();
    return { x: clamp(((event.clientX - rectangle.left) / rectangle.width) * 100), y: clamp(((event.clientY - rectangle.top) / rectangle.height) * 100) };
  };
  const startCrop = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    const point = cropPointerPosition(event); setCropDraft({ x: point.x, y: point.y, endX: point.x, endY: point.y });
  };
  const extendCrop = (event: PointerEvent<HTMLDivElement>) => { if (!cropDraft) return; const point = cropPointerPosition(event); setCropDraft((current) => current ? { ...current, endX: point.x, endY: point.y } : null); };
  const finishCrop = (event: PointerEvent<HTMLDivElement>) => {
    if (!cropDraft) return;
    const point = cropPointerPosition(event); const dimensions = normaliseBox({ ...cropDraft, endX: point.x, endY: point.y }); setCropDraft(null);
    if (dimensions.width < 3 || dimensions.height < 3) { toast.message("ارسم مقطعًا أكبر قليلًا."); return; }
    setCropAreas((current) => [...current, { id: `${Date.now()}-${Math.random()}`, ...dimensions }]);
  };
  const saveCropAreas = async () => {
    if (!cropUpload || !cropAreas.length || !requireAuth()) return;
    setIsSavingCrops(true);
    try {
      const created: AnnotationRecord[] = [];
      for (const [index, crop] of Array.from(cropAreas.entries())) {
        const dataUrl = await cropDataUrl(cropUpload.dataUrl, crop);
        const record = await uploadImage.mutateAsync({ filename: cropTileFilename(cropUpload.filename, index), dataUrl });
        created.push(record as AnnotationRecord);
      }
      created.forEach(replaceImage);
      await workspace.refetch();
      toast.success(`حُفظت ${created.length} مقاطع كصور مستقلة قابلة للوسم.`);
      closeCropDialog();
      setShowSources(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر حفظ مقاطع الصورة."); }
    finally { setIsSavingCrops(false); }
  };

  const addSource = async (source: typeof primaryTextSources[number]) => {
    if (!requireAuth()) return;
    try {
      const record = await importSource.mutateAsync({
        sourceLibraryId: source.id, sourceTitle: source.title, imageUrl: source.imageUrl, sourceUrl: source.sourceUrl,
        repositoryId: source.holdingInstitution.slice(0, 255), folioOrPage: source.catalogueRecord.slice(0, 255), rightsBasis: source.rights,
      });
      replaceImage(record as AnnotationRecord);
      await workspace.refetch();
      toast.success("أضيفت صورة المصدر إلى مشروع الوسم؛ ستبقى قيد الوسم حتى تراجعها.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر إضافة صورة المصدر."); }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files) void addFiles(event.target.files); event.target.value = ""; };
  const onCropFileChange = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) void openCropFile(file); event.target.value = ""; };
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); void addFiles(event.dataTransfer.files); };
  const pointerPosition = (event: PointerEvent<HTMLDivElement>) => { const rectangle = event.currentTarget.getBoundingClientRect(); const displayedPoint = { x: clamp(((event.clientX - rectangle.left) / rectangle.width) * 100), y: clamp(((event.clientY - rectangle.top) / rectangle.height) * 100) }; return unrotatePoint(displayedPoint, activeImage?.rotationDegrees ?? "0"); };
  const updateActive = (changes: Partial<LabelImage>) => { if (!activeImage) return; setImages((current) => current.map((image) => image.id === activeImage.id ? { ...image, ...changes } : image)); setIsDirty(true); };
  const startBox = (event: PointerEvent<HTMLDivElement>) => { if (!activeImage || tool !== "box") return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); const point = pointerPosition(event); setDraft({ x: point.x, y: point.y, endX: point.x, endY: point.y }); };
  const extendBox = (event: PointerEvent<HTMLDivElement>) => { if (!draft || tool !== "box") return; const point = pointerPosition(event); setDraft((current) => current ? { ...current, endX: point.x, endY: point.y } : null); };
  const finishBox = (event: PointerEvent<HTMLDivElement>) => { if (!draft || !activeImage || tool !== "box") return; const point = pointerPosition(event); const dimensions = normaliseBox({ ...draft, endX: point.x, endY: point.y }); setDraft(null); if (dimensions.width < 1 || dimensions.height < 1) return; updateActive({ boxes: [...activeImage.boxes, { id: `${Date.now()}-${Math.random()}`, classId: activeClassId, ...dimensions }] }); };
  const removeBox = (boxId: string) => updateActive({ boxes: activeImage?.boxes.filter((box) => box.id !== boxId) ?? [] });
  const clearActiveBoxes = () => updateActive({ boxes: [] });
  const navigate = (direction: -1 | 1) => { if (!activeImage || !images.length) return; const index = images.findIndex((image) => image.id === activeImage.id); setActiveImageId(images[(index + direction + images.length) % images.length]?.id ?? null); setDraft(null); setIsDirty(false); };
  const saveActive = async () => {
    if (!activeImage || !requireAuth()) return;
    try {
      const record = await saveImage.mutateAsync({
        imageId: activeImage.id, boxes: activeImage.boxes, annotationStatus: activeImage.annotationStatus, split: activeImage.split,
        notes: activeImage.notes, sourceTitle: activeImage.sourceTitle, repositoryId: activeImage.repositoryId, folioOrPage: activeImage.folioOrPage,
        sourceUrl: activeImage.sourceUrl, rightsBasis: activeImage.rightsBasis, oldPermicVisible: activeImage.oldPermicVisible,
        imageWidth: activeImage.imageWidth, imageHeight: activeImage.imageHeight, rotationDegrees: activeImage.rotationDegrees,
      });
      replaceImage(record as AnnotationRecord);
      setIsDirty(false);
      await workspace.refetch();
      toast.success("حُفظت الصناديق وحالة المراجعة داخل مشروع البيانات.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر حفظ حالة الصورة."); }
  };
  const exportDataset = async () => {
    if (!requireAuth()) return;
    const result = await reviewReady.refetch();
    const preflight = result.data;
    if (!preflight) { toast.error("تعذر فحص مجموعة البيانات قبل التصدير."); return; }
    if (!preflight.canExport) {
      toast.error("لا يمكن التصدير بعد: " + preflight.blockers[0]);
      return;
    }
    try {
      const readyImages = (preflight.reviewReady as AnnotationRecord[]).map(mapRecord);
      const zip = new JSZip();
      const root = "old_permic_real_labeled_v1";
      zip.file(`${root}/class_map.json`, JSON.stringify({
        schema_version: "1.0", script: "Old Permic / Abur",
        classes: OLD_PERMIC_CLASSES.map(({ id, glyph, codepoint, name }) => ({ id, label: glyph, unicode: codepoint, unicode_name: name })),
      }, null, 2));
      zip.file(`${root}/manifest_real.json`, JSON.stringify({
        dataset_version: "old_permic_real_labeled_v1", rights_reviewed: true, annotations_reviewed: true,
        exported_at_utc: new Date().toISOString(), exported_by: "research-project-owner", tool: "Old Permic Labeler",
        split_counts: preflight.splitCounts, image_count: preflight.readyImageCount, annotation_count: preflight.readyBoxCount,
        boundary: "Only images marked reviewed or approved by the researcher were exported."
      }, null, 2));
      const csvRows = [["image_file", "repository_id", "folio_or_page", "source_url", "rights_basis", "old_permic_visible", "annotation_status", "split", "notes"]];
      for (const image of readyImages) {
        const imageName = exportImageName(image);
        const response = await fetch(image.imageUrl);
        if (!response.ok) throw new Error(`تعذر قراءة ${image.originalFilename} للتصدير.`);
        zip.file(`${root}/images/${image.split}/${imageName}`, await response.blob());
        zip.file(`${root}/labels/${image.split}/${imageName.replace(/\.[^/.]+$/, "")}.txt`, image.boxes.map(yoloLine).join("\n") + "\n");
        csvRows.push([imageName, image.repositoryId, image.folioOrPage, image.sourceUrl, image.rightsBasis, "true", image.annotationStatus, image.split, image.notes ?? ""]);
      }
      zip.file(`${root}/sources.csv`, csvRows.map((row) => row.map(csvField).join(",")).join("\n") + "\n");
      zip.file(`${root}/README.txt`, "Reviewed Old Permic character annotations for YOLO. Run scripts/validate_real_labeled_dataset.py before training.\n");
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = "old_permic_real_labeled_v1.zip"; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      toast.success("صُدّرت حزمة البيانات الحقيقية المراجعة بصيغة YOLO.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر بناء حزمة YOLO."); }
  };
  const updateDimensions = (event: React.SyntheticEvent<HTMLImageElement>) => { if (!activeImage) return; const element = event.currentTarget; if (activeImage.imageWidth === element.naturalWidth && activeImage.imageHeight === element.naturalHeight) return; updateActive({ imageWidth: element.naturalWidth, imageHeight: element.naturalHeight }); };

  return (
    <div className="min-h-screen bg-[#f6f3ec] text-[#27352d]" dir="rtl">
      <ResearchHeader />
      <main className="mx-auto max-w-[1720px] px-3 py-4 sm:px-5 lg:px-6">
        <section className="overflow-hidden rounded-[1.6rem] border border-[#d8d0c2] bg-[#fbfaf6] shadow-[0_18px_50px_rgba(47,51,40,0.09)]">
          <header className="flex flex-col gap-4 border-b border-[#ded8ca] bg-[#fffdf9] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#27463b] text-[#f5e9cd] shadow-[0_7px_15px_rgba(39,70,59,0.18)]"><BoxSelect className="size-5" /></span><div><h1 className="text-base font-bold tracking-tight">ورشة وسم البرمية القديمة</h1><p className="mt-0.5 text-[10px] font-semibold tracking-[0.16em] text-[#9a6a38]">REVIEWED REAL-DATA WORKSPACE</p></div><Badge variant="outline" className="mr-2 border-[#d9c49c] bg-[#fffaf0] text-[11px] text-[#77542d]">YOLO Detection</Badge></div>
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-[#dfe5d7] bg-[#f4f8f1] px-3 py-1 text-xs text-[#446051]"><ShieldCheck className="ml-1 inline size-3.5" />{reviewedCount} مراجعة / {images.length || 0}</span><Button variant="outline" size="sm" className="border-[#ddd3c0] bg-white text-[#48554a]" onClick={() => toast.message("أضف صورة من مكتبة المصادر أو ارفع صورة جديدة. ارسم محارف مرئية فقط، ثم وثّق المصدر والحقوق والتقسيم قبل تعليمها مراجعة.")}><Info className="ml-2 size-3.5" />كيف تعمل؟</Button><Button variant="outline" size="sm" className="border-[#b9935f] bg-[#fffaf0] text-[#715027]" onClick={() => void exportDataset()} disabled={reviewReady.isFetching}><Download className="ml-2 size-3.5" />تصدير المراجَع</Button><Button size="sm" className="bg-[#27463b] text-white hover:bg-[#1f3a30]" onClick={saveActive} disabled={!activeImage || saveImage.isPending}>{saveImage.isPending ? <Loader2 className="ml-2 size-3.5 animate-spin" /> : <Save className="ml-2 size-3.5" />}{isDirty ? "حفظ التغييرات" : "حفظ الحالة"}</Button></div>
          </header>
          {!isAuthenticated ? <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ead6b9] bg-[#fff8ed] px-5 py-3 text-sm text-[#79542d]"><span>سجّل الدخول لحفظ صورك وصناديقك وحالات المراجعة داخل مشروع بياناتك.</span><Button size="sm" className="bg-[#7c552c] text-white hover:bg-[#68451f]" onClick={startLogin}>تسجيل الدخول</Button></div> : null}

          <div className="grid min-h-[720px] xl:grid-cols-[280px_minmax(0,1fr)_330px]" dir="rtl">
            <aside className="order-2 border-t border-[#e4ddd0] bg-[#fcfbf7] xl:order-1 xl:border-l xl:border-t-0" aria-label="صور مشروع الوسم">
              <div className="border-b border-[#e4ddd0] p-4"><p className="text-[10px] font-semibold tracking-[0.16em] text-[#a16d37]">REAL DATASET</p><div className="mt-2 flex items-end justify-between"><h2 className="text-sm font-bold">صور مشروع الوسم</h2><span className="text-xs text-[#8c8b81]">{images.length}</span></div><div className="mt-2 grid grid-cols-3 gap-1 text-center text-[10px]"><span className="rounded-md bg-[#eef4ec] py-1.5 text-[#35614b]">{reviewedCount} مكتملة</span><span className="rounded-md bg-[#fff3df] py-1.5 text-[#875d2c]">{inProgressCount} مفتوحة</span><span className="rounded-md bg-[#edf1e8] py-1.5 text-[#536257]">{boxCount} صندوق</span></div><div className="mt-3 flex gap-2"><Button variant={showSources ? "default" : "outline"} size="sm" className={showSources ? "h-8 flex-1 bg-[#27463b] text-xs text-white" : "h-8 flex-1 border-[#d9d1c2] bg-white text-xs"} onClick={() => setShowSources((current) => !current)}><Plus className="ml-1 size-3.5" />من المصادر</Button><Button variant="outline" size="sm" className="h-8 flex-1 border-[#d9d1c2] bg-white text-xs" onClick={() => fileInput.current?.click()}><Upload className="ml-1 size-3.5" />رفع</Button><Button variant="outline" size="icon" className="size-8 border-[#d9d1c2] bg-white" onClick={() => folderInput.current?.click()} aria-label="رفع مجلد"><FolderOpen className="size-3.5" /></Button></div></div>
              <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={onFileChange} className="sr-only" /><input ref={cropInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={onCropFileChange} className="sr-only" /><input ref={folderInput} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={onFileChange} className="sr-only" {...({ webkitdirectory: "", directory: "" } as Record<string, string>)} />
              <div className="px-4 pb-3"><Button variant="outline" size="sm" className="h-8 w-full border-dashed border-[#c9b68e] bg-[#fffaf0] text-xs text-[#725631]" onClick={() => cropInput.current?.click()}><ScanLine className="ml-1 size-3.5" />تقطيع قبل الإضافة</Button><p className="mt-1.5 text-[10px] leading-4 text-[#7c796e]">ارسم المقاطع المطلوبة ثم تحفظ كل قطعة صورةً مستقلة للوسم.</p></div>
              <div className="max-h-[430px] overflow-auto p-3 xl:max-h-[calc(100vh-390px)]">{showSources ? <div className="space-y-2">{primaryTextSources.map((source) => { const alreadyAdded = images.some((image) => image.sourceLibraryId === source.id); return <article key={source.id} className="rounded-xl border border-[#e4ddd0] bg-white p-2.5"><div className="flex gap-2"><img src={source.imageUrl} alt="" className="size-12 rounded-lg object-cover" /><div className="min-w-0"><p className="line-clamp-2 text-xs font-semibold">{source.title}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#87857d]">{source.trainingStatus}</p></div></div><Button size="sm" variant="outline" disabled={alreadyAdded || importSource.isPending} className="mt-2 h-7 w-full border-[#d7c7ad] text-[10px]" onClick={() => void addSource(source)}>{alreadyAdded ? "ضمن المشروع" : "أضف إلى الوسم"}</Button></article>; })}</div> : images.length ? <div className="space-y-2">{images.map((image, index) => <button key={image.id} onClick={() => { setActiveImageId(image.id); setDraft(null); setIsDirty(false); }} className={`flex w-full items-center gap-3 rounded-xl border p-2 text-right transition ${image.id === activeImageId ? "border-[#b8915c] bg-[#fff8eb] shadow-sm" : "border-transparent hover:border-[#e1d7c5] hover:bg-white"}`}><span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#eae6dc]"><img src={image.imageUrl} alt="" className="size-full object-cover" />{image.boxes.length ? <span className="absolute bottom-0 left-0 rounded-tr-md bg-[#2d6b55] px-1 text-[9px] text-white">{image.boxes.length}</span> : null}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{image.sourceTitle}</span><span className="mt-1 flex items-center justify-between gap-2 text-[10px]"><span className="truncate text-[#8d8c83]">{index + 1} · {image.imageWidth ? `${image.imageWidth}×${image.imageHeight}` : "الأبعاد لاحقًا"}</span><span className={image.annotationStatus === "approved" ? "text-[#297152]" : image.annotationStatus === "needs_review" ? "text-[#a36526]" : "text-[#828178]"}>{statusCopy[image.annotationStatus]}</span></span></span></button>)}</div> : <div className="grid min-h-48 place-items-center text-center"><div><ImagePlus className="mx-auto size-6 text-[#b69569]" /><p className="mt-3 text-xs font-semibold">لا توجد صور بعد</p><p className="mt-1 text-[11px] leading-5 text-[#89877d]">أضف مصادر المخطوطات أو ارفع صورًا جديدة.</p></div></div>}</div>
              <div className="border-t border-[#e4ddd0] p-4"><p className="text-[10px] font-semibold tracking-[0.14em] text-[#8b704c]">EXPORT GATE</p><p className="mt-1 text-[11px] leading-5 text-[#74746c]">{reviewReady.data?.canExport ? "الحزمة جاهزة بنيويًا للتصدير؛ راجع التنوع وحجم العينة قبل التدريب." : reviewReady.data?.blockers[0] ?? "لا تدخل صورة إلى حزمة التدريب إلا بعد وجود صناديق ومصدر وحقوق وتقسيم وحالة مراجعة."}</p><div className="mt-2 flex gap-1 text-[10px]"><span className="rounded bg-[#eef4ec] px-1.5 py-1">train {reviewReady.data?.splitCounts.train ?? 0}</span><span className="rounded bg-[#eef4ec] px-1.5 py-1">val {reviewReady.data?.splitCounts.val ?? 0}</span><span className="rounded bg-[#eef4ec] px-1.5 py-1">test {reviewReady.data?.splitCounts.test ?? 0}</span></div></div>
            </aside>

            <section className="order-1 flex min-w-0 flex-col bg-[#f7f5ef] xl:order-2" aria-label="مساحة رسم صناديق الوسم">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2dbce] bg-[#faf9f5] px-4 py-3"><div className="flex items-center gap-2"><Button variant={tool === "select" ? "default" : "outline"} size="sm" className={tool === "select" ? "bg-[#27463b] text-white" : "border-[#d9d1c2] bg-white"} onClick={() => setTool("select")}><MousePointer2 className="ml-1 size-3.5" />وسم</Button><Button variant={tool === "box" ? "default" : "outline"} size="sm" className={tool === "box" ? "bg-[#27463b] text-white" : "border-[#d9d1c2] bg-white"} onClick={() => setTool("box")}><BoxSelect className="ml-1 size-3.5" />صندوق</Button><span className="hidden text-xs text-[#8b887e] sm:inline">{activeImage ? activeImage.originalFilename : "ANNOTATION / NO IMAGE"}</span></div><div className="flex items-center gap-2 text-xs text-[#77796f]"><span>{activeImage ? `${activeImage.imageWidth || "—"} × ${activeImage.imageHeight || "—"}` : "—"}</span><span>{tool === "box" ? "اسحب لرسم صندوق" : "وضع التحديد"}</span></div></div>
              <div className="relative flex min-h-[500px] flex-1 items-center justify-center overflow-auto p-5 sm:p-8">{activeImage ? <div className="relative w-full max-w-4xl overflow-hidden rounded-xl border border-[#cfc4b0] bg-[#e7e2d8] shadow-[0_10px_28px_rgba(60,58,45,0.12)]" style={{ transform: `scale(${zoom[0] / 100})`, transformOrigin: "center center" }}><div className="relative touch-none select-none" style={{ aspectRatio: activeImage.imageWidth && activeImage.imageHeight ? (activeImage.rotationDegrees === "90" || activeImage.rotationDegrees === "270" ? `${activeImage.imageHeight} / ${activeImage.imageWidth}` : `${activeImage.imageWidth} / ${activeImage.imageHeight}`) : "4 / 3" }} onPointerDown={startBox} onPointerMove={extendBox} onPointerUp={finishBox} onPointerCancel={() => setDraft(null)}><img src={activeImage.imageUrl} alt="" draggable={false} onLoad={updateDimensions} className="sr-only" /><RotatedImageCanvas src={activeImage.imageUrl} rotation={activeImage.rotationDegrees} alt={`صورة الوسم ${activeImage.sourceTitle}`} />{activeImage.boxes.map((box) => { const current = OLD_PERMIC_CLASSES[box.classId]; const displayed = displayedBox(box, activeImage.rotationDegrees); return <button key={box.id} type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => removeBox(box.id)} className="absolute border-2 border-[#e39a3e] bg-[#f5a947]/10 text-right outline-none transition hover:bg-[#e39a3e]/20 focus:ring-2 focus:ring-[#2d7058]" style={{ left: `${displayed.x}%`, top: `${displayed.y}%`, width: `${displayed.width}%`, height: `${displayed.height}%` }} aria-label={`حذف صندوق ${current?.glyph ?? ""}`}><span className="absolute -top-6 right-0 flex h-5 items-center gap-1 rounded-t bg-[#d58222] px-1.5 font-old-permic text-xs text-white"><span>{current?.glyph}</span><X className="size-3" /></span></button>; })}{draftDimensions ? (() => { const displayed = displayedBox({ id: "draft", classId: activeClassId, ...draftDimensions }, activeImage.rotationDegrees); return <div className="pointer-events-none absolute border-2 border-dashed border-[#2d7058] bg-[#4fa07d]/10" style={{ left: `${displayed.x}%`, top: `${displayed.y}%`, width: `${displayed.width}%`, height: `${displayed.height}%` }} />; })() : null}</div></div> : <div onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className="grid min-h-72 w-full max-w-xl place-items-center rounded-2xl border-2 border-dashed border-[#d5c9b6] bg-[#fffdf9] p-8 text-center shadow-[0_10px_30px_rgba(70,64,50,0.05)]"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl border border-[#e3d5be] bg-[#fff9ef] text-[#a96d31]"><Upload className="size-6" /></span><p className="mt-5 text-xl font-bold">جهّز مشروع البيانات الحقيقية</p><p className="mt-3 max-w-sm text-sm leading-7 text-[#77766e]">أضف صورة من مكتبة المخطوطات أو ارفع صورة جديدة، ثم وسم المحارف المرئية وحفظ حالة مراجعتها.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><Button className="bg-[#27463b] text-white hover:bg-[#1f3a30]" onClick={() => setShowSources(true)}><Tags className="ml-2 size-4" />استعرض المصادر</Button><Button variant="outline" className="border-[#d7c7ad] bg-white" onClick={() => fileInput.current?.click()}><ImagePlus className="ml-2 size-4" />ارفع صورة</Button></div><p className="mt-4 text-[11px] text-[#8d8b82]">تُحفظ الصور المرفوعة وبيانات المراجعة في مشروعك؛ لا يعني الحفظ اعتمادها للتدريب.</p></div></div>}</div>
              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2dbce] bg-[#faf9f5] px-4 py-3"><div className="flex items-center gap-2"><Button variant="ghost" size="sm" className="text-[#875e31] hover:bg-[#fff1dc] hover:text-[#774b20]" onClick={clearActiveBoxes} disabled={!activeImage?.boxes.length}><Trash2 className="ml-1 size-3.5" />مسح الكل</Button><span className="text-xs text-[#8b8a82]">{activeImage?.boxes.length ?? 0} صندوق في الصورة {isDirty ? "· تغييرات غير محفوظة" : ""}</span></div><div className="flex flex-wrap items-center gap-2"><span className="text-[11px] text-[#8b8a82]">التدوير</span><Button variant="outline" size="icon" className="size-8 border-[#d8cdb9] bg-white" onClick={() => { if (activeImage) updateActive({ rotationDegrees: nextRotation(activeImage.rotationDegrees, -1) }); }} disabled={!activeImage} aria-label="تدوير عكس عقارب الساعة"><RotateCcw className="size-3.5" /></Button><span className="w-8 text-center text-xs font-semibold text-[#6c695e]">{activeImage?.rotationDegrees ?? "0"}°</span><Button variant="outline" size="icon" className="size-8 border-[#d8cdb9] bg-white" onClick={() => { if (activeImage) updateActive({ rotationDegrees: nextRotation(activeImage.rotationDegrees, 1) }); }} disabled={!activeImage} aria-label="تدوير مع عقارب الساعة"><RotateCw className="size-3.5" /></Button><span className="mr-2 text-[11px] text-[#8b8a82]">التكبير</span><Button variant="outline" size="sm" className="h-7 border-[#d8cdb9] bg-white px-2 text-[10px]" onClick={() => setZoom([100])}>100%</Button><Button variant="outline" size="sm" className="h-7 border-[#d8cdb9] bg-white px-2 text-[10px]" onClick={() => setZoom([200])}>200%</Button><Button variant="outline" size="sm" className="h-7 border-[#d8cdb9] bg-white px-2 text-[10px]" onClick={() => setZoom([300])}>300%</Button><Slider className="w-24" min={50} max={400} step={10} value={zoom} onValueChange={setZoom} /><span className="w-10 text-xs font-semibold text-[#6c695e]">{zoom[0]}%</span><Button variant="outline" size="sm" className="border-[#d8cdb9] bg-white" onClick={() => navigate(1)} disabled={!activeImage}><ChevronLeft className="ml-1 size-3.5" />التالي</Button></div></footer>
            </section>

            <aside className="order-3 border-t border-[#e4ddd0] bg-[#fcfbf7] xl:border-t-0" aria-label="تفاصيل الوسم والمراجعة">
              <div className="border-b border-[#e4ddd0] p-4"><p className="text-[10px] font-semibold tracking-[0.16em] text-[#a16d37]">INSPECTOR</p><h2 className="mt-2 text-base font-bold">تفاصيل الوسم والمراجعة</h2><div className="mt-4 flex items-center justify-between rounded-xl border border-[#e4dac9] bg-white p-3"><div><p className="text-[10px] text-[#8a887e]">الفئة النشطة</p><p className="mt-1 text-xs font-semibold">{activeClass?.codepoint} · class {activeClassId}</p></div><span className="grid size-11 place-items-center rounded-lg bg-[#b97834] font-old-permic text-2xl text-white">{activeClass?.glyph}</span></div></div>
              <div className="border-b border-[#e4ddd0] p-4"><div className="flex items-center justify-between"><h3 className="text-xs font-bold">أبجدية Old Permic</h3><span className="text-[11px] text-[#8b8a82]">{OLD_PERMIC_CLASSES.length} فئة</span></div><div className="mt-3 grid grid-cols-8 gap-1.5">{OLD_PERMIC_CLASSES.map((item) => <button key={item.id} type="button" title={`${item.codepoint} · ${item.name}`} onClick={() => setActiveClassId(item.id)} className={`grid aspect-square place-items-center rounded-md border font-old-permic text-lg transition ${item.id === activeClassId ? "border-[#2f7058] bg-[#2f7058] text-white shadow-sm" : "border-[#e1d7c7] bg-white text-[#46534b] hover:border-[#b68a55] hover:bg-[#fff9ee]"}`}>{item.glyph}</button>)}</div><p className="mt-3 text-[10px] leading-5 text-[#8a887e]">تقتصر القائمة على 38 محرفًا. لا تدخل علامة غير مقروءة في boxes.</p></div>
              {activeImage ? <div className="space-y-3 p-4"><div className="grid grid-cols-2 gap-2"><label className="text-[10px] text-[#77756d]">الحالة<select value={activeImage.annotationStatus} onChange={(event) => updateActive({ annotationStatus: event.target.value as AnnotationStatus })} className="mt-1 w-full rounded-lg border border-[#ddd3c3] bg-white px-2 py-2 text-xs text-[#38473e]"><option value="in_progress">قيد الوسم</option><option value="needs_review">تحتاج مراجعة</option><option value="reviewed">مراجعة</option><option value="approved">معتمدة</option><option value="excluded">مستبعدة</option></select></label><label className="text-[10px] text-[#77756d]">التقسيم<select value={activeImage.split} onChange={(event) => updateActive({ split: event.target.value as DatasetSplit })} className="mt-1 w-full rounded-lg border border-[#ddd3c3] bg-white px-2 py-2 text-xs text-[#38473e]"><option value="unassigned">غير معين</option><option value="train">train</option><option value="val">val</option><option value="test">test</option></select></label></div><label className="block text-[10px] text-[#77756d]">اسم المصدر<input value={activeImage.sourceTitle} onChange={(event) => updateActive({ sourceTitle: event.target.value })} className="mt-1 w-full rounded-lg border border-[#ddd3c3] bg-white px-2 py-2 text-xs text-[#38473e]" /></label><div className="grid grid-cols-2 gap-2"><label className="text-[10px] text-[#77756d]">المستودع<input value={activeImage.repositoryId} onChange={(event) => updateActive({ repositoryId: event.target.value })} className="mt-1 w-full rounded-lg border border-[#ddd3c3] bg-white px-2 py-2 text-xs text-[#38473e]" /></label><label className="text-[10px] text-[#77756d]">الورقة/الصفحة<input value={activeImage.folioOrPage} onChange={(event) => updateActive({ folioOrPage: event.target.value })} className="mt-1 w-full rounded-lg border border-[#ddd3c3] bg-white px-2 py-2 text-xs text-[#38473e]" /></label></div><label className="block text-[10px] text-[#77756d]">رابط المصدر<input type="url" value={activeImage.sourceUrl} onChange={(event) => updateActive({ sourceUrl: event.target.value })} className="mt-1 w-full rounded-lg border border-[#ddd3c3] bg-white px-2 py-2 text-xs text-[#38473e]" /></label><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e1d7c7] bg-[#fffdf9] px-2.5 py-2 text-[11px] text-[#556258]"><input type="checkbox" checked={activeImage.oldPermicVisible} onChange={(event) => updateActive({ oldPermicVisible: event.target.checked })} className="size-3.5 accent-[#2f7058]" />تظهر البرمية القديمة فعلًا في الصورة</label><label className="block text-[10px] text-[#77756d]">أساس الحقوق<textarea value={activeImage.rightsBasis} onChange={(event) => updateActive({ rightsBasis: event.target.value })} rows={2} className="mt-1 w-full resize-none rounded-lg border border-[#ddd3c3] bg-white px-2 py-2 text-xs leading-5 text-[#38473e]" /></label><label className="block text-[10px] text-[#77756d]">ملاحظات المراجعة<textarea value={activeImage.notes ?? ""} onChange={(event) => updateActive({ notes: event.target.value || null })} rows={2} placeholder="ما الذي راجعته؟ وما الذي بقي غامضًا؟" className="mt-1 w-full resize-none rounded-lg border border-[#ddd3c3] bg-white px-2 py-2 text-xs leading-5 text-[#38473e]" /></label><p className="rounded-lg border-r-2 border-[#2f7058] bg-[#ecf5ef] p-2.5 text-[10px] leading-5 text-[#3d6654]">لا يمكن تعليم الصورة «مراجعة» أو «معتمدة» حتى تحوي صناديق وتقسيمًا واضحًا. ستُصدر لاحقًا الصور المعتمدة أو المراجعة فقط.</p></div> : <div className="p-4 text-center text-xs text-[#858279]">اختر صورة لإظهار بيانات المصدر والمراجعة.</div>}
            </aside>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ddd5c7] bg-[#fffdf9] px-5 py-3 text-[10px] text-[#838179]"><span>مشروع محفوظ · صور جديدة في التخزين</span><span>{boxCount} BOXES / {images.length} IMAGES · {reviewedCount} مراجعة</span><span>لا تصبح البيانات تدريبية إلا عبر بوابة التصدير المراجعة</span></footer>
        </section>
        <Dialog open={Boolean(cropUpload)} onOpenChange={(open) => { if (!open) closeCropDialog(); }}>
          {cropUpload ? <DialogContent className={CROP_DIALOG_CONTENT_CLASS} dir="rtl">
            <DialogHeader className="border-b border-[#e3dccf] px-5 pb-4 pt-5 sm:px-7"><DialogTitle>تقطيع الصورة الكبيرة قبل الإضافة</DialogTitle><DialogDescription className="max-w-4xl leading-6">ارسم مستطيلًا لكل مقطع تريد وسمه. تظهر الصورة هنا بعرض موسع لتتمكن من قراءة التفاصيل بدقة. لا تُرفع الصورة الأصلية؛ تُحوَّل المقاطع المختارة فقط إلى صور WebP مستقلة داخل مشروعك.</DialogDescription></DialogHeader>
            <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:p-6">
              <div className="rounded-2xl border border-[#d9cfbf] bg-[#ece7dd] p-2.5 shadow-inner sm:p-3"><div className="relative touch-none select-none overflow-hidden rounded-xl bg-[#dcd5c9]" style={{ aspectRatio: cropNaturalSize ? `${cropNaturalSize.width} / ${cropNaturalSize.height}` : "4 / 3" }} onPointerDown={startCrop} onPointerMove={extendCrop} onPointerUp={finishCrop} onPointerCancel={() => setCropDraft(null)}><img src={cropUpload.dataUrl} alt="معاينة الصورة الأصلية للتقسيم" draggable={false} onLoad={(event) => setCropNaturalSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} className="absolute inset-0 size-full object-contain" />{cropAreas.map((crop, index) => <button key={crop.id} type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setCropAreas((current) => current.filter((item) => item.id !== crop.id))} className="absolute border-2 border-[#2d7058] bg-[#50a27c]/15 outline-none transition hover:bg-[#d97c39]/20" style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%` }} aria-label={`حذف المقطع ${index + 1}`}><span className="absolute -top-6 right-0 rounded-t bg-[#2d7058] px-2 py-0.5 text-[10px] text-white">مقطع {index + 1} ×</span></button>)}{cropDraft ? <div className="pointer-events-none absolute border-2 border-dashed border-[#b97834] bg-[#d8a15a]/15" style={{ left: `${normaliseBox(cropDraft).x}%`, top: `${normaliseBox(cropDraft).y}%`, width: `${normaliseBox(cropDraft).width}%`, height: `${normaliseBox(cropDraft).height}%` }} /> : null}</div></div>
              <aside className="max-h-[32vh] overflow-y-auto rounded-2xl border border-[#e2d8c8] bg-white p-4 lg:max-h-none"><p className="text-[10px] font-semibold tracking-[0.15em] text-[#a16d37]">CROP QUEUE</p><p className="mt-2 text-sm font-bold">{cropAreas.length} مقاطع جاهزة</p><p className="mt-2 text-[11px] leading-5 text-[#77756d]">يمكن أن تتداخل المقاطع إذا احتجت سياقًا بصريًا. يظهر كل مقطع لاحقًا كصورة منفصلة في قائمة الوسم، ويُراجع ويُقسّم ويُصدّر منفصلًا.</p><Button variant="outline" size="sm" className="mt-4 w-full border-[#d9cdbb] bg-[#fffdf9] text-xs" onClick={() => setCropAreas([])} disabled={!cropAreas.length || isSavingCrops}><Trash2 className="ml-1 size-3.5" />مسح المقاطع</Button><p className="mt-4 rounded-lg bg-[#f2f7ef] p-2.5 text-[10px] leading-5 text-[#466153]">يحافظ النظام على دقة المقطع ما أمكن ثم يضغطه عند الحاجة ليبقى ضمن حد الرفع الآمن.</p></aside>
            </div>
            <DialogFooter className="border-t border-[#e3dccf] px-5 py-4 sm:px-7"><Button variant="outline" onClick={closeCropDialog} disabled={isSavingCrops}>إلغاء</Button><Button className="bg-[#27463b] text-white hover:bg-[#1f3a30]" onClick={() => void saveCropAreas()} disabled={!cropAreas.length || isSavingCrops}>{isSavingCrops ? <Loader2 className="ml-2 size-4 animate-spin" /> : <Upload className="ml-2 size-4" />}أنشئ المقاطع واحفظها</Button></DialogFooter>
          </DialogContent> : null}
        </Dialog>
      </main>
    </div>
  );
}

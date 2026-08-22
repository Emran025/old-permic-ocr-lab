import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import * as ort from "onnxruntime-node";
import sharp from "sharp";
import { z } from "zod";
import { GITHUB_RELEASE_SYNC, fetchPublishedTrainingRelease } from "./trainingReleaseSync";

const INPUT_SIZE = 960;
const CLASS_COUNT = 38;
const MODEL_FILL_VALUE = 114 / 255;
const RELEASE_CACHE_DIR = "/tmp/old-permic-onnx";

const classMapSchema = z.object({
  classes: z.array(z.object({ id: z.number().int().min(0).max(CLASS_COUNT - 1), label: z.string().min(1) })).length(CLASS_COUNT),
});

type Candidate = { classId: number; label: string; confidence: number; x1: number; y1: number; x2: number; y2: number };
type Letterbox = { width: number; height: number; scale: number; left: number; top: number };

let modelPromise: Promise<{ session: ort.InferenceSession; labels: string[]; releaseId: string }> | null = null;

function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function clamp(value: number, lower: number, upper: number) {
  return Math.max(lower, Math.min(upper, value));
}

function iou(a: Candidate, b: Candidate) {
  const left = Math.max(a.x1, b.x1);
  const top = Math.max(a.y1, b.y1);
  const right = Math.min(a.x2, b.x2);
  const bottom = Math.min(a.y2, b.y2);
  const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
  const union = Math.max(0, a.x2 - a.x1) * Math.max(0, a.y2 - a.y1) + Math.max(0, b.x2 - b.x1) * Math.max(0, b.y2 - b.y1) - intersection;
  return union > 0 ? intersection / union : 0;
}

export function nonMaximumSuppress(candidates: Candidate[], iouThreshold: number) {
  const selected: Candidate[] = [];
  for (const candidate of [...candidates].sort((a, b) => b.confidence - a.confidence)) {
    if (!selected.some((chosen) => chosen.classId === candidate.classId && iou(chosen, candidate) > iouThreshold)) selected.push(candidate);
  }
  return selected;
}

export function decodeYoloV8Output(
  values: Float32Array,
  predictionCount: number,
  labels: string[],
  letterbox: Letterbox,
  confidenceThreshold: number,
  iouThreshold: number,
) {
  const candidates: Candidate[] = [];
  for (let index = 0; index < predictionCount; index += 1) {
    let classId = 0;
    let confidence = values[(4 * predictionCount) + index] ?? 0;
    for (let candidateClass = 1; candidateClass < CLASS_COUNT; candidateClass += 1) {
      const score = values[((candidateClass + 4) * predictionCount) + index] ?? 0;
      if (score > confidence) { confidence = score; classId = candidateClass; }
    }
    if (confidence < confidenceThreshold || !Number.isFinite(confidence)) continue;
    const cx = values[index] ?? 0;
    const cy = values[predictionCount + index] ?? 0;
    const width = values[(2 * predictionCount) + index] ?? 0;
    const height = values[(3 * predictionCount) + index] ?? 0;
    const x1 = (cx - width / 2 - letterbox.left) / letterbox.scale;
    const y1 = (cy - height / 2 - letterbox.top) / letterbox.scale;
    const x2 = (cx + width / 2 - letterbox.left) / letterbox.scale;
    const y2 = (cy + height / 2 - letterbox.top) / letterbox.scale;
    if (x2 <= x1 || y2 <= y1) continue;
    candidates.push({
      classId,
      label: labels[classId] ?? `class-${classId}`,
      confidence,
      x1: clamp(x1, 0, letterbox.width),
      y1: clamp(y1, 0, letterbox.height),
      x2: clamp(x2, 0, letterbox.width),
      y2: clamp(y2, 0, letterbox.height),
    });
  }
  return nonMaximumSuppress(candidates, iouThreshold).slice(0, 300);
}

function median(values: number[]) {
  if (!values.length) return 12;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function oldPermicReadingOrder(detections: Candidate[]) {
  const lineTolerance = Math.max(12, median(detections.map((item) => Math.max(1, item.y2 - item.y1))));
  return [...detections]
    .sort((a, b) => {
      const aCenterY = (a.y1 + a.y2) / 2;
      const bCenterY = (b.y1 + b.y2) / 2;
      if (Math.abs(aCenterY - bCenterY) > lineTolerance) return aCenterY - bCenterY;
      return a.x1 - b.x1;
    })
    .map((item) => item.label)
    .join("");
}

async function createInputTensor(buffer: Buffer) {
  const metadata = await sharp(buffer, { failOn: "none" }).metadata();
  if (!metadata.width || !metadata.height) throw new Error("تعذر قراءة أبعاد الصورة للاستدلال.");
  const scale = Math.min(INPUT_SIZE / metadata.width, INPUT_SIZE / metadata.height);
  const resizedWidth = Math.max(1, Math.round(metadata.width * scale));
  const resizedHeight = Math.max(1, Math.round(metadata.height * scale));
  const left = Math.floor((INPUT_SIZE - resizedWidth) / 2);
  const top = Math.floor((INPUT_SIZE - resizedHeight) / 2);
  const { data, info } = await sharp(buffer, { failOn: "none" })
    .resize(resizedWidth, resizedHeight, { fit: "fill" })
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels !== 3) throw new Error("لم تتحول الصورة إلى RGB للاستدلال.");
  const tensor = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE).fill(MODEL_FILL_VALUE);
  for (let y = 0; y < resizedHeight; y += 1) {
    for (let x = 0; x < resizedWidth; x += 1) {
      const source = (y * resizedWidth + x) * 3;
      const targetPixel = (top + y) * INPUT_SIZE + left + x;
      tensor[targetPixel] = data[source]! / 255;
      tensor[INPUT_SIZE * INPUT_SIZE + targetPixel] = data[source + 1]! / 255;
      tensor[(2 * INPUT_SIZE * INPUT_SIZE) + targetPixel] = data[source + 2]! / 255;
    }
  }
  return {
    input: new ort.Tensor("float32", tensor, [1, 3, INPUT_SIZE, INPUT_SIZE]),
    letterbox: { width: metadata.width, height: metadata.height, scale, left, top },
  };
}

function rawGithubAssetUrl(releasePath: string, assetPath: string) {
  const releaseDirectory = releasePath.split("/").slice(0, -1).join("/");
  return `https://raw.githubusercontent.com/${GITHUB_RELEASE_SYNC.repository}/${GITHUB_RELEASE_SYNC.branch}/${releaseDirectory}/${assetPath}`;
}

async function loadModel() {
  const remote = await fetchPublishedTrainingRelease();
  const onnxAsset = remote.release.assets.find((asset) => asset.kind === "onnx_weight" && asset.path.endsWith(".onnx"));
  if (!onnxAsset) throw new Error("الإصدار المنشور لا يعلن وزن ONNX صالحًا للاستدلال.");
  const parsedClassMap = classMapSchema.parse(remote.classMap);
  const labels = [...parsedClassMap.classes].sort((a, b) => a.id - b.id).map((item, index) => {
    if (item.id !== index) throw new Error("خريطة فئات الإصدار المنشور غير متسلسلة.");
    return item.label;
  });
  await fs.mkdir(RELEASE_CACHE_DIR, { recursive: true });
  const cachePath = path.join(RELEASE_CACHE_DIR, `${onnxAsset.sha256}.onnx`);
  let modelBytes: Buffer | null = null;
  try {
    const cached = await fs.readFile(cachePath);
    if (sha256(cached) === onnxAsset.sha256) modelBytes = cached;
  } catch { /* Artifact will be downloaded. */ }
  if (!modelBytes) {
    const response = await fetch(rawGithubAssetUrl(remote.pointer.release_path, onnxAsset.path));
    if (!response.ok) throw new Error(`تعذر تنزيل وزن ONNX المنشور (${response.status}).`);
    modelBytes = Buffer.from(await response.arrayBuffer());
    if (modelBytes.length !== onnxAsset.bytes || sha256(modelBytes) !== onnxAsset.sha256) throw new Error("بصمة وزن ONNX المنشور غير مطابقة لعقد الإصدار.");
    await fs.writeFile(cachePath, modelBytes);
  }
  const session = await ort.InferenceSession.create(cachePath, { executionProviders: ["cpu"] });
  if (session.inputNames[0] !== "images" || session.outputNames.length !== 1) throw new Error("توقيع نموذج ONNX المنشور لا يطابق YOLO المتوقع.");
  return { session, labels, releaseId: remote.release.release_id };
}

async function getModel() {
  modelPromise ??= loadModel().catch((error) => { modelPromise = null; throw error; });
  return modelPromise;
}

export async function getPublishedOcrModelStatus() {
  try {
    const remote = await fetchPublishedTrainingRelease();
    const onnxAsset = remote.release.assets.find((asset) => asset.kind === "onnx_weight" && asset.path.endsWith(".onnx"));
    const classMap = classMapSchema.parse(remote.classMap);
    if (!onnxAsset || classMap.classes.length !== CLASS_COUNT) throw new Error("لا يكتمل عقد الاستدلال المنشور.");
    return {
      available: true,
      engine: "YOLOv8 ONNX",
      releaseId: remote.release.release_id,
      message: "استدلال حرفي فعلي بوزن S1 الصناعي المنشور؛ النتائج على المخطوطات التاريخية اقتراحات بحثية غير مُتحقق منها بعد.",
      syntheticOnly: true,
    } as const;
  } catch (error) {
    return {
      available: false,
      engine: "YOLOv8 ONNX",
      message: `تعذر التحقق من artifact المنشور: ${error instanceof Error ? error.message : "خطأ غير معروف."}`,
      syntheticOnly: true,
    } as const;
  }
}

export async function inferOldPermicCharacters(buffer: Buffer, confidenceThreshold: number, iouThreshold: number) {
  const model = await getModel();
  const prepared = await createInputTensor(buffer);
  const output = await model.session.run({ images: prepared.input });
  const tensor = output[model.session.outputNames[0] ?? "output0"];
  if (!tensor || tensor.dims.length !== 3 || tensor.dims[0] !== 1 || tensor.dims[1] !== CLASS_COUNT + 4 || typeof tensor.data === "string") {
    throw new Error("مخرجات نموذج ONNX لا تطابق كشف محارف البرمية المتوقع.");
  }
  const detections = decodeYoloV8Output(tensor.data as Float32Array, tensor.dims[2]!, model.labels, prepared.letterbox, confidenceThreshold, iouThreshold);
  return { detections, extractedText: oldPermicReadingOrder(detections), releaseId: model.releaseId, imageWidth: prepared.letterbox.width, imageHeight: prepared.letterbox.height };
}

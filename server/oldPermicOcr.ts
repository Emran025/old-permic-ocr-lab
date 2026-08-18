import { TRPCError } from "@trpc/server";

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ParsedImageUpload = {
  mimeType: string;
  buffer: Buffer;
};

export function parseImageDataUrl(dataUrl: string): ParsedImageUpload {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
  if (!match) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "اختر صورة PNG أو JPG أو WebP صالحة.",
    });
  }

  const mimeType = match[1];
  if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "صيغة الصورة غير مدعومة." });
  }

  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
    throw new TRPCError({
      code: "PAYLOAD_TOO_LARGE",
      message: "يجب أن يكون حجم الصورة بين 1 بايت و5 ميغابايت.",
    });
  }

  return { mimeType, buffer };
}

export function safeFileName(fileName: string): string {
  const cleaned = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return cleaned.slice(0, 120) || "old-permic-image";
}

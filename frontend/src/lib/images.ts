// Upload validation and image processing: location-free original + WebP lightbox/thumbnail versions.
import sharp from "sharp";
import { randomBytes } from "node:crypto";
import { storage } from "./storage";
import { stripLocation } from "./strip-location";

export const ALLOWED_TYPES: Record<string, string> = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" };
export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB || 25) * 1024 * 1024;

export function validateFile(file: File): string | null {
  // Unknown/blank types are allowed through; processImage checks the real format with sharp.
  if (!ALLOWED_TYPES[file.type] && !["", "application/octet-stream"].includes(file.type)) return `${file.name}: this file type isn't supported. Please upload JPEG, PNG or WebP photos.`;
  if (file.size > MAX_UPLOAD_BYTES) return `${file.name}: this photo is larger than ${process.env.MAX_UPLOAD_MB || 25} MB. Please export a smaller version.`;
  return null;
}

export const randomId = (n = 12) => randomBytes(n).toString("base64url").slice(0, n);

export async function processPhoto(galleryId: string, file: File) {
  return processImage(galleryId, Buffer.from(await file.arrayBuffer()), file.name);
}

const FORMAT_MIME: Record<string, string> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

// Stores a location-free original plus WebP "large" (lightbox) and "thumb" (grid) versions.
export async function processImage(galleryId: string, raw: Buffer, name: string) {
  const meta = await sharp(raw).metadata().catch(() => null);
  if (!meta?.format || !FORMAT_MIME[meta.format]) throw new Error(`${name}: this file looks damaged or isn't a real photo. Try exporting it again.`);
  const mime = FORMAT_MIME[meta.format];
  const input = await stripLocation(raw, mime);
  // Derived images never carry metadata (sharp strips it unless asked to keep it).
  const base = sharp(input, { failOn: "none" }).rotate();
  const [large, thumb] = await Promise.all([
    base.clone().resize(2000, 2000, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true }),
    base.clone().resize(640, 640, { fit: "inside", withoutEnlargement: true }).webp({ quality: 75 }).toBuffer(),
  ]);
  const id = randomId(16);
  const ext = meta.format === "jpeg" ? "jpg" : meta.format;
  const keys = {
    originalKey: `galleries/${galleryId}/${id}/original.${ext}`,
    largeKey: `galleries/${galleryId}/${id}/large.webp`,
    thumbKey: `galleries/${galleryId}/${id}/thumb.webp`,
  };
  await Promise.all([
    storage.put(keys.originalKey, input, mime),
    storage.put(keys.largeKey, large.data, "image/webp"),
    storage.put(keys.thumbKey, thumb, "image/webp"),
  ]);
  return { ...keys, mime, size: input.length, width: large.info.width, height: large.info.height };
}

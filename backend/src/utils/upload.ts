import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import type { MultipartFile } from "@fastify/multipart";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads", "products");
export const MAX_IMAGES_PER_PRODUCT = 5;
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class UploadError extends Error {}

export async function saveProductImage(file: MultipartFile): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new UploadError(`Tipo de archivo no permitido: ${file.mimetype}`);
  }

  const ext = path.extname(file.filename) || ".jpg";
  const filename = `${randomUUID()}${ext}`;
  const destPath = path.join(UPLOAD_DIR, filename);

  await pipeline(file.file, fs.createWriteStream(destPath));

  if (file.file.truncated) {
    // El archivo excedió el límite de tamaño configurado en el plugin multipart
    fs.unlinkSync(destPath);
    throw new UploadError("La imagen supera el tamaño máximo permitido (5MB).");
  }

  return `/uploads/products/${filename}`;
}

export function deleteProductImageFile(url: string) {
  const filename = path.basename(url);
  const filePath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

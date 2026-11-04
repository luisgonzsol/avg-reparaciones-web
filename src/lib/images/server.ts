import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { PHOTO_LIMITS } from "@/content/forms";
import { sniffImageType } from "@/lib/files";

export type ProcessedImage = {
  buffer: Buffer;
  contentType: "image/jpeg" | "image/webp";
  ext: "jpg" | "webp";
};

export class ImageRejectedError extends Error {
  constructor(public readonly userMessage: string) {
    super(userMessage);
    this.name = "ImageRejectedError";
  }
}

/** Archivos de un FormData (ignora campos vacíos que envía el navegador). */
export function filesFrom(formData: FormData, field: string): File[] {
  return formData.getAll(field).filter((v): v is File => v instanceof File && v.size > 0);
}

/**
 * Valida y re-codifica una imagen subida:
 *  1. Tamaño máximo (5 MB) y tipo REAL por magic bytes (JPG, PNG, WEBP).
 *  2. sharp la decodifica (si está corrupta o es otra cosa, falla), la
 *     endereza según EXIF, la reduce y la vuelve a codificar.
 *  3. El resultado NO lleva metadatos (EXIF/GPS, perfil, comentarios):
 *     sharp los descarta salvo que se pidan expresamente.
 */
export async function processImage(
  file: File,
  { maxSide = 1600, format = "jpeg" as "jpeg" | "webp", label = "La foto" } = {},
): Promise<ProcessedImage> {
  if (file.size > PHOTO_LIMITS.maxBytes) {
    throw new ImageRejectedError(`${label} pesa más de 5 MB.`);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!sniffImageType(bytes.subarray(0, 12))) {
    throw new ImageRejectedError(`${label} no es una imagen JPG, PNG o WEBP.`);
  }
  try {
    const pipeline = sharp(bytes, { failOn: "error", limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true });
    const buffer =
      format === "webp"
        ? await pipeline.webp({ quality: 80 }).toBuffer()
        : await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    return format === "webp"
      ? { buffer, contentType: "image/webp", ext: "webp" }
      : { buffer, contentType: "image/jpeg", ext: "jpg" };
  } catch {
    throw new ImageRejectedError(`${label} está dañada o no se puede leer.`);
  }
}

/** Nombre aleatorio (UUID): nunca se usa el nombre original del archivo. */
export function randomImagePath(prefix: string, ext: string): string {
  return `${prefix}/${randomUUID()}.${ext}`;
}

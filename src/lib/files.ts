/**
 * Validación de imágenes por su contenido real (magic bytes), no por la
 * extensión ni por el tipo que declara el navegador. Funciona en el
 * navegador y en el servidor.
 */
import { PHOTO_LIMITS } from "@/content/forms";

export type ImageMime = (typeof PHOTO_LIMITS.mimeTypes)[number];

export function sniffImageType(bytes: Uint8Array): ImageMime | null {
  const b = bytes;
  // JPEG: FF D8 FF
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length >= 8 && png.every((v, i) => b[i] === v)) return "image/png";
  // WEBP: "RIFF" .... "WEBP"
  if (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export type PhotoCheck = { ok: true; type: ImageMime } | { ok: false; error: string };

export async function checkPhoto(file: Blob & { name?: string }): Promise<PhotoCheck> {
  const name = file.name ? `«${file.name}»` : "La foto";
  if (file.size === 0) return { ok: false, error: `${name} está vacía.` };
  if (file.size > PHOTO_LIMITS.maxBytes) {
    return { ok: false, error: `${name} pesa más de 5 MB. Elige una foto más liviana.` };
  }
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const type = sniffImageType(head);
  if (!type) return { ok: false, error: `${name} no es una imagen JPG, PNG o WEBP.` };
  return { ok: true, type };
}

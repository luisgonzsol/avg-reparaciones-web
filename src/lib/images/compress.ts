/**
 * Compresión de fotos EN EL NAVEGADOR antes de subirlas: reduce el tamaño
 * (el límite de una petición en Vercel es 4,5 MB) y, al redibujar la imagen
 * en un canvas, elimina los metadatos EXIF (ubicación GPS).
 * El servidor vuelve a validar y re-codificar todo igualmente.
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff"; // fondo blanco para PNG con transparencia
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], "foto.jpg", { type: "image/jpeg" });
  } catch {
    return file; // navegador antiguo: se envía el original y el servidor lo procesa
  }
}

/** Tamaño máximo total que enviamos en una petición (margen bajo 4,5 MB). */
export const MAX_UPLOAD_BYTES = 3.8 * 1024 * 1024;

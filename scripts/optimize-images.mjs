// Optimiza las imágenes originales de /assets y las copia a /public/images.
// Uso: npm run images
// - Quita metadatos (EXIF/GPS) y recomprime.
// - next/image se encarga después de servir WebP/AVIF en tamaños responsivos.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const src = (f) => path.join(root, "assets", f);
const out = (f) => path.join(root, "public", "images", f);

await mkdir(path.join(root, "public", "images"), { recursive: true });

// Foto de la fachada (900x1600, vertical).
// 1) Recorte centrado en el letrero y el mostrador (para "Nosotros").
await sharp(src("local.jpg.jpeg"))
  .rotate()
  .extract({ left: 150, top: 380, width: 600, height: 720 })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(out("local-avg-mostrador.jpg"));

// 2) Foto completa, redimensionada.
await sharp(src("local.jpg.jpeg"))
  .rotate()
  .resize({ width: 900, withoutEnlargement: true })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(out("local-avg-fachada.jpg"));

console.log("Imágenes optimizadas en public/images/");

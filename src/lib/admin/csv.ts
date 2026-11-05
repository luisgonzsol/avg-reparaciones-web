/**
 * CSV de productos para la carga inicial del inventario (importar/exportar).
 *
 * Formato (primera fila = cabeceras, en este orden o en cualquier otro):
 *   sku;nombre;slug;categoria;marcas;precio_usd;stock;umbral_stock_bajo;
 *   garantia;destacado;activo;descripcion;compatibilidad
 *
 * - Separador ";" (el que usa Excel en español) o "," (se detecta solo).
 * - categoria y marcas van por su "slug" (p. ej. licuadoras, oster|philips).
 * - Sí/no: si, no, true, false, 1, 0.
 * - Precio con punto o coma decimal: 12.50 o 12,50.
 * - slug vacío: se genera a partir del nombre.
 */
import { z } from "@/lib/zod";
import { slugify } from "@/lib/slug";

export const CSV_HEADERS = [
  "sku",
  "nombre",
  "slug",
  "categoria",
  "marcas",
  "precio_usd",
  "stock",
  "umbral_stock_bajo",
  "garantia",
  "destacado",
  "activo",
  "descripcion",
  "compatibilidad",
] as const;

const REQUIRED = ["sku", "nombre", "categoria", "precio_usd", "stock"] as const;

/* ---------- Lectura ---------- */

export function detectDelimiter(firstLine: string): ";" | "," {
  const semi = (firstLine.match(/;/g) ?? []).length;
  const comma = (firstLine.match(/,/g) ?? []).length;
  return semi >= comma ? ";" : ",";
}

/** Analiza CSV (RFC 4180: comillas dobles, saltos de línea dentro de comillas). */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const d = detectDelimiter(firstLine);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
      continue;
    }
    if (c === '"' && cell === "") quoted = true;
    else if (c === d) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

const bool = z
  .string()
  .trim()
  .toLowerCase()
  .transform((v, ctx) => {
    if (["si", "sí", "true", "1", "x", "yes"].includes(v)) return true;
    if (["no", "false", "0", ""].includes(v)) return false;
    ctx.addIssue({ code: "custom", message: "usa «si» o «no»" });
    return z.NEVER;
  });

const intField = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,6}$/, `${label}: número entero (0 o más)`)
    .transform(Number);

export const productCsvRowSchema = z
  .object({
    sku: z
      .string()
      .default("")
      .pipe(z.string().trim().min(1, "sku obligatorio").max(40, "sku: máximo 40 caracteres")),
    nombre: z
      .string()
      .default("")
      .pipe(z.string().trim().min(2, "nombre obligatorio").max(140, "nombre: máximo 140 caracteres")),
    slug: z.string().trim().max(120).default(""),
    categoria: z.string().default("").pipe(z.string().trim().toLowerCase().min(1, "categoría obligatoria")),
    marcas: z.string().trim().default(""),
    precio_usd: z
      .string()
      .default("")
      .pipe(
        z
          .string()
          .trim()
          .transform((v) => v.replace(",", "."))
          .refine(
            (v) => /^\d{1,8}(\.\d{1,2})?$/.test(v) && Number(v) > 0,
            "precio_usd: número mayor que 0 (p. ej. 12.50)",
          ),
      ),
    stock: z.string().default("").pipe(intField("stock")),
    umbral_stock_bajo: z.string().trim().default("3").pipe(intField("umbral_stock_bajo")),
    garantia: z.string().default("no").pipe(bool),
    destacado: z.string().default("no").pipe(bool),
    activo: z.string().default("si").pipe(bool),
    descripcion: z.string().trim().max(4000, "descripción: máximo 4000 caracteres").default(""),
    compatibilidad: z.string().trim().max(1000, "compatibilidad: máximo 1000 caracteres").default(""),
  })
  .transform((r) => ({
    sku: r.sku,
    name: r.nombre,
    slug: slugify(r.slug || r.nombre),
    category: r.categoria,
    brands: r.marcas
      .split(/[|/]/)
      .map((b) => b.trim().toLowerCase())
      .filter(Boolean),
    price_usd: r.precio_usd,
    stock: r.stock,
    low_stock_threshold: r.umbral_stock_bajo,
    has_warranty: r.garantia,
    featured: r.destacado,
    active: r.activo,
    description: r.descripcion,
    compatibility: r.compatibilidad,
  }))
  .refine((r) => r.slug.length > 0, {
    message: "no se pudo generar el slug a partir del nombre",
    path: ["slug"],
  });

export type ProductCsvRow = z.output<typeof productCsvRowSchema>;

export type CsvParseResult = { ok: true; rows: ProductCsvRow[] } | { ok: false; errors: string[] };

const MAX_ROWS = 2000;

/** Convierte el texto CSV en filas validadas o en una lista de errores legibles. */
export function readProductsCsv(text: string): CsvParseResult {
  const table = parseCsv(text);
  if (table.length < 2)
    return { ok: false, errors: ["El archivo está vacío o solo tiene la fila de cabeceras."] };
  if (table.length - 1 > MAX_ROWS)
    return { ok: false, errors: [`Máximo ${MAX_ROWS} productos por archivo.`] };

  const header = table[0]!.map((h) => h.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));
  const missing = REQUIRED.filter((r) => !header.includes(r));
  if (missing.length) return { ok: false, errors: [`Faltan columnas obligatorias: ${missing.join(", ")}.`] };

  const errors: string[] = [];
  const rows: ProductCsvRow[] = [];
  const seenSku = new Map<string, number>();
  const seenSlug = new Map<string, number>();

  table.slice(1).forEach((cells, idx) => {
    const line = idx + 2; // fila en la hoja de cálculo
    const raw: Record<string, string> = {};
    header.forEach((h, i) => {
      // Celda vacía = valor por defecto de la columna.
      const v = cells[i] ?? "";
      if ((CSV_HEADERS as readonly string[]).includes(h) && v.trim() !== "") raw[h] = v;
    });
    const parsed = productCsvRowSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push(`Fila ${line}: ${parsed.error.issues.map((i) => i.message).join("; ")}.`);
      return;
    }
    const r = parsed.data;
    const dupSku = seenSku.get(r.sku.toLowerCase());
    if (dupSku) errors.push(`Fila ${line}: el sku ${r.sku} ya aparece en la fila ${dupSku}.`);
    const dupSlug = seenSlug.get(r.slug);
    if (dupSlug) errors.push(`Fila ${line}: el slug ${r.slug} ya aparece en la fila ${dupSlug}.`);
    seenSku.set(r.sku.toLowerCase(), line);
    seenSlug.set(r.slug, line);
    rows.push(r);
  });

  if (errors.length) return { ok: false, errors: errors.slice(0, 30) };
  return { ok: true, rows };
}

/* ---------- Escritura ---------- */

/** Escapa una celda y neutraliza fórmulas (=, +, -, @) para Excel. */
export function csvCell(value: string | number | boolean | null | undefined, delimiter = ";"): string {
  let v =
    value === null || value === undefined
      ? ""
      : typeof value === "boolean"
        ? value
          ? "si"
          : "no"
        : String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /["\n\r;,]/.test(v) || v.includes(delimiter) ? `"${v.replace(/"/g, '""')}"` : v;
}

export type ProductExportRow = {
  sku: string;
  name: string;
  slug: string;
  category: string;
  brands: string[];
  price_usd: number | string;
  stock: number;
  low_stock_threshold: number;
  has_warranty: boolean;
  featured: boolean;
  active: boolean;
  description: string;
  compatibility: string;
};

export function writeProductsCsv(rows: ProductExportRow[]): string {
  const lines = [CSV_HEADERS.join(";")];
  for (const r of rows) {
    lines.push(
      [
        r.sku,
        r.name,
        r.slug,
        r.category,
        r.brands.join("|"),
        Number(r.price_usd).toFixed(2),
        r.stock,
        r.low_stock_threshold,
        r.has_warranty,
        r.featured,
        r.active,
        r.description,
        r.compatibility,
      ]
        .map((v) => csvCell(v))
        .join(";"),
    );
  }
  // BOM para que Excel reconozca las tildes (UTF-8).
  return `﻿${lines.join("\r\n")}\r\n`;
}

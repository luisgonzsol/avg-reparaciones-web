/**
 * Validaciones comunes (Zod). Se usan en el cliente para dar mensajes
 * claros y SIEMPRE se repiten en el servidor.
 */
import { z } from "zod";

/** Quita espacios sobrantes y caracteres de control. */
export function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export const text = (min: number, max: number, label: string) =>
  z
    .string({ error: `Escribe ${label}.` })
    .transform(cleanText)
    .pipe(
      z
        .string()
        // Primero el mensaje para el campo vacío (toFieldErrors toma el primero).
        .min(1, `Escribe ${label}.`)
        .min(min, `${capitalize(label)}: escribe al menos ${min} caracteres.`)
        .max(max, `${capitalize(label)}: máximo ${max} caracteres.`),
    );

export const optionalText = (max: number, label: string) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? cleanText(v) : ""))
    .pipe(z.string().max(max, `${capitalize(label)}: máximo ${max} caracteres.`));

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Teléfono venezolano. Acepta 0412-1234567, 04121234567, +58 412 1234567,
 * 58 (412) 123.45.67 y fijos (0212…). Devuelve el formato E.164: +584121234567.
 */
export function normalizeVePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("58") && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  // Móviles: 412, 414, 416, 422, 424, 426. Fijos: 2XX.
  if (!/^(4(12|14|16|22|24|26)|2\d{2})\d{7}$/.test(digits)) return null;
  return `+58${digits}`;
}

export const vePhone = z
  .string({ error: "Escribe tu teléfono." })
  .trim()
  .min(1, "Escribe tu teléfono.")
  .max(25, "Teléfono no válido.")
  .transform((v, ctx) => {
    const normalized = normalizeVePhone(v);
    if (!normalized) {
      ctx.addIssue({
        code: "custom",
        message: "Escribe un teléfono venezolano válido, por ejemplo 0412-1234567.",
      });
      return z.NEVER;
    }
    return normalized;
  });

export const optionalEmail = z
  .string()
  .trim()
  .max(254, "El correo es demasiado largo.")
  .optional()
  .transform((v) => (v ? v.toLowerCase() : ""))
  .pipe(z.union([z.literal(""), z.email("Escribe un correo válido, por ejemplo nombre@gmail.com.")]));

export const requiredEmail = z
  .string({ error: "Escribe tu correo." })
  .trim()
  .min(1, "Escribe tu correo.")
  .max(254, "El correo es demasiado largo.")
  .toLowerCase()
  .pipe(z.email("Escribe un correo válido, por ejemplo nombre@gmail.com."));

/**
 * Cédula o RIF venezolano. Acepta "V12345678", "v-12.345.678",
 * "J-12345678-9", "E 8123456". Devuelve "V-12345678" o "J-12345678-9".
 */
export function normalizeIdDoc(input: string): string | null {
  const s = input.toUpperCase().replace(/[\s.]/g, "");
  const m = /^([VEJGP])-?(\d{5,9})(?:-?(\d))?$/.exec(s);
  if (!m) return null;
  const letter = m[1]!;
  let number = m[2]!;
  let check = m[3];
  // RIF jurídico/gubernamental escrito todo junto: J123456789 → J-12345678-9
  if (check === undefined && (letter === "J" || letter === "G") && number.length === 9) {
    check = number.slice(-1);
    number = number.slice(0, -1);
  }
  if (check !== undefined && number.length !== 8) return null;
  return check !== undefined ? `${letter}-${number}-${check}` : `${letter}-${number}`;
}

/** Enmascara la cédula para mostrarla en páginas públicas: V-****5678. */
export function maskIdDoc(doc: string): string {
  const m = /^([A-Z])-(\d+)(-\d)?$/.exec(doc);
  if (!m) return "****";
  const digits = m[2]!;
  return `${m[1]}-${"*".repeat(Math.max(digits.length - 4, 1))}${digits.slice(-4)}${m[3] ? "-*" : ""}`;
}

export const idDoc = z
  .string({ error: "Escribe tu cédula o RIF." })
  .trim()
  .min(1, "Escribe tu cédula o RIF.")
  .max(20, "Cédula o RIF no válido.")
  .transform((v, ctx) => {
    const n = normalizeIdDoc(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "Escribe una cédula o RIF válido, por ejemplo V-12345678." });
      return z.NEVER;
    }
    return n;
  });

/** Casilla obligatoria (checkbox HTML envía "on"). */
export const mustAccept = (message: string) =>
  z.union([z.literal("on"), z.literal("true"), z.literal(true)], { error: message }).transform(() => true);

export const yesNo = z
  .union([z.literal("yes"), z.literal("no")], { error: "Elige una opción." })
  .transform((v) => v === "yes");

/** Campo trampa para bots: debe llegar vacío. */
export const honeypot = z.string().optional();

export type FieldErrors = Record<string, string>;

/** Convierte los errores de Zod en { campo: primer mensaje }. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

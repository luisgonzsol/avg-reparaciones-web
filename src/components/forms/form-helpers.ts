import type { z } from "zod";
import { toFieldErrors, type FieldErrors } from "@/lib/validation/common";

/** FormData → objeto plano de strings (sin archivos). */
export function formValues(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of new FormData(form).entries()) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

/** Valida en el navegador con el mismo esquema que el servidor. */
export function validateWith(schema: z.ZodType, values: Record<string, string>): FieldErrors {
  const r = schema.safeParse(values);
  return r.success ? {} : toFieldErrors(r.error);
}

/** Lleva el foco al primer campo con error. */
export function focusFirstError(form: HTMLFormElement | null, errors: FieldErrors, order: string[]) {
  if (!form) return;
  const first = order.find((name) => errors[name]) ?? Object.keys(errors)[0];
  if (!first) return;
  const el = form.elements.namedItem(first);
  const target =
    el instanceof RadioNodeList ? (el[0] as HTMLElement | undefined) : (el as HTMLElement | null);
  target?.focus();
  target?.scrollIntoView({ block: "center", behavior: "smooth" });
}

/** Copia del objeto sin la clave indicada. */
export function omitKey<T extends Record<string, unknown>>(obj: T, key: string): T {
  const copy = { ...obj };
  delete copy[key];
  return copy;
}

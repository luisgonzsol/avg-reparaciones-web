"use server";
/**
 * Acciones de los formularios públicos.
 *
 * FASE 2: los datos se VALIDAN en el servidor pero NO se guardan (simulación).
 * En la Fase 3 se guardarán en Supabase y en la Fase 4 se enviará el aviso por
 * email, con limitación de frecuencia y Turnstile.
 *
 * Nunca registrar datos personales en los logs.
 */
import { contactSchema, repairRequestSchema } from "@/lib/validation/forms";
import { toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { DELIVERY_METHODS } from "@/content/forms";
import { siteConfig } from "@/config/site";

export type RepairActionState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: FieldErrors }
  | {
      status: "success";
      simulated: boolean;
      requestNumber: string;
      summary: {
        name: string;
        equipment: string;
        brand: string;
        issue: string;
        deliveryMethod: string;
        returnShipping: boolean;
      };
    };

export type ContactActionState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: FieldErrors }
  | { status: "success"; simulated: boolean };

const GENERIC_ERROR = "Revisa los campos marcados en rojo.";

function currentYear(): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: siteConfig.timeZone, year: "numeric" }).format(new Date()),
  );
}

/** Número de demostración. En la Fase 3 lo genera la base de datos (correlativo). */
function demoNumber(prefix: string): string {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${currentYear()}-${n}`;
}

function formToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$")) out[key] = value;
  }
  return out;
}

export async function submitRepairRequest(
  _prev: RepairActionState,
  formData: FormData,
): Promise<RepairActionState> {
  const parsed = repairRequestSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { status: "error", message: GENERIC_ERROR, fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  // Honeypot relleno → probablemente un bot. Respondemos "éxito" sin procesar.
  const isBot = Boolean(data.website);

  const requestNumber = demoNumber("REP");
  if (!isBot) console.info("[solicitud-reparacion] recibida (simulada)", { requestNumber });

  return {
    status: "success",
    simulated: true,
    requestNumber,
    summary: {
      name: data.name.split(" ")[0] ?? data.name,
      equipment: data.equipmentType,
      brand: data.brand,
      issue: data.issue.length > 160 ? `${data.issue.slice(0, 157)}…` : data.issue,
      deliveryMethod: DELIVERY_METHODS[data.deliveryMethod].label,
      returnShipping: data.returnShipping,
    },
  };
}

export async function submitContactMessage(
  _prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const parsed = contactSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { status: "error", message: GENERIC_ERROR, fieldErrors: toFieldErrors(parsed.error) };
  }
  if (!parsed.data.website) console.info("[contacto] mensaje recibido (simulado)");
  return { status: "success", simulated: true };
}

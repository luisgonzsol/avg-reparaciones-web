"use server";
/**
 * Acciones de los formularios públicos (solicitud de reparación y contacto).
 *
 * 1. Validación con Zod (siempre en el servidor).
 * 2. Honeypot: si un bot lo rellena, respondemos "éxito" sin guardar nada.
 * 3. Cloudflare Turnstile (si está configurado).
 * 4. Limitación de frecuencia por IP (hash, sin guardar la IP).
 * 5. Fotos: tipo real, tamaño, re-codificadas sin EXIF y subidas a un bucket
 *    PRIVADO con nombre aleatorio.
 * 6. Guardado en Supabase y aviso por email a la empresa (después de
 *    responder al cliente, con after()).
 *
 * Si Supabase aún no está configurado (desarrollo), se simula el envío.
 * Nunca registrar datos personales en los logs.
 */
import { after } from "next/server";
import { contactSchema, repairRequestSchema } from "@/lib/validation/forms";
import { toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { DELIVERY_METHODS } from "@/content/forms";
import { siteConfig } from "@/config/site";
import { getServiceClient, SupabaseNotConfiguredError } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { TURNSTILE_ERROR, verifyTurnstile } from "@/lib/security/turnstile";
import {
  filesFrom,
  ImageRejectedError,
  processImage,
  randomImagePath,
  type ProcessedImage,
} from "@/lib/images/server";
import { PHOTO_LIMITS } from "@/content/forms";
import { notifyNewContact, notifyNewRepair } from "@/lib/email/notify";

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

const FIELDS_ERROR = "Revisa los campos marcados en rojo.";
const GENERIC_ERROR =
  "No pudimos enviar el formulario. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp.";
const RATE_ERROR = "Has enviado varios formularios seguidos. Espera un rato o escríbenos por WhatsApp.";

function currentYear(): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: siteConfig.timeZone, year: "numeric" }).format(new Date()),
  );
}

/** Número aparente para respuestas simuladas (bots o desarrollo sin BD). */
function fakeNumber(prefix: string): string {
  return `${prefix}-${currentYear()}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function formToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$")) out[key] = value;
  }
  return out;
}

/**
 * Sube las fotos ya procesadas al bucket privado y las asocia a la solicitud.
 * Si alguna falla, la solicitud sigue siendo válida (las fotos son opcionales).
 */
async function uploadRepairPhotos(requestId: string, photos: ProcessedImage[]): Promise<number> {
  if (!photos.length) return 0;
  const supabase = getServiceClient();
  const paths: string[] = [];
  for (const photo of photos) {
    const path = randomImagePath(requestId, photo.ext);
    const { error } = await supabase.storage
      .from("repair-photos")
      .upload(path, photo.buffer, { contentType: photo.contentType, upsert: false });
    if (error) {
      console.error("[solicitud-reparacion] error al subir foto", error.message);
      continue;
    }
    paths.push(path);
  }
  if (paths.length) {
    const { error } = await supabase
      .from("repair_request_photos")
      .insert(paths.map((path) => ({ request_id: requestId, path })));
    if (error) console.error("[solicitud-reparacion] error al registrar fotos", error.message);
  }
  return paths.length;
}

export async function submitRepairRequest(
  _prev: RepairActionState,
  formData: FormData,
): Promise<RepairActionState> {
  const parsed = repairRequestSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { status: "error", message: FIELDS_ERROR, fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;
  const summary = {
    name: data.name.split(" ")[0] ?? data.name,
    equipment: data.equipmentType,
    brand: data.brand,
    issue: data.issue.length > 160 ? `${data.issue.slice(0, 157)}…` : data.issue,
    deliveryMethod: DELIVERY_METHODS[data.deliveryMethod].label,
    returnShipping: data.returnShipping,
  };

  if (data.website || !isSupabaseConfigured()) {
    return { status: "success", simulated: !data.website, requestNumber: fakeNumber("REP"), summary };
  }

  if (!(await verifyTurnstile(formData))) {
    return { status: "error", message: TURNSTILE_ERROR, fieldErrors: {} };
  }
  if (!(await checkRateLimit("repair"))) {
    return { status: "error", message: RATE_ERROR, fieldErrors: {} };
  }

  // Fotos: se validan y procesan ANTES de guardar la solicitud.
  const files = filesFrom(formData, "photos");
  if (files.length > PHOTO_LIMITS.maxFiles) {
    return {
      status: "error",
      message: `Puedes enviar hasta ${PHOTO_LIMITS.maxFiles} fotos.`,
      fieldErrors: {},
    };
  }
  let photos: ProcessedImage[];
  try {
    photos = await Promise.all(
      files.map((f, i) => processImage(f, { maxSide: 2000, label: `La foto ${i + 1}` })),
    );
  } catch (e) {
    if (e instanceof ImageRejectedError) return { status: "error", message: e.userMessage, fieldErrors: {} };
    throw e;
  }

  try {
    const { data: rows, error } = await getServiceClient().rpc("create_repair_request", {
      p: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        state: data.state,
        city: data.city,
        equipment_type: data.equipmentType,
        brand: data.brand,
        model: data.model,
        issue: data.issue,
        delivery_method: data.deliveryMethod,
        return_shipping: data.returnShipping,
      },
    });
    if (error) throw new Error(`${error.code} ${error.message}`);
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row?.request_number) throw new Error("sin número de solicitud");
    const requestId = row.id as string;
    const requestNumber = row.request_number as string;

    const uploaded = await uploadRepairPhotos(requestId, photos);

    after(() =>
      notifyNewRepair({
        id: requestId,
        requestNumber,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        state: data.state,
        city: data.city,
        equipmentType: data.equipmentType,
        brand: data.brand,
        model: data.model || null,
        issue: data.issue,
        deliveryMethod: data.deliveryMethod,
        returnShipping: data.returnShipping,
        photos: uploaded,
      }),
    );
    return { status: "success", simulated: false, requestNumber, summary };
  } catch (e) {
    if (!(e instanceof SupabaseNotConfiguredError)) {
      console.error("[solicitud-reparacion] error al guardar", e instanceof Error ? e.message : e);
    }
    return { status: "error", message: GENERIC_ERROR, fieldErrors: {} };
  }
}

export async function submitContactMessage(
  _prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const parsed = contactSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { status: "error", message: FIELDS_ERROR, fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;
  if (data.website || !isSupabaseConfigured()) {
    return { status: "success", simulated: !data.website };
  }
  if (!(await verifyTurnstile(formData))) {
    return { status: "error", message: TURNSTILE_ERROR, fieldErrors: {} };
  }
  if (!(await checkRateLimit("contact"))) {
    return { status: "error", message: RATE_ERROR, fieldErrors: {} };
  }
  try {
    const { error } = await getServiceClient()
      .from("contact_messages")
      .insert({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        topic: data.topic,
        message: data.message,
      });
    if (error) throw new Error(`${error.code} ${error.message}`);
    after(() =>
      notifyNewContact({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        topic: data.topic,
        message: data.message,
      }),
    );
    return { status: "success", simulated: false };
  } catch (e) {
    console.error("[contacto] error al guardar", e instanceof Error ? e.message : e);
    return { status: "error", message: GENERIC_ERROR, fieldErrors: {} };
  }
}

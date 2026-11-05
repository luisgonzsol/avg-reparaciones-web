"use server";
/**
 * Acciones del panel de administración.
 *
 * Reglas (todas las acciones):
 *  1. requireAdmin() al principio: sesión válida, MFA si está activado y
 *     usuario en la tabla `admins`.
 *  2. Validación con Zod de todo lo que llega del navegador.
 *  3. Escritura con el cliente de la SESIÓN del admin (rol authenticated):
 *     RLS y los privilegios por columna se aplican también aquí, y los
 *     triggers de auditoría registran quién hizo el cambio.
 *  4. Mensajes de error genéricos; el detalle va al log sin datos personales.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "@/lib/zod";
import { requireAdmin } from "@/lib/admin/session";
import { readProductsCsv } from "@/lib/admin/csv";
import { slugify } from "@/lib/slug";
import { isOrderStatus, isRepairStatus } from "@/lib/status";
import { scheduleSchema } from "@/lib/settings";
import { sendPaymentLinkEmail } from "@/lib/email/notify";
import { isEmailConfigured } from "@/lib/email/send";
import { filesFrom, ImageRejectedError, processImage, randomImagePath } from "@/lib/images/server";
import { cleanText, toFieldErrors, type FieldErrors } from "@/lib/validation/common";

export type ActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: FieldErrors;
  details?: string[];
} | null;

const GENERIC = "No se pudo guardar. Inténtalo de nuevo; si sigue fallando, avisa al técnico.";
const ok = (message: string): ActionResult => ({ ok: true, message });
const fail = (message: string, extra: Partial<NonNullable<ActionResult>> = {}): ActionResult => ({
  ok: false,
  message,
  ...extra,
});

function logError(where: string, error: { code?: string; message?: string } | unknown) {
  const e = error as { code?: string; message?: string };
  console.error(`[admin] ${where}`, e?.code ?? "", e?.message ?? error);
}

const uuid = z.string().uuid();
const optional = (max: number) =>
  z
    .string()
    .max(max * 2)
    .transform(cleanText)
    .pipe(z.string().max(max, `Máximo ${max} caracteres.`))
    .transform((v) => v || null);

/* ======================= Pedidos ======================= */

const ORDER_ERRORS: Record<string, string> = {
  invalid_transition: "Ese cambio de estado no está permitido desde el estado actual.",
  payment_link_required: "Para marcar «Enlace enviado» primero pega el enlace de cobro.",
  invalid_payment_link: "El enlace de cobro debe empezar por https://",
  order_not_found: "Este pedido ya no existe.",
  order_not_payable: "Este pedido ya no se puede marcar como pagado.",
  order_not_cancellable: "Este pedido ya no se puede cancelar.",
  forbidden: "No tienes permiso para hacer esto.",
};

const orderUpdateSchema = z.object({
  id: uuid,
  status: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || isOrderStatus(v), "Estado no válido."),
  paymentLink: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => v || null)
    .refine(
      (v) => v === null || /^https:\/\/[^\s]+$/.test(v),
      "El enlace debe empezar por https:// y no tener espacios.",
    ),
  adminNotes: z.string().max(2000, "Máximo 2000 caracteres.").optional(),
});

export async function updateOrder(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = orderUpdateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status") ?? undefined,
    paymentLink: formData.get("paymentLink") ?? undefined,
    adminNotes: formData.get("adminNotes") ?? undefined,
  });
  if (!parsed.success) return fail("Revisa los campos.", { fieldErrors: toFieldErrors(parsed.error) });
  const d = parsed.data;

  const { error } = await supabase.rpc("admin_update_order", {
    p_order_id: d.id,
    p_status: d.status,
    p_payment_link: d.paymentLink,
    p_admin_notes: d.adminNotes ?? null,
  });
  if (error) {
    const known = ORDER_ERRORS[error.message];
    if (!known) logError("updateOrder", error);
    return fail(known ?? GENERIC);
  }
  revalidatePath(`/admin/pedidos/${d.id}`);
  revalidatePath("/admin/pedidos");
  return ok(d.status ? "Pedido actualizado." : "Cambios guardados.");
}

export async function emailPaymentLink(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return fail("Pedido no válido.");
  if (!isEmailConfigured()) return fail("El envío de emails aún no está configurado (Resend).");

  const { data: order } = await supabase
    .from("orders")
    .select("status, payment_link")
    .eq("id", id.data)
    .maybeSingle();
  if (!order) return fail("Este pedido ya no existe.");
  if (!order.payment_link) return fail("Primero guarda el enlace de cobro.");

  const sent = await sendPaymentLinkEmail(id.data);
  if (!sent) return fail("No se pudo enviar el email. Inténtalo de nuevo o envíalo por WhatsApp.");
  if (order.status === "pending_payment") {
    await supabase.rpc("admin_update_order", { p_order_id: id.data, p_status: "link_sent" });
  }
  revalidatePath(`/admin/pedidos/${id.data}`);
  return ok("Email enviado al cliente.");
}

/** Tras enviar el enlace por WhatsApp, marca el pedido como «Enlace enviado». */
export async function markLinkSent(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  const { error } = await supabase.rpc("admin_update_order", { p_order_id: id.data, p_status: "link_sent" });
  if (error && !ORDER_ERRORS[error.message]) logError("markLinkSent", error);
  revalidatePath(`/admin/pedidos/${id.data}`);
}

/* ======================= Productos ======================= */

const productSchema = z.object({
  id: z
    .string()
    .optional()
    .transform((v) => v || null)
    .pipe(uuid.nullable()),
  sku: z.string().trim().min(1, "Obligatorio.").max(40, "Máximo 40 caracteres."),
  name: z.string().trim().min(2, "Mínimo 2 caracteres.").max(140, "Máximo 140 caracteres."),
  slug: z.string().trim().max(120).optional(),
  description: z.string().max(4000, "Máximo 4000 caracteres.").default(""),
  compatibility: z.string().max(1000, "Máximo 1000 caracteres.").default(""),
  categoryId: z.coerce.number({ message: "Elige una categoría." }).int().positive("Elige una categoría."),
  priceUsd: z
    .string()
    .trim()
    .transform((v) => v.replace(",", "."))
    .refine(
      (v) => /^\d{1,8}(\.\d{1,2})?$/.test(v) && Number(v) > 0,
      "Precio mayor que 0, con hasta 2 decimales.",
    ),
  stock: z.coerce
    .number({ message: "Número entero." })
    .int("Número entero.")
    .min(0, "No puede ser negativo.")
    .max(999999),
  lowStockThreshold: z.coerce.number().int("Número entero.").min(0, "No puede ser negativo.").max(9999),
  hasWarranty: z.boolean(),
  featured: z.boolean(),
  active: z.boolean(),
  brandIds: z.array(z.coerce.number().int().positive()).max(50),
});

export async function saveProduct(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = productSchema.safeParse({
    id: formData.get("id") ?? undefined,
    sku: formData.get("sku"),
    name: formData.get("name"),
    slug: formData.get("slug") ?? undefined,
    description: formData.get("description") ?? "",
    compatibility: formData.get("compatibility") ?? "",
    categoryId: formData.get("categoryId"),
    priceUsd: formData.get("priceUsd"),
    stock: formData.get("stock"),
    lowStockThreshold: formData.get("lowStockThreshold"),
    hasWarranty: formData.get("hasWarranty") === "on",
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
    brandIds: formData.getAll("brandIds"),
  });
  if (!parsed.success)
    return fail("Revisa los campos marcados.", { fieldErrors: toFieldErrors(parsed.error) });
  const d = parsed.data;
  const slug = slugify(d.slug || d.name);
  if (!slug) return fail("Revisa los campos marcados.", { fieldErrors: { slug: "No válido." } });

  const { data: id, error } = await supabase.rpc("admin_save_product", {
    p: {
      id: d.id,
      sku: d.sku,
      name: cleanText(d.name),
      slug,
      description: d.description.trim(),
      compatibility: d.compatibility.trim(),
      category_id: d.categoryId,
      price_usd: d.priceUsd,
      stock: d.stock,
      low_stock_threshold: d.lowStockThreshold,
      has_warranty: d.hasWarranty,
      featured: d.featured,
      active: d.active,
    },
    p_brand_ids: d.brandIds,
  });
  if (error) {
    if (error.code === "23505") {
      const field = error.message.includes("sku") ? "sku" : "slug";
      return fail("Ya existe otro producto con ese dato.", {
        fieldErrors: {
          [field]: field === "sku" ? "Este SKU ya existe." : "Esta URL ya la usa otro producto.",
        },
      });
    }
    if (error.code === "23514" && error.message.includes("reserved_le_stock")) {
      return fail("El stock no puede ser menor que las unidades apartadas en pedidos pendientes.", {
        fieldErrors: { stock: "Hay unidades apartadas en pedidos sin pagar." },
      });
    }
    logError("saveProduct", error);
    return fail(GENERIC);
  }
  revalidatePath("/admin/productos");
  if (!d.id) redirect(`/admin/productos/${id as string}?creado=1`);
  return ok("Producto guardado.");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  const { data: images } = await supabase.from("product_images").select("path").eq("product_id", id.data);
  const { error } = await supabase.from("products").delete().eq("id", id.data);
  if (error) {
    // Con pedidos asociados no se puede borrar: se desactiva.
    if (error.code === "23503") {
      await supabase.from("products").update({ active: false }).eq("id", id.data);
      redirect(`/admin/productos/${id.data}?desactivado=1`);
    }
    logError("deleteProduct", error);
    redirect(`/admin/productos/${id.data}?error=1`);
  }
  if (images?.length) await supabase.storage.from("products").remove(images.map((i) => i.path));
  revalidatePath("/admin/productos");
  redirect("/admin/productos?borrado=1");
}

export async function uploadProductImages(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = uuid.safeParse(formData.get("productId"));
  if (!id.success) return fail("Producto no válido.");
  const alt = cleanText(String(formData.get("alt") ?? "")).slice(0, 200);
  const files = filesFrom(formData, "images");
  if (!files.length) return fail("Elige al menos una imagen.");
  if (files.length > 6) return fail("Sube como máximo 6 imágenes a la vez.");

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id.data);
  if ((count ?? 0) + files.length > 8) return fail("Cada producto puede tener como máximo 8 imágenes.");

  let added = 0;
  for (const [i, file] of files.entries()) {
    try {
      const img = await processImage(file, { maxSide: 1600, format: "webp", label: `La imagen ${i + 1}` });
      const path = randomImagePath(id.data, img.ext);
      const up = await supabase.storage
        .from("products")
        .upload(path, img.buffer, { contentType: img.contentType, cacheControl: "31536000", upsert: false });
      if (up.error) throw up.error;
      const ins = await supabase
        .from("product_images")
        .insert({ product_id: id.data, path, alt, sort_order: (count ?? 0) + i });
      if (ins.error) {
        await supabase.storage.from("products").remove([path]);
        throw ins.error;
      }
      added++;
    } catch (e) {
      if (e instanceof ImageRejectedError) return fail(e.userMessage);
      logError("uploadProductImages", e);
      return fail(added ? `Se subieron ${added} imágenes; las demás fallaron.` : GENERIC);
    }
  }
  revalidatePath(`/admin/productos/${id.data}`);
  return ok(added === 1 ? "Imagen subida." : `${added} imágenes subidas.`);
}

export async function deleteProductImage(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const imageId = z.coerce.number().int().positive().safeParse(formData.get("imageId"));
  const productId = uuid.safeParse(formData.get("productId"));
  if (!imageId.success || !productId.success) return;
  const { data: img } = await supabase
    .from("product_images")
    .select("path")
    .eq("id", imageId.data)
    .eq("product_id", productId.data)
    .maybeSingle();
  if (!img) return;
  const { error } = await supabase.from("product_images").delete().eq("id", imageId.data);
  if (error) return logError("deleteProductImage", error);
  await supabase.storage.from("products").remove([img.path]);
  revalidatePath(`/admin/productos/${productId.data}`);
}

/** Pone una imagen como principal (primera de la galería). */
export async function makeImageCover(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const imageId = z.coerce.number().int().positive().safeParse(formData.get("imageId"));
  const productId = uuid.safeParse(formData.get("productId"));
  if (!imageId.success || !productId.success) return;
  const { data: imgs } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId.data)
    .order("sort_order")
    .order("id");
  const ordered = [
    imageId.data,
    ...(imgs ?? []).map((i) => i.id as number).filter((i) => i !== imageId.data),
  ];
  for (const [i, imgId] of ordered.entries()) {
    await supabase.from("product_images").update({ sort_order: i }).eq("id", imgId);
  }
  revalidatePath(`/admin/productos/${productId.data}`);
}

const IMPORT_ERRORS: Record<string, (detail: string) => string> = {
  unknown_category: (d) => {
    const [row, slug] = d.split("|");
    return `Producto ${row}: la categoría «${slug}» no existe. Créala antes en Categorías y marcas.`;
  },
  unknown_brand: (d) => {
    const [row, slug] = d.split("|");
    return `Producto ${row}: la marca «${slug}» no existe. Créala antes en Categorías y marcas.`;
  },
};

export async function importProductsCsv(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const file = filesFrom(formData, "file")[0];
  if (!file) return fail("Elige un archivo CSV.");
  if (file.size > 2 * 1024 * 1024) return fail("El archivo es demasiado grande (máximo 2 MB).");
  const text = await file.text();
  const result = readProductsCsv(text);
  if (!result.ok) return fail("El archivo tiene errores. No se importó nada.", { details: result.errors });

  const { data, error } = await supabase.rpc("admin_import_products", { p_rows: result.rows });
  if (error) {
    const known = IMPORT_ERRORS[error.message];
    if (known) return fail("No se importó nada.", { details: [known(error.details ?? "")] });
    if (error.code === "23505") {
      return fail("No se importó nada.", {
        details: ["Hay un slug (URL) repetido con otro producto que ya existe. Cámbialo en el archivo."],
      });
    }
    logError("importProductsCsv", error);
    return fail(GENERIC);
  }
  const r = (Array.isArray(data) ? data[0] : data) as { inserted: number; updated: number } | undefined;
  revalidatePath("/admin/productos");
  return ok(
    `Importación completada: ${r?.inserted ?? 0} productos nuevos y ${r?.updated ?? 0} actualizados.`,
  );
}

/* ======================= Categorías y marcas ======================= */

const taxonomySchema = z.object({
  kind: z.enum(["category", "brand"]),
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(1, "Obligatorio.").max(80, "Máximo 80 caracteres."),
  slug: z.string().trim().max(80).optional(),
  sortOrder: z.coerce.number().int().min(-9999).max(9999).optional(),
});

export async function saveTaxonomy(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = taxonomySchema.safeParse({
    kind: formData.get("kind"),
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    sortOrder: formData.get("sortOrder") || undefined,
  });
  if (!parsed.success) return fail("Revisa los campos.", { fieldErrors: toFieldErrors(parsed.error) });
  const d = parsed.data;
  const slug = slugify(d.slug || d.name);
  if (!slug) return fail("Nombre no válido.");
  const table = d.kind === "category" ? "categories" : "brands";
  const row: Record<string, unknown> = { name: cleanText(d.name), slug };
  if (d.kind === "category" && d.sortOrder !== undefined) row.sort_order = d.sortOrder;

  const { error } = d.id
    ? await supabase.from(table).update(row).eq("id", d.id)
    : await supabase.from(table).insert(row);
  if (error) {
    if (error.code === "23505")
      return fail(`Ya existe ${d.kind === "category" ? "una categoría" : "una marca"} con ese nombre.`);
    logError("saveTaxonomy", error);
    return fail(GENERIC);
  }
  revalidatePath("/admin/catalogo");
  return ok(d.id ? "Guardado." : d.kind === "category" ? "Categoría creada." : "Marca creada.");
}

export async function deleteTaxonomy(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const kind = z.enum(["category", "brand"]).safeParse(formData.get("kind"));
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!kind.success || !id.success) return fail("Dato no válido.");
  const { error } = await supabase
    .from(kind.data === "category" ? "categories" : "brands")
    .delete()
    .eq("id", id.data);
  if (error) {
    if (error.code === "23503") {
      return fail(
        kind.data === "category"
          ? "No se puede borrar: hay productos en esta categoría. Muévelos antes a otra."
          : "No se puede borrar: hay productos asociados a esta marca.",
      );
    }
    logError("deleteTaxonomy", error);
    return fail(GENERIC);
  }
  revalidatePath("/admin/catalogo");
  return ok("Borrado.");
}

/* ======================= Tasa del día ======================= */

const rateSchema = z.object({
  rate: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s/g, "").replace(",", "."))
    .refine((v) => /^\d{1,9}(\.\d{1,4})?$/.test(v) && Number(v) > 0, "Escribe la tasa, p. ej. 236,45"),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida."),
  note: optional(200),
});

export async function addExchangeRate(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = rateSchema.safeParse({
    rate: formData.get("rate"),
    effectiveDate: formData.get("effectiveDate"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return fail("Revisa los campos.", { fieldErrors: toFieldErrors(parsed.error) });
  // Una fecha futura se aplicaría ya (la vigente es la de fecha más reciente).
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(new Date());
  if (parsed.data.effectiveDate > today) {
    return fail("Revisa los campos.", { fieldErrors: { effectiveDate: "No puede ser una fecha futura." } });
  }
  const { error } = await supabase.from("exchange_rates").insert({
    rate: parsed.data.rate,
    effective_date: parsed.data.effectiveDate,
    note: parsed.data.note,
  });
  if (error) {
    logError("addExchangeRate", error);
    return fail(GENERIC);
  }
  revalidatePath("/admin/tasa");
  revalidatePath("/admin");
  return ok("Tasa actualizada. Los precios en Bs de la tienda ya usan la nueva tasa.");
}

/* ======================= Solicitudes y mensajes ======================= */

export async function updateRepairRequest(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = z
    .object({
      id: uuid,
      status: z.string().refine(isRepairStatus, "Estado no válido."),
      adminNotes: optional(2000),
    })
    .safeParse({
      id: formData.get("id"),
      status: formData.get("status"),
      adminNotes: formData.get("adminNotes") ?? "",
    });
  if (!parsed.success) return fail("Revisa los campos.", { fieldErrors: toFieldErrors(parsed.error) });
  const { error } = await supabase
    .from("repair_requests")
    .update({ status: parsed.data.status, admin_notes: parsed.data.adminNotes })
    .eq("id", parsed.data.id);
  if (error) {
    logError("updateRepairRequest", error);
    return fail(GENERIC);
  }
  revalidatePath(`/admin/solicitudes/${parsed.data.id}`);
  revalidatePath("/admin/solicitudes");
  return ok("Solicitud actualizada.");
}

export async function toggleMessageRead(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  const read = formData.get("read") === "1";
  const { error } = await supabase
    .from("contact_messages")
    .update({ read_at: read ? new Date().toISOString() : null })
    .eq("id", id.data);
  if (error) logError("toggleMessageRead", error);
  revalidatePath("/admin/mensajes");
}

/* ======================= Ajustes ======================= */

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

const settingsSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254)
    .transform((v) => v || null)
    .refine((v) => v === null || z.string().email().safeParse(v).success, "Email no válido."),
  phoneDisplay: z.string().trim().min(7, "Obligatorio.").max(30),
  whatsappNumber: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => /^58\d{10}$/.test(v), "Número venezolano con 58 delante, p. ej. 584127408970."),
  addressStreet: z.string().trim().min(2, "Obligatorio.").max(120),
  addressBetween: z.string().trim().min(2, "Obligatorio.").max(120),
  addressSecondStreet: optional(120),
  instagramUrl: z
    .string()
    .trim()
    .max(200)
    .refine(
      (v) => /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/.test(v),
      "Enlace de Instagram no válido.",
    ),
  warrantyDuration: optional(80),
  pickupCostNote: optional(200),
  returnShippingCostNote: optional(200),
  orderExpirationHours: z.coerce
    .number()
    .int("Número entero.")
    .min(1, "Mínimo 1 hora.")
    .max(720, "Máximo 720 horas (30 días)."),
  paymentMethods: z
    .string()
    .max(500)
    .transform((v) =>
      v
        .split(/[\n,]/)
        .map((m) => cleanText(m))
        .filter(Boolean),
    )
    .refine((v) => v.length >= 1 && v.length <= 12, "Escribe al menos un método (uno por línea)."),
  showTestimonials: z.boolean(),
});

export async function saveSettings(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = settingsSchema.safeParse({
    email: formData.get("email") ?? "",
    phoneDisplay: formData.get("phoneDisplay"),
    whatsappNumber: formData.get("whatsappNumber") ?? "",
    addressStreet: formData.get("addressStreet"),
    addressBetween: formData.get("addressBetween"),
    addressSecondStreet: formData.get("addressSecondStreet") ?? "",
    instagramUrl: formData.get("instagramUrl") ?? "",
    warrantyDuration: formData.get("warrantyDuration") ?? "",
    pickupCostNote: formData.get("pickupCostNote") ?? "",
    returnShippingCostNote: formData.get("returnShippingCostNote") ?? "",
    orderExpirationHours: formData.get("orderExpirationHours"),
    paymentMethods: formData.get("paymentMethods") ?? "",
    showTestimonials: formData.get("showTestimonials") === "on",
  });

  const schedule: Record<string, { open: string; close: string } | null> = {};
  for (const day of DAYS) {
    const open = String(formData.get(`open-${day}`) ?? "");
    const close = String(formData.get(`close-${day}`) ?? "");
    schedule[day] = formData.get(`closed-${day}`) === "on" ? null : { open, close };
  }
  const sched = scheduleSchema.safeParse(schedule);
  const badDay = DAYS.find((d) => schedule[d] && schedule[d]!.open >= schedule[d]!.close);

  if (!parsed.success || !sched.success || badDay !== undefined) {
    const fieldErrors = parsed.success ? {} : toFieldErrors(parsed.error);
    if (!sched.success || badDay !== undefined) {
      fieldErrors.schedule = "Revisa el horario: formato HH:MM y la apertura antes del cierre.";
    }
    return fail("Revisa los campos marcados.", { fieldErrors });
  }
  const d = parsed.data;
  const { error } = await supabase
    .from("settings")
    .update({
      email: d.email,
      phone_display: d.phoneDisplay,
      whatsapp_number: d.whatsappNumber,
      address_street: d.addressStreet,
      address_between: d.addressBetween,
      address_second_street: d.addressSecondStreet,
      instagram_url: d.instagramUrl,
      schedule: sched.data,
      warranty_duration: d.warrantyDuration,
      pickup_cost_note: d.pickupCostNote,
      return_shipping_cost_note: d.returnShippingCostNote,
      order_expiration_hours: d.orderExpirationHours,
      payment_methods: d.paymentMethods,
      show_testimonials: d.showTestimonials,
    })
    .eq("id", 1);
  if (error) {
    logError("saveSettings", error);
    return fail(GENERIC);
  }
  revalidatePath("/", "layout");
  return ok("Ajustes guardados. La web ya muestra los datos nuevos.");
}

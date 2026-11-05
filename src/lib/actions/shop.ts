"use server";
/**
 * Acciones de la tienda.
 * Los precios y el stock SIEMPRE se calculan en el servidor a partir de la
 * base de datos; nunca se confía en lo que envía el navegador.
 */
import { after } from "next/server";
import { z } from "@/lib/zod";
import { getCurrentRate, getProductsBySlugs } from "@/lib/data/catalog";
import { getServiceClient, SupabaseNotConfiguredError } from "@/lib/supabase/server";
import { cartLinesSchema, checkoutSchema } from "@/lib/validation/forms";
import { toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { TURNSTILE_ERROR, verifyTurnstile } from "@/lib/security/turnstile";
import { notifyNewOrder } from "@/lib/email/notify";
import type { CatalogProduct, ExchangeRate } from "@/lib/catalog";

/* ---------- Refrescar el carrito ---------- */

export type CartQuote =
  { ok: true; products: CatalogProduct[]; rate: ExchangeRate | null } | { ok: false; message: string };

export async function getCartQuote(slugs: unknown): Promise<CartQuote> {
  const parsed = z.array(z.string().max(120)).max(30).safeParse(slugs);
  if (!parsed.success) return { ok: false, message: "Carrito no válido." };
  try {
    const [products, rate] = await Promise.all([getProductsBySlugs(parsed.data), getCurrentRate()]);
    return { ok: true, products, rate };
  } catch (e) {
    console.error("[cart-quote]", e instanceof Error ? e.message : e);
    return {
      ok: false,
      message: "No pudimos actualizar los precios. Revisa tu conexión e inténtalo de nuevo.",
    };
  }
}

/* ---------- Crear pedido ---------- */

export type PlaceOrderResult =
  | { status: "success"; token: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: FieldErrors;
      stockIssues?: { slug: string; available: number }[];
    };

const GENERIC =
  "No pudimos registrar tu pedido. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp.";

export async function placeOrder(formData: FormData, cartJson: string): Promise<PlaceOrderResult> {
  // 1. Validación
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string" && !k.startsWith("$")) values[k] = v;
  const parsed = checkoutSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los campos marcados en rojo.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  let lines: unknown;
  try {
    lines = JSON.parse(cartJson);
  } catch {
    lines = null;
  }
  const cart = cartLinesSchema.safeParse(lines);
  if (!cart.success) return { status: "error", message: "Tu carrito está vacío o no es válido." };

  const data = parsed.data;
  if (data.website) {
    // Honeypot: probablemente un bot. No creamos nada.
    return { status: "error", message: GENERIC };
  }

  // 2. Antispam y limitación de frecuencia
  if (!(await verifyTurnstile(formData))) return { status: "error", message: TURNSTILE_ERROR };
  if (!(await checkRateLimit("checkout"))) {
    return {
      status: "error",
      message: "Has hecho demasiados intentos seguidos. Espera unos minutos o escríbenos por WhatsApp.",
    };
  }

  // 3. Pedido + reserva atómica de stock (precios y totales los calcula la BD)
  const shipping = data.deliveryMethod === "national_shipping";
  try {
    const { data: rows, error } = await getServiceClient().rpc("create_order", {
      p_customer: {
        name: data.name,
        id_doc: data.idDoc,
        phone: data.phone,
        email: data.email,
        delivery_method: data.deliveryMethod,
        state: shipping ? data.state : "",
        city: shipping ? data.city : "",
        address: shipping ? data.address : "",
        agency: shipping ? data.agency : "",
        notes: data.notes,
      },
      p_items: cart.data,
    });

    if (error) {
      switch (error.message) {
        case "insufficient_stock": {
          const [slug = "", available = "0"] = (error.details ?? "").split("|");
          return {
            status: "error",
            message:
              "Alguien se nos adelantó: uno de los productos ya no tiene stock suficiente. Revisa tu carrito.",
            stockIssues: [{ slug, available: Number(available) || 0 }],
          };
        }
        case "product_unavailable":
        case "product_not_found":
          return {
            status: "error",
            message: "Uno de los productos ya no está disponible. Revisa tu carrito.",
            stockIssues: error.details ? [{ slug: error.details, available: 0 }] : undefined,
          };
        case "no_exchange_rate":
          console.error("[checkout] no hay tasa del día cargada");
          return { status: "error", message: GENERIC };
        default:
          console.error("[checkout] create_order", error.code, error.message);
          return { status: "error", message: GENERIC };
      }
    }

    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row?.public_token) return { status: "error", message: GENERIC };

    // Confirmación al cliente y aviso a la empresa, después de responder.
    const orderId = row.order_id as string;
    after(() => notifyNewOrder(orderId));
    return { status: "success", token: row.public_token as string };
  } catch (e) {
    if (e instanceof SupabaseNotConfiguredError) {
      return { status: "error", message: "La tienda en línea aún no está activa. Escríbenos por WhatsApp." };
    }
    console.error("[checkout] error inesperado", e instanceof Error ? e.message : e);
    return { status: "error", message: GENERIC };
  }
}

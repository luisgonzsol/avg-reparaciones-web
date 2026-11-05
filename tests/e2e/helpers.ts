import { existsSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

let client: SupabaseClient | null = null;

/** Cliente de servicio SOLO para preparar y limpiar datos de prueba. */
export function db(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Faltan claves de Supabase en .env.local");
  client ??= createClient(url, secret, { auth: { persistSession: false } });
  return client;
}

/** Evita que el rate limiting bloquee las pruebas repetidas. */
export async function resetRateLimits() {
  await db().from("rate_limits").delete().gte("count", 0);
}

export async function getProduct(slug: string) {
  const { data, error } = await db().from("products").select("id, stock, reserved").eq("slug", slug).single();
  if (error) throw error;
  return data as { id: string; stock: number; reserved: number };
}

/** Cancela (libera stock) y borra un pedido de prueba a partir de su token. */
export async function cleanupOrder(token: string) {
  const { data } = await db().from("orders").select("id, status").eq("public_token", token).maybeSingle();
  if (!data) return;
  if (!["cancelled", "expired", "delivered"].includes(data.status)) {
    await db().rpc("cancel_order", { p_order_id: data.id });
  }
  await db().from("orders").delete().eq("id", data.id);
}

export async function emptyCart(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    try {
      localStorage.removeItem("avg_cart_v1");
    } catch {}
  });
}

/** Rellena los datos del checkout (retiro en tienda). */
export async function fillCheckout(page: Page) {
  await page.getByLabel("Nombre y apellido").fill("Prueba Automática");
  await page.getByLabel("Cédula o RIF").fill("V-12345678");
  await page.getByLabel("Teléfono (WhatsApp)").fill("0412-1234567");
  await page.getByLabel("Correo").fill("prueba.e2e@example.com");
  await page.getByText("Retiro en la tienda", { exact: true }).click();
  await page.locator('input[name="terms"]').check();
}

/**
 * Administrador TEMPORAL para las pruebas: se crea con una contraseña
 * aleatoria (nunca se guarda ni se muestra) y se borra al terminar.
 */
export async function createTempAdmin() {
  const { randomBytes } = await import("node:crypto");
  const email = `e2e-admin-${randomBytes(4).toString("hex")}@example.test`;
  const password = randomBytes(24).toString("base64url");
  const { data, error } = await db().auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const userId = data.user.id;
  const { error: e2 } = await db().from("admins").insert({ user_id: userId, role: "staff", email });
  if (e2) throw e2;
  return {
    email,
    password,
    remove: async () => {
      await db().from("admins").delete().eq("user_id", userId);
      await db().auth.admin.deleteUser(userId);
    },
  };
}

/** Crea un pedido de prueba (retiro en tienda) directamente en la BD. */
export async function createTestOrder(slug: string) {
  const { data, error } = await db().rpc("create_order", {
    p_customer: {
      name: "Prueba Panel",
      id_doc: "V-12345678",
      phone: "+584121234567",
      email: "prueba.e2e@example.com",
      delivery_method: "store_pickup",
    },
    p_items: [{ slug, quantity: 1 }],
  });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as { order_id: string; public_token: string };
  return { id: row.order_id, token: row.public_token };
}

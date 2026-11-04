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

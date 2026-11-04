/**
 * Prueba de concurrencia REAL contra Supabase: dos pedidos simultáneos
 * por la última unidad → solo uno debe tener éxito.
 *
 * Requiere .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY.
 * Ejecutar con: npm run test:integration
 * Crea un producto temporal (TEST-…) y lo borra al terminar.
 */
import { existsSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const run = url && secret ? describe : describe.skip;

run("Supabase: reserva atómica con concurrencia real", () => {
  let admin: SupabaseClient;
  const slug = `test-concurrencia-${Date.now()}`;
  let productId = "";
  const orderIds: string[] = [];

  const customer = {
    name: "Prueba Concurrencia",
    id_doc: "V-12345678",
    phone: "+584121234567",
    email: "prueba@example.com",
    delivery_method: "store_pickup",
  };

  beforeAll(async () => {
    admin = createClient(url!, secret!, { auth: { persistSession: false } });
    const { data: cat, error: e1 } = await admin.from("categories").select("id").limit(1).single();
    if (e1) throw e1;
    const { data, error } = await admin
      .from("products")
      .insert({
        sku: `TEST-${Date.now()}`,
        name: "Producto de prueba de concurrencia",
        slug,
        category_id: cat.id,
        price_usd: 10,
        stock: 1,
        active: true,
        is_sample: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    productId = data.id;
  });

  afterAll(async () => {
    if (!admin) return;
    if (orderIds.length) await admin.from("orders").delete().in("id", orderIds);
    if (productId) await admin.from("products").delete().eq("id", productId);
  });

  it("dos pedidos simultáneos por la última unidad: solo uno lo consigue", async () => {
    const attempt = () =>
      admin.rpc("create_order", { p_customer: customer, p_items: [{ slug, quantity: 1 }] });

    const results = await Promise.all([attempt(), attempt(), attempt(), attempt()]);
    const ok = results.filter((r) => !r.error);
    const failed = results.filter((r) => r.error);

    for (const r of ok) orderIds.push((Array.isArray(r.data) ? r.data[0] : r.data).order_id);

    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(3);
    for (const f of failed) expect(f.error?.message).toBe("insufficient_stock");

    const { data: p } = await admin.from("products").select("stock, reserved").eq("id", productId).single();
    expect(p).toEqual({ stock: 1, reserved: 1 });
  });

  it("la clave pública NO puede crear pedidos ni leerlos", async () => {
    if (!publishable) return;
    const anon = createClient(url!, publishable, { auth: { persistSession: false } });
    const rpc = await anon.rpc("create_order", { p_customer: customer, p_items: [{ slug, quantity: 1 }] });
    expect(rpc.error).not.toBeNull();
    const read = await anon.from("orders").select("id").limit(1);
    expect(read.error ?? read.data).toBeTruthy();
    expect(read.data ?? []).toHaveLength(0);
    const write = await anon.from("products").update({ price_usd: 0.01 }).eq("slug", slug).select();
    expect(write.data ?? []).toHaveLength(0);
  });
});

/**
 * Mismo esquema, pero con "Automatically expose new tables" DESACTIVADO en
 * Supabase (sin privilegios por defecto). Comprueba que los GRANT explícitos
 * de las migraciones bastan para que la web funcione.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    grant usage on schema auth to anon, authenticated, service_role;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `);
  const dir = path.join(process.cwd(), "supabase", "migrations");
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith("_cron.sql")) await db.exec(readFileSync(path.join(dir, f), "utf8"));
  }
  await db.exec(readFileSync(path.join(process.cwd(), "supabase", "seed.sql"), "utf8"));
}, 60_000);

afterAll(async () => {
  await db?.close();
});

async function as<T>(role: string, fn: () => Promise<T>) {
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}

describe("sin exposición automática de tablas", () => {
  it("anon puede leer el catálogo y buscar", async () => {
    const r = await as("anon", () => db.query<{ n: number }>("select count(*)::int n from public.products"));
    expect(r.rows[0]!.n).toBe(20);
    const s = await as("anon", () => db.query("select * from public.search_products('licuadora')"));
    expect(s.rows.length).toBeGreaterThan(0);
  });

  it("anon sigue sin poder leer pedidos", async () => {
    await expect(as("anon", () => db.query("select * from public.orders"))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("service_role puede crear pedidos, solicitudes, mensajes y usar el rate limit", async () => {
    await as("service_role", async () => {
      const o = await db.query("select * from public.create_order($1::jsonb, $2::jsonb)", [
        JSON.stringify({
          name: "Cliente",
          id_doc: "V-12345678",
          phone: "+584121234567",
          email: "c@example.com",
          delivery_method: "store_pickup",
        }),
        JSON.stringify([{ slug: "rejilla-ventilador", quantity: 1 }]),
      ]);
      expect(o.rows).toHaveLength(1);
      await db.query(
        "insert into public.contact_messages (name, phone, topic, message) values ('Ana', '+584121234567', 'Otro', 'Mensaje de prueba largo')",
      );
      const rl = await db.query<{ ok: boolean }>("select public.check_rate_limit('k', 5, 60) ok");
      expect(rl.rows[0]!.ok).toBe(true);
      const ord = await db.query("select order_number from public.orders");
      expect(ord.rows).toHaveLength(1);
    });
  });
});

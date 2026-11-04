/**
 * Pruebas de la base de datos con las migraciones REALES ejecutadas en
 * PGlite (Postgres embebido). Simula lo mínimo de Supabase: roles
 * anon / authenticated / service_role y el esquema auth.
 *
 * La prueba de concurrencia real (dos conexiones simultáneas) se ejecuta
 * contra Supabase: tests/integration/concurrency.test.ts
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { usdToBs } from "@/lib/money";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const root = process.cwd();
let db: PGlite;

const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  -- Peor caso: "Automatically expose new tables" ACTIVADO en Supabase
  -- (concede todo por defecto). Las migraciones deben revocar lo que sobra.
  -- Con la opción desactivada, los GRANT explícitos de las migraciones bastan.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

async function asRole<T>(role: "anon" | "authenticated" | "service_role", fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}

async function product(slug: string) {
  const r = await db.query<{ id: string; stock: number; reserved: number; active: boolean }>(
    "select id, stock, reserved, active from public.products where slug = $1",
    [slug],
  );
  return r.rows[0]!;
}

const customer = {
  name: "Cliente Prueba",
  id_doc: "V-12345678",
  phone: "+584121234567",
  email: "cliente@example.com",
  delivery_method: "store_pickup",
};

async function createOrder(items: { slug: string; quantity: number }[], c: object = customer) {
  const r = await db.query<{
    order_id: string;
    order_number: string;
    public_token: string;
    subtotal_usd: string;
    total_bs: string;
  }>("select * from public.create_order($1::jsonb, $2::jsonb)", [JSON.stringify(c), JSON.stringify(items)]);
  return r.rows[0]!;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUBS);
  const dir = path.join(root, "supabase", "migrations");
  for (const file of readdirSync(dir).sort()) {
    if (file.endsWith("_cron.sql")) continue; // pg_cron solo existe en Supabase
    await db.exec(readFileSync(path.join(dir, file), "utf8"));
  }
  await db.exec(readFileSync(path.join(root, "supabase", "seed.sql"), "utf8"));
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("semilla", () => {
  it("carga categorías, marcas, 20 productos de ejemplo y una tasa", async () => {
    const r = await db.query<{ c: number; b: number; p: number; s: number; x: number }>(`
      select (select count(*)::int from public.categories) c,
             (select count(*)::int from public.brands) b,
             (select count(*)::int from public.products) p,
             (select count(*)::int from public.products where is_sample) s,
             (select count(*)::int from public.exchange_rates) x`);
    expect(r.rows[0]).toEqual({ c: 8, b: 11, p: 20, s: 20, x: 1 });
  });

  it("es idempotente", async () => {
    await db.exec(readFileSync(path.join(root, "supabase", "seed.sql"), "utf8"));
    const r = await db.query<{ p: number }>("select count(*)::int p from public.products");
    expect(r.rows[0]!.p).toBe(20);
  });
});

describe("restricciones", () => {
  it("impide stock negativo, reservado > stock y precios <= 0", async () => {
    await expect(db.query("update public.products set stock = -1 where sku = 'EJ-0001'")).rejects.toThrow();
    await expect(
      db.query("update public.products set reserved = stock + 1 where sku = 'EJ-0001'"),
    ).rejects.toThrow();
    await expect(
      db.query("update public.products set price_usd = 0 where sku = 'EJ-0001'"),
    ).rejects.toThrow();
  });

  it("solo acepta enlaces de cobro https://", async () => {
    const o = await createOrder([{ slug: "acople-goma-licuadora", quantity: 1 }]);
    await expect(
      db.query("update public.orders set payment_link = 'http://inseguro.com' where id = $1", [o.order_id]),
    ).rejects.toThrow();
    await db.query("update public.orders set payment_link = 'https://pago.example.com/x' where id = $1", [
      o.order_id,
    ]);
    await db.query("select public.cancel_order($1)", [o.order_id]);
  });
});

describe("RLS y permisos (rol anon)", () => {
  it("solo ve productos activos", async () => {
    await db.query("update public.products set active = false where sku = 'EJ-0020'");
    const rows = await asRole("anon", () => db.query<{ sku: string }>("select sku from public.products"));
    expect(rows.rows.map((r) => r.sku)).not.toContain("EJ-0020");
    expect(rows.rows.length).toBe(19);
    await db.query("update public.products set active = true where sku = 'EJ-0020'");
  });

  it("no puede leer pedidos, solicitudes ni mensajes", async () => {
    for (const table of [
      "orders",
      "order_items",
      "repair_requests",
      "contact_messages",
      "admins",
      "audit_log",
      "rate_limits",
    ]) {
      await expect(asRole("anon", () => db.query(`select * from public.${table}`))).rejects.toThrow(
        /permission denied/,
      );
    }
  });

  it("no puede escribir en ninguna tabla", async () => {
    await expect(
      asRole("anon", () => db.query("update public.products set price_usd = 0.01")),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asRole("anon", () => db.query("insert into public.categories (name, slug) values ('x', 'x')")),
    ).rejects.toThrow(/permission denied/);
    await expect(asRole("anon", () => db.query("delete from public.exchange_rates"))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("no puede ejecutar funciones críticas", async () => {
    for (const sql of [
      "select * from public.create_order('{}'::jsonb, '[]'::jsonb)",
      "select public.expire_orders()",
      "select public.mark_order_paid(gen_random_uuid())",
      "select public.cancel_order(gen_random_uuid())",
      "select public.check_rate_limit('x', 1, 60)",
      "select * from public.create_repair_request('{}'::jsonb)",
    ]) {
      await expect(asRole("anon", () => db.query(sql))).rejects.toThrow(/permission denied/);
    }
  });

  it("solo ve la tasa vigente", async () => {
    await db.query("insert into public.exchange_rates (rate, effective_date) values (100, '2020-01-01')");
    const r = await asRole("anon", () =>
      db.query<{ rate: string }>("select rate from public.exchange_rates"),
    );
    expect(r.rows).toEqual([{ rate: "236.4500" }]);
  });

  it("un usuario autenticado que NO es admin no ve pedidos", async () => {
    const r = await asRole("authenticated", () => db.query("select * from public.orders"));
    expect(r.rows).toEqual([]);
  });
});

describe("búsqueda del catálogo", () => {
  it("ignora tildes y mayúsculas", async () => {
    const r = await asRole("anon", () =>
      db.query<{ sku: string }>("select sku from public.search_products('VALVULA')"),
    );
    expect(r.rows.map((x) => x.sku)).toEqual(["EJ-0012"]);
  });

  it("filtra por categoría y marca, ordena por precio y pagina", async () => {
    const r = await asRole("anon", () =>
      db.query<{ sku: string; price_usd: string; total_count: string }>(
        "select sku, price_usd, total_count from public.search_products(null, 'licuadoras', 'oster', 'price_asc', 2, 0)",
      ),
    );
    expect(r.rows.map((x) => x.sku)).toEqual(["EJ-0004", "EJ-0003"]);
    expect(Number(r.rows[0]!.total_count)).toBe(4);
  });
});

describe("pedidos: reserva atómica de stock", () => {
  beforeEach(async () => {
    await db.query("update public.products set stock = 5, reserved = 0 where slug = 'rejilla-ventilador'");
    await db.query(
      "update public.products set stock = 1, reserved = 0 where slug = 'motor-ventilador-pedestal'",
    );
  });

  it("crea el pedido, reserva stock y guarda la instantánea", async () => {
    const o = await createOrder([
      { slug: "rejilla-ventilador", quantity: 2 },
      { slug: "rejilla-ventilador", quantity: 1 }, // se agrupan
    ]);
    expect(o.order_number).toMatch(/^AVG-\d{4}-\d{4}$/);
    expect(o.public_token).toMatch(/^[0-9a-f]{64}$/);
    expect(Number(o.subtotal_usd)).toBe(19.5); // 3 × 6,50
    // Mismo resultado en JS (src/lib/money.ts) y en Postgres: 4610,775 → 4610,78
    expect(Number(o.total_bs)).toBe(4610.78);
    expect(usdToBs(19.5, 236.45)).toBe(4610.78);
    expect((await product("rejilla-ventilador")).reserved).toBe(3);

    const items = await db.query<{ name_snapshot: string; price_usd_snapshot: string; quantity: number }>(
      "select name_snapshot, price_usd_snapshot, quantity from public.order_items where order_id = $1",
      [o.order_id],
    );
    expect(items.rows).toEqual([
      { name_snapshot: "Rejilla delantera para ventilador", price_usd_snapshot: "6.50", quantity: 3 },
    ]);

    // Cambiar el precio después no altera el pedido.
    await db.query("update public.products set price_usd = 99 where slug = 'rejilla-ventilador'");
    const again = await db.query<{ subtotal_usd: string }>(
      "select subtotal_usd from public.orders where id = $1",
      [o.order_id],
    );
    expect(again.rows[0]!.subtotal_usd).toBe("19.50");
    await db.query("update public.products set price_usd = 6.50 where slug = 'rejilla-ventilador'");
  });

  it("los números de pedido son correlativos", async () => {
    const a = await createOrder([{ slug: "rejilla-ventilador", quantity: 1 }]);
    const b = await createOrder([{ slug: "rejilla-ventilador", quantity: 1 }]);
    const n = (s: string) => Number(s.split("-")[2]);
    expect(n(b.order_number)).toBe(n(a.order_number) + 1);
  });

  it("rechaza comprar más stock del disponible", async () => {
    await expect(createOrder([{ slug: "rejilla-ventilador", quantity: 6 }])).rejects.toThrow(
      /insufficient_stock/,
    );
    expect((await product("rejilla-ventilador")).reserved).toBe(0);
  });

  it("la última unidad solo se la lleva un pedido", async () => {
    await createOrder([{ slug: "motor-ventilador-pedestal", quantity: 1 }]);
    await expect(createOrder([{ slug: "motor-ventilador-pedestal", quantity: 1 }])).rejects.toThrow(
      /insufficient_stock/,
    );
    const p = await product("motor-ventilador-pedestal");
    expect(p).toMatchObject({ stock: 1, reserved: 1 });
  });

  it("si una línea falla, no se reserva nada (todo o nada)", async () => {
    await expect(
      createOrder([
        { slug: "rejilla-ventilador", quantity: 2 },
        { slug: "goma-olla-presion-22", quantity: 1 }, // stock 0
      ]),
    ).rejects.toThrow(/insufficient_stock/);
    expect((await product("rejilla-ventilador")).reserved).toBe(0);
  });

  it("rechaza productos inexistentes, inactivos y cantidades no válidas", async () => {
    await expect(createOrder([{ slug: "no-existe", quantity: 1 }])).rejects.toThrow(/product_not_found/);
    await expect(createOrder([{ slug: "rejilla-ventilador", quantity: 0 }])).rejects.toThrow(/invalid_items/);
    await expect(createOrder([{ slug: "rejilla-ventilador", quantity: 1.5 }])).rejects.toThrow(
      /invalid_items/,
    );
    await expect(createOrder([])).rejects.toThrow(/invalid_items/);
    await db.query("update public.products set active = false where slug = 'rejilla-ventilador'");
    await expect(createOrder([{ slug: "rejilla-ventilador", quantity: 1 }])).rejects.toThrow(
      /product_unavailable/,
    );
    await db.query("update public.products set active = true where slug = 'rejilla-ventilador'");
  });

  it("exige dirección completa si es envío nacional", async () => {
    await expect(
      createOrder([{ slug: "rejilla-ventilador", quantity: 1 }], {
        ...customer,
        delivery_method: "national_shipping",
      }),
    ).rejects.toThrow(/orders_shipping_complete/);
  });

  it("al pagar descuenta el stock definitivamente", async () => {
    const o = await createOrder([{ slug: "rejilla-ventilador", quantity: 2 }]);
    await db.query("select public.mark_order_paid($1)", [o.order_id]);
    expect(await product("rejilla-ventilador")).toMatchObject({ stock: 3, reserved: 0 });
    await expect(db.query("select public.mark_order_paid($1)", [o.order_id])).rejects.toThrow(
      /order_not_payable/,
    );
  });

  it("al cancelar un pedido sin pagar libera la reserva", async () => {
    const o = await createOrder([{ slug: "rejilla-ventilador", quantity: 2 }]);
    await db.query("select public.cancel_order($1)", [o.order_id]);
    expect(await product("rejilla-ventilador")).toMatchObject({ stock: 5, reserved: 0 });
    await expect(db.query("select public.cancel_order($1)", [o.order_id])).rejects.toThrow(
      /order_not_cancellable/,
    );
  });

  it("al cancelar un pedido ya pagado, las unidades vuelven al stock", async () => {
    const o = await createOrder([{ slug: "rejilla-ventilador", quantity: 2 }]);
    await db.query("select public.mark_order_paid($1)", [o.order_id]);
    await db.query("select public.cancel_order($1)", [o.order_id]);
    expect(await product("rejilla-ventilador")).toMatchObject({ stock: 5, reserved: 0 });
  });

  it("los pedidos caducados se marcan como expirados y liberan stock", async () => {
    const o = await createOrder([{ slug: "rejilla-ventilador", quantity: 4 }]);
    await db.query("update public.orders set expires_at = now() - interval '1 minute' where id = $1", [
      o.order_id,
    ]);
    const r = await db.query<{ n: number }>("select public.expire_orders() as n");
    expect(r.rows[0]!.n).toBeGreaterThanOrEqual(1);
    const st = await db.query<{ status: string; stock_state: string }>(
      "select status, stock_state from public.orders where id = $1",
      [o.order_id],
    );
    expect(st.rows[0]).toEqual({ status: "expired", stock_state: "released" });
    expect((await product("rejilla-ventilador")).reserved).toBe(0);
  });
});

describe("solicitudes de reparación", () => {
  it("se crean con número correlativo REP-AAAA-NNNN", async () => {
    const r = await db.query<{ request_number: string }>(
      "select * from public.create_repair_request($1::jsonb)",
      [
        JSON.stringify({
          name: "Ana",
          phone: "+584141234567",
          state: "Lara",
          city: "Barquisimeto",
          equipment_type: "Lavadora",
          brand: "Whirlpool",
          issue: "No centrifuga desde ayer.",
          delivery_method: "courier",
          return_shipping: true,
        }),
      ],
    );
    expect(r.rows[0]!.request_number).toMatch(/^REP-\d{4}-0001$/);
  });
});

describe("limitación de frecuencia", () => {
  it("permite N peticiones por ventana y bloquea la siguiente", async () => {
    const call = async () =>
      (await db.query<{ ok: boolean }>("select public.check_rate_limit('test:ip', 2, 3600) as ok")).rows[0]!
        .ok;
    expect(await call()).toBe(true);
    expect(await call()).toBe(true);
    expect(await call()).toBe(false);
  });
});

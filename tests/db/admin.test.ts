/**
 * Panel de administración en la base de datos: permisos, MFA, flujo de
 * estados de pedidos, guardado de productos, importación CSV y auditoría.
 */
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asRole, createTestDb } from "./setup";

let db: PGlite;
const ADMIN = "00000000-0000-4000-8000-000000000001";
const ADMIN_MFA = "00000000-0000-4000-8000-000000000002";
const STRANGER = "00000000-0000-4000-8000-000000000003";

const admin = <T>(fn: () => Promise<T>, aal: "aal1" | "aal2" = "aal1") =>
  asRole(db, "authenticated", fn, { id: ADMIN, aal });
const stranger = <T>(fn: () => Promise<T>) => asRole(db, "authenticated", fn, { id: STRANGER });

beforeAll(async () => {
  db = await createTestDb();
  await db.exec(`
    insert into auth.users (id) values ('${ADMIN}'), ('${ADMIN_MFA}'), ('${STRANGER}');
    insert into public.admins (user_id, role) values ('${ADMIN}', 'owner'), ('${ADMIN_MFA}', 'staff');
    insert into auth.mfa_factors (user_id, status) values ('${ADMIN_MFA}', 'verified');
  `);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

async function newOrder(slug = "rejilla-ventilador", quantity = 1) {
  const r = await db.query<{ order_id: string }>("select * from public.create_order($1::jsonb, $2::jsonb)", [
    JSON.stringify({
      name: "Cliente",
      id_doc: "V-12345678",
      phone: "+584121234567",
      email: "c@example.com",
      delivery_method: "store_pickup",
    }),
    JSON.stringify([{ slug, quantity }]),
  ]);
  return r.rows[0]!.order_id;
}

async function stockOf(slug: string) {
  const r = await db.query<{ stock: number; reserved: number }>(
    "select stock, reserved from public.products where slug = $1",
    [slug],
  );
  return r.rows[0]!;
}

describe("is_admin y MFA", () => {
  it("un admin sin MFA es admin con aal1", async () => {
    const r = await admin(() => db.query<{ ok: boolean }>("select public.is_admin() ok"));
    expect(r.rows[0]!.ok).toBe(true);
  });

  it("un admin con TOTP verificado necesita aal2", async () => {
    const q = () => db.query<{ ok: boolean }>("select public.is_admin() ok");
    const aal1 = await asRole(db, "authenticated", q, { id: ADMIN_MFA, aal: "aal1" });
    const aal2 = await asRole(db, "authenticated", q, { id: ADMIN_MFA, aal: "aal2" });
    expect(aal1.rows[0]!.ok).toBe(false);
    expect(aal2.rows[0]!.ok).toBe(true);
  });

  it("un usuario que no está en admins no es admin ni puede escribir", async () => {
    const r = await stranger(() => db.query<{ ok: boolean }>("select public.is_admin() ok"));
    expect(r.rows[0]!.ok).toBe(false);
    const upd = await stranger(() =>
      db.query("update public.products set price_usd = 1 where sku = 'EJ-0001' returning id"),
    );
    expect(upd.rows).toHaveLength(0); // RLS: no ve filas que actualizar
    await expect(
      stranger(() => db.query("insert into public.exchange_rates (rate) values (1)")),
    ).rejects.toThrow(/row-level security/);
    await expect(stranger(() => db.query("select public.admin_dashboard()"))).rejects.toThrow(/forbidden/);
  });

  it("el admin no puede tocar columnas internas (reserved) ni la tabla admins", async () => {
    await expect(admin(() => db.query("update public.products set reserved = 0"))).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      admin(() => db.query(`insert into public.admins (user_id) values ('${STRANGER}')`)),
    ).rejects.toThrow(/permission denied/);
    await expect(admin(() => db.query("update public.orders set status = 'paid'"))).rejects.toThrow(
      /permission denied/,
    );
  });
});

describe("pedidos: flujo de estados", () => {
  it("pendiente → enlace enviado exige un enlace https://", async () => {
    const id = await newOrder();
    await expect(
      admin(() => db.query("select public.admin_update_order($1, 'link_sent')", [id])),
    ).rejects.toThrow(/payment_link_required/);
    await expect(
      admin(() => db.query("select public.admin_update_order($1, null, 'http://x.com')", [id])),
    ).rejects.toThrow(/invalid_payment_link/);
    await admin(() =>
      db.query("select public.admin_update_order($1, 'link_sent', 'https://pago.example.com/abc')", [id]),
    );
    const o = await db.query<{ status: string; payment_link: string }>(
      "select status, payment_link from public.orders where id = $1",
      [id],
    );
    expect(o.rows[0]).toEqual({ status: "link_sent", payment_link: "https://pago.example.com/abc" });
  });

  it("al marcar pagado descuenta el stock y registra quién lo hizo", async () => {
    const before = await stockOf("motor-ventilador-pedestal");
    const id = await newOrder("motor-ventilador-pedestal", 2);
    await admin(() => db.query("select public.admin_update_order($1, 'paid')", [id]));
    const after = await stockOf("motor-ventilador-pedestal");
    expect(after).toEqual({ stock: before.stock - 2, reserved: before.reserved });
    const h = await db.query<{ changed_by: string }>(
      "select changed_by from public.order_status_history where order_id = $1 and to_status = 'paid'",
      [id],
    );
    expect(h.rows[0]!.changed_by).toBe(ADMIN);
  });

  it("rechaza saltos no permitidos y estados finales", async () => {
    const id = await newOrder();
    await expect(
      admin(() => db.query("select public.admin_update_order($1, 'delivered')", [id])),
    ).rejects.toThrow(/invalid_transition/);
    await admin(() => db.query("select public.admin_update_order($1, 'cancelled')", [id]));
    await expect(admin(() => db.query("select public.admin_update_order($1, 'paid')", [id]))).rejects.toThrow(
      /invalid_transition/,
    );
  });

  it("cancelar libera la reserva; flujo completo hasta entregado", async () => {
    const s0 = await stockOf("rejilla-ventilador");
    const id = await newOrder();
    await admin(() => db.query("select public.admin_update_order($1, 'cancelled')", [id]));
    expect(await stockOf("rejilla-ventilador")).toEqual(s0);

    const id2 = await newOrder();
    for (const s of ["paid", "preparing", "ready_for_pickup", "delivered"]) {
      await admin(() => db.query("select public.admin_update_order($1, $2::public.order_status)", [id2, s]));
    }
    const o = await db.query<{ status: string }>("select status from public.orders where id = $1", [id2]);
    expect(o.rows[0]!.status).toBe("delivered");
  });

  it("un no-admin no puede cambiar pedidos", async () => {
    const id = await newOrder();
    await expect(
      stranger(() => db.query("select public.admin_update_order($1, 'paid')", [id])),
    ).rejects.toThrow(/forbidden/);
    await expect(
      asRole(db, "anon", () => db.query("select public.admin_update_order($1, 'paid')", [id])),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("productos", () => {
  it("crea y edita un producto con sus marcas", async () => {
    const cat = (await db.query<{ id: number }>("select id from public.categories order by id limit 1"))
      .rows[0]!.id;
    const brands = (
      await db.query<{ id: number }>("select id from public.brands order by id limit 2")
    ).rows.map((b) => b.id);
    const base = {
      sku: "TEST-001",
      name: "Producto de prueba",
      slug: "producto-de-prueba",
      description: "",
      compatibility: "",
      category_id: cat,
      price_usd: "12.50",
      stock: 4,
      low_stock_threshold: 1,
      has_warranty: false,
      featured: false,
      active: true,
    };
    const created = await admin(() =>
      db.query<{ id: string }>("select public.admin_save_product($1::jsonb, $2::bigint[]) id", [
        JSON.stringify(base),
        brands,
      ]),
    );
    const id = created.rows[0]!.id;
    await admin(() =>
      db.query("select public.admin_save_product($1::jsonb, $2::bigint[])", [
        JSON.stringify({ ...base, id, price_usd: "15.00" }),
        [brands[0]],
      ]),
    );
    const p = await db.query<{ price_usd: string; n: number }>(
      "select price_usd, (select count(*)::int from public.product_brands where product_id = p.id) n from public.products p where id = $1",
      [id],
    );
    expect(p.rows[0]).toEqual({ price_usd: "15.00", n: 1 });
  });

  it("no se puede borrar un producto con pedidos (se desactiva)", async () => {
    await expect(
      admin(() => db.query("delete from public.products where slug = 'rejilla-ventilador'")),
    ).rejects.toThrow(/foreign key/);
  });

  it("importa CSV todo o nada", async () => {
    const row = (sku: string, category = "ventiladores") => ({
      sku,
      name: `Pieza ${sku}`,
      slug: `pieza-${sku.toLowerCase()}`,
      category,
      brands: ["oster"],
      price_usd: "3.00",
      stock: 2,
      low_stock_threshold: 1,
      has_warranty: false,
      featured: false,
      active: true,
    });
    const r = await admin(() =>
      db.query<{ inserted: number; updated: number }>(
        "select * from public.admin_import_products($1::jsonb)",
        [JSON.stringify([row("IMP-1"), row("IMP-2"), row("EJ-0001")])],
      ),
    );
    expect(r.rows[0]).toEqual({ inserted: 2, updated: 1 });

    await expect(
      admin(() =>
        db.query("select * from public.admin_import_products($1::jsonb)", [
          JSON.stringify([row("IMP-3"), row("IMP-4", "no-existe")]),
        ]),
      ),
    ).rejects.toThrow(/unknown_category/);
    const n = await db.query<{ n: number }>(
      "select count(*)::int n from public.products where sku = 'IMP-3'",
    );
    expect(n.rows[0]!.n).toBe(0);
  });
});

describe("auditoría", () => {
  it("registra cambios de precio, tasa y estado con el admin", async () => {
    await admin(() => db.query("update public.products set price_usd = 99.99 where sku = 'EJ-0002'"));
    await admin(() => db.query("insert into public.exchange_rates (rate, note) values (240.5, 'prueba')"));
    const log = await admin(() =>
      db.query<{ entity: string; action: string; admin_id: string; before: object; after: object }>(
        "select entity, action, admin_id, before, after from public.audit_log order by id desc limit 2",
      ),
    );
    expect(log.rows[0]).toMatchObject({ entity: "exchange_rates", action: "insert", admin_id: ADMIN });
    expect(log.rows[1]).toMatchObject({
      entity: "products",
      action: "update",
      admin_id: ADMIN,
      after: { price_usd: 99.99 },
    });
    expect(Object.keys(log.rows[1]!.after)).toEqual(["price_usd"]);

    const rate = await db.query<{ created_by: string }>(
      "select created_by from public.exchange_rates order by id desc limit 1",
    );
    expect(rate.rows[0]!.created_by).toBe(ADMIN);
  });

  it("los pedidos de clientes no generan ruido en la auditoría", async () => {
    const before = await db.query<{ n: number }>("select count(*)::int n from public.audit_log");
    await newOrder();
    const after = await db.query<{ n: number }>("select count(*)::int n from public.audit_log");
    expect(after.rows[0]!.n).toBe(before.rows[0]!.n);
  });

  it("nadie que no sea admin lee la auditoría", async () => {
    const r = await stranger(() => db.query("select * from public.audit_log"));
    expect(r.rows).toHaveLength(0);
  });
});

describe("panel", () => {
  it("el resumen cuenta pendientes y stock bajo", async () => {
    const r = await admin(() =>
      db.query<{ d: { pending_orders: number; low_stock: unknown[] } }>("select public.admin_dashboard() d"),
    );
    expect(r.rows[0]!.d.pending_orders).toBeGreaterThan(0);
    expect(Array.isArray(r.rows[0]!.d.low_stock)).toBe(true);
  });

  it("ajustes: el admin edita y queda registrado quién", async () => {
    await admin(() => db.query("update public.settings set warranty_duration = '3 meses' where id = 1"));
    const s = await db.query<{ warranty_duration: string; updated_by: string }>(
      "select warranty_duration, updated_by from public.settings",
    );
    expect(s.rows[0]).toEqual({ warranty_duration: "3 meses", updated_by: ADMIN });
    await expect(
      stranger(() =>
        db.query("update public.settings set warranty_duration = 'x' where id = 1 returning id"),
      ),
    ).resolves.toMatchObject({ rows: [] });
  });
});

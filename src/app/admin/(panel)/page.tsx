import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/session";
import { formatRate, formatUsd } from "@/lib/money";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, type OrderStatus } from "@/lib/status";
import { AdminHeader, Badge, Card, EmptyState, adminDate, adminDateTime } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Resumen" };

type Dashboard = {
  pending_orders: number;
  to_prepare: number;
  new_requests: number;
  unread_messages: number;
  low_stock: { id: string; name: string; sku: string; available: number; low_stock_threshold: number }[];
};

const EMPTY: Dashboard = {
  pending_orders: 0,
  to_prepare: 0,
  new_requests: 0,
  unread_messages: 0,
  low_stock: [],
};

export default async function AdminHome() {
  const { supabase, mfaEnabled } = await requireAdmin();
  const [dash, rate, recent] = await Promise.all([
    supabase.rpc("admin_dashboard"),
    supabase
      .from("exchange_rates")
      .select("rate, effective_date, note")
      .order("effective_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, status, subtotal_usd, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);
  if (dash.error) console.error("[admin] resumen", dash.error.code, dash.error.message);
  const d = (dash.data as Dashboard | null) ?? EMPTY;
  const r = rate.data;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(new Date());
  const rateIsOld = !r || r.effective_date < today;

  const stats = [
    {
      label: "Pedidos sin pagar",
      value: d.pending_orders,
      href: "/admin/pedidos?estado=pending_payment",
      hint: "Envía el enlace de cobro",
    },
    {
      label: "Pedidos por preparar",
      value: d.to_prepare,
      href: "/admin/pedidos?estado=paid",
      hint: "Pagados o en preparación",
    },
    {
      label: "Solicitudes nuevas",
      value: d.new_requests,
      href: "/admin/solicitudes?estado=new",
      hint: "Reparaciones por contactar",
    },
    {
      label: "Mensajes sin leer",
      value: d.unread_messages,
      href: "/admin/mensajes",
      hint: "Formulario de contacto",
    },
  ];

  return (
    <>
      <AdminHeader title="Resumen" description="Lo que necesita tu atención hoy." />

      {!mfaEnabled && (
        <div className="mb-6 rounded-2xl bg-warning-soft p-4 text-ink ring-1 ring-flame/30">
          <strong>Recomendado:</strong> activa la verificación en dos pasos para proteger el panel.{" "}
          <Link href="/admin/seguridad" className="font-semibold underline underline-offset-4">
            Activarla ahora
          </Link>
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className="flex h-full flex-col rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-line transition-shadow hover:shadow-lift"
            >
              <span className="text-sm font-semibold text-muted">{s.label}</span>
              <span className="mt-1 font-display text-4xl font-extrabold">{s.value}</span>
              <span className="mt-1 text-sm text-ink-soft">{s.hint}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card
          title="Últimos pedidos"
          actions={
            <Link href="/admin/pedidos" className="text-sm font-semibold underline underline-offset-4">
              Ver todos
            </Link>
          }
        >
          {recent.data?.length ? (
            <ul className="divide-y divide-line">
              {recent.data.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-sand/40"
                  >
                    <span>
                      <span className="font-semibold">{o.order_number}</span> · {o.customer_name}
                      <span className="block text-sm text-muted">
                        {adminDateTime.format(new Date(o.created_at))}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-semibold">{formatUsd(Number(o.subtotal_usd))}</span>
                      <Badge tone={ORDER_STATUS_TONE[o.status as OrderStatus]}>
                        {ORDER_STATUS_LABEL[o.status as OrderStatus]}
                      </Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>Todavía no hay pedidos.</EmptyState>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card title="Tasa del día">
            {r ? (
              <>
                <p className="font-display text-3xl font-extrabold">Bs {formatRate(Number(r.rate))}</p>
                <p className="text-sm text-muted">
                  Vigente desde el {adminDate.format(new Date(`${r.effective_date}T12:00:00`))}
                  {r.note ? ` · ${r.note}` : ""}
                </p>
              </>
            ) : (
              <p className="text-ink-soft">No hay tasa cargada: la tienda no puede recibir pedidos.</p>
            )}
            {rateIsOld && (
              <p className="mt-3 text-sm font-semibold text-warning">No se ha actualizado hoy.</p>
            )}
            <ButtonLink href="/admin/tasa" variant="secondary" className="mt-4">
              Actualizar tasa
            </ButtonLink>
          </Card>

          <Card title="Stock bajo">
            {d.low_stock.length ? (
              <ul className="divide-y divide-line">
                {d.low_stock.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="flex items-center justify-between gap-3 py-2.5 hover:bg-sand/40"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{p.name}</span>
                        <span className="text-sm text-muted">SKU {p.sku}</span>
                      </span>
                      <Badge tone={p.available === 0 ? "danger" : "warning"}>
                        {p.available === 0 ? "Agotado" : `${p.available} disp.`}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>Todo el inventario está por encima del mínimo.</EmptyState>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

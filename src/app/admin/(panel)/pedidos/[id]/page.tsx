import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/session";
import { emailPaymentLink, markLinkSent, updateOrder } from "@/lib/actions/admin";
import { isEmailConfigured } from "@/lib/email/send";
import { formatBs, formatRate, formatUsd } from "@/lib/money";
import { paymentLinkMessage, whatsappUrl } from "@/lib/whatsapp";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, ORDER_TRANSITIONS, type OrderStatus } from "@/lib/status";
import { AdminHeader, Badge, Card, adminDateTime } from "@/components/admin/ui";
import { ActionForm, Input, Select, SubmitButton, Textarea } from "@/components/admin/form";
import { ExternalButton } from "@/components/ui/button";
import { IconWhatsApp } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Pedido" };

type Item = {
  id: number;
  name_snapshot: string;
  sku_snapshot: string;
  price_usd_snapshot: string;
  quantity: number;
};
type History = {
  id: number;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by: string | null;
  created_at: string;
};

const TRANSITION_HINT: Partial<Record<OrderStatus, string>> = {
  paid: "Descuenta el stock definitivamente.",
  cancelled: "Libera el stock apartado (o lo devuelve al inventario si ya estaba pagado).",
};

export default async function OrderDetail({ params }: PageProps<"/admin/pedidos/[id]">) {
  const { supabase } = await requireAdmin();
  const id = z
    .string()
    .uuid()
    .safeParse((await params).id);
  if (!id.success) notFound();

  const { data: o } = await supabase
    .from("orders")
    .select(
      "*, order_items(id, name_snapshot, sku_snapshot, price_usd_snapshot, quantity), order_status_history(id, from_status, to_status, changed_by, created_at)",
    )
    .eq("id", id.data)
    .maybeSingle();
  if (!o) notFound();

  const status = o.status as OrderStatus;
  const items = (o.order_items ?? []) as Item[];
  const history = ((o.order_status_history ?? []) as History[]).sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  const next = ORDER_TRANSITIONS[status];
  const total = formatUsd(Number(o.subtotal_usd));
  const totalBs = formatBs(Number(o.total_bs));
  const firstName = String(o.customer_name).split(" ")[0] ?? "";
  const open = status === "pending_payment" || status === "link_sent";
  const waLink = o.payment_link
    ? whatsappUrl(
        paymentLinkMessage({
          firstName,
          orderNumber: o.order_number,
          totalUsd: total,
          totalBs,
          link: o.payment_link,
        }),
        o.customer_phone,
      )
    : null;

  return (
    <>
      <AdminHeader
        back={{ href: "/admin/pedidos", label: "Pedidos" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {o.order_number} <Badge tone={ORDER_STATUS_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>
          </span>
        }
        description={`Creado el ${adminDateTime.format(new Date(o.created_at))}${
          open ? ` · caduca el ${adminDateTime.format(new Date(o.expires_at))}` : ""
        }`}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
        <div className="flex flex-col gap-6">
          {open && (
            <Card title="1. Enlace de cobro">
              <ActionForm action={updateOrder} submitLabel="Guardar enlace">
                <input type="hidden" name="id" value={o.id} />
                <Input
                  name="paymentLink"
                  label="Enlace de cobro"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  defaultValue={o.payment_link ?? ""}
                  hint="Pega aquí el enlace de pago (debe empezar por https://)."
                />
              </ActionForm>

              {o.payment_link && (
                <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5">
                  <p className="font-semibold">2. Envíaselo al cliente</p>
                  <div className="flex flex-wrap gap-3">
                    {waLink && (
                      <ExternalButton href={waLink} variant="whatsapp">
                        <IconWhatsApp size={20} />
                        Enviar por WhatsApp
                      </ExternalButton>
                    )}
                    {isEmailConfigured() ? (
                      <ActionForm
                        action={emailPaymentLink}
                        submitLabel="Enviar por email"
                        pendingLabel="Enviando…"
                        submitVariant="secondary"
                      >
                        <input type="hidden" name="id" value={o.id} />
                      </ActionForm>
                    ) : (
                      <p className="text-sm text-muted">El envío por email se activa al configurar Resend.</p>
                    )}
                  </div>
                  {status === "pending_payment" && (
                    <form action={markLinkSent}>
                      <input type="hidden" name="id" value={o.id} />
                      <p className="mb-2 text-sm text-ink-soft">
                        Después de enviarlo por WhatsApp, márcalo para que conste:
                      </p>
                      <SubmitButton label="Marcar «Enlace enviado»" variant="secondary" />
                    </form>
                  )}
                </div>
              )}
            </Card>
          )}

          <Card title="Productos">
            <ul className="divide-y divide-line border-y border-line">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-3">
                  <span>
                    {i.quantity} × {i.name_snapshot}
                    <span className="block text-sm text-muted">
                      SKU {i.sku_snapshot} · {formatUsd(Number(i.price_usd_snapshot))} c/u
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold">
                    {formatUsd(Number(i.price_usd_snapshot) * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1">
              <div className="flex justify-between gap-4">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-2xl font-bold">{total}</dd>
              </div>
              <div className="flex justify-between gap-4 text-sm text-ink-soft">
                <dt>En Bs (tasa {formatRate(Number(o.exchange_rate))} del día del pedido)</dt>
                <dd className="font-semibold">{totalBs}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Historial">
            <ol className="flex flex-col gap-2">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap justify-between gap-2 text-[0.95rem]">
                  <span>
                    {h.from_status ? `${ORDER_STATUS_LABEL[h.from_status]} → ` : ""}
                    <strong>{ORDER_STATUS_LABEL[h.to_status]}</strong>
                    <span className="text-muted">{h.changed_by ? " · panel" : " · automático"}</span>
                  </span>
                  <span className="text-sm text-muted">{adminDateTime.format(new Date(h.created_at))}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          {next.length > 0 && (
            <Card title="Cambiar estado">
              <ActionForm action={updateOrder} submitLabel="Cambiar estado">
                <input type="hidden" name="id" value={o.id} />
                <Select
                  name="status"
                  label="Nuevo estado"
                  placeholder="Elige…"
                  options={next.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))}
                  hint={next
                    .filter((s) => TRANSITION_HINT[s])
                    .map((s) => `${ORDER_STATUS_LABEL[s]}: ${TRANSITION_HINT[s]}`)
                    .join(" ")}
                />
              </ActionForm>
            </Card>
          )}

          <Card title="Cliente">
            <dl className="space-y-2 text-[0.95rem]">
              {(
                [
                  ["Nombre", o.customer_name],
                  ["Cédula / RIF", o.customer_id_doc],
                  ["Teléfono", o.customer_phone],
                  ["Email", o.customer_email],
                  [
                    "Entrega",
                    o.delivery_method === "store_pickup" ? "Retiro en la tienda" : "Envío nacional",
                  ],
                  ["Estado / ciudad", o.shipping_state ? `${o.shipping_city}, ${o.shipping_state}` : null],
                  ["Dirección", o.shipping_address],
                  ["Agencia", o.shipping_agency],
                  ["Notas del cliente", o.notes],
                ] as [string, string | null][]
              )
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-sm text-muted">{k}</dt>
                    <dd className="font-medium break-words whitespace-pre-line">{v}</dd>
                  </div>
                ))}
            </dl>
            <ExternalButton
              href={whatsappUrl(
                `¡Hola, ${firstName}! Te escribimos de AVG Reparaciones por tu pedido ${o.order_number}.`,
                o.customer_phone,
              )}
              variant="secondary"
              className="mt-4"
            >
              <IconWhatsApp size={20} className="text-[#1f8f4e]" />
              Escribir al cliente
            </ExternalButton>
          </Card>

          <Card title="Notas internas">
            <ActionForm action={updateOrder} submitLabel="Guardar notas" submitVariant="secondary">
              <input type="hidden" name="id" value={o.id} />
              <Textarea
                name="adminNotes"
                label="Solo las ve el equipo"
                maxLength={2000}
                defaultValue={o.admin_notes ?? ""}
              />
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}

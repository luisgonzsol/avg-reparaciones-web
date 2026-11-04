import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";
import clsx from "clsx";
import { getOrderByToken } from "@/lib/data/orders";
import { formatBs, formatRate, formatUsd } from "@/lib/money";
import { orderMessage, whatsappUrl } from "@/lib/whatsapp";
import { siteConfig } from "@/config/site";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/primitives";
import { ButtonLink, ExternalButton } from "@/components/ui/button";
import { IconShield, IconWhatsApp } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Tu pedido",
  robots: { index: false, follow: false },
  referrer: "no-referrer", // el token no debe filtrarse a otros sitios
};

const dateTime = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: siteConfig.timeZone,
});

export default async function OrderPage({ params }: PageProps<"/pedido/[token]">) {
  const { token } = await params;
  let order;
  try {
    order = await getOrderByToken(token);
  } catch (e) {
    unstable_rethrow(e); // deja pasar las señales internas de Next.js
    console.error("[pedido]", e instanceof Error ? e.message : e);
    throw new Error("No se pudo cargar el pedido");
  }
  if (!order) notFound();

  const open = order.status === "pending_payment" || order.status === "link_sent";
  const closed = order.status === "cancelled" || order.status === "expired";
  const message = orderMessage({
    orderNumber: order.orderNumber,
    items: order.items.map((i) => ({ name: i.name, quantity: i.quantity })),
    totalUsd: formatUsd(order.subtotalUsd),
    totalBs: formatBs(order.totalBs),
  });

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Tu pedido" }]}
        title={
          open ? `¡Gracias, ${order.customerFirstName}! Recibimos tu pedido` : `Pedido ${order.orderNumber}`
        }
      />
      <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_22rem] lg:gap-10">
        <div className="flex flex-col gap-6">
          <div className="rounded-(--radius-card) bg-surface p-7 shadow-soft ring-1 ring-line sm:p-9">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display text-2xl font-bold">{order.orderNumber}</span>
              <span
                className={clsx(
                  "rounded-full px-3 py-1 text-sm font-bold",
                  closed
                    ? "bg-sand text-muted"
                    : open
                      ? "bg-warning-soft text-warning"
                      : "bg-success-soft text-success",
                )}
              >
                {order.statusLabel}
              </span>
            </div>

            {open && (
              <div className="mt-6 flex gap-4 rounded-2xl bg-sand/70 p-5">
                <IconShield size={28} className="shrink-0 text-brand-ink" />
                <div className="text-ink-soft">
                  <p className="font-semibold text-ink">
                    Te enviaremos por WhatsApp o Gmail el enlace de cobro para completar tu compra.
                  </p>
                  <p className="mt-2">
                    Apartamos tus productos hasta el{" "}
                    <strong className="text-ink">{dateTime.format(new Date(order.expiresAt))}</strong>. Si no
                    se completa el pago antes, el pedido se cancela automáticamente.
                  </p>
                </div>
              </div>
            )}
            {order.paymentLink && open && (
              <ExternalButton href={order.paymentLink} size="lg" className="mt-6">
                Ir al enlace de cobro
              </ExternalButton>
            )}
            {closed && (
              <p className="mt-6 text-ink-soft">
                Este pedido ya no está activo. Si quieres comprar estos productos, haz un pedido nuevo o
                escríbenos.
              </p>
            )}

            <h2 className="mt-8 text-xl font-bold">Resumen</h2>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {order.items.map((i) => (
                <li key={i.sku} className="flex justify-between gap-4 py-3">
                  <span>
                    {i.quantity} × {i.name}
                    <span className="block text-sm text-muted">SKU {i.sku}</span>
                  </span>
                  <span className="shrink-0 font-semibold">{formatUsd(i.priceUsd * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1">
              <div className="flex justify-between gap-4">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-2xl font-bold">{formatUsd(order.subtotalUsd)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-sm text-ink-soft">
                <dt>Referencia en Bs (tasa {formatRate(order.exchangeRate)})</dt>
                <dd className="font-semibold">{formatBs(order.totalBs)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-muted">
              Monto en Bs referencial según la tasa del día del pedido; el monto final se confirma en el
              enlace de cobro.
            </p>
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-(--radius-card) bg-surface p-6 shadow-soft ring-1 ring-line">
            <h2 className="text-lg font-bold">Datos del pedido</h2>
            <dl className="mt-3 space-y-2 text-[0.95rem]">
              <div>
                <dt className="text-muted">Cédula / RIF</dt>
                <dd className="font-semibold">{order.idDocMasked}</dd>
              </div>
              <div>
                <dt className="text-muted">Entrega</dt>
                <dd className="font-semibold">
                  {order.deliveryMethod === "store_pickup"
                    ? "Retiro en la tienda"
                    : `Envío nacional a ${order.shippingCity}, ${order.shippingState}`}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Fecha</dt>
                <dd className="font-semibold">{dateTime.format(new Date(order.createdAt))}</dd>
              </div>
            </dl>
          </div>
          <ExternalButton href={whatsappUrl(message)} variant="whatsapp" size="lg">
            <IconWhatsApp size={22} />
            Continuar por WhatsApp
          </ExternalButton>
          <ButtonLink href="/tienda" variant="secondary" size="lg">
            Seguir comprando
          </ButtonLink>
          <p className="text-sm text-muted">
            Guarda el enlace de esta página para consultar tu pedido. No lo compartas: es personal.
          </p>
        </aside>
      </Container>
    </>
  );
}

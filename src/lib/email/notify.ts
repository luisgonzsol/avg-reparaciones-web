import "server-only";
import { siteConfig } from "@/config/site";
import { getServiceClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/settings";
import { formatBs, formatRate, formatUsd } from "@/lib/money";
import { DELIVERY_METHODS, type DeliveryMethod } from "@/content/forms";
import { ORDER_DELIVERY } from "@/lib/validation/forms";
import {
  NewContactAdminEmail,
  NewOrderAdminEmail,
  NewRepairAdminEmail,
  OrderConfirmationEmail,
  PaymentLinkEmail,
} from "@/emails/templates";
import { sendEmail } from "./send";

const dateTime = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: siteConfig.timeZone,
});

const absolute = (path: string) => new URL(path, siteConfig.url).toString();

/** Buzón de la empresa: variable de entorno o, si falta, el email de Ajustes. */
async function businessInbox(): Promise<string | null> {
  if (process.env.EMAIL_NOTIFY_TO) return process.env.EMAIL_NOTIFY_TO;
  return (await getSiteSettings()).email;
}

type OrderRow = {
  id: string;
  order_number: string;
  public_token: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_method: keyof typeof ORDER_DELIVERY;
  shipping_state: string | null;
  shipping_city: string | null;
  shipping_address: string | null;
  shipping_agency: string | null;
  notes: string | null;
  subtotal_usd: string | number;
  exchange_rate: string | number;
  total_bs: string | number;
  payment_link: string | null;
  expires_at: string;
  order_items: {
    name_snapshot: string;
    sku_snapshot: string;
    price_usd_snapshot: string | number;
    quantity: number;
  }[];
};

async function loadOrder(orderId: string): Promise<OrderRow | null> {
  const { data, error } = await getServiceClient()
    .from("orders")
    .select(
      "id, order_number, public_token, customer_name, customer_phone, customer_email, delivery_method, shipping_state, shipping_city, shipping_address, shipping_agency, notes, subtotal_usd, exchange_rate, total_bs, payment_link, expires_at, order_items(name_snapshot, sku_snapshot, price_usd_snapshot, quantity)",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as OrderRow | null;
}

function orderBasics(o: OrderRow) {
  return {
    firstName: o.customer_name.split(" ")[0] ?? o.customer_name,
    items: o.order_items.map((i) => ({
      name: i.name_snapshot,
      sku: i.sku_snapshot,
      quantity: i.quantity,
      lineTotal: formatUsd(Number(i.price_usd_snapshot) * i.quantity),
    })),
    total: formatUsd(Number(o.subtotal_usd)),
    totalBs: formatBs(Number(o.total_bs)),
    rate: formatRate(Number(o.exchange_rate)),
    deliveryLabel: ORDER_DELIVERY[o.delivery_method]?.label ?? o.delivery_method,
    expiresAt: dateTime.format(new Date(o.expires_at)),
    orderUrl: absolute(`/pedido/${o.public_token}`),
  };
}

/** Pedido nuevo: confirmación al cliente y aviso a la empresa. */
export async function notifyNewOrder(orderId: string): Promise<void> {
  try {
    const o = await loadOrder(orderId);
    if (!o) return;
    const b = orderBasics(o);
    const inbox = await businessInbox();
    await Promise.all([
      sendEmail({
        tag: "pedido-cliente",
        to: o.customer_email,
        subject: `Recibimos tu pedido ${o.order_number}`,
        react: OrderConfirmationEmail({ ...b, orderNumber: o.order_number }),
        replyTo: inbox ?? undefined,
      }),
      inbox
        ? sendEmail({
            tag: "pedido-empresa",
            to: inbox,
            subject: `Nuevo pedido ${o.order_number} · ${b.total}`,
            react: NewOrderAdminEmail({
              orderNumber: o.order_number,
              customerName: o.customer_name,
              phone: o.customer_phone,
              email: o.customer_email,
              deliveryLabel: b.deliveryLabel,
              shipping:
                o.delivery_method === "national_shipping"
                  ? [
                      o.shipping_address,
                      o.shipping_city,
                      o.shipping_state,
                      o.shipping_agency && `Agencia: ${o.shipping_agency}`,
                    ]
                      .filter(Boolean)
                      .join(", ")
                  : null,
              notes: o.notes,
              items: b.items,
              total: b.total,
              totalBs: b.totalBs,
              adminUrl: absolute(`/admin/pedidos/${o.id}`),
            }),
            replyTo: o.customer_email,
          })
        : Promise.resolve(console.info("[email] sin buzón de la empresa (pon el email en Ajustes)")),
    ]);
  } catch (e) {
    console.error("[email] pedido", e instanceof Error ? e.message : e);
  }
}

/** Envía al cliente el enlace de cobro guardado en el pedido. */
export async function sendPaymentLinkEmail(orderId: string): Promise<boolean> {
  const o = await loadOrder(orderId);
  if (!o?.payment_link) return false;
  const b = orderBasics(o);
  const inbox = await businessInbox();
  return sendEmail({
    tag: "enlace-cobro",
    to: o.customer_email,
    subject: `Enlace de cobro de tu pedido ${o.order_number}`,
    react: PaymentLinkEmail({
      firstName: b.firstName,
      orderNumber: o.order_number,
      total: b.total,
      totalBs: b.totalBs,
      paymentLink: o.payment_link,
      orderUrl: b.orderUrl,
      expiresAt: b.expiresAt,
    }),
    replyTo: inbox ?? undefined,
  });
}

/** Solicitud de reparación nueva: aviso a la empresa. */
export async function notifyNewRepair(r: {
  id: string;
  requestNumber: string;
  name: string;
  phone: string;
  email: string | null;
  state: string;
  city: string;
  equipmentType: string;
  brand: string;
  model: string | null;
  issue: string;
  deliveryMethod: DeliveryMethod;
  returnShipping: boolean;
  photos: number;
}): Promise<void> {
  try {
    const inbox = await businessInbox();
    if (!inbox) return console.info("[email] sin buzón de la empresa (pon el email en Ajustes)");
    await sendEmail({
      tag: "reparacion-empresa",
      to: inbox,
      subject: `Nueva solicitud ${r.requestNumber} · ${r.equipmentType} ${r.brand}`,
      replyTo: r.email ?? undefined,
      react: NewRepairAdminEmail({
        requestNumber: r.requestNumber,
        customerName: r.name,
        phone: r.phone,
        email: r.email,
        location: `${r.city}, ${r.state}`,
        equipment: `${r.equipmentType} · ${r.brand}`,
        model: r.model,
        issue: r.issue,
        deliveryLabel: DELIVERY_METHODS[r.deliveryMethod].label,
        returnShipping: r.returnShipping,
        photos: r.photos,
        adminUrl: absolute(`/admin/solicitudes/${r.id}`),
      }),
    });
  } catch (e) {
    console.error("[email] reparación", e instanceof Error ? e.message : e);
  }
}

/** Mensaje de contacto nuevo: aviso a la empresa. */
export async function notifyNewContact(m: {
  name: string;
  phone: string;
  email: string | null;
  topic: string;
  message: string;
}): Promise<void> {
  try {
    const inbox = await businessInbox();
    if (!inbox) return console.info("[email] sin buzón de la empresa (pon el email en Ajustes)");
    await sendEmail({
      tag: "contacto-empresa",
      to: inbox,
      subject: `Nuevo mensaje: ${m.topic}`,
      replyTo: m.email ?? undefined,
      react: NewContactAdminEmail({ ...m, adminUrl: absolute("/admin/mensajes") }),
    });
  } catch (e) {
    console.error("[email] contacto", e instanceof Error ? e.message : e);
  }
}

import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { maskIdDoc } from "@/lib/validation/common";
import { ORDER_STATUS_LABEL, isOrderStatus } from "@/lib/status";

export type PublicOrder = {
  orderNumber: string;
  status: string;
  statusLabel: string;
  customerFirstName: string;
  idDocMasked: string;
  deliveryMethod: "store_pickup" | "national_shipping";
  shippingCity: string | null;
  shippingState: string | null;
  subtotalUsd: number;
  exchangeRate: number;
  totalBs: number;
  paymentLink: string | null;
  expiresAt: string;
  createdAt: string;
  items: { name: string; sku: string; priceUsd: number; quantity: number }[];
};

const TOKEN_RE = /^[0-9a-f]{64}$/;

/**
 * Pedido visible públicamente SOLO con su token aleatorio (nunca por el
 * número correlativo). Devuelve datos mínimos: cédula enmascarada, sin
 * teléfono, correo ni dirección completa.
 */
export async function getOrderByToken(token: string): Promise<PublicOrder | null> {
  if (!TOKEN_RE.test(token)) return null;
  const client = getServiceClient();
  // Marca como expirados los pedidos vencidos antes de mostrar el estado.
  await client.rpc("expire_orders");
  const { data, error } = await client
    .from("orders")
    .select(
      "order_number, status, customer_name, customer_id_doc, delivery_method, shipping_city, shipping_state, subtotal_usd, exchange_rate, total_bs, payment_link, expires_at, created_at, order_items(name_snapshot, sku_snapshot, price_usd_snapshot, quantity)",
    )
    .eq("public_token", token)
    .maybeSingle();
  if (error) throw new Error(`order: ${error.message}`);
  if (!data) return null;

  type Item = {
    name_snapshot: string;
    sku_snapshot: string;
    price_usd_snapshot: number | string;
    quantity: number;
  };
  return {
    orderNumber: data.order_number,
    status: data.status,
    statusLabel: isOrderStatus(data.status) ? ORDER_STATUS_LABEL[data.status] : String(data.status),
    customerFirstName: String(data.customer_name).split(" ")[0] ?? "",
    idDocMasked: maskIdDoc(data.customer_id_doc),
    deliveryMethod: data.delivery_method,
    shippingCity: data.shipping_city,
    shippingState: data.shipping_state,
    subtotalUsd: Number(data.subtotal_usd),
    exchangeRate: Number(data.exchange_rate),
    totalBs: Number(data.total_bs),
    paymentLink: data.payment_link,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
    items: ((data.order_items ?? []) as Item[]).map((i) => ({
      name: i.name_snapshot,
      sku: i.sku_snapshot,
      priceUsd: Number(i.price_usd_snapshot),
      quantity: i.quantity,
    })),
  };
}

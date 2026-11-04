/**
 * Estados de pedidos y solicitudes: etiquetas, colores y flujo permitido.
 * El flujo de pedidos REPITE el de la función SQL order_transition_allowed
 * (la base de datos es quien manda; esto solo sirve para pintar los botones).
 */

export const ORDER_STATUSES = [
  "pending_payment",
  "link_sent",
  "paid",
  "preparing",
  "shipped",
  "ready_for_pickup",
  "delivered",
  "cancelled",
  "expired",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Pendiente de pago",
  link_sent: "Enlace de cobro enviado",
  paid: "Pagado",
  preparing: "En preparación",
  shipped: "Enviado",
  ready_for_pickup: "Listo para retirar",
  delivered: "Entregado",
  cancelled: "Cancelado",
  expired: "Cancelado (expirado)",
};

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["link_sent", "paid", "cancelled"],
  link_sent: ["pending_payment", "paid", "cancelled"],
  paid: ["preparing", "shipped", "ready_for_pickup", "cancelled"],
  preparing: ["shipped", "ready_for_pickup", "cancelled"],
  shipped: ["delivered", "cancelled"],
  ready_for_pickup: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
  expired: [],
};

export function isOrderStatus(v: unknown): v is OrderStatus {
  return typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v);
}

export const REPAIR_STATUSES = [
  "new",
  "contacted",
  "received",
  "in_repair",
  "ready",
  "delivered",
  "discarded",
] as const;
export type RepairStatus = (typeof REPAIR_STATUSES)[number];

export const REPAIR_STATUS_LABEL: Record<RepairStatus, string> = {
  new: "Nueva",
  contacted: "Contactado",
  received: "Recibido en taller",
  in_repair: "En reparación",
  ready: "Listo",
  delivered: "Entregado",
  discarded: "Descartado",
};

export function isRepairStatus(v: unknown): v is RepairStatus {
  return typeof v === "string" && (REPAIR_STATUSES as readonly string[]).includes(v);
}

export type Tone = "neutral" | "warning" | "success" | "info" | "muted" | "danger";

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  pending_payment: "warning",
  link_sent: "info",
  paid: "success",
  preparing: "success",
  shipped: "success",
  ready_for_pickup: "success",
  delivered: "neutral",
  cancelled: "muted",
  expired: "muted",
};

export const REPAIR_STATUS_TONE: Record<RepairStatus, Tone> = {
  new: "warning",
  contacted: "info",
  received: "info",
  in_repair: "info",
  ready: "success",
  delivered: "neutral",
  discarded: "muted",
};

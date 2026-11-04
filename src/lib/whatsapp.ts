/**
 * Enlaces de WhatsApp. El texto SIEMPRE se codifica con encodeURIComponent.
 * No incluir datos sensibles (cédula, dirección completa) en estos mensajes.
 */
import { siteConfig } from "@/config/site";

export function whatsappUrl(message?: string, phone: string = siteConfig.whatsappNumber): string {
  const digits = phone.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  const text = message?.trim();
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export const DEFAULT_WHATSAPP_MESSAGE = "¡Hola, AVG Reparaciones! Quisiera hacer una consulta.";

export function productInquiryMessage(productName: string, sku?: string): string {
  const ref = sku ? ` (ref. ${sku})` : "";
  return `¡Hola, AVG Reparaciones! Me interesa el repuesto: ${productName}${ref}. ¿Está disponible?`;
}

export type RepairSummary = {
  requestNumber: string;
  name: string;
  equipment: string;
  brand: string;
  issue: string;
  deliveryMethod: string;
};

export function repairRequestMessage(r: RepairSummary): string {
  return [
    "¡Hola, AVG Reparaciones! Acabo de enviar una solicitud de reparación.",
    `N.º de solicitud: ${r.requestNumber}`,
    `Nombre: ${r.name}`,
    `Equipo: ${r.equipment} ${r.brand}`.trim(),
    `Falla: ${r.issue}`,
    `Entrega: ${r.deliveryMethod}`,
  ].join("\n");
}

export type OrderSummary = {
  orderNumber: string;
  items: { name: string; quantity: number }[];
  totalUsd: string;
  totalBs?: string;
};

export function orderMessage(o: OrderSummary): string {
  const lines = o.items.map((i) => `• ${i.quantity} × ${i.name}`);
  return [
    `¡Hola, AVG Reparaciones! Hice el pedido ${o.orderNumber}:`,
    ...lines,
    `Total: ${o.totalUsd}${o.totalBs ? ` (ref. ${o.totalBs})` : ""}`,
    "Quedo atento/a al enlace de cobro.",
  ].join("\n");
}

import { z } from "zod";
import { CONTACT_TOPICS, DELIVERY_METHOD_KEYS, EQUIPMENT_TYPES, VENEZUELA_STATES } from "@/content/forms";
import {
  honeypot,
  idDoc,
  mustAccept,
  optionalEmail,
  optionalText,
  requiredEmail,
  text,
  vePhone,
  yesNo,
} from "./common";

const PRIVACY_MSG = "Debes aceptar la política de privacidad para continuar.";

/* ---------- Solicitud de reparación (divida por pasos) ---------- */

export const repairEquipmentSchema = z.object({
  equipmentType: z.enum(EQUIPMENT_TYPES, { error: "Elige el tipo de equipo." }),
  brand: text(1, 60, "la marca"),
  model: optionalText(80, "el modelo"),
  issue: text(10, 1500, "la falla"),
});

export const repairDeliverySchema = z.object({
  deliveryMethod: z.enum(DELIVERY_METHOD_KEYS, { error: "Elige cómo nos harás llegar el equipo." }),
  returnShipping: yesNo,
});

export const repairContactSchema = z.object({
  name: text(2, 100, "tu nombre"),
  phone: vePhone,
  email: optionalEmail,
  state: z.enum(VENEZUELA_STATES, { error: "Elige tu estado." }),
  city: text(2, 80, "tu ciudad"),
  privacy: mustAccept(PRIVACY_MSG),
});

export const repairRequestSchema = repairEquipmentSchema
  .extend(repairDeliverySchema.shape)
  .extend(repairContactSchema.shape)
  .extend({ website: honeypot });

export type RepairRequestInput = z.input<typeof repairRequestSchema>;
export type RepairRequest = z.output<typeof repairRequestSchema>;

/** Pasos del formulario: qué campos valida cada uno. */
export const REPAIR_STEPS = [
  { title: "Tu equipo", schema: repairEquipmentSchema },
  { title: "Entrega", schema: repairDeliverySchema },
  { title: "Tus datos", schema: repairContactSchema },
] as const;

/* ---------- Contacto ---------- */

export const contactSchema = z.object({
  name: text(2, 100, "tu nombre"),
  phone: vePhone,
  email: optionalEmail,
  topic: z.enum(CONTACT_TOPICS, { error: "Elige el motivo del mensaje." }),
  message: text(10, 2000, "tu mensaje"),
  privacy: mustAccept(PRIVACY_MSG),
  website: honeypot,
});

export type ContactMessage = z.output<typeof contactSchema>;

/* ---------- Checkout ---------- */

export const ORDER_DELIVERY = {
  store_pickup: { label: "Retiro en la tienda", description: "Sin coste. En nuestro local de Caracas." },
  national_shipping: {
    label: "Envío nacional",
    description: "Por agencia de encomiendas a toda Venezuela. El envío tiene un coste extra a tu cargo.",
  },
} as const;
export type OrderDelivery = keyof typeof ORDER_DELIVERY;

export const cartLinesSchema = z
  .array(
    z.object({
      slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
      quantity: z.number().int().min(1).max(99),
    }),
  )
  .min(1, "Tu carrito está vacío.")
  .max(30, "Demasiados productos en el carrito.");

export const checkoutSchema = z
  .object({
    name: text(2, 100, "tu nombre y apellido"),
    idDoc,
    phone: vePhone,
    email: requiredEmail,
    deliveryMethod: z.enum(["store_pickup", "national_shipping"], {
      error: "Elige cómo quieres recibir tu pedido.",
    }),
    state: z.string().optional(),
    city: optionalText(80, "la ciudad"),
    address: optionalText(300, "la dirección"),
    agency: optionalText(80, "la agencia"),
    notes: optionalText(1000, "las notas"),
    terms: mustAccept("Debes aceptar los términos y la política de privacidad."),
    website: honeypot,
  })
  .superRefine((v, ctx) => {
    if (v.deliveryMethod !== "national_shipping") return;
    if (!v.state || !(VENEZUELA_STATES as readonly string[]).includes(v.state)) {
      ctx.addIssue({ code: "custom", path: ["state"], message: "Elige el estado de destino." });
    }
    if (!v.city || v.city.length < 2) {
      ctx.addIssue({ code: "custom", path: ["city"], message: "Escribe la ciudad de destino." });
    }
    if (!v.address || v.address.length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message: "Escribe la dirección de entrega completa.",
      });
    }
  });

export type CheckoutInput = z.output<typeof checkoutSchema>;

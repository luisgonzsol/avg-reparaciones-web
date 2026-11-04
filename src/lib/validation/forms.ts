import { z } from "zod";
import { CONTACT_TOPICS, DELIVERY_METHOD_KEYS, EQUIPMENT_TYPES, VENEZUELA_STATES } from "@/content/forms";
import { honeypot, mustAccept, optionalEmail, optionalText, text, vePhone, yesNo } from "./common";

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

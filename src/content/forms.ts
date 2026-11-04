/**
 * Opciones de los formularios (listas cerradas: se validan en el servidor).
 */

export const VENEZUELA_STATES = [
  "Amazonas",
  "Anzoátegui",
  "Apure",
  "Aragua",
  "Barinas",
  "Bolívar",
  "Carabobo",
  "Cojedes",
  "Delta Amacuro",
  "Distrito Capital",
  "Falcón",
  "Guárico",
  "La Guaira",
  "Lara",
  "Mérida",
  "Miranda",
  "Monagas",
  "Nueva Esparta",
  "Portuguesa",
  "Sucre",
  "Táchira",
  "Trujillo",
  "Yaracuy",
  "Zulia",
] as const;

export const EQUIPMENT_TYPES = [
  "Lavadora",
  "Microondas",
  "Licuadora",
  "Ventilador",
  "Olla de presión",
  "Batidora",
  "Cafetera",
  "Motor eléctrico o inducido",
  "Batidora KitchenAid",
  "Licuadora industrial",
  "Rebanadora",
  "Rayador de queso",
  "Otro equipo",
] as const;

export const COMMON_BRANDS = [
  "Samsung",
  "Electrolux",
  "Frigilux",
  "Taurus",
  "Oster",
  "GE",
  "Mabe",
  "Haier",
  "Daewoo",
  "Whirlpool",
  "KitchenAid",
] as const;

export const DELIVERY_METHODS = {
  dropoff: {
    label: "Lo llevo al local",
    description: "Sin coste. Tráelo en nuestro horario de atención.",
  },
  pickup: {
    label: "Que lo busquen",
    description: "Servicio de recogida. Tiene un coste aparte que te confirmamos antes.",
  },
  courier: {
    label: "Lo envío por agencia",
    description: "Envíalo por la agencia de encomiendas o el mediador que prefieras.",
  },
} as const;

export type DeliveryMethod = keyof typeof DELIVERY_METHODS;
export const DELIVERY_METHOD_KEYS = Object.keys(DELIVERY_METHODS) as [DeliveryMethod, ...DeliveryMethod[]];

export const CONTACT_TOPICS = [
  "Consulta sobre una reparación",
  "Repuestos",
  "Pedido en la tienda",
  "Otro",
] as const;

/** Límites de las fotos de una solicitud. */
export const PHOTO_LIMITS = {
  maxFiles: 3,
  maxBytes: 5 * 1024 * 1024,
  mimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
};

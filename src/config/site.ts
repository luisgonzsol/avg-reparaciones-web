/**
 * Valores por defecto de los datos del negocio.
 * En la Fase 3 estos datos pasarán a la tabla `settings` (editable desde el
 * panel); este archivo seguirá siendo el respaldo si la base de datos falla.
 *
 * Convención: `null` = dato [PENDIENTE] del cliente. La interfaz lo muestra
 * con la etiqueta visible "[PENDIENTE]".
 */
import type { WeeklySchedule } from "@/lib/schedule";

export const PENDING = "[PENDIENTE]";

export const siteConfig = {
  legalName: "AVG Reparaciones C.A.",
  shortName: "AVG Reparaciones",
  rif: "J-504740098",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  timeZone: "America/Caracas",
  locale: "es-VE",

  phoneDisplay: "+58 412-7408970",
  phoneE164: "+584127408970",
  whatsappNumber: "584127408970",
  email: null as string | null, // [PENDIENTE] cuenta Gmail
  instagram: "https://www.instagram.com/avgreparaciones/",
  instagramHandle: "@avgreparaciones",

  address: {
    street: "Av. Este 12",
    between: "entre El Hoyo y", // + segunda calle [PENDIENTE]
    secondStreet: null as string | null,
    city: "Caracas",
    postalCode: "1012",
    region: "Distrito Capital",
    country: "Venezuela",
    countryCode: "VE",
  },
  /** Coordenadas del local [PENDIENTE]: necesarias para JSON-LD. */
  geo: null as { lat: number; lng: number } | null,
  /** Consulta para el mapa embebido mientras no haya coordenadas exactas. */
  mapQuery: "AVG Reparaciones, Av. Este 12, Caracas",

  /** Horario en hora de Caracas. Días: 0 = domingo … 6 = sábado. */
  schedule: {
    0: null,
    1: { open: "08:00", close: "17:00" },
    2: { open: "08:00", close: "17:00" },
    3: { open: "08:00", close: "17:00" },
    4: { open: "08:00", close: "17:00" },
    5: { open: "08:00", close: "17:00" },
    6: { open: "08:00", close: "14:00" },
  } satisfies WeeklySchedule,

  /** Duración de la garantía de reparaciones [PENDIENTE]. */
  warrantyDuration: null as string | null,
  /** Costes orientativos [PENDIENTE]. */
  pickupCostNote: null as string | null,
  returnShippingCostNote: null as string | null,
  /** Horas hasta que caduca un pedido sin pagar. */
  orderExpirationHours: 48,
  /** Métodos de pago aceptados [PENDIENTE de confirmar la lista completa]. */
  paymentMethods: ["Pago Móvil"] as string[],

  /** Mostrar la sección de testimonios (solo cuando haya reseñas reales). */
  showTestimonials: false,
} as const;

export type SiteConfig = typeof siteConfig;

export function fullAddress(cfg: SiteConfig = siteConfig): string {
  const a = cfg.address;
  const between = `${a.between} ${a.secondStreet ?? PENDING}`;
  return `${a.street}, ${between}, ${a.city} ${a.postalCode}, ${a.region}, ${a.country}`;
}

export const navLinks = [
  { href: "/servicios", label: "Servicios" },
  { href: "/tienda", label: "Tienda" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
] as const;

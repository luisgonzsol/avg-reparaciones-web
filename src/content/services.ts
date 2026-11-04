/**
 * Líneas de negocio. Contenido gestionado en código (no hace falta panel).
 * Las páginas de detalle (/servicios/[slug]) se construyen en la Fase 2.
 */
export type ServiceIcon = "home" | "coil" | "industrial" | "parts";

export type Service = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  icon: ServiceIcon;
  examples: string[];
  cta: { label: string; href: string };
};

export const services: Service[] = [
  {
    slug: "reparacion-electrodomesticos",
    title: "Reparación de electrodomésticos del hogar",
    shortTitle: "Electrodomésticos del hogar",
    summary:
      "Reparamos los equipos que usas cada día, de cualquier marca. Te decimos con claridad qué tiene y cuánto cuesta antes de repararlo.",
    icon: "home",
    examples: [
      "Lavadoras",
      "Microondas",
      "Licuadoras",
      "Ventiladores",
      "Ollas de presión",
      "Batidoras",
      "Cafeteras",
    ],
    cta: { label: "Solicitar reparación", href: "/solicitar-reparacion" },
  },
  {
    slug: "embobinado-de-motores",
    title: "Embobinado de motores e inducidos",
    shortTitle: "Embobinado de motores",
    summary:
      "Rebobinamos motores eléctricos e inducidos con alambre 100 % de cobre, para que tu equipo vuelva a trabajar con toda su fuerza.",
    icon: "coil",
    examples: [
      "Motores eléctricos",
      "Inducidos",
      "Motores de lavadora Whirlpool",
      "Ventiladores industriales",
    ],
    cta: { label: "Solicitar reparación", href: "/solicitar-reparacion" },
  },
  {
    slug: "equipos-industriales",
    title: "Servicio técnico de equipos industriales y comerciales",
    shortTitle: "Equipos industriales y comerciales",
    summary:
      "Atendemos los equipos de tu negocio para que no pares de trabajar: panaderías, cafeterías, charcuterías y cocinas.",
    icon: "industrial",
    examples: ["Batidoras KitchenAid", "Licuadoras industriales", "Rebanadoras", "Rayadores de queso"],
    cta: { label: "Solicitar reparación", href: "/solicitar-reparacion" },
  },
  {
    slug: "repuestos",
    title: "Tienda de repuestos para electrodomésticos",
    shortTitle: "Tienda de repuestos",
    summary:
      "Consigue la pieza que te falta: aspas, vasos y cuchillas de licuadora, capacitores, gomas de ollas, carbones, motores y alambre de cobre.",
    icon: "parts",
    examples: [
      "Aspas de ventilador",
      "Vasos y cuchillas de licuadora",
      "Capacitores",
      "Gomas de ollas de presión",
      "Carbones",
      "Motores",
      "Alambre de cobre",
    ],
    cta: { label: "Ver repuestos", href: "/tienda" },
  },
];

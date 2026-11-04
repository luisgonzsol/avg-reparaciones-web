/**
 * Líneas de negocio. Contenido gestionado en código (no hace falta panel).
 * Se usa en Inicio (tarjetas), /servicios y /servicios/[slug].
 *
 * Regla: no inventar datos del negocio (plazos, precios, certificaciones).
 * Las "señales" son orientaciones generales para que el cliente reconozca
 * la falla, no promesas.
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
  /** SEO */
  metaTitle: string;
  metaDescription: string;
  /** Detalle */
  intro: string[];
  highlights: { title: string; body: string }[];
  signsTitle: string;
  signs: string[];
  note?: string;
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
    metaTitle: "Reparación de electrodomésticos en Caracas",
    metaDescription:
      "Reparación de lavadoras, microondas, licuadoras, ventiladores, ollas de presión y más, de cualquier marca. Con garantía. Recibimos equipos de toda Venezuela.",
    intro: [
      "Cuando un electrodoméstico falla, se complica el día a día. En AVG Reparaciones llevamos más de 20 años devolviéndole la vida a los equipos de las familias de Caracas, y ahora recibimos equipos de toda Venezuela.",
      "Trabajamos con todas las marcas. Primero revisamos tu equipo en el taller, te explicamos qué tiene con palabras sencillas y te damos el precio. Solo reparamos cuando tú lo apruebas.",
    ],
    highlights: [
      {
        title: "Multimarca",
        body: "Samsung, Electrolux, Frigilux, Taurus, Oster, GE, Mabe, Haier, Daewoo, Whirlpool y más.",
      },
      {
        title: "Precio claro antes de reparar",
        body: "Sabrás qué tiene tu equipo y cuánto cuesta antes de empezar.",
      },
      { title: "Con garantía", body: "Todas nuestras reparaciones tienen garantía." },
      {
        title: "Repuestos en el mismo lugar",
        body: "Tenemos tienda de repuestos, así que muchas piezas las conseguimos al momento.",
      },
    ],
    signsTitle: "¿Cuándo conviene traerlo?",
    signs: [
      "No enciende o se apaga solo.",
      "Hace ruidos extraños o vibra más de lo normal.",
      "Huele a quemado o salta la protección eléctrica.",
      "La lavadora no centrifuga, no bota el agua o pierde agua.",
      "El microondas funciona pero no calienta.",
      "La licuadora o la batidora pierde fuerza.",
    ],
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
    metaTitle: "Embobinado de motores en Caracas · Cobre 100 %",
    metaDescription:
      "Embobinado de motores eléctricos, inducidos, motores de lavadora Whirlpool y ventiladores industriales con alambre 100 % de cobre. Taller en Caracas.",
    intro: [
      "El embobinado es una de nuestras especialidades. Cuando el bobinado de un motor se quema o se daña, lo rehacemos para que el motor vuelva a funcionar como debe.",
      "Usamos alambre 100 % de cobre. Así el motor recupera su fuerza y trabaja mejor durante más tiempo.",
    ],
    highlights: [
      { title: "Cobre 100 %", body: "Alambre de cobre puro en todos nuestros embobinados." },
      {
        title: "Motores e inducidos",
        body: "Motores eléctricos, inducidos y motores de lavadora Whirlpool.",
      },
      {
        title: "Uso doméstico e industrial",
        body: "Desde el motor de tu lavadora hasta ventiladores industriales.",
      },
      { title: "Con garantía", body: "Respondemos por nuestro trabajo." },
    ],
    signsTitle: "Señales de que el motor puede necesitar embobinado",
    signs: [
      "El motor zumba pero no gira.",
      "Se calienta demasiado en poco tiempo.",
      "Huele a quemado o el barniz del bobinado se ve oscuro.",
      "Pierde fuerza o gira más lento de lo normal.",
      "Salta la protección eléctrica al encenderlo.",
    ],
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
    metaTitle: "Servicio técnico de licuadoras industriales y equipos comerciales",
    metaDescription:
      "Servicio técnico de batidoras KitchenAid, licuadoras industriales, rebanadoras y rayadores de queso para negocios. Taller en Caracas, equipos de toda Venezuela.",
    intro: [
      "Sabemos que en un negocio cada día con un equipo parado cuesta dinero. Por eso atendemos los equipos de panaderías, cafeterías, charcuterías, restaurantes y cocinas.",
      "Revisamos tu equipo en el taller, te decimos qué tiene y cuánto cuesta, y lo reparamos con garantía.",
    ],
    highlights: [
      { title: "Batidoras KitchenAid", body: "Servicio técnico para batidoras de pedestal." },
      { title: "Licuadoras industriales", body: "Motores, acoples, vasos y cuchillas." },
      { title: "Rebanadoras y rayadores", body: "Equipos de charcutería y cocina." },
      { title: "Con garantía", body: "Todas nuestras reparaciones tienen garantía." },
    ],
    signsTitle: "Fallas frecuentes",
    signs: [
      "El equipo no arranca o se detiene con carga.",
      "Ruidos metálicos o vibraciones fuertes.",
      "Pierde velocidad o fuerza.",
      "El motor se recalienta.",
      "Piezas desgastadas: acoples, cuchillas, correas.",
    ],
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
    metaTitle: "Repuestos de electrodomésticos en Venezuela",
    metaDescription:
      "Aspas de ventilador, vasos y cuchillas de licuadora Oster, capacitores, gomas de ollas de presión, carbones, motores y alambre de cobre. Envíos a toda Venezuela.",
    intro: [
      "En nuestra tienda encuentras los repuestos más buscados para electrodomésticos del hogar. Puedes comprarlos en el local o pedirlos por la web y te los enviamos a toda Venezuela.",
      "¿No sabes cuál es la pieza que necesitas? Escríbenos por WhatsApp con una foto y te ayudamos a encontrarla.",
    ],
    highlights: [
      { title: "Repuestos para tu licuadora", body: "Vasos, cuchillas y acoples, por ejemplo para Oster." },
      { title: "Ventiladores", body: "Aspas, capacitores y motores." },
      { title: "Ollas de presión", body: "Gomas y otras piezas." },
      { title: "Embobinado", body: "Carbones, motores y alambre de cobre." },
    ],
    signsTitle: "Antes de comprar",
    signs: [
      "Revisa la marca y el modelo de tu equipo (suelen estar en una etiqueta debajo o detrás).",
      "Si puedes, mide la pieza o tómale una foto.",
      "¿Tienes dudas? Escríbenos por WhatsApp antes de comprar.",
    ],
    note: "Las piezas eléctricas vendidas sueltas (capacitores, motores, carbones, etc.) no tienen garantía, porque su funcionamiento depende de cómo se instalen. Si quieres garantía, te la instalamos como parte de una reparación.",
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

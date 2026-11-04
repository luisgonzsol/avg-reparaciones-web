/**
 * Textos de la página de Inicio, centralizados para editarlos fácilmente.
 */
export const hero = {
  eyebrow: "Taller y tienda en Caracas · Envíos a toda Venezuela",
  title: "Reparamos tus electrodomésticos con garantía.",
  subtitle:
    "Más de 20 años cuidando lo que usas cada día. Trato honesto, precios claros y repuestos para que tus equipos vuelvan a funcionar.",
  primaryCta: { label: "Solicitar reparación", href: "/solicitar-reparacion" },
  secondaryCta: { label: "Comprar repuestos", href: "/tienda" },
};

export const trustItems = [
  { icon: "years", label: "Más de 20 años" },
  { icon: "brands", label: "Multimarca" },
  { icon: "shield", label: "Reparaciones con garantía" },
  { icon: "truck", label: "Envíos a toda Venezuela" },
  { icon: "currency", label: "Precios en USD y Bs" },
] as const;

export const howItWorks = {
  title: "Así de fácil funciona",
  subtitle: "Sin complicaciones. Te acompañamos en cada paso y te avisamos por WhatsApp.",
  steps: [
    {
      title: "Haznos llegar tu equipo",
      body: "Elige lo que te quede más cómodo:",
      options: [
        "Tráelo al local (sin coste).",
        "Lo buscamos por ti (la recogida tiene un coste aparte).",
        "Envíalo por una agencia de encomiendas o un mediador.",
      ],
    },
    {
      title: "Lo revisamos en el taller",
      body: "Hacemos el diagnóstico y te explicamos, con palabras sencillas, qué tiene y cuánto cuesta repararlo.",
    },
    {
      title: "Lo reparamos con garantía",
      body: "Solo reparamos cuando tú lo apruebas. Todas nuestras reparaciones tienen garantía.",
    },
    {
      title: "Recógelo o te lo enviamos",
      body: "Puedes retirarlo en el local o te lo enviamos a tu ciudad (el envío tiene un coste extra).",
    },
  ],
};

export const brandsSection = {
  title: "Trabajamos con las marcas que tienes en casa",
  brands: [
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
  ],
  disclaimer: "Marcas mencionadas a título informativo; propiedad de sus respectivos titulares.",
};

export const aboutSummary = {
  eyebrow: "Nosotros",
  title: "Un taller de barrio con más de 20 años de confianza",
  paragraphs: [
    "AVG Reparaciones nació en Caracas ayudando a los vecinos a recuperar sus equipos. Durante más de 20 años hemos reparado lavadoras, licuadoras, ventiladores y motores con el mismo compromiso: hacer bien el trabajo y decir siempre la verdad.",
    "Hoy queremos llegar a toda Venezuela, pero sin perder lo que nos define: la cercanía, la transparencia y la garantía en cada reparación.",
  ],
  values: [
    { title: "Honestidad", body: "Te decimos qué tiene tu equipo y si vale la pena repararlo." },
    { title: "Transparencia", body: "Precios claros antes de empezar. Sin sorpresas." },
    { title: "Garantía", body: "Respondemos por nuestras reparaciones." },
    { title: "Cercanía", body: "Te atendemos como a un vecino, porque lo eres." },
  ],
  cta: { label: "Conoce nuestra historia", href: "/nosotros" },
};

export const coverage = {
  title: "Atendemos en Caracas y recibimos equipos de toda Venezuela",
  body: "Si estás fuera de Caracas, envíanos tu equipo por la agencia de encomiendas que prefieras. Lo reparamos en el taller y te lo devolvemos a tu ciudad.",
  cta: {
    label: "Escríbenos por WhatsApp",
    message: "¡Hola! Estoy fuera de Caracas y quisiera enviarles un equipo para reparar.",
  },
};

/** Testimonios de EJEMPLO. Ocultos (siteConfig.showTestimonials = false). */
export const testimonials = [
  {
    name: "[PLACEHOLDER] Nombre del cliente",
    location: "Caracas",
    text: "[PLACEHOLDER] Aquí irá una reseña real de un cliente.",
  },
  {
    name: "[PLACEHOLDER] Nombre del cliente",
    location: "Valencia",
    text: "[PLACEHOLDER] Aquí irá una reseña real de un cliente.",
  },
  {
    name: "[PLACEHOLDER] Nombre del cliente",
    location: "Maracay",
    text: "[PLACEHOLDER] Aquí irá una reseña real de un cliente.",
  },
];

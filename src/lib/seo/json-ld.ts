import type { SiteConfig } from "@/config/site";
import type { FaqItem } from "@/content/faq";
import type { ProductDetail } from "@/lib/catalog";
import { availabilityOf } from "@/lib/catalog";

/* Datos estructurados (schema.org) para Google. Funciones puras: se prueban
   en tests/unit/json-ld.test.ts. Nunca se incluyen datos [PENDIENTE]. */

const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const isPending = (s: string | null | undefined) => !s || s.includes("[PENDIENTE");

export function absoluteUrl(cfg: SiteConfig, path = "/"): string {
  return new URL(path, cfg.url.endsWith("/") ? cfg.url : `${cfg.url}/`).toString();
}

export function localBusinessJsonLd(cfg: SiteConfig) {
  const a = cfg.address;
  // Agrupa los días con el mismo horario (lunes-viernes 8-17, sábado 8-14…).
  const groups = new Map<string, string[]>();
  for (let d = 0; d < 7; d++) {
    const h = cfg.schedule[d as keyof typeof cfg.schedule];
    if (!h) continue;
    const key = `${h.open}-${h.close}`;
    groups.set(key, [...(groups.get(key) ?? []), DAY[d]!]);
  }
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "ElectronicsStore"],
    "@id": absoluteUrl(cfg, "/#negocio"),
    name: cfg.legalName,
    alternateName: cfg.shortName,
    description:
      "Reparación de electrodomésticos, embobinado de motores y venta de repuestos en Caracas. Envíos a toda Venezuela.",
    url: absoluteUrl(cfg),
    logo: absoluteUrl(cfg, "/icon.svg"),
    image: absoluteUrl(cfg, "/opengraph-image"),
    telephone: cfg.phoneE164,
    ...(cfg.email ? { email: cfg.email } : {}),
    taxID: cfg.rif,
    priceRange: "$",
    currenciesAccepted: "USD, VES",
    address: {
      "@type": "PostalAddress",
      streetAddress: a.secondStreet ? `${a.street}, ${a.between} ${a.secondStreet}` : a.street,
      addressLocality: a.city,
      addressRegion: a.region,
      postalCode: a.postalCode,
      addressCountry: a.countryCode,
    },
    ...(cfg.geo ? { geo: { "@type": "GeoCoordinates", latitude: cfg.geo.lat, longitude: cfg.geo.lng } } : {}),
    openingHoursSpecification: [...groups].map(([key, days]) => {
      const [opens, closes] = key.split("-");
      return { "@type": "OpeningHoursSpecification", dayOfWeek: days, opens, closes };
    }),
    areaServed: { "@type": "Country", name: "Venezuela" },
    sameAs: [cfg.instagram],
  };
}

export function productJsonLd(cfg: SiteConfig, p: ProductDetail) {
  const availability = availabilityOf(p);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    url: absoluteUrl(cfg, `/tienda/${p.slug}`),
    ...(p.description ? { description: p.description } : {}),
    ...(p.images.length ? { image: p.images.map((i) => i.url) } : {}),
    ...(p.brandNames.length ? { brand: { "@type": "Brand", name: p.brandNames[0] } } : {}),
    category: p.categoryName,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(cfg, `/tienda/${p.slug}`),
      priceCurrency: "USD",
      price: p.priceUsd.toFixed(2),
      itemCondition: "https://schema.org/NewCondition",
      availability:
        availability === "out"
          ? "https://schema.org/OutOfStock"
          : availability === "low"
            ? "https://schema.org/LimitedAvailability"
            : "https://schema.org/InStock",
      seller: { "@id": absoluteUrl(cfg, "/#negocio") },
    },
  };
}

export function faqJsonLd(items: FaqItem[]) {
  const valid = items.filter((i) => !isPending(i.question) && !isPending(i.answer));
  if (!valid.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: valid.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

/** JSON seguro para incrustar en <script>: escapa < > & y separadores de línea. */
export function serializeJsonLd(data: unknown): string {
  const LS = String.fromCharCode(0x2028);
  const PS = String.fromCharCode(0x2029);
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replaceAll(LS, "\\u2028")
    .replaceAll(PS, "\\u2029");
}

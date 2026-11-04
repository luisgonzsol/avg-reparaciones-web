/**
 * DATOS DE EJEMPLO — solo para la Fase 1/2 (sin base de datos).
 * Nombres, precios y stock son ficticios y se marcan como [EJEMPLO].
 * En la Fase 3 se reemplazan por los productos de Supabase.
 */
export type SampleProduct = {
  slug: string;
  sku: string;
  name: string;
  category: string;
  compatibleBrands: string[];
  priceUsd: number;
  available: number;
  lowStockThreshold: number;
  hasWarranty: boolean;
  featured: boolean;
};

export const SAMPLE_EXCHANGE_RATE = {
  rate: 236.45, // [EJEMPLO] tasa ficticia
  effectiveDate: "2026-11-04",
  isSample: true,
};

export const sampleProducts: SampleProduct[] = [
  {
    slug: "vaso-licuadora-oster-ejemplo",
    sku: "EJ-0001",
    name: "Vaso de vidrio para licuadora Oster",
    category: "Licuadoras",
    compatibleBrands: ["Oster"],
    priceUsd: 14.5,
    available: 8,
    lowStockThreshold: 3,
    hasWarranty: false,
    featured: true,
  },
  {
    slug: "cuchilla-licuadora-oster-ejemplo",
    sku: "EJ-0002",
    name: "Cuchilla para licuadora Oster",
    category: "Licuadoras",
    compatibleBrands: ["Oster"],
    priceUsd: 6,
    available: 2,
    lowStockThreshold: 3,
    hasWarranty: false,
    featured: true,
  },
  {
    slug: "aspa-ventilador-18-ejemplo",
    sku: "EJ-0003",
    name: "Aspa para ventilador de 18 pulgadas",
    category: "Ventiladores",
    compatibleBrands: ["Taurus", "Frigilux"],
    priceUsd: 5.25,
    available: 15,
    lowStockThreshold: 4,
    hasWarranty: false,
    featured: true,
  },
  {
    slug: "goma-olla-presion-ejemplo",
    sku: "EJ-0004",
    name: "Goma para olla de presión",
    category: "Ollas de presión",
    compatibleBrands: ["Oster", "Taurus"],
    priceUsd: 3.5,
    available: 0,
    lowStockThreshold: 5,
    hasWarranty: false,
    featured: true,
  },
];

export type Availability = "available" | "low" | "out";

export function availabilityOf(p: Pick<SampleProduct, "available" | "lowStockThreshold">): Availability {
  if (p.available <= 0) return "out";
  if (p.available <= p.lowStockThreshold) return "low";
  return "available";
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  available: "Disponible",
  low: "Últimas unidades",
  out: "Agotado",
};

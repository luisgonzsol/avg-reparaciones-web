/**
 * Tipos y reglas del catálogo (puros, sin acceso a datos: testeables).
 */

export type ProductImage = { url: string; alt: string };

export type CatalogProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  priceUsd: number;
  available: number;
  lowStockThreshold: number;
  hasWarranty: boolean;
  featured: boolean;
  isSample: boolean;
  categoryName: string;
  categorySlug: string;
  brandNames: string[];
  image: ProductImage | null;
};

export type ProductDetail = CatalogProduct & {
  description: string;
  compatibility: string;
  images: ProductImage[];
  active: boolean;
};

export type Category = { id: number; name: string; slug: string };
export type Brand = { id: number; name: string; slug: string };

export type ExchangeRate = { rate: number; effectiveDate: string; isSample: boolean };

export type Availability = "available" | "low" | "out";

export function availabilityOf(p: { available: number; lowStockThreshold: number }): Availability {
  if (p.available <= 0) return "out";
  if (p.available <= p.lowStockThreshold) return "low";
  return "available";
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  available: "Disponible",
  low: "Últimas unidades",
  out: "Agotado",
};

export const SORT_OPTIONS = [
  { value: "newest", label: "Más recientes" },
  { value: "price_asc", label: "Precio: de menor a mayor" },
  { value: "price_desc", label: "Precio: de mayor a menor" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const PAGE_SIZE = 12;

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Lee y sanea los parámetros de búsqueda de /tienda. */
export function parseCatalogParams(sp: Record<string, string | string[] | undefined>) {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = one(sp.q).trim().slice(0, 80);
  const category = one(sp.categoria);
  const brand = one(sp.marca);
  const sortRaw = one(sp.orden);
  const pageRaw = Number.parseInt(one(sp.pagina), 10);
  return {
    q,
    category: SLUG_RE.test(category) ? category : "",
    brand: SLUG_RE.test(brand) ? brand : "",
    sort: (SORT_OPTIONS.some((o) => o.value === sortRaw) ? sortRaw : "newest") as SortOption,
    page: Number.isFinite(pageRaw) && pageRaw > 0 && pageRaw <= 1000 ? pageRaw : 1,
  };
}

export type CatalogParams = ReturnType<typeof parseCatalogParams>;

/** Construye la URL de /tienda conservando los filtros. */
export function catalogHref(params: Partial<CatalogParams>): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.category) sp.set("categoria", params.category);
  if (params.brand) sp.set("marca", params.brand);
  if (params.sort && params.sort !== "newest") sp.set("orden", params.sort);
  if (params.page && params.page > 1) sp.set("pagina", String(params.page));
  const s = sp.toString();
  return s ? `/tienda?${s}` : "/tienda";
}

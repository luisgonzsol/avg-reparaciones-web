import "server-only";
import { cache } from "react";
import { getPublicClient } from "@/lib/supabase/server";
import { productImageUrl } from "@/lib/supabase/config";
import {
  PAGE_SIZE,
  type Brand,
  type CatalogParams,
  type CatalogProduct,
  type Category,
  type ExchangeRate,
  type ProductDetail,
} from "@/lib/catalog";

/* Todas las lecturas usan la clave publicable: RLS garantiza que solo se
   vea el catálogo activo y la tasa vigente. */

type SearchRow = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  price_usd: number | string;
  available: number;
  low_stock_threshold: number;
  has_warranty: boolean;
  featured: boolean;
  is_sample: boolean;
  category_name: string;
  category_slug: string;
  brand_names: string[] | null;
  image_path: string | null;
  image_alt: string | null;
  total_count: number | string;
};

function fromSearchRow(r: SearchRow): CatalogProduct {
  return {
    id: r.id,
    slug: r.slug,
    sku: r.sku,
    name: r.name,
    priceUsd: Number(r.price_usd),
    available: r.available,
    lowStockThreshold: r.low_stock_threshold,
    hasWarranty: r.has_warranty,
    featured: r.featured,
    isSample: r.is_sample,
    categoryName: r.category_name,
    categorySlug: r.category_slug,
    brandNames: r.brand_names ?? [],
    image: r.image_path ? { url: productImageUrl(r.image_path), alt: r.image_alt || r.name } : null,
  };
}

export async function searchProducts(
  params: CatalogParams,
): Promise<{ products: CatalogProduct[]; total: number; pages: number }> {
  const { data, error } = await getPublicClient().rpc("search_products", {
    p_query: params.q || null,
    p_category: params.category || null,
    p_brand: params.brand || null,
    p_sort: params.sort,
    p_limit: PAGE_SIZE,
    p_offset: (params.page - 1) * PAGE_SIZE,
  });
  if (error) throw new Error(`search_products: ${error.message}`);
  const rows = (data ?? []) as SearchRow[];
  const total = rows.length ? Number(rows[0]!.total_count) : 0;
  return { products: rows.map(fromSearchRow), total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getFeaturedProducts(limit = 4): Promise<CatalogProduct[]> {
  const { data, error } = await getPublicClient().rpc("search_products", { p_limit: 48 });
  if (error) throw new Error(`featured: ${error.message}`);
  return ((data ?? []) as SearchRow[])
    .map(fromSearchRow)
    .filter((p) => p.featured)
    .slice(0, limit);
}

export const getCategories = cache(async (): Promise<Category[]> => {
  const { data, error } = await getPublicClient()
    .from("categories")
    .select("id, name, slug")
    .order("sort_order")
    .order("name");
  if (error) throw new Error(`categories: ${error.message}`);
  return data ?? [];
});

export const getBrands = cache(async (): Promise<Brand[]> => {
  const { data, error } = await getPublicClient().from("brands").select("id, name, slug").order("name");
  if (error) throw new Error(`brands: ${error.message}`);
  return data ?? [];
});

/** Tasa vigente (la más reciente). */
export const getCurrentRate = cache(async (): Promise<ExchangeRate | null> => {
  const { data, error } = await getPublicClient()
    .from("exchange_rates")
    .select("rate, effective_date, note")
    .order("effective_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`exchange_rates: ${error.message}`);
  if (!data) return null;
  return {
    rate: Number(data.rate),
    effectiveDate: data.effective_date as string,
    isSample: typeof data.note === "string" && data.note.toUpperCase().includes("EJEMPLO"),
  };
});

type DetailRow = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  description: string;
  compatibility: string;
  price_usd: number | string;
  stock: number;
  reserved: number;
  low_stock_threshold: number;
  has_warranty: boolean;
  featured: boolean;
  active: boolean;
  is_sample: boolean;
  categories: { name: string; slug: string } | null;
  product_images: { path: string; alt: string; sort_order: number }[];
  product_brands: { brands: { name: string } | null }[];
};

export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const { data, error } = await getPublicClient()
    .from("products")
    .select(
      "id, slug, sku, name, description, compatibility, price_usd, stock, reserved, low_stock_threshold, has_warranty, featured, active, is_sample, categories(name, slug), product_images(path, alt, sort_order), product_brands(brands(name))",
    )
    .eq("slug", slug)
    .maybeSingle<DetailRow>();
  if (error) throw new Error(`product: ${error.message}`);
  if (!data) return null;

  const images = [...data.product_images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => ({ url: productImageUrl(i.path), alt: i.alt || data.name }));

  return {
    id: data.id,
    slug: data.slug,
    sku: data.sku,
    name: data.name,
    description: data.description,
    compatibility: data.compatibility,
    priceUsd: Number(data.price_usd),
    available: Math.max(0, data.stock - data.reserved),
    lowStockThreshold: data.low_stock_threshold,
    hasWarranty: data.has_warranty,
    featured: data.featured,
    active: data.active,
    isSample: data.is_sample,
    categoryName: data.categories?.name ?? "",
    categorySlug: data.categories?.slug ?? "",
    brandNames: data.product_brands.map((b) => b.brands?.name).filter((n): n is string => Boolean(n)),
    image: images[0] ?? null,
    images,
  };
});

/** Datos frescos de varios productos (para refrescar el carrito). */
export async function getProductsBySlugs(slugs: string[]): Promise<CatalogProduct[]> {
  const clean = [...new Set(slugs)].filter((s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)).slice(0, 30);
  if (!clean.length) return [];
  const { data, error } = await getPublicClient()
    .from("products")
    .select(
      "id, slug, sku, name, price_usd, stock, reserved, low_stock_threshold, has_warranty, featured, is_sample, categories(name, slug), product_images(path, alt, sort_order), product_brands(brands(name))",
    )
    .in("slug", clean)
    .returns<Omit<DetailRow, "description" | "compatibility" | "active">[]>();
  if (error) throw new Error(`products by slug: ${error.message}`);
  return (data ?? []).map((d) => {
    const img = [...d.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];
    return {
      id: d.id,
      slug: d.slug,
      sku: d.sku,
      name: d.name,
      priceUsd: Number(d.price_usd),
      available: Math.max(0, d.stock - d.reserved),
      lowStockThreshold: d.low_stock_threshold,
      hasWarranty: d.has_warranty,
      featured: d.featured,
      isSample: d.is_sample,
      categoryName: d.categories?.name ?? "",
      categorySlug: d.categories?.slug ?? "",
      brandNames: d.product_brands.map((b) => b.brands?.name).filter((n): n is string => Boolean(n)),
      image: img ? { url: productImageUrl(img.path), alt: img.alt || d.name } : null,
    };
  });
}

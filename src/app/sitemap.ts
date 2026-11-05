import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { services } from "@/content/services";
import { absoluteUrl } from "@/lib/seo/json-ld";
import { getPublicClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Se regenera como mucho cada hora (los productos cambian desde el panel).
export const revalidate = 3600;

const STATIC_PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/servicios", priority: 0.9 },
  { path: "/tienda", priority: 0.9 },
  { path: "/solicitar-reparacion", priority: 0.8 },
  { path: "/contacto", priority: 0.7 },
  { path: "/nosotros", priority: 0.6 },
  { path: "/preguntas-frecuentes", priority: 0.6 },
  { path: "/privacidad", priority: 0.2 },
  { path: "/terminos", priority: 0.2 },
];

async function productEntries(): Promise<MetadataRoute.Sitemap> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await getPublicClient()
      .from("products")
      .select("slug, updated_at")
      .eq("is_sample", false)
      .order("updated_at", { ascending: false })
      .limit(5000);
    if (error) throw error;
    return (data ?? []).map((p) => ({
      url: absoluteUrl(siteConfig, `/tienda/${p.slug}`),
      lastModified: new Date(p.updated_at),
      priority: 0.7,
    }));
  } catch (e) {
    console.error("[sitemap]", e instanceof Error ? e.message : e);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    ...STATIC_PAGES.map((p) => ({ url: absoluteUrl(siteConfig, p.path), priority: p.priority })),
    ...services.map((s) => ({ url: absoluteUrl(siteConfig, `/servicios/${s.slug}`), priority: 0.8 })),
    ...(await productEntries()),
  ];
}

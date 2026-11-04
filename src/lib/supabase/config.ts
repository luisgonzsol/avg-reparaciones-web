/**
 * Configuración pública de Supabase (se puede usar en cliente y servidor).
 * La clave publicable solo permite lo que autorizan las políticas RLS.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

/** URL pública de una imagen del bucket "products" (Storage, Fase 4). */
export function productImageUrl(path: string): string {
  const clean = path.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl}/storage/v1/object/public/products/${clean}`;
}

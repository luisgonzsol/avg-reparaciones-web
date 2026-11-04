import { getAdminSession } from "@/lib/admin/session";
import { writeProductsCsv, type ProductExportRow } from "@/lib/admin/csv";

/** Descarga del inventario completo en CSV (solo administradores). */
export async function GET() {
  const session = await getAdminSession();
  if (session.status !== "ok") return new Response("No autorizado", { status: 401 });

  const { data, error } = await session.supabase
    .from("products")
    .select(
      "sku, name, slug, price_usd, stock, low_stock_threshold, has_warranty, featured, active, description, compatibility, categories(slug), product_brands(brands(slug))",
    )
    .order("sku");
  if (error) {
    console.error("[admin] exportar", error.code, error.message);
    return new Response("Error al exportar", { status: 500 });
  }

  type Row = Omit<ProductExportRow, "category" | "brands"> & {
    categories: { slug: string } | null;
    product_brands: { brands: { slug: string } | null }[];
  };
  const rows: ProductExportRow[] = (data as unknown as Row[]).map(({ categories, product_brands, ...p }) => ({
    ...p,
    category: categories?.slug ?? "",
    brands: product_brands.map((b) => b.brands?.slug).filter((s): s is string => Boolean(s)),
  }));

  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(new Date());
  return new Response(writeProductsCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="productos-avg-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { AdminHeader, Card } from "@/components/admin/ui";
import { EMPTY_PRODUCT, ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const [categories, brands] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order").order("name"),
    supabase.from("brands").select("id, name").order("name"),
  ]);

  return (
    <>
      <AdminHeader
        back={{ href: "/admin/productos", label: "Productos" }}
        title="Nuevo producto"
        description="Después de crearlo podrás subir sus imágenes."
      />
      <Card className="max-w-4xl">
        <ProductForm product={EMPTY_PRODUCT} categories={categories.data ?? []} brands={brands.data ?? []} />
      </Card>
    </>
  );
}

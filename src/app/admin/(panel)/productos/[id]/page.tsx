import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/session";
import { deleteProduct, deleteProductImage, makeImageCover } from "@/lib/actions/admin";
import { productImageUrl } from "@/lib/supabase/config";
import { AdminHeader, Badge, Card, EmptyState } from "@/components/admin/ui";
import { ConfirmButton, SubmitButton } from "@/components/admin/form";
import { ProductForm } from "@/components/admin/product-form";
import { ImageUploader } from "@/components/admin/image-uploader";

export const metadata: Metadata = { title: "Editar producto" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/productos/[id]">) {
  const { supabase } = await requireAdmin();
  const id = z
    .string()
    .uuid()
    .safeParse((await params).id);
  if (!id.success) notFound();
  const sp = await searchParams;

  const [product, categories, brands, images, orders] = await Promise.all([
    supabase.from("products").select("*, product_brands(brand_id)").eq("id", id.data).maybeSingle(),
    supabase.from("categories").select("id, name").order("sort_order").order("name"),
    supabase.from("brands").select("id, name").order("name"),
    supabase
      .from("product_images")
      .select("id, path, alt, sort_order")
      .eq("product_id", id.data)
      .order("sort_order")
      .order("id"),
    supabase.from("order_items").select("id", { count: "exact", head: true }).eq("product_id", id.data),
  ]);
  const p = product.data;
  if (!p) notFound();
  const hasOrders = (orders.count ?? 0) > 0;

  return (
    <>
      <AdminHeader
        back={{ href: "/admin/productos", label: "Productos" }}
        title={p.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            SKU {p.sku}
            {p.active ? <Badge tone="success">Visible</Badge> : <Badge tone="muted">Desactivado</Badge>}
            {p.is_sample && <Badge tone="warning">Ejemplo</Badge>}
          </span>
        }
        actions={
          p.active ? (
            <Link
              href={`/tienda/${p.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center font-semibold underline underline-offset-4"
            >
              Ver en la tienda <span className="sr-only">(se abre en una pestaña nueva)</span>
            </Link>
          ) : undefined
        }
      />

      {sp.creado && (
        <p role="status" className="mb-4 rounded-xl bg-success-soft px-4 py-3 font-medium text-success">
          Producto creado. Ahora puedes subir sus imágenes.
        </p>
      )}
      {sp.desactivado && (
        <p role="status" className="mb-4 rounded-xl bg-warning-soft px-4 py-3 font-medium text-warning">
          Este producto tiene pedidos, así que no se puede borrar: lo hemos desactivado (ya no aparece en la
          tienda).
        </p>
      )}
      {sp.error && (
        <p role="alert" className="mb-4 rounded-xl bg-brand/8 px-4 py-3 font-medium text-brand-ink">
          No se pudo completar la acción. Inténtalo de nuevo.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card title="Datos">
          <ProductForm
            categories={categories.data ?? []}
            brands={brands.data ?? []}
            product={{
              id: p.id,
              sku: p.sku,
              name: p.name,
              slug: p.slug,
              description: p.description,
              compatibility: p.compatibility,
              category_id: p.category_id,
              price_usd: Number(p.price_usd).toFixed(2),
              stock: p.stock,
              reserved: p.reserved,
              low_stock_threshold: p.low_stock_threshold,
              has_warranty: p.has_warranty,
              featured: p.featured,
              active: p.active,
              brandIds: ((p.product_brands ?? []) as { brand_id: number }[]).map((b) => b.brand_id),
            }}
          />
        </Card>

        <div className="flex flex-col gap-6">
          <Card title="Imágenes">
            {images.data?.length ? (
              <ul className="mb-6 grid grid-cols-2 gap-3">
                {images.data.map((img, i) => (
                  <li key={img.id} className="flex flex-col gap-2">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-sand ring-1 ring-line">
                      <Image
                        src={productImageUrl(img.path)}
                        alt={img.alt}
                        fill
                        sizes="12rem"
                        className="object-contain"
                      />
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5">
                          <Badge tone="info">Principal</Badge>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {i > 0 && (
                        <form action={makeImageCover}>
                          <input type="hidden" name="imageId" value={img.id} />
                          <input type="hidden" name="productId" value={p.id} />
                          <SubmitButton
                            label="Principal"
                            pendingLabel="…"
                            variant="ghost"
                            className="min-h-11 px-3 text-sm"
                          />
                        </form>
                      )}
                      <form action={deleteProductImage}>
                        <input type="hidden" name="imageId" value={img.id} />
                        <input type="hidden" name="productId" value={p.id} />
                        <ConfirmButton
                          label="Borrar"
                          confirm="¿Borrar esta imagen?"
                          className="min-h-11 px-3 text-sm"
                        />
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mb-6">
                <EmptyState>Sin imágenes: la tienda muestra «Foto pendiente».</EmptyState>
              </div>
            )}
            <ImageUploader productId={p.id} productName={p.name} />
          </Card>

          <Card title={hasOrders ? "Desactivar" : "Borrar producto"}>
            <p className="mb-4 text-[0.95rem] text-ink-soft">
              {hasOrders
                ? "Este producto aparece en pedidos, así que no se puede borrar. Desmarca «Visible en la tienda» para ocultarlo."
                : "Se borrará el producto y sus imágenes. Si solo quieres ocultarlo, desmarca «Visible en la tienda»."}
            </p>
            {!hasOrders && (
              <form action={deleteProduct}>
                <input type="hidden" name="id" value={p.id} />
                <ConfirmButton
                  label="Borrar producto"
                  confirm={`¿Borrar «${p.name}» definitivamente? No se puede deshacer.`}
                  variant="secondary"
                />
              </form>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

import { saveProduct } from "@/lib/actions/admin";
import { ActionForm, Checkbox, Input, Select, Textarea } from "./form";

export type ProductFormValues = {
  id?: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  compatibility: string;
  category_id: number | null;
  price_usd: string;
  stock: number;
  reserved?: number;
  low_stock_threshold: number;
  has_warranty: boolean;
  featured: boolean;
  active: boolean;
  brandIds: number[];
};

export const EMPTY_PRODUCT: ProductFormValues = {
  sku: "",
  name: "",
  slug: "",
  description: "",
  compatibility: "",
  category_id: null,
  price_usd: "",
  stock: 0,
  low_stock_threshold: 3,
  has_warranty: false,
  featured: false,
  active: true,
  brandIds: [],
};

export function ProductForm({
  product,
  categories,
  brands,
}: {
  product: ProductFormValues;
  categories: { id: number; name: string }[];
  brands: { id: number; name: string }[];
}) {
  return (
    <ActionForm action={saveProduct} submitLabel={product.id ? "Guardar cambios" : "Crear producto"}>
      {product.id && <input type="hidden" name="id" value={product.id} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          name="name"
          label="Nombre"
          defaultValue={product.name}
          maxLength={140}
          required
          className="sm:col-span-2"
        />
        <Input name="sku" label="SKU (código interno)" defaultValue={product.sku} maxLength={40} required />
        <Input
          name="slug"
          label="URL"
          defaultValue={product.slug}
          maxLength={120}
          hint="Se genera sola a partir del nombre si la dejas vacía."
        />
        <Select
          name="categoryId"
          label="Categoría"
          placeholder="Elige una categoría"
          defaultValue={product.category_id ? String(product.category_id) : ""}
          options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
        />
        <Input
          name="priceUsd"
          label="Precio en USD"
          inputMode="decimal"
          defaultValue={product.price_usd}
          placeholder="12.50"
          required
        />
        <Input
          name="stock"
          label="Stock (unidades en la tienda)"
          type="number"
          min={0}
          step={1}
          defaultValue={product.stock}
          hint={
            product.reserved
              ? `${product.reserved} apartadas en pedidos sin pagar: el stock no puede ser menor.`
              : "Las unidades apartadas por pedidos se descuentan solas."
          }
        />
        <Input
          name="lowStockThreshold"
          label="Avisar de stock bajo con"
          type="number"
          min={0}
          step={1}
          defaultValue={product.low_stock_threshold}
          hint="Con estas unidades o menos se muestra «Últimas unidades»."
        />
      </div>

      <Textarea
        name="description"
        label="Descripción"
        defaultValue={product.description}
        maxLength={4000}
        rows={5}
      />
      <Textarea
        name="compatibility"
        label="Compatibilidad"
        defaultValue={product.compatibility}
        maxLength={1000}
        rows={3}
        hint="Modelos o equipos con los que sirve."
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold">Marcas compatibles</legend>
        {brands.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
            {brands.map((b) => (
              <label key={b.id} className="flex min-h-11 items-center gap-2.5">
                <input
                  type="checkbox"
                  name="brandIds"
                  value={b.id}
                  defaultChecked={product.brandIds.includes(b.id)}
                  className="size-5 accent-brand"
                />
                {b.name}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No hay marcas. Créalas en «Categorías y marcas».</p>
        )}
      </fieldset>

      <div className="grid gap-4 rounded-2xl bg-sand/60 p-4 sm:grid-cols-3">
        <Checkbox name="active" label="Visible en la tienda" defaultChecked={product.active} />
        <Checkbox name="featured" label="Destacado en Inicio" defaultChecked={product.featured} />
        <Checkbox
          name="hasWarranty"
          label="Con garantía"
          hint="Las piezas eléctricas sueltas no llevan."
          defaultChecked={product.has_warranty}
        />
      </div>
    </ActionForm>
  );
}

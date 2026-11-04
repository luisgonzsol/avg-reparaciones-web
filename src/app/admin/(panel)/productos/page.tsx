import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/session";
import { importProductsCsv } from "@/lib/actions/admin";
import { formatUsd } from "@/lib/money";
import {
  AdminHeader,
  Badge,
  Card,
  EmptyState,
  Pager,
  Table,
  Td,
  pageParam,
  param,
  searchTerm,
} from "@/components/admin/ui";
import { ActionForm, adminControl } from "@/components/admin/form";
import { ButtonLink, buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Productos" };
const PAGE = 30;

export default async function ProductsPage({ searchParams }: PageProps<"/admin/productos">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const q = searchTerm(param(sp, "q"));
  const filter = param(sp, "ver");
  const page = pageParam(sp);

  let query = supabase
    .from("products")
    .select(
      "id, sku, name, price_usd, stock, reserved, low_stock_threshold, active, featured, is_sample, categories(name)",
      {
        count: "exact",
      },
    )
    .order("name")
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  if (filter === "inactivos") query = query.eq("active", false);
  if (filter === "destacados") query = query.eq("featured", true);
  if (filter === "ejemplo") query = query.eq("is_sample", true);
  const { data, count, error } = await query;
  if (error) console.error("[admin] productos", error.code, error.message);

  const href = (p: number) => {
    const s = new URLSearchParams();
    if (q) s.set("q", q);
    if (filter) s.set("ver", filter);
    if (p > 1) s.set("pagina", String(p));
    const qs = s.toString();
    return `/admin/productos${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <AdminHeader
        title="Productos"
        description="Inventario de la tienda: precios en USD, stock y visibilidad."
        actions={
          <>
            <ButtonLink href="/admin/productos/nuevo">Nuevo producto</ButtonLink>
            <a href="/admin/productos/exportar" className={buttonClasses("secondary")} download>
              Exportar CSV
            </a>
          </>
        }
      />

      {sp.borrado && (
        <p role="status" className="mb-4 rounded-xl bg-success-soft px-4 py-3 font-medium text-success">
          Producto borrado.
        </p>
      )}

      <Card>
        <form className="mb-5 grid gap-3 sm:grid-cols-[1fr_14rem_auto]" role="search">
          <label className="sr-only" htmlFor="q">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Nombre o SKU"
            className={`${adminControl} min-h-12`}
          />
          <label className="sr-only" htmlFor="ver">
            Mostrar
          </label>
          <select id="ver" name="ver" defaultValue={filter} className={`${adminControl} min-h-12`}>
            <option value="">Todos</option>
            <option value="destacados">Destacados</option>
            <option value="inactivos">Desactivados</option>
            <option value="ejemplo">De ejemplo</option>
          </select>
          <button type="submit" className={buttonClasses("secondary")}>
            Filtrar
          </button>
        </form>

        {data?.length ? (
          <Table head={["Producto", "Categoría", "Precio", "Disponible", "Estado"]}>
            {data.map((p) => {
              const available = Math.max(p.stock - p.reserved, 0);
              const category = (p.categories as unknown as { name: string } | null)?.name ?? "";
              return (
                <tr key={p.id} className="hover:bg-sand/40">
                  <Td>
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="font-semibold underline-offset-4 hover:underline"
                    >
                      {p.name}
                    </Link>
                    <span className="block text-sm text-muted">SKU {p.sku}</span>
                  </Td>
                  <Td>{category}</Td>
                  <Td className="font-semibold">{formatUsd(Number(p.price_usd))}</Td>
                  <Td>
                    <span className={available <= p.low_stock_threshold ? "font-bold text-warning" : ""}>
                      {available}
                    </span>
                    <span className="block text-sm text-muted">
                      {p.stock} en tienda{p.reserved ? ` · ${p.reserved} apartadas` : ""}
                    </span>
                  </Td>
                  <Td>
                    <span className="flex flex-wrap gap-1">
                      {p.active ? (
                        <Badge tone="success">Visible</Badge>
                      ) : (
                        <Badge tone="muted">Desactivado</Badge>
                      )}
                      {p.featured && <Badge tone="info">Destacado</Badge>}
                      {p.is_sample && <Badge tone="warning">Ejemplo</Badge>}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <EmptyState>
            {q || filter ? "No hay productos con esos filtros." : "Todavía no hay productos."}
          </EmptyState>
        )}
        <Pager page={page} total={count ?? 0} pageSize={PAGE} href={href} />
      </Card>

      <Card title="Importar inventario (CSV)" className="mt-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="text-[0.95rem] text-ink-soft">
            <p>
              Sube un archivo CSV (Excel → «Guardar como» → CSV UTF-8). Si el SKU ya existe, el producto se
              actualiza; si no, se crea. Si hay un solo error, <strong>no se importa nada</strong>.
            </p>
            <p className="mt-3">
              Columnas:{" "}
              <code className="text-sm">
                sku; nombre; slug; categoria; marcas; precio_usd; stock; umbral_stock_bajo; garantia;
                destacado; activo; descripcion; compatibilidad
              </code>
              . Las obligatorias son sku, nombre, categoria, precio_usd y stock. Categoría y marcas van por su
              identificador (p. ej. <code>licuadoras</code>, <code>oster|philips</code>).
            </p>
            <p className="mt-3">Consejo: exporta primero el CSV actual y úsalo como plantilla.</p>
          </div>
          <ActionForm
            action={importProductsCsv}
            submitLabel="Importar"
            pendingLabel="Importando…"
            resetOnSuccess
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="csv-file" className="font-semibold">
                Archivo CSV
              </label>
              <input
                id="csv-file"
                name="file"
                type="file"
                accept=".csv,text/csv"
                required
                className="block w-full rounded-xl border border-dashed border-line bg-surface p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:font-semibold file:text-white"
              />
            </div>
          </ActionForm>
        </div>
      </Card>
    </>
  );
}

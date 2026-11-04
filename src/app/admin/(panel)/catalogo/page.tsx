import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { deleteTaxonomy, saveTaxonomy } from "@/lib/actions/admin";
import { AdminHeader, Card, EmptyState } from "@/components/admin/ui";
import { ActionForm, Input } from "@/components/admin/form";

export const metadata: Metadata = { title: "Categorías y marcas" };

type Row = { id: number; name: string; slug: string; sort_order?: number };

function TaxonomyList({ kind, rows }: { kind: "category" | "brand"; rows: Row[] }) {
  if (!rows.length) return <EmptyState>No hay ninguna todavía.</EmptyState>;
  return (
    <ul className="divide-y divide-line">
      {rows.map((r) => (
        <li key={r.id} className="py-3">
          <details>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3">
              <span>
                <span className="font-semibold">{r.name}</span>
                <span className="ml-2 text-sm text-muted">{r.slug}</span>
              </span>
              <span className="text-sm font-semibold text-ink-soft underline underline-offset-4">Editar</span>
            </summary>
            <div className="mt-3 grid gap-4 rounded-xl bg-sand/50 p-4">
              <ActionForm action={saveTaxonomy} submitLabel="Guardar">
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="id" value={r.id} />
                <Input name="name" label="Nombre" defaultValue={r.name} maxLength={80} required />
                <Input
                  name="slug"
                  label="Identificador (para la URL y el CSV)"
                  defaultValue={r.slug}
                  maxLength={80}
                  hint="Cambiarlo rompe los enlaces y archivos CSV que lo usen."
                />
                {kind === "category" && (
                  <Input
                    name="sortOrder"
                    label="Orden"
                    type="number"
                    defaultValue={r.sort_order ?? 0}
                    hint="Menor = antes."
                  />
                )}
              </ActionForm>
              <ActionForm
                action={deleteTaxonomy}
                submitLabel="Borrar"
                pendingLabel="Borrando…"
                submitVariant="secondary"
              >
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="id" value={r.id} />
              </ActionForm>
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}

export default async function TaxonomyPage() {
  const { supabase } = await requireAdmin();
  const [categories, brands] = await Promise.all([
    supabase.from("categories").select("id, name, slug, sort_order").order("sort_order").order("name"),
    supabase.from("brands").select("id, name, slug").order("name"),
  ]);

  return (
    <>
      <AdminHeader
        title="Categorías y marcas"
        description="Sirven para los filtros de la tienda. Solo se pueden borrar si ningún producto las usa."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Categorías">
          <TaxonomyList kind="category" rows={categories.data ?? []} />
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="mb-3 font-bold">Nueva categoría</h3>
            <ActionForm action={saveTaxonomy} submitLabel="Crear categoría" resetOnSuccess>
              <input type="hidden" name="kind" value="category" />
              <Input name="name" label="Nombre" maxLength={80} required placeholder="Ej.: Planchas" />
            </ActionForm>
          </div>
        </Card>
        <Card title="Marcas compatibles">
          <TaxonomyList kind="brand" rows={brands.data ?? []} />
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="mb-3 font-bold">Nueva marca</h3>
            <ActionForm action={saveTaxonomy} submitLabel="Crear marca" resetOnSuccess>
              <input type="hidden" name="kind" value="brand" />
              <Input name="name" label="Nombre" maxLength={80} required placeholder="Ej.: Black+Decker" />
            </ActionForm>
          </div>
        </Card>
      </div>
    </>
  );
}

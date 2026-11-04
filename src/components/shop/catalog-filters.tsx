import Link from "next/link";
import { SORT_OPTIONS, type Brand, type CatalogParams, type Category } from "@/lib/catalog";
import { buttonClasses } from "@/components/ui/button";
import { IconSearch } from "@/components/ui/icons";

const control =
  "block w-full min-h-12 rounded-xl border border-line bg-surface px-4 text-base text-ink hover:border-ink/30 focus:border-ink focus:outline-none focus:ring-4 focus:ring-bolt/40";

/**
 * Filtros del catálogo con un formulario GET normal: funcionan sin
 * JavaScript y la URL se puede compartir.
 */
export function CatalogFilters({
  params,
  categories,
  brands,
  idPrefix = "",
}: {
  idPrefix?: string;
  params: CatalogParams;
  categories: Category[];
  brands: Brand[];
}) {
  const hasFilters = Boolean(params.q || params.category || params.brand || params.sort !== "newest");
  return (
    <form
      method="get"
      action="/tienda"
      role="search"
      aria-label="Buscar y filtrar repuestos"
      className="grid gap-4"
    >
      <div>
        <label htmlFor={`${idPrefix}q`} className="mb-1.5 block font-semibold">
          Buscar
        </label>
        <div className="relative">
          <IconSearch
            size={20}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
          />
          <input
            id={`${idPrefix}q`}
            name="q"
            type="search"
            defaultValue={params.q}
            maxLength={80}
            placeholder="Ej.: cuchilla Oster, capacitor…"
            className={`${control} pl-11`}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        <div>
          <label htmlFor={`${idPrefix}categoria`} className="mb-1.5 block font-semibold">
            Categoría
          </label>
          <select
            id={`${idPrefix}categoria`}
            name="categoria"
            defaultValue={params.category}
            className={control}
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}marca`} className="mb-1.5 block font-semibold">
            Marca compatible
          </label>
          <select id={`${idPrefix}marca`} name="marca" defaultValue={params.brand} className={control}>
            <option value="">Todas</option>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}orden`} className="mb-1.5 block font-semibold">
            Ordenar por
          </label>
          <select id={`${idPrefix}orden`} name="orden" defaultValue={params.sort} className={control}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={buttonClasses("primary", "md")}>
          Aplicar filtros
        </button>
        {hasFilters && (
          <Link
            href="/tienda"
            className="inline-flex min-h-12 items-center px-2 font-semibold text-brand-ink underline-offset-4 hover:underline"
          >
            Quitar filtros
          </Link>
        )}
      </div>
    </form>
  );
}

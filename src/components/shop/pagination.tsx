import Link from "next/link";
import clsx from "clsx";
import { catalogHref, type CatalogParams } from "@/lib/catalog";

/** Paginación accesible con enlaces (funciona sin JavaScript). */
export function Pagination({ params, pages }: { params: CatalogParams; pages: number }) {
  if (pages <= 1) return null;
  const current = Math.min(params.page, pages);
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - current) <= 1,
  );

  const item = "inline-grid min-h-12 min-w-12 place-items-center rounded-full px-3 font-semibold";
  return (
    <nav aria-label="Paginación" className="mt-12 flex justify-center">
      <ul className="flex flex-wrap items-center gap-2">
        {current > 1 && (
          <li>
            <Link
              href={catalogHref({ ...params, page: current - 1 })}
              className={clsx(item, "hover:bg-sand")}
            >
              ← Anterior
            </Link>
          </li>
        )}
        {nums.map((n, i) => (
          <li key={n} className="flex items-center gap-2">
            {i > 0 && n - nums[i - 1]! > 1 && <span aria-hidden="true">…</span>}
            <Link
              href={catalogHref({ ...params, page: n })}
              aria-current={n === current ? "page" : undefined}
              aria-label={`Página ${n}`}
              className={clsx(item, n === current ? "bg-ink text-white" : "ring-1 ring-line hover:bg-sand")}
            >
              {n}
            </Link>
          </li>
        ))}
        {current < pages && (
          <li>
            <Link
              href={catalogHref({ ...params, page: current + 1 })}
              className={clsx(item, "hover:bg-sand")}
            >
              Siguiente →
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

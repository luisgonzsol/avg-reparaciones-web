import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import type { Tone } from "@/lib/status";

export function AdminHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && (
          <Link
            href={back.href}
            className="mb-2 inline-flex min-h-11 items-center text-sm font-semibold text-ink-soft hover:text-ink"
          >
            ← {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({
  title,
  children,
  className,
  actions,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={clsx("rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-line sm:p-6", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-lg font-bold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const toneClass: Record<Tone, string> = {
  neutral: "bg-sand text-ink",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
  info: "bg-ink/8 text-ink",
  muted: "bg-sand text-muted",
  danger: "bg-brand/10 text-brand-ink",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-0.5 text-sm font-bold whitespace-nowrap",
        toneClass[tone],
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-xl bg-sand/70 px-4 py-6 text-center text-ink-soft">{children}</p>;
}

/** Tabla con desplazamiento horizontal en pantallas pequeñas. */
export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[40rem] border-collapse text-left text-[0.95rem]">
        <thead>
          <tr className="border-b border-line text-sm text-muted">
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-3 py-2 font-semibold first:pl-5 sm:first:pl-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={clsx("px-3 py-3 align-top first:pl-5 sm:first:pl-3", className)}>{children}</td>;
}

export function Pager({
  page,
  total,
  pageSize,
  href,
}: {
  page: number;
  total: number;
  pageSize: number;
  href: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Páginas" className="mt-4 flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">
        Página {page} de {pages} · {total} resultados
      </span>
      <span className="flex gap-2">
        {page > 1 && (
          <Link
            href={href(page - 1)}
            className="inline-flex min-h-11 items-center rounded-full px-4 font-semibold ring-1 ring-line hover:ring-ink/40"
          >
            Anterior
          </Link>
        )}
        {page < pages && (
          <Link
            href={href(page + 1)}
            className="inline-flex min-h-11 items-center rounded-full px-4 font-semibold ring-1 ring-line hover:ring-ink/40"
          >
            Siguiente
          </Link>
        )}
      </span>
    </nav>
  );
}

export const adminDateTime = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Caracas",
});

export const adminDate = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "medium",
  timeZone: "America/Caracas",
});

/** Lee un parámetro de búsqueda como texto simple. */
export function param(sp: Record<string, string | string[] | undefined>, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v)?.slice(0, 100) ?? "";
}

export function pageParam(sp: Record<string, string | string[] | undefined>): number {
  const n = Number(param(sp, "pagina"));
  return Number.isInteger(n) && n > 0 && n < 10000 ? n : 1;
}

/** Texto de búsqueda seguro para filtros de PostgREST (sin comas ni paréntesis). */
export function searchTerm(q: string): string {
  return q
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}@.+\-\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

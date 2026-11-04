"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export const ADMIN_NAV = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/mensajes", label: "Mensajes" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/catalogo", label: "Categorías y marcas" },
  { href: "/admin/tasa", label: "Tasa del día" },
  { href: "/admin/ajustes", label: "Ajustes" },
  { href: "/admin/auditoria", label: "Auditoría" },
  { href: "/admin/seguridad", label: "Mi cuenta" },
] as const;

/** Navegación del panel: barra lateral en escritorio, fila deslizable en móvil. */
export function AdminNav({ badges }: { badges: Partial<Record<string, number>> }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Panel">
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {ADMIN_NAV.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const badge = badges[item.href];
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex min-h-11 items-center justify-between gap-3 rounded-xl px-3.5 font-semibold whitespace-nowrap transition-colors",
                  active ? "bg-ink text-white" : "text-ink-soft hover:bg-sand hover:text-ink",
                )}
              >
                {item.label}
                {badge ? (
                  <span
                    className={clsx(
                      "rounded-full px-2 text-xs leading-5 font-bold",
                      active ? "bg-white text-ink" : "bg-brand text-white",
                    )}
                  >
                    {badge}
                    <span className="sr-only"> pendientes</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

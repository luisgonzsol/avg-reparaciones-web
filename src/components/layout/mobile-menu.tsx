"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { IconClose, IconMenu } from "@/components/ui/icons";

/**
 * Menú móvil accesible con <dialog> nativo: atrapa el foco, se cierra con
 * Escape y devuelve el foco al botón al cerrarse.
 */
export function MobileMenu({
  links,
  footer,
}: {
  links: readonly { href: string; label: string }[];
  footer: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  // Cierra el menú al cambiar de página.
  useEffect(() => {
    ref.current?.close();
  }, [pathname]);

  const open = () => ref.current?.showModal();
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className="grid size-12 place-items-center rounded-full text-ink transition-colors hover:bg-sand lg:hidden"
      >
        <IconMenu size={26} />
        <span className="sr-only">Abrir menú</span>
      </button>

      <dialog
        ref={ref}
        aria-label="Menú principal"
        className="mobile-menu fixed inset-0 m-0 ml-auto h-dvh max-h-none w-[min(22rem,88vw)] max-w-none bg-canvas p-0 text-ink shadow-lift open:flex open:flex-col"
        onClick={(e) => {
          // Clic fuera del panel (en el fondo) cierra el menú.
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <span className="font-display text-lg font-bold">Menú</span>
          <button
            type="button"
            onClick={close}
            className="grid size-12 place-items-center rounded-full hover:bg-sand"
          >
            <IconClose size={26} />
            <span className="sr-only">Cerrar menú</span>
          </button>
        </div>
        <nav aria-label="Principal (móvil)" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={close}
                  className="flex min-h-14 items-center rounded-xl px-4 text-lg font-semibold hover:bg-sand"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-line p-5">{footer}</div>
      </dialog>
    </>
  );
}

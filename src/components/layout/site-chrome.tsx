import type { ReactNode } from "react";

/** Estructura de la web pública (también la usa la página 404). */
export function SiteChrome({
  header,
  footer,
  fab,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  fab?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-50 rounded-full bg-ink px-5 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      {header}
      <main id="contenido" className="flex-1">
        {children}
      </main>
      {footer}
      {fab}
    </>
  );
}

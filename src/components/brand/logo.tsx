import clsx from "clsx";

/**
 * Logo de AVG Reparaciones.
 *
 * [PENDIENTE] Logo oficial en SVG. Mientras tanto se muestra un logotipo
 * tipográfico PROVISIONAL inspirado en el letrero del local.
 *
 * Para usar el logo oficial cuando llegue:
 *   1. Guarda el archivo en `public/brand/logo.svg` (y `logo-dark.svg` para
 *      fondos oscuros, si hace falta).
 *   2. Cambia `OFFICIAL_LOGO` a true y ajusta `LOGO_RATIO` (ancho / alto).
 * El componente respeta siempre la proporción (no deforma el logo).
 */
const OFFICIAL_LOGO = false;
const LOGO_RATIO = 3.2;

export function Logo({
  tone = "light",
  className,
  height = 40,
}: {
  /** light = sobre fondo claro; dark = sobre fondo oscuro */
  tone?: "light" | "dark";
  className?: string;
  height?: number;
}) {
  if (OFFICIAL_LOGO) {
    const src = tone === "dark" ? "/brand/logo-dark.svg" : "/brand/logo.svg";
    return (
      // SVG local: no necesita optimización de next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="AVG Reparaciones C.A."
        height={height}
        width={Math.round(height * LOGO_RATIO)}
        className={clsx("h-auto w-auto", className)}
        style={{ height }}
      />
    );
  }

  return (
    <span
      className={clsx("inline-flex items-center gap-2.5 leading-none select-none", className)}
      style={{ height }}
      title="Logo provisional — [PENDIENTE] logo oficial en SVG"
    >
      <span
        aria-hidden="true"
        className="relative grid aspect-square h-full place-items-center rounded-xl bg-brand text-white shadow-soft"
      >
        <svg viewBox="0 0 24 24" className="h-[62%] w-[62%]" fill="currentColor" aria-hidden="true">
          <path d="M13.5 1.5 4 14h7l-1.5 8.5L20 9.5h-7.2l.7-8Z" fill="var(--color-bolt)" />
        </svg>
      </span>
      <span className="flex flex-col">
        <span
          className={clsx(
            "font-display text-[1.35rem] font-extrabold tracking-tight italic",
            tone === "dark" ? "text-white" : "text-ink",
          )}
        >
          AVG
        </span>
        <span
          className={clsx(
            "mt-0.5 text-[0.62rem] font-semibold tracking-[0.18em] uppercase",
            tone === "dark" ? "text-white/70" : "text-muted",
          )}
        >
          Reparaciones C.A.
        </span>
      </span>
      <span className="sr-only">AVG Reparaciones C.A.</span>
    </span>
  );
}

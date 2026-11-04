import clsx from "clsx";

/**
 * Motivos decorativos inspirados en el logo: el rayo y las curvas.
 * Siempre aria-hidden y sutiles.
 */

/** Divisor con un pequeño rayo en el centro. */
export function BoltDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={clsx("flex items-center gap-4", className)}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-line" />
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-bolt" fill="currentColor">
        <path d="M13.5 1.5 4 14h7l-1.5 8.5L20 9.5h-7.2l.7-8Z" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-line" />
    </div>
  );
}

/** Curvas tipo "swoosh" del logo, para fondos (hero, secciones oscuras). */
export function SwooshBackdrop({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={clsx("pointer-events-none absolute", className)}
      viewBox="0 0 800 600"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      <path
        d="M-40 470C140 380 330 330 520 340 640 346 740 380 840 430"
        stroke="var(--color-brand)"
        strokeOpacity="0.12"
        strokeWidth="56"
        strokeLinecap="round"
      />
      <path
        d="M-40 540C170 450 380 410 580 420 690 426 770 452 840 484"
        stroke="var(--color-flame)"
        strokeOpacity="0.14"
        strokeWidth="18"
        strokeLinecap="round"
      />
      <path d="M560 40 470 210h80l-30 120 140-190h-86l40-100Z" fill="var(--color-bolt)" fillOpacity="0.16" />
    </svg>
  );
}

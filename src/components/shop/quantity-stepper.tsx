"use client";

import clsx from "clsx";

/** Selector de cantidad con botones grandes (− / +), limitado al stock. */
export function QuantityStepper({
  value,
  max,
  onChange,
  label,
  className,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
  className?: string;
}) {
  const limit = Math.max(1, Math.min(max, 99));
  const btn =
    "grid size-12 place-items-center rounded-full text-xl font-bold text-ink transition-colors hover:bg-sand disabled:opacity-35 disabled:hover:bg-transparent";
  return (
    <div
      role="group"
      aria-label={label}
      className={clsx("inline-flex items-center rounded-full bg-surface ring-1 ring-line", className)}
    >
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1}>
        <span aria-hidden="true">−</span>
        <span className="sr-only">Quitar una unidad</span>
      </button>
      <output aria-live="polite" className="min-w-10 text-center text-lg font-semibold tabular-nums">
        {value}
      </output>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= limit}>
        <span aria-hidden="true">+</span>
        <span className="sr-only">Añadir una unidad</span>
      </button>
    </div>
  );
}

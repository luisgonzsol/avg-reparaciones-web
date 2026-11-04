"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import clsx from "clsx";
import type { Currency } from "@/lib/money";
import { setCurrency } from "@/lib/actions/currency";

const OPTIONS: { value: Currency; label: string; full: string }[] = [
  { value: "USD", label: "USD", full: "Dólares" },
  { value: "VES", label: "Bs", full: "Bolívares" },
];

export function CurrencySwitcher({ current, className }: { current: Currency; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(value: Currency) {
    if (value === current) return;
    startTransition(async () => {
      await setCurrency(value);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="Moneda de los precios"
      className={clsx(
        "inline-flex rounded-full bg-sand p-1 ring-1 ring-line ring-inset",
        pending && "opacity-70",
        className,
      )}
    >
      {OPTIONS.map((o) => {
        const active = o.value === current;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => choose(o.value)}
            aria-pressed={active}
            className={clsx(
              "min-h-10 min-w-12 rounded-full px-3 text-sm font-semibold transition-colors",
              active ? "bg-ink text-white shadow-soft" : "text-ink-soft hover:text-ink",
            )}
          >
            <span aria-hidden="true">{o.label}</span>
            <span className="sr-only">{o.full}</span>
          </button>
        );
      })}
    </div>
  );
}

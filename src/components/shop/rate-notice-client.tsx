"use client";

import clsx from "clsx";
import { formatRate } from "@/lib/money";
import type { ExchangeRate } from "@/lib/catalog";
import { PendingTag } from "@/components/ui/primitives";

const dateFormatter = new Intl.DateTimeFormat("es-VE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Tasa del día y aviso obligatorio sobre el monto referencial en Bs. */
export function RateNoticeClient({ rate, className }: { rate: ExchangeRate | null; className?: string }) {
  return (
    <p className={clsx("rounded-2xl bg-sand/70 p-4 text-sm text-ink-soft", className)}>
      {rate && (
        <>
          <strong className="font-semibold text-ink">Tasa del día: {formatRate(rate.rate)}</strong> ·{" "}
          {dateFormatter.format(new Date(`${rate.effectiveDate}T00:00:00Z`))}
          {rate.isSample && (
            <>
              {" "}
              <PendingTag>[EJEMPLO]</PendingTag>
            </>
          )}
          <br />
        </>
      )}
      Monto en Bs referencial según la tasa del día; el monto final se confirma en el enlace de cobro.
    </p>
  );
}

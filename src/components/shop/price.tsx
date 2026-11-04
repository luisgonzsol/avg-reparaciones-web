import clsx from "clsx";
import { formatBs, formatUsd, usdToBs, type Currency } from "@/lib/money";

/** Precio en la moneda elegida, con la otra como referencia. */
export function Price({
  usd,
  currency,
  rate,
  size = "md",
  className,
}: {
  usd: number;
  currency: Currency;
  rate: number | null;
  size?: "md" | "lg";
  className?: string;
}) {
  const usdText = formatUsd(usd);
  const bsText = rate ? formatBs(usdToBs(usd, rate)) : null;
  const showBs = currency === "VES" && bsText;
  const main = showBs ? bsText : usdText;
  const secondary = showBs ? usdText : bsText ? `Ref. ${bsText}` : null;

  return (
    <div className={className}>
      <p className={clsx("font-display font-bold", size === "lg" ? "text-4xl" : "text-2xl")}>{main}</p>
      {secondary && (
        <p className={clsx("text-muted", size === "lg" ? "text-base" : "text-sm")}>{secondary}</p>
      )}
    </div>
  );
}

/** Tasa del día + aviso de monto referencial (sirve en servidor y cliente). */
export { RateNoticeClient as RateNotice } from "./rate-notice-client";

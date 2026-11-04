import Link from "next/link";
import clsx from "clsx";
import { formatBs, formatUsd, usdToBs, type Currency } from "@/lib/money";
import { AVAILABILITY_LABEL, availabilityOf, type SampleProduct } from "@/content/sample-products";
import { IconImage } from "@/components/ui/icons";
import { PendingTag } from "@/components/ui/primitives";

const AVAILABILITY_STYLE = {
  available: "bg-success-soft text-success",
  low: "bg-warning-soft text-warning",
  out: "bg-sand text-muted",
} as const;

export function ProductCard({
  product,
  currency,
  rate,
  isSample,
}: {
  product: SampleProduct;
  currency: Currency;
  rate: number;
  isSample?: boolean;
}) {
  const availability = availabilityOf(product);
  const usd = formatUsd(product.priceUsd);
  const bs = formatBs(usdToBs(product.priceUsd, rate));
  const [main, secondary] = currency === "USD" ? [usd, bs] : [bs, usd];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-(--radius-card) bg-surface shadow-soft ring-1 ring-line transition-[box-shadow,transform] duration-300 ease-(--ease-out-soft) hover:shadow-lift motion-safe:hover:-translate-y-1">
      {/* [PLACEHOLDER] foto del producto */}
      <div className="relative grid aspect-[4/3] place-items-center bg-gradient-to-br from-sand to-canvas text-muted">
        <IconImage size={40} className="opacity-50" />
        <span className="sr-only">Foto del producto pendiente</span>
        {isSample && <PendingTag className="absolute top-3 left-3">[EJEMPLO]</PendingTag>}
        <span
          className={clsx(
            "absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-bold",
            AVAILABILITY_STYLE[availability],
          )}
        >
          {AVAILABILITY_LABEL[availability]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm font-medium text-muted">{product.category}</p>
        <h3 className="mt-1 text-lg leading-snug font-bold">
          <Link href={`/tienda/${product.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-ink-soft">Compatible con: {product.compatibleBrands.join(", ")}</p>
        <div className="mt-auto pt-4">
          <p className="font-display text-2xl font-bold">{main}</p>
          <p className="text-sm text-muted">
            {currency === "USD" ? "Ref. " : ""}
            {secondary}
          </p>
          {!product.hasWarranty && (
            <p className="mt-3 text-xs font-medium text-ink-soft">Pieza suelta sin garantía</p>
          )}
        </div>
      </div>
    </article>
  );
}

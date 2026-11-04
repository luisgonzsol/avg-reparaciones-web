import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog";
import type { Currency } from "@/lib/money";
import { IconImage } from "@/components/ui/icons";
import { PendingTag } from "@/components/ui/primitives";
import { AvailabilityBadge } from "./availability-badge";
import { Price } from "./price";

export function ProductCard({
  product,
  currency,
  rate,
}: {
  product: CatalogProduct;
  currency: Currency;
  rate: number | null;
}) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-(--radius-card) bg-surface shadow-soft ring-1 ring-line transition-[box-shadow,transform] duration-300 ease-(--ease-out-soft) hover:shadow-lift motion-safe:hover:-translate-y-1">
      <div className="relative grid aspect-[4/3] place-items-center bg-gradient-to-br from-sand to-canvas text-muted">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes="(min-width: 1024px) 18rem, (min-width: 640px) 45vw, 92vw"
            className="object-cover"
          />
        ) : (
          <>
            {/* [PLACEHOLDER] foto del producto */}
            <IconImage size={40} className="opacity-50" />
            <span className="sr-only">Sin foto del producto</span>
          </>
        )}
        {product.isSample && <PendingTag className="absolute top-3 left-3">[EJEMPLO]</PendingTag>}
        <AvailabilityBadge
          available={product.available}
          lowStockThreshold={product.lowStockThreshold}
          className="absolute top-3 right-3"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm font-medium text-muted">{product.categoryName}</p>
        <h3 className="mt-1 text-lg leading-snug font-bold">
          <Link
            href={`/tienda/${product.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-(--radius-card)"
          >
            {product.name}
          </Link>
        </h3>
        {product.brandNames.length > 0 && (
          <p className="mt-1 text-sm text-ink-soft">Compatible con: {product.brandNames.join(", ")}</p>
        )}
        <div className="mt-auto pt-4">
          <Price usd={product.priceUsd} currency={currency} rate={rate} />
          {!product.hasWarranty && (
            <p className="mt-3 text-xs font-medium text-ink-soft">Pieza suelta sin garantía</p>
          )}
        </div>
      </div>
    </article>
  );
}

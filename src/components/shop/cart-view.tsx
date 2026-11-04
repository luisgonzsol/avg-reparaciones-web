"use client";

import Image from "next/image";
import Link from "next/link";
import { setQuantity } from "@/lib/cart/store";
import { formatBs, formatUsd, usdToBs } from "@/lib/money";
import { ButtonLink } from "@/components/ui/button";
import { FormAlert } from "@/components/forms/fields";
import { PendingTag } from "@/components/ui/primitives";
import { IconArrowRight, IconCart, IconClose, IconImage } from "@/components/ui/icons";
import { QuantityStepper } from "./quantity-stepper";
import { RateNoticeClient } from "./rate-notice-client";
import { useCartQuote } from "./use-cart-quote";

export function CartView() {
  const { lines, quoted, loading, error, rate, totalUsd, totalBs, hasIssues } = useCartQuote();

  if (!lines.length) {
    return (
      <div className="rounded-(--radius-card) bg-surface p-10 text-center shadow-soft ring-1 ring-line">
        <IconCart size={40} className="mx-auto text-muted" />
        <h2 className="mt-4 text-2xl font-bold">Tu carrito está vacío</h2>
        <p className="mt-2 text-ink-soft">Busca el repuesto que necesitas en nuestra tienda.</p>
        <ButtonLink href="/tienda" size="lg" className="mt-6">
          Ir a la tienda
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:gap-10">
      <section aria-labelledby="cart-items-title">
        <h2 id="cart-items-title" className="sr-only">
          Productos en tu carrito
        </h2>
        {error && <FormAlert>{error}</FormAlert>}
        <ul
          className="divide-y divide-line rounded-(--radius-card) bg-surface px-5 shadow-soft ring-1 ring-line sm:px-7"
          aria-busy={loading}
        >
          {quoted.map(({ line, product, quantity, adjusted, unavailable }) => (
            <li key={line.slug} className="flex gap-4 py-5">
              <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-sand text-muted sm:size-24">
                {product?.image ? (
                  <Image src={product.image.url} alt="" fill sizes="6rem" className="object-cover" />
                ) : (
                  <IconImage size={28} className="opacity-50" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {product ? (
                      <Link href={`/tienda/${product.slug}`} className="font-semibold hover:underline">
                        {product.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-muted">
                        {loading ? "Cargando…" : "Producto no disponible"}
                      </span>
                    )}
                    {product?.isSample && (
                      <>
                        {" "}
                        <PendingTag>[EJEMPLO]</PendingTag>
                      </>
                    )}
                    {product && <p className="text-sm text-muted">SKU: {product.sku}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.slug, 0)}
                    className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink"
                  >
                    <IconClose size={20} />
                    <span className="sr-only">Quitar {product?.name ?? "producto"} del carrito</span>
                  </button>
                </div>

                {unavailable ? (
                  <p className="text-sm font-semibold text-brand-ink">
                    Agotado o ya no disponible. Quítalo para continuar.
                  </p>
                ) : (
                  product && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <QuantityStepper
                        value={quantity}
                        max={product.available}
                        onChange={(n) => setQuantity(line.slug, Math.max(1, n))}
                        label={`Cantidad de ${product.name}`}
                      />
                      <div className="text-right">
                        <p className="font-display text-lg font-bold">
                          {formatUsd(product.priceUsd * quantity)}
                        </p>
                        {rate && (
                          <p className="text-sm text-muted">
                            Ref. {formatBs(usdToBs(product.priceUsd * quantity, rate.rate))}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                )}
                {adjusted && (
                  <p className="text-sm font-medium text-warning">
                    Solo quedan {product?.available} unidades: ajustamos la cantidad.
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
        <Link
          href="/tienda"
          className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-brand-ink underline-offset-4 hover:underline"
        >
          ← Seguir comprando
        </Link>
      </section>

      <aside
        aria-labelledby="cart-summary-title"
        className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start"
      >
        <div className="rounded-(--radius-card) bg-surface p-6 shadow-soft ring-1 ring-line">
          <h2 id="cart-summary-title" className="text-xl font-bold">
            Resumen
          </h2>
          <dl className="mt-4 space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Total</dt>
              <dd className="font-display text-2xl font-bold">{loading ? "…" : formatUsd(totalUsd)}</dd>
            </div>
            {totalBs !== null && (
              <div className="flex justify-between gap-4 text-sm">
                <dt className="text-muted">Referencia en Bs</dt>
                <dd className="font-semibold">{formatBs(totalBs)}</dd>
              </div>
            )}
          </dl>
          <p className="mt-3 text-sm text-muted">
            El envío nacional, si lo eliges, se paga aparte a la agencia.
          </p>
          {hasIssues ? (
            <p className="mt-5 rounded-xl bg-brand-soft p-3 text-sm font-semibold text-brand-ink">
              Quita los productos no disponibles para continuar.
            </p>
          ) : (
            <ButtonLink
              href="/checkout"
              size="lg"
              className="mt-5 w-full"
              aria-disabled={loading || totalUsd <= 0}
            >
              Continuar con el pedido
              <IconArrowRight size={20} />
            </ButtonLink>
          )}
        </div>
        <RateNoticeClient rate={rate} />
      </aside>
    </div>
  );
}

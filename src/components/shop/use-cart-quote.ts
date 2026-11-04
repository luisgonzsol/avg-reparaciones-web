"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { setQuantity, useCart, type CartLine } from "@/lib/cart/store";
import { getCartQuote } from "@/lib/actions/shop";
import { subtotalUsd, usdToBs } from "@/lib/money";
import type { CatalogProduct, ExchangeRate } from "@/lib/catalog";

export type QuotedLine = {
  line: CartLine;
  product: CatalogProduct | null;
  /** Cantidad ajustada al stock disponible. */
  quantity: number;
  adjusted: boolean;
  unavailable: boolean;
};

/**
 * Carrito con precios y stock refrescados DESDE EL SERVIDOR. El navegador
 * solo guarda slug y cantidad.
 */
export function useCartQuote() {
  const lines = useCart();
  const slugKey = useMemo(
    () =>
      lines
        .map((l) => l.slug)
        .sort()
        .join(","),
    [lines],
  );
  const [products, setProducts] = useState<Map<string, CatalogProduct> | null>(null);
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [error, setError] = useState<string>();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!slugKey) return;
    let cancelled = false;
    getCartQuote(slugKey.split(","))
      .then((q) => {
        if (cancelled) return;
        if (q.ok) {
          setProducts(new Map(q.products.map((p) => [p.slug, p])));
          setRate(q.rate);
          setError(undefined);
        } else {
          setError(q.message);
        }
      })
      .catch(() => {
        if (!cancelled) setError("No pudimos actualizar los precios. Revisa tu conexión.");
      });
    return () => {
      cancelled = true;
    };
  }, [slugKey, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const quoted: QuotedLine[] = useMemo(
    () =>
      lines.map((line) => {
        const product = products?.get(line.slug) ?? null;
        const unavailable = products !== null && (!product || product.available <= 0);
        const max = product ? Math.min(product.available, 99) : line.quantity;
        const quantity = unavailable ? 0 : Math.min(line.quantity, max);
        return { line, product, quantity, adjusted: !unavailable && quantity < line.quantity, unavailable };
      }),
    [lines, products],
  );

  // Guarda en el carrito las cantidades ajustadas al stock real.
  useEffect(() => {
    for (const q of quoted) if (q.adjusted) setQuantity(q.line.slug, q.quantity);
  }, [quoted]);

  const valid = quoted.filter((q) => q.product && !q.unavailable && q.quantity > 0);
  const totalUsd = subtotalUsd(valid.map((q) => ({ priceUsd: q.product!.priceUsd, quantity: q.quantity })));
  const totalBs = rate ? usdToBs(totalUsd, rate.rate) : null;

  return {
    lines,
    quoted,
    loading: lines.length > 0 && products === null && !error,
    error,
    rate,
    totalUsd,
    totalBs,
    hasIssues: quoted.some((q) => q.unavailable),
    orderLines: valid.map((q) => ({ slug: q.line.slug, quantity: q.quantity })),
    refresh,
  };
}

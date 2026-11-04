"use client";

import Link from "next/link";
import { useState } from "react";
import { addToCart, useCart } from "@/lib/cart/store";
import { buttonClasses } from "@/components/ui/button";
import { IconCart } from "@/components/ui/icons";
import { QuantityStepper } from "./quantity-stepper";

/**
 * Añadir al carrito sin superar el stock disponible. El servidor vuelve a
 * comprobarlo al confirmar el pedido.
 */
export function AddToCart({ slug, available, name }: { slug: string; available: number; name: string }) {
  const cart = useCart();
  const inCart = cart.find((l) => l.slug === slug)?.quantity ?? 0;
  const remaining = Math.max(0, Math.min(available, 99) - inCart);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState<number | null>(null);

  if (available <= 0) {
    return (
      <p className="rounded-2xl bg-sand p-4 font-semibold text-ink-soft">
        Agotado por ahora. Escríbenos por WhatsApp y te avisamos cuando vuelva.
      </p>
    );
  }

  const quantity = Math.min(qty, Math.max(remaining, 1));

  return (
    <div className="flex flex-col gap-4">
      {remaining > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <QuantityStepper value={quantity} max={remaining} onChange={setQty} label={`Cantidad de ${name}`} />
          <button
            type="button"
            className={buttonClasses("primary", "lg", "sm:flex-1")}
            onClick={() => {
              addToCart(slug, quantity, available);
              setAdded(quantity);
              setQty(1);
            }}
          >
            <IconCart size={22} />
            Añadir al carrito
          </button>
        </div>
      ) : (
        <p className="rounded-2xl bg-sand p-4 text-ink-soft">
          Ya tienes en tu carrito todas las unidades disponibles ({available}).
        </p>
      )}
      <p aria-live="polite" className="min-h-6 text-[0.95rem]">
        {added !== null && (
          <>
            <span className="font-semibold text-success">
              ✓ {added === 1 ? "Añadido" : `${added} unidades añadidas`} al carrito.
            </span>{" "}
            <Link href="/carrito" className="font-semibold text-brand-ink underline underline-offset-4">
              Ver carrito
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

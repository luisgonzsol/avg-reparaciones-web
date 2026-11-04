"use client";

import Link from "next/link";
import { useCartCount } from "@/lib/cart/store";
import { IconCart } from "@/components/ui/icons";

export function CartButton() {
  const count = useCartCount();
  const label = count === 1 ? "Carrito: 1 producto" : `Carrito: ${count} productos`;

  return (
    <Link
      href="/carrito"
      aria-label={label}
      className="relative grid size-12 place-items-center rounded-full text-ink transition-colors hover:bg-sand"
    >
      <IconCart size={24} />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-0.5 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[0.7rem] leading-5 font-bold text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

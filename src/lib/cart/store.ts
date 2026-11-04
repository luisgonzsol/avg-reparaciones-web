"use client";
/**
 * Carrito persistido en localStorage (siempre con try/catch: puede fallar
 * en modo privado o con almacenamiento bloqueado).
 * Solo guarda slug y cantidad: los precios y el stock SIEMPRE se refrescan
 * desde el servidor (Fase 3).
 */
import { useSyncExternalStore } from "react";

export type CartLine = { slug: string; quantity: number };

const KEY = "avg_cart_v1";
const listeners = new Set<() => void>();
const EMPTY: CartLine[] = [];
let cache: CartLine[] | null = null;

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed)
      ? parsed.filter(
          (l): l is CartLine =>
            typeof l?.slug === "string" &&
            Number.isInteger(l?.quantity) &&
            l.quantity > 0 &&
            l.quantity <= 99,
        )
      : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Sin almacenamiento: el carrito vive solo en memoria en esta visita.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useCartCount(): number {
  return useCart().reduce((n, l) => n + l.quantity, 0);
}

/** Añade unidades respetando el máximo disponible (validado de nuevo en el servidor). */
export function addToCart(slug: string, quantity: number, maxAvailable: number) {
  const lines = [...read()];
  const i = lines.findIndex((l) => l.slug === slug);
  const current = i >= 0 ? lines[i]!.quantity : 0;
  const next = Math.min(current + quantity, maxAvailable, 99);
  if (next <= 0) return;
  if (i >= 0) lines[i] = { slug, quantity: next };
  else lines.push({ slug, quantity: next });
  write(lines);
}

export function setQuantity(slug: string, quantity: number) {
  const lines = read()
    .map((l) => (l.slug === slug ? { ...l, quantity } : l))
    .filter((l) => l.quantity > 0);
  write(lines);
}

export function clearCart() {
  write([]);
}

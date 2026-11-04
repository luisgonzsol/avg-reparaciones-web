import "server-only";
import { cookies } from "next/headers";
import { CURRENCY_COOKIE, isCurrency, type Currency } from "@/lib/money";

/** Moneda preferida del visitante (cookie funcional, no de seguimiento). */
export async function getCurrency(): Promise<Currency> {
  const value = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return isCurrency(value) ? value : "USD";
}

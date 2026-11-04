"use server";

import { cookies } from "next/headers";
import { CURRENCY_COOKIE, isCurrency } from "@/lib/money";

/** Guarda la moneda preferida (cookie funcional, sin datos personales). */
export async function setCurrency(value: unknown): Promise<void> {
  if (!isCurrency(value)) return;
  (await cookies()).set(CURRENCY_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
}

import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getServiceClient } from "@/lib/supabase/server";

/** Límites por acción: [peticiones, ventana en segundos]. */
export const RATE_LIMITS = {
  checkout: [5, 10 * 60],
  repair: [5, 60 * 60],
  contact: [5, 60 * 60],
} as const satisfies Record<string, readonly [number, number]>;

export type RateLimitAction = keyof typeof RATE_LIMITS;

/**
 * Identificador anónimo del cliente: hash de la IP con una sal secreta.
 * Nunca se guarda la IP en claro (privacidad).
 */
async function clientKey(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("cf-connecting-ip") ??
    "unknown";
  const salt = process.env.RATE_LIMIT_SALT ?? process.env.SUPABASE_SECRET_KEY ?? "avg";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Devuelve true si la petición está permitida. Si la base de datos falla,
 * se permite (fail-open) y se registra el error: preferimos no bloquear a
 * clientes legítimos.
 */
export async function checkRateLimit(action: RateLimitAction): Promise<boolean> {
  const [limit, windowSeconds] = RATE_LIMITS[action];
  try {
    const key = `${action}:${await clientKey()}`;
    const { data, error } = await getServiceClient().rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data === true;
  } catch (e) {
    console.error("[rate-limit] error", e instanceof Error ? e.message : e);
    return true;
  }
}

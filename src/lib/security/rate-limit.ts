import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getServiceClient } from "@/lib/supabase/server";

/** Límites por acción: [peticiones, ventana en segundos]. */
export const RATE_LIMITS = {
  checkout: [5, 10 * 60],
  repair: [5, 60 * 60],
  contact: [5, 60 * 60],
  // Panel: intentos de login por IP y por cuenta, y códigos de MFA.
  login: [20, 15 * 60],
  loginAccount: [5, 15 * 60],
  mfa: [10, 15 * 60],
} as const satisfies Record<string, readonly [number, number]>;

export type RateLimitAction = keyof typeof RATE_LIMITS;

function salt(): string {
  return process.env.RATE_LIMIT_SALT ?? process.env.SUPABASE_SECRET_KEY ?? "avg";
}

/** Hash con sal: nunca se guarda la IP ni el email en claro (privacidad). */
export function hashKey(value: string): string {
  return createHash("sha256").update(`${salt()}:${value}`).digest("hex").slice(0, 32);
}

/** IP del cliente según las cabeceras del proxy (Vercel). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("cf-connecting-ip") ??
    "unknown"
  );
}

/**
 * Devuelve true si la petición está permitida. Por defecto limita por IP;
 * con `subject` limita por otro identificador (p. ej. la cuenta en el login).
 * Si la base de datos falla, se permite (fail-open) y se registra el error:
 * preferimos no bloquear a clientes legítimos.
 */
export async function checkRateLimit(action: RateLimitAction, subject?: string): Promise<boolean> {
  const [limit, windowSeconds] = RATE_LIMITS[action];
  try {
    const key = `${action}:${hashKey(subject ?? (await clientIp()))}`;
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

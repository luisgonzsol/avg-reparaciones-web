import "server-only";
import { clientIp } from "./rate-limit";

/** Nombre del campo que Turnstile añade al formulario. */
export const TURNSTILE_FIELD = "cf-turnstile-response";

/** Turnstile se activa solo si están las dos claves (configurable por entorno). */
export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
}

/**
 * Verifica el token de Cloudflare Turnstile en el servidor.
 * - Sin configurar: devuelve true (desarrollo).
 * - Token ausente o rechazado por Cloudflare: false.
 * - Cloudflare no responde: true (fail-open) y se registra; el honeypot y la
 *   limitación de frecuencia siguen protegiendo el formulario.
 */
export async function verifyTurnstile(formData: FormData): Promise<boolean> {
  if (!isTurnstileEnabled()) return true;
  const token = formData.get(TURNSTILE_FIELD);
  if (typeof token !== "string" || !token || token.length > 2048) return false;

  try {
    const body = new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: token,
      remoteip: await clientIp(),
    });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) console.warn("[turnstile] rechazado", data["error-codes"]?.join(","));
    return data.success === true;
  } catch (e) {
    console.error("[turnstile] sin respuesta", e instanceof Error ? e.message : e);
    return true;
  }
}

export const TURNSTILE_ERROR =
  "No pudimos comprobar que no eres un robot. Espera a que aparezca la casilla de verificación e inténtalo de nuevo.";

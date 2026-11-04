/**
 * Construye la Content-Security-Policy. Solo se permiten los orígenes
 * imprescindibles: el propio sitio, Supabase (Fase 3), Google Maps (iframe
 * del mapa) y Cloudflare Turnstile (antispam, Fase 4).
 */
export function buildCsp({
  nonce,
  isDev,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
}: {
  nonce: string;
  isDev: boolean;
  supabaseUrl?: string;
}): string {
  const supabase = supabaseUrl ? new URL(supabaseUrl).origin : "";
  const supabaseWs = supabase ? supabase.replace(/^https:/, "wss:") : "";
  const turnstile = "https://challenges.cloudflare.com";

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      turnstile,
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    // Next.js y next/font insertan estilos en línea; el nonce no cubre los
    // atributos style, por eso se permite 'unsafe-inline' solo para estilos.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", supabase].filter(Boolean),
    "font-src": ["'self'"],
    "connect-src": ["'self'", supabase, supabaseWs, turnstile].filter(Boolean),
    "frame-src": ["https://www.google.com", "https://maps.google.com", turnstile],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "manifest-src": ["'self'"],
    "worker-src": ["'self'", "blob:"],
  };

  const policy = Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");

  return isDev ? policy : `${policy}; upgrade-insecure-requests`;
}

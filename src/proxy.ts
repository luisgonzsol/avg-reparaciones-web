import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { buildCsp } from "@/lib/security/csp";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

/** Rutas del panel accesibles sin sesión. */
const PUBLIC_ADMIN_PATHS = new Set(["/admin/login"]);

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Proxy (antes "middleware"):
 *  1. Genera un nonce por petición y aplica una Content-Security-Policy estricta.
 *  2. En /admin: renueva la sesión de Supabase y, si no hay sesión, redirige
 *     al login. (Cada página y cada acción vuelve a comprobar que el usuario
 *     es administrador: el proxy es solo la primera barrera.)
 */
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp({
    nonce,
    isDev: process.env.NODE_ENV === "development",
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const next = () => NextResponse.next({ request: { headers: requestHeaders } });
  let response = next();

  const { pathname } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");

    if (isSupabaseConfigured()) {
      const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
        cookieOptions: AUTH_COOKIE_OPTIONS,
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (list, extraHeaders) => {
            for (const { name, value } of list) request.cookies.set(name, value);
            requestHeaders.set("cookie", request.cookies.toString());
            response = next();
            for (const { name, value, options } of list) {
              response.cookies.set(name, value, { ...options, ...AUTH_COOKIE_OPTIONS });
            }
            for (const [k, v] of Object.entries(extraHeaders ?? {})) response.headers.set(k, v);
            response.headers.set("X-Robots-Tag", "noindex, nofollow");
            response.headers.set("Cache-Control", "private, no-store");
          },
        },
      });

      // Verifica el JWT (y lo renueva si caducó).
      const { data } = await supabase.auth.getClaims();
      if (!data?.claims && !PUBLIC_ADMIN_PATHS.has(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        url.search = "";
        const redirect = NextResponse.redirect(url);
        for (const c of response.cookies.getAll()) redirect.cookies.set(c);
        redirect.headers.set("Content-Security-Policy", csp);
        return redirect;
      }
    }
  }

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|images|brand|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

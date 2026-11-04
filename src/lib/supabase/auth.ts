import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublishableKey, supabaseUrl } from "./config";

/**
 * Cookies de sesión del panel: httpOnly (el JavaScript del navegador no las
 * puede leer), secure en producción y sameSite=lax. Toda la autenticación
 * ocurre en el servidor, así que el navegador nunca necesita leerlas.
 */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Cliente de Supabase con la sesión del administrador (rol authenticated):
 * todas sus consultas pasan por RLS. Para Server Components, Server Actions
 * y Route Handlers.
 */
export async function getAuthClient() {
  const store = await cookies();
  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) {
            store.set(name, value, { ...options, ...AUTH_COOKIE_OPTIONS });
          }
        } catch {
          // En un Server Component no se pueden escribir cookies: el proxy
          // ya renueva la sesión en cada petición a /admin.
        }
      },
    },
  });
}

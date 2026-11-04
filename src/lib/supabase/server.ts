import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "./config";

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("Supabase no está configurado (revisa .env.local)");
    this.name = "SupabaseNotConfiguredError";
  }
}

let publicClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

const noSession = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

/**
 * Cliente con la clave PUBLICABLE (rol anon), sin sesión. Para lecturas
 * públicas del catálogo: está sujeto a RLS.
 */
export function getPublicClient(): SupabaseClient {
  if (!isSupabaseConfigured()) throw new SupabaseNotConfiguredError();
  publicClient ??= createClient(supabaseUrl, supabasePublishableKey, noSession);
  return publicClient;
}

/**
 * Cliente con la clave SECRETA (service_role). SOLO en el servidor, para las
 * operaciones que pasan por funciones RPC protegidas (crear pedidos,
 * solicitudes, mensajes, rate limiting). Nunca exponer al navegador.
 */
export function getServiceClient(): SupabaseClient {
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!isSupabaseConfigured() || !secret) throw new SupabaseNotConfiguredError();
  serviceClient ??= createClient(supabaseUrl, secret, noSession);
  return serviceClient;
}

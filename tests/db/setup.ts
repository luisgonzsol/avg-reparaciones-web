/**
 * Base de datos de pruebas: PGlite (Postgres embebido) con las migraciones
 * REALES y lo mínimo de Supabase simulado (roles, auth.uid(), auth.jwt(),
 * auth.mfa_factors). Las migraciones que solo existen en Supabase
 * (pg_cron, Storage) se omiten.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = process.cwd();
const SUPABASE_ONLY = ["_cron.sql", "_storage.sql"];

const STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (id uuid primary key);
  create table auth.mfa_factors (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    status text not null
  );
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant execute on function auth.jwt() to anon, authenticated, service_role;
`;

/**
 * Peor caso: "Automatically expose new tables" ACTIVADO en Supabase (concede
 * todo por defecto). Las migraciones deben revocar lo que sobra.
 */
const AUTO_EXPOSE = `
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

export async function createTestDb({ autoExpose = true, seed = true } = {}): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(STUBS);
  if (autoExpose) await db.exec(AUTO_EXPOSE);
  const dir = path.join(root, "supabase", "migrations");
  for (const file of readdirSync(dir).sort()) {
    if (SUPABASE_ONLY.some((s) => file.endsWith(s))) continue;
    await db.exec(readFileSync(path.join(dir, file), "utf8"));
  }
  if (seed) await db.exec(readFileSync(path.join(root, "supabase", "seed.sql"), "utf8"));
  return db;
}

export type Role = "anon" | "authenticated" | "service_role";

/**
 * Ejecuta `fn` con un rol y, opcionalmente, como un usuario concreto
 * (simula el JWT de Supabase: sub y aal).
 */
export async function asRole<T>(
  db: PGlite,
  role: Role,
  fn: () => Promise<T>,
  user?: { id: string; aal?: "aal1" | "aal2" },
): Promise<T> {
  if (user) {
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user.id]);
    await db.query("select set_config('request.jwt.claims', $1, false)", [
      JSON.stringify({ sub: user.id, aal: user.aal ?? "aal1" }),
    ]);
  }
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    if (user) {
      await db.exec("select set_config('request.jwt.claim.sub', '', false)");
      await db.exec("select set_config('request.jwt.claims', '', false)");
    }
  }
}

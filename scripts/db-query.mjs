// Ejecuta una consulta SQL de SOLO LECTURA contra la base de datos de
// Supabase indicada en .env.local (SUPABASE_DB_URL). Útil para revisiones.
//
// Uso: npm run db:query -- "select count(*) from public.products"
// La cadena de conexión NUNCA se imprime en pantalla.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.SUPABASE_DB_URL;
const sql = process.argv.slice(2).join(" ").trim();
if (!url) {
  console.error("Falta SUPABASE_DB_URL en .env.local.");
  process.exit(1);
}
if (!sql) {
  console.error('Uso: npm run db:query -- "select …"');
  process.exit(1);
}

const cli = path.join(process.cwd(), "node_modules", "supabase", "dist", "supabase.js");
const r = spawnSync(process.execPath, [cli, "db", "query", `--remote=${url}`, "--read-only", sql], {
  stdio: ["ignore", "pipe", "pipe"],
  shell: false,
});
const redact = (s) =>
  String(s ?? "")
    .split(url)
    .join("[SUPABASE_DB_URL]")
    .replace(/:[^:@/\s]+@/g, ":****@");
process.stdout.write(redact(r.stdout));
process.stderr.write(redact(r.stderr));
process.exit(r.status ?? 1);

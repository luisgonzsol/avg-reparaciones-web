// Aplica las migraciones (y opcionalmente la semilla) a la base de datos de
// Supabase indicada en .env.local (SUPABASE_DB_URL).
//
// Uso:
//   npm run db:push          → solo migraciones nuevas
//   npm run db:push -- --seed → migraciones + datos de ejemplo
//   npm run db:push -- --dry  → muestra qué se aplicaría, sin cambiar nada
//
// La cadena de conexión NUNCA se imprime en pantalla.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.SUPABASE_DB_URL;
if (!url || !url.startsWith("postgres")) {
  console.error("Falta SUPABASE_DB_URL en .env.local. Revisa docs/supabase-setup.md (paso 4).");
  process.exit(1);
}

// Se ejecuta el CLI con Node directamente (sin shell), para que caracteres
// especiales de la contraseña no se interpreten.
const cli = path.join(process.cwd(), "node_modules", "supabase", "dist", "supabase.js");
const args = [cli, "db", "push", `--remote=${url}`, "--yes"];
if (process.argv.includes("--seed")) args.push("--include-seed");
if (process.argv.includes("--dry")) args.push("--dry-run");

console.log(`Aplicando migraciones${process.argv.includes("--seed") ? " y datos de ejemplo" : ""}…`);
const r = spawnSync(process.execPath, args, { stdio: ["inherit", "pipe", "pipe"], shell: false });
const redact = (s) =>
  String(s ?? "")
    .split(url)
    .join("[SUPABASE_DB_URL]")
    .replace(/:[^:@/]+@/g, ":****@");
process.stdout.write(redact(r.stdout));
process.stderr.write(redact(r.stderr));
process.exit(r.status ?? 1);

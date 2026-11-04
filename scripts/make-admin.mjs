// Da acceso al panel (/admin) a un usuario que YA existe en Supabase Auth.
//
// Pasos:
//   1. En Supabase → Authentication → Users → "Add user" → "Create new user",
//      crea el usuario con su email y una contraseña (marca "Auto Confirm User").
//   2. Ejecuta:  node scripts/make-admin.mjs correo@ejemplo.com owner
//      (owner = propietario, staff = equipo; por defecto owner)
//   Para quitar el acceso:  node scripts/make-admin.mjs correo@ejemplo.com --remove
//
// Usa la clave secreta de .env.local. No muestra ninguna clave en pantalla.
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local.");
  process.exit(1);
}

const [emailArg, roleArg] = process.argv.slice(2);
const email = (emailArg ?? "").trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Uso: node scripts/make-admin.mjs correo@ejemplo.com [owner|staff|--remove]");
  process.exit(1);
}
const remove = roleArg === "--remove";
const role = remove ? null : (roleArg ?? "owner");
if (!remove && !["owner", "staff"].includes(role)) {
  console.error("El rol debe ser owner (propietario) o staff (equipo).");
  process.exit(1);
}

const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

// Busca el usuario por email (paginando por si hay muchos).
let user = null;
for (let page = 1; page <= 20 && !user; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error("No se pudo consultar los usuarios:", error.message);
    process.exit(1);
  }
  user = data.users.find((u) => u.email?.toLowerCase() === email) ?? null;
  if (data.users.length < 200) break;
}
if (!user) {
  console.error(`No existe ningún usuario con el email ${email}.`);
  console.error("Créalo primero en Supabase → Authentication → Users → Add user.");
  process.exit(1);
}

if (remove) {
  const { error } = await supabase.from("admins").delete().eq("user_id", user.id);
  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
  console.log(`✅ ${email} ya no tiene acceso al panel.`);
  process.exit(0);
}

const { error } = await supabase
  .from("admins")
  .upsert({ user_id: user.id, role, email }, { onConflict: "user_id" });
if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
console.log(`✅ ${email} ya es administrador (${role === "owner" ? "propietario" : "equipo"}).`);
console.log("   Entra en /admin/login con su email y contraseña.");

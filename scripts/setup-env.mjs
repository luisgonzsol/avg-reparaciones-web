// Asistente para guardar los datos SECRETOS de Supabase en .env.local sin
// tener que editar el archivo a mano. Lo que escribes no se muestra en
// pantalla y no se envía a ningún sitio: solo se guarda en .env.local.
//
// Uso: npm run setup:env
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { stdin, stdout } from "node:process";

const FILE = ".env.local";
const POOLER =
  "postgresql://postgres.ldudfupxmuqymiiidlab:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

/** Pide un valor sin mostrarlo (muestra * por cada carácter). */
function askHidden(question) {
  return new Promise((resolve) => {
    stdout.write(question);
    let value = "";
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode?.(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          return resolve(value.trim());
        }
        if (ch === "\u0003") process.exit(1); // Ctrl+C
        if (ch === "\u007f" || ch === "\b") {
          if (value.length) {
            value = value.slice(0, -1);
            stdout.write("\b \b");
          }
          continue;
        }
        value += ch;
        stdout.write("*");
      }
    };
    stdin.on("data", onData);
  });
}

function setVar(text, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  return re.test(text) ? text.replace(re, () => line) : `${text.trimEnd()}\n${line}\n`;
}

let env = existsSync(FILE) ? readFileSync(FILE, "utf8") : "";

console.log("\n=== Configuración de Supabase para AVG Reparaciones ===\n");
console.log("Para pegar en esta ventana: clic derecho, o Ctrl+V. Verás asteriscos (*) en lugar del texto.\n");

// Una secret key real solo tiene letras, números, "_" y "-" y unos 40+ caracteres.
// Si se copia la versión oculta de la pantalla (con •••), no sirve.
const validSecret = (s) => /^sb_secret_[A-Za-z0-9_-]{20,}$/.test(s);

let secret = "";
while (!validSecret(secret)) {
  secret = await askHidden("1) Pega la SECRET KEY (empieza por sb_secret_) y pulsa Enter: ");
  if (!validSecret(secret)) {
    console.log("   ✗ Esa clave no es válida o está incompleta.");
    console.log(
      "     En Supabase, usa el BOTÓN DE COPIAR (📋) junto a la clave; no la selecciones con el ratón",
    );
    console.log("     (la pantalla la muestra oculta con puntitos •••). Prueba de nuevo.\n");
  }
}
console.log("   ✓ Secret key recibida.\n");

const currentDb = env.match(/^SUPABASE_DB_URL=(postgresql:\/\/\S+)$/m)?.[1] ?? "";
const hasDb = currentDb.includes("@") && !currentDb.includes("YOUR-PASSWORD");

let password = "";
while (password.length < 6) {
  password = await askHidden(
    hasDb
      ? "2) Ya hay una contraseña guardada. Pulsa Enter para conservarla, o pega una nueva: "
      : "2) Escribe o pega la CONTRASEÑA DE LA BASE DE DATOS y pulsa Enter: ",
  );
  if (hasDb && password === "") break;
  if (password.length < 6) console.log("   ✗ Contraseña demasiado corta. Prueba de nuevo.\n");
}
console.log(password ? "   ✓ Contraseña recibida.\n" : "   ✓ Se conserva la contraseña guardada.\n");

env = setVar(env, "SUPABASE_SECRET_KEY", secret);
if (password)
  env = setVar(env, "SUPABASE_DB_URL", POOLER.replace("[YOUR-PASSWORD]", encodeURIComponent(password)));
writeFileSync(FILE, env, "utf8");

console.log("✅ Listo. Datos guardados en .env.local (este archivo no se sube a git).");
console.log("   Ya puedes cerrar esta ventana y volver al chat.\n");

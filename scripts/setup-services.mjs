// Asistente para guardar en .env.local las claves de Resend (emails) y de
// Cloudflare Turnstile (antispam). Las claves secretas no se muestran en
// pantalla y no se envían a ningún sitio: solo se guardan en .env.local.
//
// Uso: node scripts/setup-services.mjs
// Deja una respuesta vacía (pulsa Enter) para no cambiar ese valor.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const FILE = ".env.local";

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
        if (ch === "\u0003") process.exit(1);
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

async function ask(question) {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

function setVar(text, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  return re.test(text) ? text.replace(re, () => line) : `${text.trimEnd()}\n${line}\n`;
}
const has = (text, key) => new RegExp(`^${key}=\\S+`, "m").test(text);

let env = existsSync(FILE) ? readFileSync(FILE, "utf8") : "";
const changed = [];
const state = (key) => (has(env, key) ? "(ya guardada; Enter para mantenerla)" : "(Enter para omitir)");

console.log("\n=== Emails (Resend) y antispam (Turnstile) ===\n");
console.log("Para pegar: clic derecho o Ctrl+V. Las claves se ven como asteriscos (*).\n");

// --- Resend ---
const resend = await askHidden(`API key de Resend, empieza por re_ ${state("RESEND_API_KEY")}: `);
if (resend) {
  if (/^re_[A-Za-z0-9_-]{10,}$/.test(resend)) {
    env = setVar(env, "RESEND_API_KEY", resend);
    changed.push("RESEND_API_KEY");
  } else console.log("  ✗ No parece una API key de Resend (re_…). No se guardó.");
}
const from = await ask(`Remitente, p. ej. AVG Reparaciones <avisos@tudominio.com> ${state("EMAIL_FROM")}: `);
if (from) {
  if (/^[^<>]*<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>$|^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)) {
    env = setVar(env, "EMAIL_FROM", `"${from.replace(/"/g, "")}"`);
    changed.push("EMAIL_FROM");
  } else console.log("  ✗ Formato no válido. No se guardó.");
}
const to = await ask(`Email que recibe los avisos de la web ${state("EMAIL_NOTIFY_TO")}: `);
if (to) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    env = setVar(env, "EMAIL_NOTIFY_TO", to);
    changed.push("EMAIL_NOTIFY_TO");
  } else console.log("  ✗ Email no válido. No se guardó.");
}

// --- Turnstile ---
const site = await ask(
  `\nSite Key de Turnstile, empieza por 0x ${state("NEXT_PUBLIC_TURNSTILE_SITE_KEY")}: `,
);
if (site) {
  if (/^0x[A-Za-z0-9_-]{10,}$/.test(site)) {
    env = setVar(env, "NEXT_PUBLIC_TURNSTILE_SITE_KEY", site);
    changed.push("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
  } else console.log("  ✗ No parece una Site Key (0x…). No se guardó.");
}
const secret = await askHidden(`Secret Key de Turnstile, empieza por 0x ${state("TURNSTILE_SECRET_KEY")}: `);
if (secret) {
  if (/^0x[A-Za-z0-9_-]{10,}$/.test(secret)) {
    env = setVar(env, "TURNSTILE_SECRET_KEY", secret);
    changed.push("TURNSTILE_SECRET_KEY");
  } else console.log("  ✗ No parece una Secret Key (0x…). No se guardó.");
}

if (changed.length) {
  writeFileSync(FILE, env.endsWith("\n") ? env : `${env}\n`);
  console.log(`\n✅ Guardado en ${FILE}: ${changed.join(", ")}`);
  console.log("   Reinicia el servidor (Ctrl+C y npm.cmd run dev) para que se apliquen.");
} else {
  console.log("\nNo se cambió nada.");
}

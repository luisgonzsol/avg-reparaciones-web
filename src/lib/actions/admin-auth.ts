"use server";
/**
 * Acceso al panel: login con email y contraseña, segundo paso (TOTP),
 * activación/desactivación de MFA, cambio de contraseña y cierre de sesión.
 *
 * - Limitación de intentos por IP y por cuenta (hash, sin guardar el email).
 * - Mensajes de error genéricos: no revelan si el email existe.
 * - Solo entran usuarios presentes en la tabla `admins`.
 */
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthClient } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { TURNSTILE_ERROR, verifyTurnstile } from "@/lib/security/turnstile";
import { requireAdmin } from "@/lib/admin/session";

export type AuthFormState = { error?: string; ok?: string } | null;

const LOGIN_ERROR = "Email o contraseña incorrectos.";
const LOCKED = "Demasiados intentos. Por seguridad, espera 15 minutos antes de volver a intentarlo.";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return { error: "Supabase no está configurado." };
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: LOGIN_ERROR };
  const { email, password } = parsed.data;

  if (!(await verifyTurnstile(formData))) return { error: TURNSTILE_ERROR };
  const [byIp, byAccount] = await Promise.all([
    checkRateLimit("login"),
    checkRateLimit("loginAccount", `account:${email}`),
  ]);
  if (!byIp || !byAccount) return { error: LOCKED };

  const supabase = await getAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: LOGIN_ERROR };

  const { data: admin } = await supabase
    .from("admins")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!admin) {
    // Puede que tenga MFA y aún esté en aal1: la política deja ver su propia fila,
    // así que si no aparece, no es administrador.
    await supabase.auth.signOut();
    return { error: LOGIN_ERROR };
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  redirect(aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2" ? "/admin/login/mfa" : "/admin");
}

const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/);

export async function verifyMfa(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await getAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const code = codeSchema.safeParse(formData.get("code"));
  if (!code.success) return { error: "Escribe los 6 números que muestra tu app." };
  if (!(await checkRateLimit("mfa", `mfa:${user.id}`))) return { error: LOCKED };

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp?.[0];
  if (!factor) redirect("/admin");

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.data });
  if (error) return { error: "Código incorrecto o caducado. Prueba con el siguiente código." };
  redirect("/admin");
}

export async function logout(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await getAuthClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

/* ---------- MFA (desde /admin/seguridad) ---------- */

export type EnrollState =
  | { step: "idle"; error?: string }
  | { step: "scan"; factorId: string; qr: string; secret: string; error?: string }
  | { step: "done" };

export async function startMfaEnroll(): Promise<EnrollState> {
  const { supabase } = await requireAdmin();
  // Limpia intentos anteriores sin terminar.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) {
    if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  if (factors?.totp?.length) return { step: "done" };

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `Panel AVG ${new Date().toISOString().slice(0, 10)}`,
  });
  if (error || !data) {
    console.error("[mfa] enroll", error?.message);
    return { step: "idle", error: "No se pudo iniciar la activación. Inténtalo de nuevo." };
  }
  return { step: "scan", factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

export async function confirmMfaEnroll(prev: EnrollState, formData: FormData): Promise<EnrollState> {
  const { supabase, user } = await requireAdmin();
  if (prev.step !== "scan") return prev;
  const code = codeSchema.safeParse(formData.get("code"));
  if (!code.success) return { ...prev, error: "Escribe los 6 números que muestra tu app." };
  if (!(await checkRateLimit("mfa", `mfa:${user.id}`))) return { ...prev, error: LOCKED };

  const factorId = z.string().uuid().safeParse(prev.factorId);
  if (!factorId.success) return { step: "idle" };
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factorId.data, code: code.data });
  if (error)
    return { ...prev, error: "Código incorrecto. Revisa que la hora del móvil esté bien y prueba otra vez." };
  return { step: "done" };
}

export async function removeMfa(): Promise<AuthFormState> {
  const { supabase, mfaEnabled } = await requireAdmin();
  if (!mfaEnabled) return { error: "La verificación en dos pasos no está activada." };
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) await supabase.auth.mfa.unenroll({ factorId: f.id });
  // Tras quitar el factor, la sesión debe renovarse.
  await supabase.auth.refreshSession();
  return { ok: "Verificación en dos pasos desactivada." };
}

/* ---------- Contraseña ---------- */

const passwordSchema = z
  .object({
    password: z.string().min(12, "Usa al menos 12 caracteres.").max(72, "Máximo 72 caracteres."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Las contraseñas no coinciden.", path: ["confirm"] });

export async function changePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const { supabase } = await requireAdmin();
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Contraseña no válida." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    console.error("[password]", error.code ?? error.message);
    return {
      error:
        error.code === "same_password"
          ? "La nueva contraseña debe ser distinta de la actual."
          : error.code === "weak_password"
            ? "Esa contraseña es demasiado débil. Usa una más larga y difícil de adivinar."
            : "No se pudo cambiar la contraseña. Cierra sesión, vuelve a entrar e inténtalo de nuevo.",
    };
  }
  return { ok: "Contraseña cambiada." };
}

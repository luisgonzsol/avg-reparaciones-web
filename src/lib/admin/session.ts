import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getAuthClient } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AdminRole = "owner" | "staff";

export type AdminSession =
  | { status: "unconfigured" }
  | { status: "anonymous" }
  | { status: "mfa_required"; supabase: SupabaseClient; user: User }
  | { status: "forbidden"; supabase: SupabaseClient; user: User }
  | { status: "ok"; supabase: SupabaseClient; user: User; role: AdminRole; mfaEnabled: boolean };

/**
 * Estado de la sesión del panel (una vez por petición).
 *  - getUser() valida la sesión contra el servidor de Auth (no se fía de la cookie).
 *  - Si el usuario tiene MFA activado, exige haber pasado el segundo paso (aal2).
 *  - Comprueba que el usuario está en la tabla `admins`.
 */
export const getAdminSession = cache(async (): Promise<AdminSession> => {
  if (!isSupabaseConfigured()) return { status: "unconfigured" };
  const supabase = await getAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anonymous" };

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    return { status: "mfa_required", supabase, user };
  }

  const { data: admin } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  if (!admin) return { status: "forbidden", supabase, user };

  return {
    status: "ok",
    supabase,
    user,
    role: admin.role as AdminRole,
    mfaEnabled: aal?.nextLevel === "aal2",
  };
});

export type ActiveAdmin = Extract<AdminSession, { status: "ok" }>;

/**
 * Exige un administrador con la sesión completa. Úsalo al principio de CADA
 * página y CADA acción del panel (el proxy es solo la primera barrera).
 */
export async function requireAdmin(): Promise<ActiveAdmin> {
  const session = await getAdminSession();
  switch (session.status) {
    case "ok":
      return session;
    case "mfa_required":
      redirect("/admin/login/mfa");
    case "forbidden":
      await session.supabase.auth.signOut();
      redirect("/admin/login?error=forbidden");
    default:
      redirect("/admin/login");
  }
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { logout } from "@/lib/actions/admin-auth";
import { MfaForm } from "@/components/admin/auth-forms";
import { AuthCard } from "../auth-card";

export const metadata: Metadata = { title: "Verificación en dos pasos" };

export default async function MfaPage() {
  const session = await getAdminSession();
  if (session.status === "ok") redirect("/admin");
  if (session.status !== "mfa_required") redirect("/admin/login");

  return (
    <AuthCard
      title="Verificación en dos pasos"
      subtitle="Abre tu app de autenticación (Google Authenticator, Microsoft Authenticator…) y escribe el código de AVG Reparaciones."
    >
      <MfaForm />
      <form action={logout} className="mt-6">
        <button
          type="submit"
          className="min-h-11 text-sm font-semibold text-ink-soft underline underline-offset-4"
        >
          Cancelar y salir
        </button>
      </form>
    </AuthCard>
  );
}

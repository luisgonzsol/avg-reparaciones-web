import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { LoginForm } from "@/components/admin/auth-forms";
import { AuthCard } from "./auth-card";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const session = await getAdminSession();
  if (session.status === "ok") redirect("/admin");
  if (session.status === "mfa_required") redirect("/admin/login/mfa");

  const { error } = await searchParams;
  return (
    <AuthCard title="Panel de administración" subtitle="Acceso solo para el equipo de AVG Reparaciones.">
      {session.status === "unconfigured" ? (
        <p className="text-ink-soft">Supabase no está configurado en este entorno.</p>
      ) : (
        <LoginForm
          initialError={error === "forbidden" ? "Esta cuenta no tiene acceso al panel." : undefined}
        />
      )}
    </AuthCard>
  );
}

import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { AdminHeader, Card } from "@/components/admin/ui";
import { MfaSetup, PasswordForm } from "@/components/admin/mfa-setup";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function SecurityPage() {
  const { user, mfaEnabled } = await requireAdmin();
  return (
    <>
      <AdminHeader title="Mi cuenta" description={`Sesión iniciada como ${user.email}.`} />
      <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
        <Card title="Verificación en dos pasos">
          <MfaSetup enabled={mfaEnabled} />
        </Card>
        <Card title="Cambiar contraseña">
          <PasswordForm />
        </Card>
      </div>
    </>
  );
}

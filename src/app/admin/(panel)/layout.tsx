import Link from "next/link";
import { requireAdmin } from "@/lib/admin/session";
import { logout } from "@/lib/actions/admin-auth";
import { AdminNav } from "@/components/admin/nav";
import { Logo } from "@/components/brand/logo";

/**
 * Estructura del panel. requireAdmin() aquí protege todas las páginas, pero
 * cada página y cada acción lo vuelven a comprobar (los layouts no se
 * re-ejecutan en todas las navegaciones).
 */
export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const { supabase, user, role } = await requireAdmin();

  const [orders, requests, messages] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending_payment", "paid"]),
    supabase.from("repair_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).is("read_at", null),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col lg:flex-row">
      <aside className="border-b border-line bg-surface px-4 py-4 lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0 lg:py-6">
        <div className="mb-4 flex items-center justify-between gap-3 lg:mb-8 lg:flex-col lg:items-start">
          <Link href="/admin" className="inline-flex min-h-11 items-center" aria-label="Resumen del panel">
            <Logo height={36} />
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-ink-soft underline-offset-4 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver la web <span className="sr-only">(se abre en una pestaña nueva)</span>
          </Link>
        </div>
        <AdminNav
          badges={{
            "/admin/pedidos": orders.count ?? 0,
            "/admin/solicitudes": requests.count ?? 0,
            "/admin/mensajes": messages.count ?? 0,
          }}
        />
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4 text-sm lg:mt-8 lg:flex-col lg:items-start">
          <p className="min-w-0 truncate text-muted" title={user.email ?? undefined}>
            {user.email}
            <span className="block text-xs">{role === "owner" ? "Propietario" : "Equipo"}</span>
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="min-h-11 rounded-full px-4 font-semibold ring-1 ring-line hover:ring-ink/40"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main id="contenido" className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}

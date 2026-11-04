import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/session";
import {
  AdminHeader,
  Card,
  EmptyState,
  Pager,
  Table,
  Td,
  adminDateTime,
  pageParam,
  param,
} from "@/components/admin/ui";
import { adminControl } from "@/components/admin/form";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Auditoría" };
const PAGE = 40;

const ENTITY_LABEL: Record<string, string> = {
  products: "Producto",
  categories: "Categoría",
  brands: "Marca",
  exchange_rates: "Tasa",
  settings: "Ajustes",
  orders: "Pedido",
  repair_requests: "Solicitud",
};
const ACTION_LABEL: Record<string, string> = { insert: "creó", update: "cambió", delete: "borró" };

const FIELD_LABEL: Record<string, string> = {
  price_usd: "precio",
  stock: "stock",
  active: "visible",
  featured: "destacado",
  name: "nombre",
  status: "estado",
  payment_link: "enlace de cobro",
  admin_notes: "notas",
  rate: "tasa",
};

/** Resumen corto de los campos que cambiaron (sin volcar datos personales). */
function summarize(
  entity: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): string {
  if (!after && before) return String(before.name ?? before.sku ?? before.rate ?? "");
  if (after && !before) return String(after.name ?? after.sku ?? (after.rate ? `Bs ${after.rate}` : ""));
  if (!after) return "";
  const parts = Object.keys(after)
    .filter((k) => !(entity === "orders" && k === "stock_state") && k !== "reserved")
    .slice(0, 6)
    .map((k) => {
      const label = FIELD_LABEL[k] ?? k.replace(/_/g, " ");
      if (["admin_notes", "description", "compatibility", "schedule"].includes(k)) return label;
      return `${label}: ${String(before?.[k] ?? "—")} → ${String(after[k] ?? "—")}`;
    });
  return parts.join(" · ");
}

export default async function AuditPage({ searchParams }: PageProps<"/admin/auditoria">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const entity = param(sp, "tipo");
  const page = pageParam(sp);

  let query = supabase
    .from("audit_log")
    .select("id, admin_id, action, entity, entity_id, before, after, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (ENTITY_LABEL[entity]) query = query.eq("entity", entity);
  const { data, count } = await query;

  // Nombres de los administradores (solo de los que aparecen).
  const { data: admins } = await supabase.from("admins").select("user_id, email, role");
  const who = (id: string | null) => {
    if (!id) return "Sistema";
    const a = admins?.find((x) => x.user_id === id);
    return a?.email ?? (a ? (a.role === "owner" ? "Propietario" : "Equipo") : "Usuario eliminado");
  };

  const linkFor = (e: string, id: string | null) =>
    !id
      ? null
      : e === "products"
        ? `/admin/productos/${id}`
        : e === "orders"
          ? `/admin/pedidos/${id}`
          : e === "repair_requests"
            ? `/admin/solicitudes/${id}`
            : null;

  return (
    <>
      <AdminHeader
        title="Auditoría"
        description="Quién cambió qué y cuándo: precios, stock, estados, tasa y ajustes."
      />
      <Card>
        <form className="mb-5 flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="tipo">
            Tipo
          </label>
          <select id="tipo" name="tipo" defaultValue={entity} className={`${adminControl} min-h-12 max-w-xs`}>
            <option value="">Todo</option>
            {Object.entries(ENTITY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button type="submit" className={buttonClasses("secondary")}>
            Filtrar
          </button>
        </form>
        {data?.length ? (
          <Table head={["Cuándo", "Quién", "Qué", "Detalle"]}>
            {data.map((a) => {
              const href = linkFor(a.entity, a.entity_id);
              const label = `${ACTION_LABEL[a.action] ?? a.action} ${(ENTITY_LABEL[a.entity] ?? a.entity).toLowerCase()}`;
              return (
                <tr key={a.id}>
                  <Td className="text-sm whitespace-nowrap">
                    {adminDateTime.format(new Date(a.created_at))}
                  </Td>
                  <Td>{who(a.admin_id)}</Td>
                  <Td className="whitespace-nowrap">
                    {href ? (
                      <Link href={href} className="underline underline-offset-4">
                        {label}
                      </Link>
                    ) : (
                      label
                    )}
                  </Td>
                  <Td className="text-sm break-words text-ink-soft">
                    {summarize(a.entity, a.before, a.after)}
                  </Td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <EmptyState>Todavía no hay cambios registrados.</EmptyState>
        )}
        <Pager
          page={page}
          total={count ?? 0}
          pageSize={PAGE}
          href={(p) =>
            `/admin/auditoria?${new URLSearchParams({ ...(entity ? { tipo: entity } : {}), ...(p > 1 ? { pagina: String(p) } : {}) })}`
          }
        />
      </Card>
    </>
  );
}

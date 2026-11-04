import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/session";
import {
  REPAIR_STATUSES,
  REPAIR_STATUS_LABEL,
  REPAIR_STATUS_TONE,
  isRepairStatus,
  type RepairStatus,
} from "@/lib/status";
import {
  AdminHeader,
  Badge,
  Card,
  EmptyState,
  Pager,
  Table,
  Td,
  adminDateTime,
  pageParam,
  param,
  searchTerm,
} from "@/components/admin/ui";
import { adminControl } from "@/components/admin/form";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Solicitudes de reparación" };
const PAGE = 25;

export default async function RepairRequestsPage({ searchParams }: PageProps<"/admin/solicitudes">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const status = param(sp, "estado");
  const q = searchTerm(param(sp, "q"));
  const page = pageParam(sp);

  let query = supabase
    .from("repair_requests")
    .select(
      "id, request_number, customer_name, customer_phone, city, equipment_type, brand, status, created_at, repair_request_photos(count)",
      {
        count: "exact",
      },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (isRepairStatus(status)) query = query.eq("status", status);
  if (q) {
    const like = `%${q}%`;
    query = query.or(
      `request_number.ilike.${like},customer_name.ilike.${like},customer_phone.ilike.${like},equipment_type.ilike.${like},brand.ilike.${like}`,
    );
  }
  const { data, count, error } = await query;
  if (error) console.error("[admin] solicitudes", error.code, error.message);

  const href = (p: number) => {
    const s = new URLSearchParams();
    if (status) s.set("estado", status);
    if (q) s.set("q", q);
    if (p > 1) s.set("pagina", String(p));
    const qs = s.toString();
    return `/admin/solicitudes${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <AdminHeader
        title="Solicitudes de reparación"
        description="Lo que los clientes piden desde «Solicitar reparación»."
      />
      <Card>
        <form className="mb-5 grid gap-3 sm:grid-cols-[1fr_14rem_auto]" role="search">
          <label className="sr-only" htmlFor="q">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Número, nombre, teléfono, equipo o marca"
            className={`${adminControl} min-h-12`}
          />
          <label className="sr-only" htmlFor="estado">
            Estado
          </label>
          <select id="estado" name="estado" defaultValue={status} className={`${adminControl} min-h-12`}>
            <option value="">Todos los estados</option>
            {REPAIR_STATUSES.map((s) => (
              <option key={s} value={s}>
                {REPAIR_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <button type="submit" className={buttonClasses("secondary")}>
            Filtrar
          </button>
        </form>

        {data?.length ? (
          <Table head={["Solicitud", "Cliente", "Equipo", "Fotos", "Estado"]}>
            {data.map((r) => {
              const photos = (r.repair_request_photos as unknown as { count: number }[])?.[0]?.count ?? 0;
              return (
                <tr key={r.id} className="hover:bg-sand/40">
                  <Td>
                    <Link
                      href={`/admin/solicitudes/${r.id}`}
                      className="font-semibold underline-offset-4 hover:underline"
                    >
                      {r.request_number}
                    </Link>
                    <span className="block text-sm text-muted">
                      {adminDateTime.format(new Date(r.created_at))}
                    </span>
                  </Td>
                  <Td>
                    {r.customer_name}
                    <span className="block text-sm text-muted">
                      {r.customer_phone} · {r.city}
                    </span>
                  </Td>
                  <Td>
                    {r.equipment_type}
                    <span className="block text-sm text-muted">{r.brand}</span>
                  </Td>
                  <Td>{photos || "—"}</Td>
                  <Td>
                    <Badge tone={REPAIR_STATUS_TONE[r.status as RepairStatus]}>
                      {REPAIR_STATUS_LABEL[r.status as RepairStatus]}
                    </Badge>
                  </Td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <EmptyState>
            {q || status ? "No hay solicitudes con esos filtros." : "Todavía no hay solicitudes."}
          </EmptyState>
        )}
        <Pager page={page} total={count ?? 0} pageSize={PAGE} href={href} />
      </Card>
    </>
  );
}

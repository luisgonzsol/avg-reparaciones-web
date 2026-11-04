import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/session";
import { formatUsd } from "@/lib/money";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  isOrderStatus,
  type OrderStatus,
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

export const metadata: Metadata = { title: "Pedidos" };
const PAGE = 25;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const status = param(sp, "estado");
  const q = searchTerm(param(sp, "q"));
  const page = pageParam(sp);

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_phone, delivery_method, status, subtotal_usd, created_at",
      {
        count: "exact",
      },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (isOrderStatus(status)) query = query.eq("status", status);
  if (q) {
    // searchTerm() elimina comas y paréntesis: no se puede alterar el filtro.
    const like = `%${q}%`;
    query = query.or(
      `order_number.ilike.${like},customer_name.ilike.${like},customer_phone.ilike.${like},customer_email.ilike.${like},customer_id_doc.ilike.${like}`,
    );
  }
  const { data, count, error } = await query;
  if (error) console.error("[admin] pedidos", error.code, error.message);

  const href = (p: number) => {
    const s = new URLSearchParams();
    if (status) s.set("estado", status);
    if (q) s.set("q", q);
    if (p > 1) s.set("pagina", String(p));
    const qs = s.toString();
    return `/admin/pedidos${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <AdminHeader
        title="Pedidos"
        description="Envía el enlace de cobro y sigue cada pedido hasta la entrega."
      />
      <Card>
        <form className="mb-5 grid gap-3 sm:grid-cols-[1fr_16rem_auto]" role="search">
          <label className="sr-only" htmlFor="q">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Número, nombre, teléfono, email o cédula"
            className={`${adminControl} min-h-12`}
          />
          <label className="sr-only" htmlFor="estado">
            Estado
          </label>
          <select id="estado" name="estado" defaultValue={status} className={`${adminControl} min-h-12`}>
            <option value="">Todos los estados</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <button type="submit" className={buttonClasses("secondary")}>
            Filtrar
          </button>
        </form>

        {data?.length ? (
          <Table head={["Pedido", "Cliente", "Entrega", "Total", "Estado"]}>
            {data.map((o) => (
              <tr key={o.id} className="hover:bg-sand/40">
                <Td>
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="font-semibold underline-offset-4 hover:underline"
                  >
                    {o.order_number}
                  </Link>
                  <span className="block text-sm text-muted">
                    {adminDateTime.format(new Date(o.created_at))}
                  </span>
                </Td>
                <Td>
                  {o.customer_name}
                  <span className="block text-sm text-muted">{o.customer_phone}</span>
                </Td>
                <Td>{o.delivery_method === "store_pickup" ? "Retiro" : "Envío"}</Td>
                <Td className="font-semibold">{formatUsd(Number(o.subtotal_usd))}</Td>
                <Td>
                  <Badge tone={ORDER_STATUS_TONE[o.status as OrderStatus]}>
                    {ORDER_STATUS_LABEL[o.status as OrderStatus]}
                  </Badge>
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState>
            {q || status ? "No hay pedidos con esos filtros." : "Todavía no hay pedidos."}
          </EmptyState>
        )}
        <Pager page={page} total={count ?? 0} pageSize={PAGE} href={href} />
      </Card>
    </>
  );
}

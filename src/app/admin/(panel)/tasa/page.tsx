import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { addExchangeRate } from "@/lib/actions/admin";
import { formatRate } from "@/lib/money";
import {
  AdminHeader,
  Badge,
  Card,
  EmptyState,
  Table,
  Td,
  adminDate,
  adminDateTime,
} from "@/components/admin/ui";
import { ActionForm, Input } from "@/components/admin/form";

export const metadata: Metadata = { title: "Tasa del día" };

export default async function RatePage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("exchange_rates")
    .select("id, rate, effective_date, note, created_at")
    .order("effective_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(new Date());
  const current = data?.[0];

  return (
    <>
      <AdminHeader
        title="Tasa del día"
        description="Tasa USD → Bs que usa la tienda para mostrar los precios en bolívares. Los pedidos guardan la tasa del momento en que se hicieron."
      />
      <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
        <Card title="Nueva tasa">
          {current && (
            <p className="mb-5 text-ink-soft">
              Vigente: <strong className="text-ink">Bs {formatRate(Number(current.rate))}</strong> desde el{" "}
              {adminDate.format(new Date(`${current.effective_date}T12:00:00`))}.
            </p>
          )}
          <ActionForm action={addExchangeRate} submitLabel="Guardar tasa" resetOnSuccess>
            <Input
              name="rate"
              label="Bs por 1 USD"
              inputMode="decimal"
              placeholder="236,45"
              required
              autoComplete="off"
            />
            <Input name="effectiveDate" label="Fecha" type="date" defaultValue={today} max={today} required />
            <Input name="note" label="Nota" maxLength={200} placeholder="Ej.: tasa BCV" />
          </ActionForm>
        </Card>
        <Card title="Historial">
          {data?.length ? (
            <Table head={["Fecha", "Tasa", "Nota", "Cargada"]}>
              {data.map((r, i) => (
                <tr key={r.id}>
                  <Td>
                    {adminDate.format(new Date(`${r.effective_date}T12:00:00`))}{" "}
                    {i === 0 && <Badge tone="success">Vigente</Badge>}
                  </Td>
                  <Td className="font-semibold">{formatRate(Number(r.rate))}</Td>
                  <Td>{r.note}</Td>
                  <Td className="text-sm text-muted">{adminDateTime.format(new Date(r.created_at))}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState>No hay ninguna tasa cargada.</EmptyState>
          )}
        </Card>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/session";
import { updateRepairRequest } from "@/lib/actions/admin";
import { DELIVERY_METHODS, type DeliveryMethod } from "@/content/forms";
import { whatsappUrl } from "@/lib/whatsapp";
import { REPAIR_STATUSES, REPAIR_STATUS_LABEL, REPAIR_STATUS_TONE, type RepairStatus } from "@/lib/status";
import { AdminHeader, Badge, Card, EmptyState, adminDateTime } from "@/components/admin/ui";
import { ActionForm, Select, Textarea } from "@/components/admin/form";
import { ExternalButton } from "@/components/ui/button";
import { IconWhatsApp } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Solicitud de reparación" };

/** Las fotos están en un bucket PRIVADO: se muestran con URLs firmadas de 10 minutos. */
const SIGNED_URL_SECONDS = 600;

export default async function RepairRequestDetail({ params }: PageProps<"/admin/solicitudes/[id]">) {
  const { supabase } = await requireAdmin();
  const id = z
    .string()
    .uuid()
    .safeParse((await params).id);
  if (!id.success) notFound();

  const { data: r } = await supabase
    .from("repair_requests")
    .select("*, repair_request_photos(id, path)")
    .eq("id", id.data)
    .maybeSingle();
  if (!r) notFound();

  const photos = (r.repair_request_photos ?? []) as { id: number; path: string }[];
  let signed: { url: string; id: number }[] = [];
  if (photos.length) {
    const { data, error } = await supabase.storage.from("repair-photos").createSignedUrls(
      photos.map((p) => p.path),
      SIGNED_URL_SECONDS,
    );
    if (error) console.error("[admin] fotos firmadas", error.message);
    signed = (data ?? [])
      .map((d, i) => ({ url: d.signedUrl, id: photos[i]!.id }))
      .filter((d): d is { url: string; id: number } => Boolean(d.url));
  }

  const status = r.status as RepairStatus;
  const firstName = String(r.customer_name).split(" ")[0] ?? "";
  const delivery = DELIVERY_METHODS[r.delivery_method as DeliveryMethod]?.label ?? r.delivery_method;

  return (
    <>
      <AdminHeader
        back={{ href: "/admin/solicitudes", label: "Solicitudes" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {r.request_number} <Badge tone={REPAIR_STATUS_TONE[status]}>{REPAIR_STATUS_LABEL[status]}</Badge>
          </span>
        }
        description={`Recibida el ${adminDateTime.format(new Date(r.created_at))}`}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="flex flex-col gap-6">
          <Card title="Equipo y falla">
            <dl className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["Equipo", r.equipment_type],
                  ["Marca", r.brand],
                  ["Modelo", r.model],
                  ["Entrega", delivery],
                  ["Devolución por envío", r.return_shipping ? "Sí (coste extra)" : "No, retira en el local"],
                ] as [string, string | null][]
              )
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-sm text-muted">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted">Falla</dt>
                <dd className="font-medium whitespace-pre-line">{r.issue}</dd>
              </div>
            </dl>
          </Card>

          <Card title={`Fotos (${photos.length})`}>
            {signed.length ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {signed.map((p, i) => (
                  <li key={p.id}>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-xl ring-1 ring-line"
                    >
                      {/* URL firmada temporal de Supabase (bucket privado): no pasa por next/image. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={`Foto ${i + 1} del equipo`}
                        className="aspect-square w-full object-cover"
                      />
                      <span className="sr-only">(abrir en tamaño completo, pestaña nueva)</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>
                {photos.length ? "No se pudieron cargar las fotos." : "El cliente no envió fotos."}
              </EmptyState>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Cliente">
            <dl className="space-y-2 text-[0.95rem]">
              {(
                [
                  ["Nombre", r.customer_name],
                  ["Teléfono", r.customer_phone],
                  ["Email", r.customer_email],
                  ["Ubicación", `${r.city}, ${r.state}`],
                ] as [string, string | null][]
              )
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-sm text-muted">{k}</dt>
                    <dd className="font-medium break-words">{v}</dd>
                  </div>
                ))}
            </dl>
            <ExternalButton
              href={whatsappUrl(
                `¡Hola, ${firstName}! Te escribimos de AVG Reparaciones por tu solicitud ${r.request_number} (${r.equipment_type} ${r.brand}).`,
                r.customer_phone,
              )}
              variant="whatsapp"
              className="mt-4"
            >
              <IconWhatsApp size={20} />
              Escribir por WhatsApp
            </ExternalButton>
          </Card>

          <Card title="Seguimiento">
            <ActionForm action={updateRepairRequest} submitLabel="Guardar">
              <input type="hidden" name="id" value={r.id} />
              <Select
                name="status"
                label="Estado"
                defaultValue={status}
                options={REPAIR_STATUSES.map((s) => ({ value: s, label: REPAIR_STATUS_LABEL[s] }))}
              />
              <Textarea
                name="adminNotes"
                label="Notas internas"
                maxLength={2000}
                defaultValue={r.admin_notes ?? ""}
                hint="Presupuesto, piezas, fechas… Solo las ve el equipo."
              />
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}

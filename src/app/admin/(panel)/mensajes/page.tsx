import type { Metadata } from "next";
import clsx from "clsx";
import { requireAdmin } from "@/lib/admin/session";
import { toggleMessageRead } from "@/lib/actions/admin";
import { whatsappUrl } from "@/lib/whatsapp";
import {
  AdminHeader,
  Badge,
  Card,
  EmptyState,
  Pager,
  adminDateTime,
  pageParam,
  param,
} from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import { ExternalButton } from "@/components/ui/button";
import { IconWhatsApp } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Mensajes" };
const PAGE = 20;

export default async function MessagesPage({ searchParams }: PageProps<"/admin/mensajes">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const onlyUnread = param(sp, "ver") !== "todos";
  const page = pageParam(sp);

  let query = supabase
    .from("contact_messages")
    .select("id, name, phone, email, topic, message, read_at, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (onlyUnread) query = query.is("read_at", null);
  const { data, count } = await query;

  return (
    <>
      <AdminHeader
        title="Mensajes de contacto"
        description="Mensajes del formulario de la página Contacto."
        actions={
          <a
            href={onlyUnread ? "/admin/mensajes?ver=todos" : "/admin/mensajes"}
            className="inline-flex min-h-12 items-center font-semibold underline underline-offset-4"
          >
            {onlyUnread ? "Ver también los leídos" : "Ver solo los no leídos"}
          </a>
        }
      />
      {data?.length ? (
        <ul className="flex flex-col gap-4">
          {data.map((m) => (
            <li key={m.id}>
              <Card className={clsx(!m.read_at && "ring-2 ring-bolt/60")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {m.name} {!m.read_at && <Badge tone="warning">Nuevo</Badge>}
                    </p>
                    <p className="text-sm text-muted">
                      {m.topic} · {adminDateTime.format(new Date(m.created_at))}
                    </p>
                  </div>
                  <form action={toggleMessageRead}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="read" value={m.read_at ? "0" : "1"} />
                    <SubmitButton
                      label={m.read_at ? "Marcar como no leído" : "Marcar como leído"}
                      pendingLabel="…"
                      variant="secondary"
                    />
                  </form>
                </div>
                <p className="mt-3 whitespace-pre-line text-ink-soft">{m.message}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-[0.95rem]">
                  <ExternalButton
                    href={whatsappUrl(
                      `¡Hola, ${String(m.name).split(" ")[0]}! Te escribimos de AVG Reparaciones por tu mensaje.`,
                      m.phone,
                    )}
                    variant="secondary"
                  >
                    <IconWhatsApp size={20} className="text-[#1f8f4e]" />
                    {m.phone}
                  </ExternalButton>
                  {m.email && (
                    <a href={`mailto:${m.email}`} className="font-semibold underline underline-offset-4">
                      {m.email}
                    </a>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>{onlyUnread ? "No hay mensajes sin leer." : "Todavía no hay mensajes."}</EmptyState>
      )}
      <Pager
        page={page}
        total={count ?? 0}
        pageSize={PAGE}
        href={(p) =>
          `/admin/mensajes?${new URLSearchParams({ ...(onlyUnread ? {} : { ver: "todos" }), ...(p > 1 ? { pagina: String(p) } : {}) })}`
        }
      />
    </>
  );
}

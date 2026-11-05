import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { whatsappUrl } from "@/lib/whatsapp";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/primitives";
import { IconClock, IconShield, IconWhatsApp } from "@/components/ui/icons";
import { RepairForm } from "@/components/forms/repair-form";

export const metadata: Metadata = {
  title: "Solicitar reparación",
  description:
    "Cuéntanos qué le pasa a tu equipo en tres pasos. Te respondemos por WhatsApp. Reparaciones con garantía en Caracas y equipos de toda Venezuela.",
  alternates: { canonical: "/solicitar-reparacion" },
};

export default async function RepairRequestPage() {
  const cfg = await getSiteSettings();
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Solicitar reparación" }]}
        title="Solicita tu reparación"
        intro="Son solo tres pasos y menos de tres minutos. Después te escribimos por WhatsApp."
      />
      <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_20rem] lg:gap-12">
        <RepairForm
          pickupNote={cfg.pickupCostNote}
          returnNote={cfg.returnShippingCostNote}
          whatsappNumber={cfg.whatsappNumber}
        />

        <aside className="flex flex-col gap-5 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl bg-sand/70 p-6 ring-1 ring-line">
            <h2 className="text-lg font-bold">Qué pasa después</h2>
            <ol className="mt-4 space-y-4 text-[0.95rem] text-ink-soft">
              <li className="flex gap-3">
                <IconWhatsApp size={22} className="shrink-0 text-[#187a41]" />
                Te escribimos por WhatsApp para confirmar los detalles.
              </li>
              <li className="flex gap-3">
                <IconClock size={22} className="shrink-0 text-brand-ink" />
                Revisamos el equipo en el taller y te damos el precio.
              </li>
              <li className="flex gap-3">
                <IconShield size={22} className="shrink-0 text-brand-ink" />
                Solo reparamos si lo apruebas. Con garantía.
              </li>
            </ol>
          </div>
          <div className="rounded-2xl p-6 ring-1 ring-line">
            <p className="font-semibold">¿Prefieres hablar con nosotros?</p>
            <a
              href={whatsappUrl(
                "¡Hola, AVG Reparaciones! Quisiera solicitar una reparación.",
                cfg.whatsappNumber,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-11 items-center gap-2 font-semibold text-brand-ink underline-offset-4 hover:underline"
            >
              Escríbenos al {cfg.phoneDisplay}
              <span className="sr-only"> por WhatsApp (se abre en una pestaña nueva)</span>
            </a>
          </div>
        </aside>
      </Container>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/primitives";
import { Contact } from "@/components/sections/contact";
import { ContactForm } from "@/components/forms/contact-form";
import { IconArrowRight } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Dirección, horario, teléfono y WhatsApp de AVG Reparaciones en Caracas. Escríbenos o visítanos en la Av. Este 12.",
  alternates: { canonical: "/contacto" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Contacto" }]}
        eyebrow="Contacto"
        title="Estamos para ayudarte"
        intro="Escríbenos por WhatsApp, déjanos un mensaje o visítanos en el local."
      />
      <Contact showHeading={false} />
      <Container className="grid gap-10 pb-16 sm:pb-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <ContactForm />
        <aside className="flex flex-col gap-4 self-start rounded-2xl bg-sand/70 p-7 ring-1 ring-line">
          <h2 className="text-xl font-bold">¿Tu equipo está dañado?</h2>
          <p className="text-ink-soft">
            Para reparaciones, usa el formulario de solicitud: nos das toda la información de una vez y te
            respondemos más rápido.
          </p>
          <Link
            href="/solicitar-reparacion"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-ink underline-offset-4 hover:underline"
          >
            Solicitar reparación <IconArrowRight size={18} />
          </Link>
          <hr className="my-2 border-line" />
          <p className="text-ink-soft">¿Tienes dudas sobre garantía, envíos o pagos?</p>
          <Link
            href="/preguntas-frecuentes"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-ink underline-offset-4 hover:underline"
          >
            Ver preguntas frecuentes <IconArrowRight size={18} />
          </Link>
        </aside>
      </Container>
    </>
  );
}

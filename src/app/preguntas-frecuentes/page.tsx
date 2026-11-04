import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Faq } from "@/components/sections/faq";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Garantía, tiempos de reparación, cómo enviarnos tu equipo, costes de recogida y devolución, formas de pago y repuestos sin garantía.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

export default function FaqPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Preguntas frecuentes" }]}
        eyebrow="Ayuda"
        title="Preguntas frecuentes"
        intro="Todo lo que necesitas saber antes de traernos tu equipo o comprar un repuesto."
      />
      <Faq showHeading={false} />
      <CtaBand title="¿Te quedó alguna duda?" body="Escríbenos por WhatsApp y te respondemos." />
    </>
  );
}

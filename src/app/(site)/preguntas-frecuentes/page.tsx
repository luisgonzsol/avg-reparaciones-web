import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Faq } from "@/components/sections/faq";
import { CtaBand } from "@/components/sections/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { getFaq } from "@/content/faq";
import { getSiteSettings } from "@/lib/settings";
import { faqJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Garantía, tiempos de reparación, cómo enviarnos tu equipo, costes de recogida y devolución, formas de pago y repuestos sin garantía.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

export default async function FaqPage() {
  const cfg = await getSiteSettings();
  return (
    <>
      <JsonLd data={faqJsonLd(getFaq(cfg))} />
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

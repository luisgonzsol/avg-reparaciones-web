import { whatsappUrl } from "@/lib/whatsapp";
import { ButtonLink, ExternalButton } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { IconArrowRight, IconWhatsApp } from "@/components/ui/icons";

/** Franja final de llamada a la acción, reutilizable en páginas interiores. */
export function CtaBand({
  title = "¿Tu equipo necesita reparación?",
  body = "Cuéntanos qué le pasa. Te respondemos por WhatsApp con los siguientes pasos.",
  primary = { label: "Solicitar reparación", href: "/solicitar-reparacion" },
  whatsappMessage = "¡Hola, AVG Reparaciones! Quisiera hacer una consulta.",
}: {
  title?: string;
  body?: string;
  primary?: { label: string; href: string };
  whatsappMessage?: string;
}) {
  return (
    <section aria-label="Contacto rápido" className="py-16 sm:py-20">
      <Container>
        <div className="flex flex-col gap-8 rounded-[2rem] bg-graphite px-7 py-12 text-white shadow-lift sm:px-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold text-white">{title}</h2>
            <p className="mt-3 text-lg text-white/80">{body}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={primary.href} size="lg">
              {primary.label}
              <IconArrowRight size={20} />
            </ButtonLink>
            <ExternalButton href={whatsappUrl(whatsappMessage)} variant="inverse" size="lg">
              <IconWhatsApp size={22} className="text-[#1f8f4e]" />
              WhatsApp
            </ExternalButton>
          </div>
        </div>
      </Container>
    </section>
  );
}

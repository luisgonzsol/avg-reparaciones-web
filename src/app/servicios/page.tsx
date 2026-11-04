import type { Metadata } from "next";
import Link from "next/link";
import { services } from "@/content/services";
import { PageHeader } from "@/components/ui/page-header";
import { Container, Section } from "@/components/ui/primitives";
import { IconArrowRight } from "@/components/ui/icons";
import { ServiceIcon } from "@/components/sections/service-icon";
import { HowItWorks } from "@/components/sections/how-it-works";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Reparación de electrodomésticos multimarca, embobinado de motores con cobre 100 %, servicio técnico de equipos industriales y tienda de repuestos en Caracas.",
  alternates: { canonical: "/servicios" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Servicios" }]}
        eyebrow="Servicios"
        title="Reparamos, rebobinamos y te conseguimos el repuesto"
        intro="Cuatro servicios, un mismo compromiso: hacer bien el trabajo, decirte la verdad y responder con garantía."
      />
      <Section aria-label="Lista de servicios">
        <Container>
          <ul className="grid gap-6">
            {services.map((s, i) => (
              <li key={s.slug} className="reveal">
                <article className="grid gap-6 rounded-(--radius-card) bg-surface p-7 shadow-soft ring-1 ring-line sm:p-10 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-10">
                  <span className="grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
                    <ServiceIcon name={s.icon} size={32} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-muted">0{i + 1}</p>
                    <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{s.title}</h2>
                    <p className="mt-3 max-w-2xl text-lg text-ink-soft">{s.summary}</p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {s.examples.map((e) => (
                        <li
                          key={e}
                          className="rounded-full bg-sand px-3 py-1 text-sm font-medium text-ink-soft"
                        >
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href={`/servicios/${s.slug}`}
                    className="inline-flex min-h-12 items-center gap-2 self-start font-semibold text-brand-ink underline-offset-4 hover:underline lg:self-center"
                  >
                    Ver detalles<span className="sr-only"> de {s.shortTitle}</span>
                    <IconArrowRight size={18} />
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
      <HowItWorks />
      <CtaBand />
    </>
  );
}

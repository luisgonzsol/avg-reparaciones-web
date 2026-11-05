import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getService, services } from "@/content/services";
import { whatsappUrl } from "@/lib/whatsapp";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink, ExternalButton } from "@/components/ui/button";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { IconArrowRight, IconShield, IconWhatsApp } from "@/components/ui/icons";
import { ServiceIcon } from "@/components/sections/service-icon";
import { HowItWorks } from "@/components/sections/how-it-works";
import { CtaBand } from "@/components/sections/cta-band";

export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/servicios/[slug]">): Promise<Metadata> {
  const service = getService((await params).slug);
  if (!service) return {};
  return {
    title: service.metaTitle,
    description: service.metaDescription,
    alternates: { canonical: `/servicios/${service.slug}` },
  };
}

export default async function ServicePage({ params }: PageProps<"/servicios/[slug]">) {
  const service = getService((await params).slug);
  if (!service) notFound();
  const cfg = await getSiteSettings();

  const isShop = service.slug === "repuestos";
  const waMessage = isShop
    ? "¡Hola, AVG Reparaciones! Estoy buscando un repuesto."
    : `¡Hola, AVG Reparaciones! Quisiera consultar por: ${service.shortTitle}.`;
  const others = services.filter((s) => s.slug !== service.slug);

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/servicios", label: "Servicios" }, { label: service.shortTitle }]}
        title={service.title}
        intro={service.summary}
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={service.cta.href} size="lg">
            {service.cta.label}
            <IconArrowRight size={20} />
          </ButtonLink>
          <ExternalButton href={whatsappUrl(waMessage, cfg.whatsappNumber)} variant="secondary" size="lg">
            <IconWhatsApp size={22} className="text-[#187a41]" />
            Consultar por WhatsApp
          </ExternalButton>
        </div>
      </PageHeader>

      <Section aria-labelledby="detalle-title">
        <Container className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            <h2 id="detalle-title" className="sr-only">
              Detalles del servicio
            </h2>
            <div className="space-y-4 text-lg text-ink-soft">
              {service.intro.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <dl className="mt-10 grid gap-5 sm:grid-cols-2">
              {service.highlights.map((h) => (
                <div key={h.title} className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-line">
                  <dt className="font-display text-lg font-bold">{h.title}</dt>
                  <dd className="mt-1 text-ink-soft">{h.body}</dd>
                </div>
              ))}
            </dl>
          </div>

          <aside className="flex flex-col gap-6">
            <div className="rounded-(--radius-card) bg-surface p-7 shadow-soft ring-1 ring-line">
              <span className="grid size-12 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                <ServiceIcon name={service.icon} />
              </span>
              <h2 className="mt-5 text-xl font-bold">
                {isShop ? "Qué encuentras" : "Equipos que atendemos"}
              </h2>
              <ul className="mt-4 space-y-2">
                {service.examples.map((e) => (
                  <li key={e} className="flex gap-3 text-ink-soft">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-flame" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-(--radius-card) bg-sand/70 p-7 ring-1 ring-line">
              <h2 className="text-xl font-bold">{service.signsTitle}</h2>
              <ul className="mt-4 space-y-2">
                {service.signs.map((s) => (
                  <li key={s} className="flex gap-3 text-ink-soft">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            {service.note && (
              <p className="flex gap-3 rounded-2xl bg-warning-soft p-5 text-[0.95rem] text-ink ring-1 ring-flame/30">
                <IconShield size={22} className="mt-0.5 shrink-0 text-warning" />
                <span>
                  <strong className="font-semibold">Importante: </strong>
                  {service.note}
                </span>
              </p>
            )}
          </aside>
        </Container>
      </Section>

      {!isShop && <HowItWorks />}

      <Section aria-labelledby="otros-title">
        <Container>
          <SectionHeading id="otros-title" title="Otros servicios" />
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {others.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/servicios/${s.slug}`}
                  className="group flex h-full items-center gap-4 rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-line transition-shadow hover:shadow-lift"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                    <ServiceIcon name={s.icon} size={24} />
                  </span>
                  <span className="font-semibold">{s.shortTitle}</span>
                  <IconArrowRight
                    size={18}
                    className="ml-auto shrink-0 text-muted transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CtaBand
        primary={isShop ? { label: "Ver la tienda", href: "/tienda" } : undefined}
        title={isShop ? "¿No encuentras tu repuesto?" : undefined}
        body={isShop ? "Escríbenos con una foto de la pieza y te ayudamos a encontrarla." : undefined}
        whatsappMessage={waMessage}
      />
    </>
  );
}

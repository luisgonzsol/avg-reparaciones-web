import type { Metadata } from "next";
import Image from "next/image";
import { about } from "@/content/about";
import { siteConfig } from "@/config/site";
import { PageHeader } from "@/components/ui/page-header";
import { Container, PendingTag, Section, SectionHeading } from "@/components/ui/primitives";
import { IconImage, IconShield } from "@/components/ui/icons";
import { BoltDivider } from "@/components/brand/decor";
import { CtaBand } from "@/components/sections/cta-band";
import mostrador from "@/../public/images/local-avg-mostrador.jpg";
import fachada from "@/../public/images/local-avg-fachada.jpg";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "AVG Reparaciones: más de 20 años reparando electrodomésticos y embobinando motores en Caracas. Honestidad, transparencia, garantía y cercanía.",
  alternates: { canonical: "/nosotros" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Nosotros" }]}
        eyebrow="Nosotros"
        title={about.title}
        intro={about.intro}
      />

      <Section aria-labelledby="historia-title">
        <Container className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading id="historia-title" title="Nuestra historia" />
            <div className="mt-6 space-y-4 text-lg text-ink-soft">
              {about.story.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <BoltDivider className="my-10" />
            <ul className="space-y-3">
              {about.promises.map((p) => (
                <li key={p} className="flex gap-3 text-lg">
                  <IconShield size={24} className="mt-0.5 shrink-0 text-brand-ink" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 reveal overflow-hidden rounded-[2rem] shadow-lift ring-1 ring-black/5">
              <Image
                src={mostrador}
                alt="Interior del local de AVG Reparaciones: pared con repuestos de ventiladores y licuadoras, y vitrina del mostrador"
                sizes="(min-width: 1024px) 34rem, 92vw"
                placeholder="blur"
                quality={75}
                className="aspect-[5/4] h-auto w-full object-cover"
              />
            </div>
            <div className="reveal overflow-hidden rounded-2xl shadow-soft ring-1 ring-black/5">
              <Image
                src={fachada}
                alt="Fachada del local en la Av. Este de Caracas"
                sizes="(min-width: 1024px) 17rem, 46vw"
                placeholder="blur"
                quality={70}
                className="aspect-square h-auto w-full object-cover object-[50%_40%]"
              />
            </div>
            {/* [PLACEHOLDER] fotos del taller y de trabajos realizados */}
            <div className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-line bg-sand/60 p-4 text-center text-sm text-muted">
              <div className="flex flex-col items-center gap-2">
                <IconImage size={32} className="opacity-60" />
                <span>Foto del taller o de trabajos realizados</span>
                <PendingTag>[PLACEHOLDER]</PendingTag>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="valores-title" className="bg-surface">
        <Container>
          <SectionHeading
            id="valores-title"
            eyebrow="Lo que nos define"
            title="Nuestros valores"
            subtitle="Lo que nos ha mantenido más de 20 años en el barrio."
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {about.values.map((v, i) => (
              <li key={v.title} className="reveal rounded-(--radius-card) bg-canvas p-7 ring-1 ring-line">
                <span
                  aria-hidden="true"
                  className="font-display text-4xl font-extrabold text-ink underline decoration-bolt decoration-4 underline-offset-8"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-xl font-bold">{v.title}</h3>
                <p className="mt-2 text-ink-soft">{v.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section aria-label="Datos de la empresa" className="py-12 sm:py-14">
        <Container>
          <p className="text-center text-ink-soft">
            {siteConfig.legalName} · RIF {siteConfig.rif} · Caracas, Venezuela
          </p>
        </Container>
      </Section>

      <CtaBand />
    </>
  );
}

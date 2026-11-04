import Image from "next/image";
import { aboutSummary } from "@/content/home";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { BoltDivider } from "@/components/brand/decor";
import fachada from "@/../public/images/local-avg-fachada.jpg";

export function AboutSummary() {
  return (
    <Section aria-labelledby="nosotros-title" className="bg-surface">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative order-last reveal lg:order-first">
          <div className="overflow-hidden rounded-[2rem] shadow-lift ring-1 ring-black/5">
            <Image
              src={fachada}
              alt="Entrada del local de AVG Reparaciones en la Av. Este de Caracas, con el letrero de reparaciones, repuestos y embobinados"
              sizes="(min-width: 1024px) 34rem, 92vw"
              placeholder="blur"
              quality={70}
              className="aspect-[4/5] h-auto w-full object-cover object-[50%_35%]"
            />
          </div>
        </div>
        <div>
          <SectionHeading id="nosotros-title" eyebrow={aboutSummary.eyebrow} title={aboutSummary.title} />
          <div className="mt-6 space-y-4 text-lg text-ink-soft">
            {aboutSummary.paragraphs.map((p) => (
              <p key={p.slice(0, 20)}>{p}</p>
            ))}
          </div>
          <BoltDivider className="my-8" />
          <dl className="grid gap-5 sm:grid-cols-2">
            {aboutSummary.values.map((v) => (
              <div key={v.title}>
                <dt className="font-display text-lg font-bold">{v.title}</dt>
                <dd className="mt-1 text-ink-soft">{v.body}</dd>
              </div>
            ))}
          </dl>
          <ButtonLink href={aboutSummary.cta.href} variant="secondary" className="mt-9">
            {aboutSummary.cta.label}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}

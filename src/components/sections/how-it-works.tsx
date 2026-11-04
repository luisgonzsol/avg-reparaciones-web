import { howItWorks } from "@/content/home";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { SwooshBackdrop } from "@/components/brand/decor";

export function HowItWorks() {
  return (
    <Section
      id="como-funciona"
      aria-labelledby="como-funciona-title"
      className="relative isolate overflow-hidden bg-graphite text-white"
    >
      <SwooshBackdrop className="inset-0 -z-10 h-full w-full opacity-60" />
      <Container>
        <SectionHeading
          id="como-funciona-title"
          eyebrow="Cómo funciona"
          title={howItWorks.title}
          subtitle={howItWorks.subtitle}
          tone="dark"
        />
        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {howItWorks.steps.map((step, i) => (
            <li
              key={step.title}
              className="relative reveal rounded-(--radius-card) bg-graphite-soft/80 p-7 ring-1 ring-white/10 backdrop-blur-sm"
            >
              <span aria-hidden="true" className="font-display text-5xl font-extrabold text-bolt/90">
                {i + 1}
              </span>
              <span className="sr-only">Paso {i + 1}: </span>
              <h3 className="mt-4 text-xl font-bold text-white">{step.title}</h3>
              <p className="mt-3 text-white/80">{step.body}</p>
              {"options" in step && step.options && (
                <ul className="mt-3 space-y-2 text-[0.95rem] text-white/80">
                  {step.options.map((o) => (
                    <li key={o} className="flex gap-2">
                      <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-flame" />
                      {o}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
        <div className="mt-12">
          <ButtonLink href="/solicitar-reparacion" size="lg" variant="inverse">
            Empezar mi solicitud
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}

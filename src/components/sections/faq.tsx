import clsx from "clsx";
import { getSiteSettings } from "@/lib/settings";
import { getFaq } from "@/content/faq";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { IconChevronDown } from "@/components/ui/icons";

/** FAQ con <details>/<summary> nativos: accesible y sin JavaScript. */
export async function Faq({ showHeading = true }: { showHeading?: boolean }) {
  const items = getFaq(await getSiteSettings());
  return (
    <Section
      id={showHeading ? "preguntas-frecuentes" : undefined}
      aria-labelledby={showHeading ? "faq-title" : undefined}
      aria-label={showHeading ? undefined : "Preguntas y respuestas"}
      className="bg-surface"
    >
      <Container className={clsx(showHeading && "grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16")}>
        {showHeading && (
          <SectionHeading
            id="faq-title"
            eyebrow="Preguntas frecuentes"
            title="Resolvemos tus dudas"
            subtitle="¿No encuentras tu respuesta? Escríbenos por WhatsApp y te atendemos."
          />
        )}
        <div
          className={clsx("divide-y divide-line border-y border-line", !showHeading && "mx-auto max-w-3xl")}
        >
          {items.map((item) => (
            <details key={item.question} className="group">
              <summary className="summary-clean flex min-h-16 cursor-pointer items-center justify-between gap-4 py-4 text-left text-lg font-semibold transition-colors hover:text-brand-ink">
                {item.question}
                <IconChevronDown
                  size={22}
                  className="shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
                />
              </summary>
              <p className="pb-6 text-ink-soft">{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}

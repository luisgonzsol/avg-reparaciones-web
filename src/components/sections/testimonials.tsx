import { getSiteSettings } from "@/lib/settings";
import { testimonials } from "@/content/home";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";

/**
 * Testimonios. OCULTOS mientras `cfg.showTestimonials` sea false:
 * los datos actuales son [PLACEHOLDER] y no deben publicarse.
 */
export async function Testimonials() {
  const cfg = await getSiteSettings();
  if (!cfg.showTestimonials) return null;

  return (
    <Section aria-labelledby="testimonios-title">
      <Container>
        <SectionHeading id="testimonios-title" eyebrow="Testimonios" title="Lo que dicen nuestros clientes" />
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <li
              key={i}
              className="reveal rounded-(--radius-card) bg-surface p-7 shadow-soft ring-1 ring-line"
            >
              <figure>
                <blockquote className="text-lg text-ink-soft">“{t.text}”</blockquote>
                <figcaption className="mt-5 font-semibold">
                  {t.name} <span className="font-normal text-muted">· {t.location}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

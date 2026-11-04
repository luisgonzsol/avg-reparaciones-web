import Link from "next/link";
import { services, type ServiceIcon } from "@/content/services";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { IconArrowRight, IconCoil, IconFactory, IconHome, IconPackage } from "@/components/ui/icons";

const ICONS: Record<ServiceIcon, typeof IconHome> = {
  home: IconHome,
  coil: IconCoil,
  industrial: IconFactory,
  parts: IconPackage,
};

export function ServicesGrid() {
  return (
    <Section aria-labelledby="servicios-title" id="servicios">
      <Container>
        <SectionHeading
          id="servicios-title"
          eyebrow="Servicios"
          title="Todo lo que tu equipo necesita, en un solo lugar"
          subtitle="Reparamos, rebobinamos y vendemos repuestos. Si no sabes qué le pasa a tu equipo, nosotros te ayudamos a averiguarlo."
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {services.map((s) => {
            const Icon = ICONS[s.icon];
            return (
              <li key={s.slug} className="reveal">
                <Link
                  href={`/servicios/${s.slug}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-(--radius-card) bg-surface p-7 shadow-soft ring-1 ring-line transition-[box-shadow,transform] duration-300 ease-(--ease-out-soft) hover:shadow-lift motion-safe:hover:-translate-y-1 sm:p-8"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -top-10 -right-10 size-32 rounded-full bg-bolt/0 transition-colors duration-500 group-hover:bg-bolt/15"
                  />
                  <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-ink transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
                    <Icon size={28} />
                  </span>
                  <h3 className="mt-6 text-xl font-bold sm:text-2xl">{s.title}</h3>
                  <p className="mt-3 text-ink-soft">{s.summary}</p>
                  <p className="mt-4 text-[0.95rem] text-muted">
                    {s.examples.slice(0, 5).join(" · ")}
                    {s.examples.length > 5 ? "…" : ""}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-6 font-semibold text-brand-ink">
                    Ver detalles
                    <IconArrowRight
                      size={18}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

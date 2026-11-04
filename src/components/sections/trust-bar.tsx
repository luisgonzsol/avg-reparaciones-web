import { trustItems } from "@/content/home";
import { Container } from "@/components/ui/primitives";
import { IconCalendar, IconCurrency, IconShield, IconTags, IconTruck } from "@/components/ui/icons";

const ICONS = {
  years: IconCalendar,
  brands: IconTags,
  shield: IconShield,
  truck: IconTruck,
  currency: IconCurrency,
} as const;

export function TrustBar() {
  return (
    <section aria-label="Por qué elegirnos" className="border-y border-line bg-surface">
      <Container>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-5 py-7 sm:grid-cols-3 lg:grid-cols-5">
          {trustItems.map(({ icon, label }) => {
            const Icon = ICONS[icon];
            return (
              <li
                key={label}
                className="flex items-center gap-3 last:col-span-2 last:justify-center sm:last:col-span-1 sm:last:justify-start"
              >
                <Icon size={24} className="shrink-0 text-flame" />
                <span className="text-[0.95rem] leading-tight font-semibold">{label}</span>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

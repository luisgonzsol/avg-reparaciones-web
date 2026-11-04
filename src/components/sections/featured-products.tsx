import { getCurrency } from "@/lib/currency";
import { formatRate } from "@/lib/money";
import { SAMPLE_EXCHANGE_RATE, sampleProducts } from "@/content/sample-products";
import { ButtonLink } from "@/components/ui/button";
import { Container, PendingTag, Section, SectionHeading } from "@/components/ui/primitives";
import { ProductCard } from "@/components/shop/product-card";
import { IconArrowRight } from "@/components/ui/icons";

const dateFormatter = new Intl.DateTimeFormat("es-VE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Caracas",
});

export async function FeaturedProducts() {
  const currency = await getCurrency();
  // Fase 3: productos destacados y tasa vigente desde Supabase.
  const products = sampleProducts.filter((p) => p.featured);
  const { rate, effectiveDate, isSample } = SAMPLE_EXCHANGE_RATE;

  return (
    <Section aria-labelledby="destacados-title">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            id="destacados-title"
            eyebrow="Tienda de repuestos"
            title="Repuestos destacados"
            subtitle="Piezas para tus electrodomésticos, con envío a toda Venezuela."
          />
          <ButtonLink href="/tienda" variant="secondary" className="self-start md:self-auto">
            Ver toda la tienda
            <IconArrowRight size={18} />
          </ButtonLink>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <li key={p.slug} className="reveal">
              <ProductCard product={p} currency={currency} rate={rate} isSample />
            </li>
          ))}
        </ul>

        <p className="mt-8 rounded-2xl bg-sand/70 p-4 text-sm text-ink-soft">
          <strong className="font-semibold text-ink">Tasa del día: {formatRate(rate)}</strong> ·{" "}
          {dateFormatter.format(new Date(`${effectiveDate}T12:00:00-04:00`))}
          {isSample && (
            <>
              {" "}
              <PendingTag>[EJEMPLO]</PendingTag>
            </>
          )}
          <br />
          Monto en Bs referencial según la tasa del día; el monto final se confirma en el enlace de cobro.
        </p>
      </Container>
    </Section>
  );
}

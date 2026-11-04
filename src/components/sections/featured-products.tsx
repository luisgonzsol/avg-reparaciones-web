import { getCurrency } from "@/lib/currency";
import { getCurrentRate, getFeaturedProducts } from "@/lib/data/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { ProductCard } from "@/components/shop/product-card";
import { RateNotice } from "@/components/shop/price";
import { IconArrowRight } from "@/components/ui/icons";

/** Repuestos marcados como destacados desde el panel. */
export async function FeaturedProducts() {
  if (!isSupabaseConfigured()) return null;

  let data;
  try {
    const [currency, products, rate] = await Promise.all([
      getCurrency(),
      getFeaturedProducts(4),
      getCurrentRate(),
    ]);
    data = { currency, products, rate };
  } catch (e) {
    console.error("[inicio] destacados", e instanceof Error ? e.message : e);
    return null; // Si falla la BD, la portada sigue funcionando sin esta sección.
  }
  if (!data.products.length) return null;

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
          {data.products.map((p) => (
            <li key={p.slug} className="reveal">
              <ProductCard product={p} currency={data.currency} rate={data.rate?.rate ?? null} />
            </li>
          ))}
        </ul>

        <RateNotice rate={data.rate} className="mt-8" />
      </Container>
    </Section>
  );
}

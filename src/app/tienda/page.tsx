import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { getCurrency } from "@/lib/currency";
import { getBrands, getCategories, getCurrentRate, searchProducts } from "@/lib/data/catalog";
import { parseCatalogParams } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/primitives";
import { ProductCard } from "@/components/shop/product-card";
import { CatalogFilters } from "@/components/shop/catalog-filters";
import { Pagination } from "@/components/shop/pagination";
import { RateNotice } from "@/components/shop/price";
import { StoreUnavailable } from "@/components/shop/store-unavailable";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Tienda de repuestos",
  description:
    "Repuestos de electrodomésticos en Venezuela: aspas de ventilador, vasos y cuchillas de licuadora, capacitores, gomas de ollas, motores, carbones y alambre de cobre. Precios en USD y Bs.",
  alternates: { canonical: "/tienda" },
};

async function loadCatalog(sp: Record<string, string | string[] | undefined>) {
  if (!isSupabaseConfigured()) return null;
  const params = parseCatalogParams(sp);
  try {
    const [result, categories, brands, rate, currency] = await Promise.all([
      searchProducts(params),
      getCategories(),
      getBrands(),
      getCurrentRate(),
      getCurrency(),
    ]);
    return { params, result, categories, brands, rate, currency };
  } catch (e) {
    unstable_rethrow(e); // deja pasar las señales internas de Next.js
    console.error("[tienda]", e instanceof Error ? e.message : e);
    return null;
  }
}

export default async function StorePage({ searchParams }: PageProps<"/tienda">) {
  const data = await loadCatalog(await searchParams);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Tienda" }]}
        eyebrow="Tienda de repuestos"
        title="Encuentra el repuesto que necesitas"
        intro="Piezas para tus electrodomésticos con envío a toda Venezuela. ¿No lo encuentras? Escríbenos y te ayudamos."
      />
      <Container className="py-10 sm:py-14">
        {!data ? (
          <StoreUnavailable />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[17rem_1fr] lg:gap-12">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              {/* En móvil los filtros se pliegan para no ocupar la pantalla. */}
              <details className="group rounded-2xl bg-surface p-5 ring-1 ring-line lg:hidden" open={false}>
                <summary className="summary-clean flex min-h-12 cursor-pointer items-center justify-between font-semibold">
                  Buscar y filtrar
                  <span aria-hidden="true" className="transition-transform group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <div className="mt-4">
                  <CatalogFilters
                    idPrefix="m-"
                    params={data.params}
                    categories={data.categories}
                    brands={data.brands}
                  />
                </div>
              </details>
              <div className="hidden rounded-2xl bg-surface p-6 ring-1 ring-line lg:block">
                <CatalogFilters params={data.params} categories={data.categories} brands={data.brands} />
              </div>
            </aside>

            <section aria-labelledby="resultados-title">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="resultados-title" className="text-xl font-bold">
                  {data.result.total === 1 ? "1 producto" : `${data.result.total} productos`}
                  {data.params.q && (
                    <span className="font-normal text-ink-soft"> para «{data.params.q}»</span>
                  )}
                </h2>
                {data.result.pages > 1 && (
                  <p className="text-sm text-muted">
                    Página {Math.min(data.params.page, data.result.pages)} de {data.result.pages}
                  </p>
                )}
              </div>

              {data.result.products.length ? (
                <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {data.result.products.map((p) => (
                    <li key={p.slug}>
                      <ProductCard product={p} currency={data.currency} rate={data.rate?.rate ?? null} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-6 rounded-2xl bg-surface p-8 text-center ring-1 ring-line">
                  <p className="text-lg font-semibold">No encontramos repuestos con esos filtros.</p>
                  <p className="mt-2 text-ink-soft">
                    Prueba con otras palabras o{" "}
                    <a
                      href={whatsappUrl(
                        `¡Hola, AVG Reparaciones! Busco este repuesto: ${data.params.q || "(escribe aquí el repuesto)"}`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand-ink underline underline-offset-4"
                    >
                      pregúntanos por WhatsApp
                      <span className="sr-only"> (se abre en una pestaña nueva)</span>
                    </a>
                    .
                  </p>
                </div>
              )}

              <Pagination params={data.params} pages={data.result.pages} />
              <RateNotice rate={data.rate} className="mt-10" />
            </section>
          </div>
        )}
      </Container>
    </>
  );
}

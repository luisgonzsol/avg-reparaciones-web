import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCurrency } from "@/lib/currency";
import { getCurrentRate, getProductBySlug } from "@/lib/data/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { productInquiryMessage, whatsappUrl } from "@/lib/whatsapp";
import { formatUsd } from "@/lib/money";
import { PageHeader } from "@/components/ui/page-header";
import { Container, PendingTag } from "@/components/ui/primitives";
import { ExternalButton } from "@/components/ui/button";
import { IconImage, IconShield, IconWhatsApp } from "@/components/ui/icons";
import { AvailabilityBadge } from "@/components/shop/availability-badge";
import { Price, RateNotice } from "@/components/shop/price";
import { AddToCart } from "@/components/shop/add-to-cart";
import { StoreUnavailable } from "@/components/shop/store-unavailable";

async function load(slug: string) {
  if (!isSupabaseConfigured()) return { unavailable: true as const };
  try {
    const product = await getProductBySlug(slug);
    return { unavailable: false as const, product };
  } catch (e) {
    console.error("[ficha]", e instanceof Error ? e.message : e);
    return { unavailable: true as const };
  }
}

export async function generateMetadata({ params }: PageProps<"/tienda/[slug]">): Promise<Metadata> {
  const r = await load((await params).slug);
  if (r.unavailable || !r.product) return { title: "Repuesto" };
  const p = r.product;
  return {
    title: p.name,
    description: `${p.name}${p.brandNames.length ? ` compatible con ${p.brandNames.join(", ")}` : ""}. ${formatUsd(p.priceUsd)}. Envíos a toda Venezuela.`,
    alternates: { canonical: `/tienda/${p.slug}` },
    robots: p.isSample ? { index: false } : undefined,
  };
}

export default async function ProductPage({ params }: PageProps<"/tienda/[slug]">) {
  const { slug } = await params;
  const r = await load(slug);

  if (r.unavailable) {
    return (
      <>
        <PageHeader crumbs={[{ href: "/tienda", label: "Tienda" }, { label: "Repuesto" }]} title="Repuesto" />
        <Container className="py-12">
          <StoreUnavailable />
        </Container>
      </>
    );
  }
  if (!r.product) notFound();

  const p = r.product;
  const [currency, rate] = await Promise.all([getCurrency(), getCurrentRate().catch(() => null)]);

  return (
    <>
      <PageHeader
        crumbs={[
          { href: "/tienda", label: "Tienda" },
          ...(p.categorySlug ? [{ href: `/tienda?categoria=${p.categorySlug}`, label: p.categoryName }] : []),
          { label: p.name },
        ]}
        title={p.name}
      >
        {p.isSample && (
          <p className="mt-4 text-sm text-muted">
            <PendingTag>[EJEMPLO]</PendingTag> Producto de demostración: precio y stock ficticios.
          </p>
        )}
      </PageHeader>

      <Container className="grid gap-10 py-10 sm:py-14 lg:grid-cols-2 lg:gap-14">
        {/* Galería */}
        <section aria-label="Fotos del producto" className="flex flex-col gap-3">
          {p.images.length ? (
            <>
              <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-surface ring-1 ring-line">
                <Image
                  src={p.images[0]!.url}
                  alt={p.images[0]!.alt}
                  fill
                  preload
                  sizes="(min-width: 1024px) 36rem, 92vw"
                  className="object-contain"
                />
              </div>
              {p.images.length > 1 && (
                <ul className="grid grid-cols-4 gap-3">
                  {p.images.slice(1, 5).map((img) => (
                    <li
                      key={img.url}
                      className="relative aspect-square overflow-hidden rounded-xl bg-surface ring-1 ring-line"
                    >
                      <Image src={img.url} alt={img.alt} fill sizes="8rem" className="object-contain" />
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="grid aspect-square place-items-center rounded-[2rem] bg-gradient-to-br from-sand to-canvas text-muted ring-1 ring-line">
              <div className="flex flex-col items-center gap-3 text-center">
                <IconImage size={56} className="opacity-50" />
                <span className="text-sm">Foto pendiente</span>
                <PendingTag>[PLACEHOLDER]</PendingTag>
              </div>
            </div>
          )}
        </section>

        {/* Compra */}
        <section aria-label="Precio y compra" className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <AvailabilityBadge
              available={p.available}
              lowStockThreshold={p.lowStockThreshold}
              className="text-sm"
            />
            <span className="text-sm text-muted">SKU: {p.sku}</span>
          </div>

          <Price usd={p.priceUsd} currency={currency} rate={rate?.rate ?? null} size="lg" />

          <AddToCart slug={p.slug} available={p.available} name={p.name} />

          <div
            className={
              p.hasWarranty
                ? "flex gap-3 rounded-2xl bg-success-soft p-4 text-ink"
                : "flex gap-3 rounded-2xl bg-warning-soft p-4 text-ink ring-1 ring-flame/30"
            }
          >
            <IconShield
              size={24}
              className={p.hasWarranty ? "shrink-0 text-success" : "shrink-0 text-warning"}
            />
            <p className="text-[0.95rem]">
              {p.hasWarranty ? (
                <>
                  <strong>Con garantía.</strong> Consulta las condiciones en los términos.
                </>
              ) : (
                <>
                  <strong>Pieza sin garantía.</strong> Las piezas eléctricas vendidas sueltas no tienen
                  garantía. Si quieres garantía, te la instalamos como parte de una reparación.
                </>
              )}
            </p>
          </div>

          <ExternalButton
            href={whatsappUrl(productInquiryMessage(p.name, p.sku))}
            variant="secondary"
            size="lg"
          >
            <IconWhatsApp size={22} className="text-[#1f8f4e]" />
            Preguntar por este repuesto
          </ExternalButton>

          <RateNotice rate={rate} />

          <dl className="divide-y divide-line border-y border-line">
            {p.description && (
              <div className="py-4">
                <dt className="font-semibold">Descripción</dt>
                <dd className="mt-1 whitespace-pre-line text-ink-soft">{p.description}</dd>
              </div>
            )}
            {(p.compatibility || p.brandNames.length > 0) && (
              <div className="py-4">
                <dt className="font-semibold">Compatibilidad</dt>
                <dd className="mt-1 text-ink-soft">
                  {p.compatibility}
                  {p.brandNames.length > 0 && (
                    <span className="mt-1 block">Marcas: {p.brandNames.join(", ")}</span>
                  )}
                </dd>
              </div>
            )}
            <div className="py-4">
              <dt className="font-semibold">Categoría</dt>
              <dd className="mt-1 text-ink-soft">{p.categoryName}</dd>
            </div>
          </dl>
        </section>
      </Container>
    </>
  );
}

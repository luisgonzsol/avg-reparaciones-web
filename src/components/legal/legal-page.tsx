import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Container, PendingTag } from "@/components/ui/primitives";

/** Plantilla de las páginas legales con estilos de lectura. */
export function LegalPage({
  title,
  updated,
  crumb,
  children,
}: {
  title: string;
  updated: string;
  crumb: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader crumbs={[{ label: crumb }]} title={title}>
        <p className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted">
          Última actualización: {updated}
          <PendingTag>[REVISAR CON EL CLIENTE]</PendingTag>
        </p>
      </PageHeader>
      <Container className="py-12 sm:py-16">
        <div
          role="note"
          className="mb-10 max-w-3xl rounded-2xl bg-warning-soft p-5 text-[0.95rem] text-ink ring-1 ring-flame/30"
        >
          <strong className="font-semibold">Borrador.</strong> Este texto es una propuesta inicial y debe
          revisarlo AVG Reparaciones (y, si es posible, un abogado) antes de publicarse.
        </div>
        <article className="max-w-3xl text-[1.02rem] leading-relaxed text-ink-soft [&_a]:font-medium [&_a]:text-brand-ink [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-ink [&_li]:mt-2 [&_p]:mt-4 [&_strong]:text-ink [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </article>
      </Container>
    </>
  );
}

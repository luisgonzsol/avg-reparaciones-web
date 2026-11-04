import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "./primitives";
import { SwooshBackdrop } from "@/components/brand/decor";

export type Crumb = { href?: string; label: string };

/** Cabecera de las páginas interiores, con migas de pan. */
export function PageHeader({
  title,
  intro,
  crumbs,
  eyebrow,
  children,
}: {
  title: ReactNode;
  intro?: ReactNode;
  crumbs: Crumb[];
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-line">
      <SwooshBackdrop className="inset-0 -z-10 h-full w-full opacity-70" />
      <Container className="py-10 sm:py-14">
        <nav aria-label="Migas de pan">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            {[{ href: "/", label: "Inicio" }, ...crumbs].map((c, i, all) => {
              const last = i === all.length - 1;
              return (
                <li key={c.label} className="flex items-center gap-2">
                  {c.href && !last ? (
                    <Link href={c.href} className="underline-offset-4 hover:text-ink hover:underline">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? "page" : undefined} className={last ? "text-ink-soft" : ""}>
                      {c.label}
                    </span>
                  )}
                  {!last && <span aria-hidden="true">/</span>}
                </li>
              );
            })}
          </ol>
        </nav>
        {eyebrow && (
          <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold tracking-wider text-brand-ink uppercase">
            <span aria-hidden="true" className="h-0.5 w-6 rounded-full bg-flame" />
            {eyebrow}
          </p>
        )}
        <h1 className={`${eyebrow ? "mt-3" : "mt-6"} max-w-3xl text-[2rem] font-extrabold sm:text-5xl`}>
          {title}
        </h1>
        {intro && <div className="mt-5 max-w-2xl text-lg text-ink-soft sm:text-xl">{intro}</div>}
        {children}
      </Container>
    </section>
  );
}

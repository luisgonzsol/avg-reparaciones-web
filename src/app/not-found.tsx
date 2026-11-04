import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { SwooshBackdrop } from "@/components/brand/decor";
import { IconArrowRight } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

const suggestions = [
  { href: "/servicios", label: "Nuestros servicios" },
  { href: "/solicitar-reparacion", label: "Solicitar una reparación" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  { href: "/contacto", label: "Contacto" },
];

export default function NotFound() {
  return (
    <section className="relative isolate overflow-hidden">
      <SwooshBackdrop className="inset-0 -z-10 h-full w-full" />
      <Container className="flex min-h-[70dvh] flex-col justify-center py-16">
        <p className="font-display text-7xl font-extrabold text-brand sm:text-8xl" aria-hidden="true">
          404
        </p>
        <h1 className="mt-4 max-w-xl text-3xl font-extrabold sm:text-4xl">
          Esta página se nos <span className="accent-underline">desconectó</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-soft">
          No encontramos la página que buscas. Puede que la dirección esté mal escrita o que la página ya no
          exista.
        </p>
        <div className="mt-8">
          <ButtonLink href="/" size="lg">
            Volver al inicio
          </ButtonLink>
        </div>
        <nav aria-label="Páginas sugeridas" className="mt-10">
          <p className="font-semibold">Quizás te interese:</p>
          <ul className="mt-3 flex flex-col gap-1">
            {suggestions.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="inline-flex min-h-11 items-center gap-2 font-medium text-brand-ink underline-offset-4 hover:underline"
                >
                  {s.label} <IconArrowRight size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </section>
  );
}

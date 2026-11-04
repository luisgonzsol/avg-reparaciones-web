import { brandsSection } from "@/content/home";
import { Container } from "@/components/ui/primitives";

/** Franja de marcas en escala de grises (texto, sin logos de terceros). */
export function Brands() {
  return (
    <section aria-labelledby="marcas-title" className="border-y border-line bg-sand/60 py-12 sm:py-14">
      <Container>
        <h2 id="marcas-title" className="text-center text-lg font-bold text-ink-soft sm:text-xl">
          {brandsSection.title}
        </h2>
        <ul className="mx-auto mt-8 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-10">
          {brandsSection.brands.map((b) => (
            <li
              key={b}
              className="font-display text-xl font-bold tracking-tight text-muted transition-colors duration-300 hover:text-ink sm:text-2xl"
            >
              {b}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-sm text-muted">{brandsSection.disclaimer}</p>
      </Container>
    </section>
  );
}

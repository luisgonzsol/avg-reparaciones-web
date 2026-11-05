import Image from "next/image";
import { hero } from "@/content/home";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { IconArrowRight, IconShield } from "@/components/ui/icons";
import { SwooshBackdrop } from "@/components/brand/decor";
import localPhoto from "@/../public/images/local-avg-mostrador.jpg";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <SwooshBackdrop className="inset-0 -z-10 h-full w-full" />
      <Container className="grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-24">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-sm font-medium text-ink-soft shadow-soft ring-1 ring-line">
            <span aria-hidden="true" className="size-2 rounded-full bg-bolt" />
            {hero.eyebrow}
          </p>
          <h1
            id="hero-title"
            className="text-[1.95rem] leading-[1.1] font-extrabold [overflow-wrap:anywhere] min-[400px]:text-[2.2rem] sm:text-5xl lg:text-[3.6rem]"
          >
            Reparamos tus electrodomésticos <span className="accent-underline">con garantía.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-soft sm:text-xl">{hero.subtitle}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={hero.primaryCta.href} size="lg">
              {hero.primaryCta.label}
              <IconArrowRight size={20} />
            </ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} size="lg" variant="secondary">
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative overflow-hidden rounded-[2rem] shadow-lift ring-1 ring-black/5">
            <Image
              src={localPhoto}
              alt="Fachada del local de AVG Reparaciones en Caracas, con la pared de repuestos y la vitrina del mostrador"
              sizes="(min-width: 1024px) 40vw, (min-width: 640px) 28rem, 92vw"
              loading="eager"
              fetchPriority="high"
              placeholder="blur"
              quality={75}
              className="aspect-[5/6] h-auto w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-lift ring-1 ring-line sm:-left-6">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-ink">
              <IconShield size={24} />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-bold">+20 años</span>
              <span className="text-sm text-ink-soft">reparando en Caracas</span>
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}

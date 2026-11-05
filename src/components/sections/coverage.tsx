import { coverage } from "@/content/home";
import { getSiteSettings } from "@/lib/settings";
import { whatsappUrl } from "@/lib/whatsapp";
import { ExternalButton } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { IconTruck, IconWhatsApp } from "@/components/ui/icons";

export async function Coverage() {
  const cfg = await getSiteSettings();
  return (
    <section aria-labelledby="cobertura-title" className="py-16 sm:py-20">
      <Container>
        <div className="relative isolate reveal overflow-hidden rounded-[2rem] bg-brand px-7 py-12 text-white shadow-lift sm:px-12 sm:py-14">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="absolute -top-8 -right-6 -z-10 h-64 w-64 text-bolt/25"
            fill="currentColor"
          >
            <path d="M13.5 1.5 4 14h7l-1.5 8.5L20 9.5h-7.2l.7-8Z" />
          </svg>
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <IconTruck size={36} className="text-bolt" />
              <h2 id="cobertura-title" className="mt-4 max-w-2xl text-3xl font-bold text-white sm:text-4xl">
                {coverage.title}
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-white">{coverage.body}</p>
            </div>
            <ExternalButton
              href={whatsappUrl(coverage.cta.message, cfg.whatsappNumber)}
              variant="inverse"
              size="lg"
            >
              <IconWhatsApp size={22} className="text-[#187a41]" />
              {coverage.cta.label}
            </ExternalButton>
          </div>
        </div>
      </Container>
    </section>
  );
}

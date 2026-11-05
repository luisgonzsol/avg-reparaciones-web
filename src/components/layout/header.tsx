import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";
import { navLinks } from "@/config/site";
import { getCurrency } from "@/lib/currency";
import { whatsappUrl, DEFAULT_WHATSAPP_MESSAGE } from "@/lib/whatsapp";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/primitives";
import { ButtonLink, ExternalButton } from "@/components/ui/button";
import { IconWhatsApp } from "@/components/ui/icons";
import { CurrencySwitcher } from "./currency-switcher";
import { CartButton } from "./cart-button";
import { MobileMenu } from "./mobile-menu";

export async function Header() {
  const cfg = await getSiteSettings();
  const currency = await getCurrency();
  const wa = whatsappUrl(DEFAULT_WHATSAPP_MESSAGE, cfg.whatsappNumber);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/90 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/75">
      <Container className="flex h-18 items-center gap-3 sm:h-20">
        <Link href="/" className="mr-auto shrink-0 rounded-lg">
          <Logo height={42} />
          <span className="sr-only">, ir al inicio</span>
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="relative inline-flex min-h-11 items-center rounded-full px-3.5 text-[0.95rem] font-medium whitespace-nowrap text-ink-soft transition-colors after:absolute after:inset-x-3.5 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-bolt after:transition-transform after:duration-300 hover:text-ink hover:after:scale-x-100"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden sm:block">
          <CurrencySwitcher current={currency} />
        </div>
        <CartButton />
        <div className="hidden xl:block">
          <ExternalButton href={wa} variant="whatsapp">
            <IconWhatsApp size={20} />
            WhatsApp
          </ExternalButton>
        </div>

        <MobileMenu
          links={navLinks}
          footer={
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink-soft">Ver precios en</span>
                <CurrencySwitcher current={currency} />
              </div>
              <ButtonLink href="/solicitar-reparacion" size="lg">
                Solicitar reparación
              </ButtonLink>
              <ExternalButton href={wa} variant="whatsapp" size="lg">
                <IconWhatsApp size={22} />
                Escríbenos por WhatsApp
              </ExternalButton>
            </div>
          }
        />
      </Container>
    </header>
  );
}

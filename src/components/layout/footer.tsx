import Link from "next/link";
import { fullAddress, navLinks, siteConfig } from "@/config/site";
import { groupSchedule } from "@/lib/schedule";
import { whatsappUrl } from "@/lib/whatsapp";
import { Logo } from "@/components/brand/logo";
import { Container, PendingTag } from "@/components/ui/primitives";
import { IconInstagram, IconMail, IconPhone, IconPin, IconWhatsApp } from "@/components/ui/icons";

const extraLinks = [
  { href: "/solicitar-reparacion", label: "Solicitar reparación" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
];

const legalLinks = [
  { href: "/privacidad", label: "Política de privacidad" },
  { href: "/terminos", label: "Términos y condiciones" },
];

export function Footer() {
  const year = new Date().getFullYear();
  const hours = groupSchedule(siteConfig.schedule);

  return (
    // pb extra en móvil: deja sitio al botón flotante de WhatsApp.
    <footer className="bg-graphite pt-16 pb-28 text-white/80 sm:pb-16">
      <Container>
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo tone="dark" height={44} />
            <p className="mt-5 max-w-xs text-[0.95rem] leading-relaxed text-white/70">
              Reparación de electrodomésticos, embobinado de motores y repuestos. Más de 20 años en Caracas,
              ahora para toda Venezuela.
            </p>
            <div className="mt-6 flex gap-2">
              <a
                href={siteConfig.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="grid size-12 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <IconInstagram />
                <span className="sr-only">Instagram de AVG Reparaciones (se abre en una pestaña nueva)</span>
              </a>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="grid size-12 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <IconWhatsApp />
                <span className="sr-only">WhatsApp de AVG Reparaciones (se abre en una pestaña nueva)</span>
              </a>
            </div>
          </div>

          <nav aria-label="Enlaces del pie de página">
            <h2 className="font-display text-sm font-bold tracking-wider text-white uppercase">Navegación</h2>
            <ul className="mt-4 space-y-1">
              <li>
                <Link href="/" className="inline-flex min-h-10 items-center hover:text-white">
                  Inicio
                </Link>
              </li>
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-10 items-center hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
              {extraLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-10 items-center hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-display text-sm font-bold tracking-wider text-white uppercase">Horario</h2>
            <dl className="mt-4 space-y-2 text-[0.95rem]">
              {hours.map((h) => (
                <div key={h.label}>
                  <dt className="text-white/60">{h.label}</dt>
                  <dd className="font-medium text-white">{h.hours}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className="font-display text-sm font-bold tracking-wider text-white uppercase">Contacto</h2>
            <ul className="mt-4 space-y-3 text-[0.95rem]">
              <li className="flex gap-3">
                <IconPin className="mt-0.5 shrink-0 text-bolt" size={20} />
                <span>{fullAddress()}</span>
              </li>
              <li>
                <a
                  href={`tel:${siteConfig.phoneE164}`}
                  className="flex min-h-10 items-center gap-3 hover:text-white"
                >
                  <IconPhone className="shrink-0 text-bolt" size={20} />
                  {siteConfig.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <IconMail className="shrink-0 text-bolt" size={20} />
                {siteConfig.email ? (
                  <a href={`mailto:${siteConfig.email}`} className="hover:text-white">
                    {siteConfig.email}
                  </a>
                ) : (
                  <span>
                    Correo <PendingTag />
                  </span>
                )}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {siteConfig.legalName} · RIF {siteConfig.rif}
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-10 items-center hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}

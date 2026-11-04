import { fullAddress, siteConfig } from "@/config/site";
import { groupSchedule } from "@/lib/schedule";
import { whatsappUrl, DEFAULT_WHATSAPP_MESSAGE } from "@/lib/whatsapp";
import { ExternalButton } from "@/components/ui/button";
import { Container, PendingTag, Section, SectionHeading } from "@/components/ui/primitives";
import { IconClock, IconInstagram, IconMail, IconPhone, IconPin, IconWhatsApp } from "@/components/ui/icons";
import { OpenStatus } from "@/components/layout/open-status";

export function Contact({ showHeading = true }: { showHeading?: boolean }) {
  const hours = groupSchedule(siteConfig.schedule);
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(siteConfig.mapQuery)}&output=embed`;

  return (
    <Section
      id={showHeading ? "contacto" : undefined}
      aria-labelledby={showHeading ? "contacto-title" : undefined}
      aria-label={showHeading ? undefined : "Datos de contacto y mapa"}
      className={showHeading ? undefined : "pt-12 sm:pt-16"}
    >
      <Container>
        {showHeading && (
          <SectionHeading
            id="contacto-title"
            eyebrow="Contacto"
            title="Visítanos o escríbenos"
            subtitle="Estamos en el centro de Caracas. Si vienes de lejos, avísanos por WhatsApp y te orientamos."
          />
        )}
        <div className={`${showHeading ? "mt-10" : ""}grid gap-6 lg:grid-cols-[1fr_1.15fr]`}>
          <div className="flex flex-col gap-6 rounded-(--radius-card) bg-surface p-7 shadow-soft ring-1 ring-line sm:p-8">
            <OpenStatus className="self-start" />

            <ul className="space-y-5">
              <li className="flex gap-4">
                <IconPin className="mt-0.5 shrink-0 text-brand-ink" />
                <div>
                  <p className="font-semibold">Dirección</p>
                  <p className="text-ink-soft">{fullAddress()}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <IconClock className="mt-0.5 shrink-0 text-brand-ink" />
                <div>
                  <p className="font-semibold">Horario</p>
                  <dl className="text-ink-soft">
                    {hours.map((h) => (
                      <div key={h.label} className="flex flex-wrap gap-x-2">
                        <dt>{h.label}:</dt>
                        <dd className="font-medium text-ink">{h.hours}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </li>
              <li className="flex gap-4">
                <IconPhone className="mt-0.5 shrink-0 text-brand-ink" />
                <div>
                  <p className="font-semibold">Teléfono y WhatsApp</p>
                  <a
                    href={`tel:${siteConfig.phoneE164}`}
                    className="text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                  >
                    {siteConfig.phoneDisplay}
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <IconMail className="mt-0.5 shrink-0 text-brand-ink" />
                <div>
                  <p className="font-semibold">Correo</p>
                  {siteConfig.email ? (
                    <a href={`mailto:${siteConfig.email}`} className="text-ink-soft hover:text-ink">
                      {siteConfig.email}
                    </a>
                  ) : (
                    <PendingTag />
                  )}
                </div>
              </li>
              <li className="flex gap-4">
                <IconInstagram className="mt-0.5 shrink-0 text-brand-ink" />
                <div>
                  <p className="font-semibold">Instagram</p>
                  <a
                    href={siteConfig.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                  >
                    {siteConfig.instagramHandle}
                    <span className="sr-only"> (se abre en una pestaña nueva)</span>
                  </a>
                </div>
              </li>
            </ul>

            <ExternalButton
              href={whatsappUrl(DEFAULT_WHATSAPP_MESSAGE)}
              variant="whatsapp"
              size="lg"
              className="mt-auto"
            >
              <IconWhatsApp size={22} />
              Escríbenos por WhatsApp
            </ExternalButton>
          </div>

          <div className="relative min-h-80 overflow-hidden rounded-(--radius-card) bg-sand shadow-soft ring-1 ring-line">
            <iframe
              src={mapSrc}
              title="Mapa con la ubicación de AVG Reparaciones en Caracas"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 h-full w-full border-0"
              allowFullScreen={false}
            />
          </div>
        </div>
        {!siteConfig.address.secondStreet && (
          <p className="mt-4 text-sm text-muted">
            <PendingTag /> Falta verificar la segunda calle de la dirección y la ubicación exacta del mapa.
          </p>
        )}
      </Container>
    </Section>
  );
}

import { whatsappUrl } from "@/lib/whatsapp";
import { ExternalButton } from "@/components/ui/button";
import { IconWhatsApp } from "@/components/ui/icons";

/** Se muestra si la base de datos no responde o aún no está configurada. */
export function StoreUnavailable() {
  return (
    <div
      role="status"
      className="rounded-(--radius-card) bg-surface p-8 text-center shadow-soft ring-1 ring-line"
    >
      <h2 className="text-2xl font-bold">La tienda en línea no está disponible en este momento</h2>
      <p className="mx-auto mt-3 max-w-lg text-ink-soft">
        Inténtalo de nuevo en unos minutos. Mientras tanto, escríbenos por WhatsApp y te decimos si tenemos el
        repuesto que buscas.
      </p>
      <ExternalButton
        href={whatsappUrl("¡Hola, AVG Reparaciones! Estoy buscando un repuesto.")}
        variant="whatsapp"
        size="lg"
        className="mt-6"
      >
        <IconWhatsApp size={22} />
        Preguntar por WhatsApp
      </ExternalButton>
    </div>
  );
}

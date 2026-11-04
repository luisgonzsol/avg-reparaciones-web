import { whatsappUrl, DEFAULT_WHATSAPP_MESSAGE } from "@/lib/whatsapp";
import { IconWhatsApp } from "@/components/ui/icons";

/**
 * Botón flotante de WhatsApp. En móvil es circular y pequeño, y el layout
 * reserva espacio al final de la página para que no tape contenido ni CTA.
 */
export function WhatsAppFab() {
  return (
    <a
      href={whatsappUrl(DEFAULT_WHATSAPP_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 inline-flex size-14 items-center justify-center gap-2 rounded-full bg-[#1f8f4e] text-white shadow-lift ring-4 ring-white/70 transition-[transform,background-color] duration-300 ease-(--ease-out-soft) hover:bg-[#187a41] motion-safe:hover:-translate-y-0.5 sm:right-6 sm:bottom-6 lg:h-14 lg:w-auto lg:px-5"
    >
      <IconWhatsApp size={28} />
      <span className="sr-only lg:not-sr-only lg:font-semibold">Escríbenos</span>
      <span className="sr-only"> por WhatsApp (se abre en una pestaña nueva)</span>
    </a>
  );
}

/**
 * Preguntas frecuentes. Se usan en Inicio, en /contacto (Fase 2) y para
 * el JSON-LD FAQPage (Fase 5). Texto plano: nunca HTML.
 */
import { PENDING, siteConfig } from "@/config/site";

export type FaqItem = { question: string; answer: string };

export function getFaq(cfg = siteConfig): FaqItem[] {
  const warranty = cfg.warrantyDuration
    ? `La garantía de nuestras reparaciones es de ${cfg.warrantyDuration}.`
    : `Todas nuestras reparaciones tienen garantía. Duración: ${PENDING}.`;

  const pickup = cfg.pickupCostNote ?? `Coste orientativo ${PENDING}.`;
  const returnCost = cfg.returnShippingCostNote ?? `Coste orientativo ${PENDING}.`;

  return [
    {
      question: "¿Las reparaciones tienen garantía?",
      answer: `${warranty} La garantía cubre la reparación realizada. Guarda tu comprobante para cualquier reclamo.`,
    },
    {
      question: "¿Los repuestos que compro sueltos tienen garantía?",
      answer:
        "No. Las piezas eléctricas vendidas sueltas (capacitores, motores, carbones, etc.) no tienen garantía, porque su funcionamiento depende de cómo se instalen. Si quieres garantía, te recomendamos que la instalemos nosotros como parte de una reparación.",
    },
    {
      question: "¿Cuánto tarda una reparación?",
      answer:
        "Depende del equipo y de la falla. Después del diagnóstico te decimos el tiempo estimado y te avisamos por WhatsApp cuando esté listo.",
    },
    {
      question: "¿Cómo les hago llegar mi equipo?",
      answer:
        "Tienes tres opciones: traerlo al local (sin coste), pedir que lo busquemos (coste aparte) o enviarlo por una agencia de encomiendas o un mediador. Todas las reparaciones se hacen en nuestro taller.",
    },
    {
      question: "¿Cuánto cuesta la recogida y la devolución por envío?",
      answer: `Recogida: ${pickup} Devolución por envío: ${returnCost} El coste corre por cuenta del cliente y te lo confirmamos antes.`,
    },
    {
      question: "¿Cómo se paga?",
      answer: `En el local aceptamos ${cfg.paymentMethods.join(", ")} (otros métodos ${PENDING}). En la tienda en línea no se paga dentro de la web: cuando haces un pedido te enviamos por WhatsApp o correo un enlace de cobro para completar la compra.`,
    },
    {
      question: "¿Por qué el precio en bolívares puede cambiar?",
      answer:
        "Nuestros precios están en dólares. El monto en Bs es referencial según la tasa del día; el monto final se confirma en el enlace de cobro.",
    },
    {
      question: "¿Hacen envíos fuera de Caracas?",
      answer:
        "Sí. Enviamos repuestos y equipos reparados a toda Venezuela mediante agencias de encomiendas. El envío tiene un coste extra a cargo del cliente.",
    },
  ];
}

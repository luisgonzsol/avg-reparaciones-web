/**
 * Plantillas de los emails transaccionales.
 *  - Al cliente: confirmación de pedido y enlace de cobro.
 *  - A la empresa: nuevo pedido, nueva solicitud de reparación y nuevo mensaje.
 */
import { Button, Details, EmailLayout, H1, ItemsTable, P, type EmailItem } from "./components";

/* ---------- Cliente: pedido recibido ---------- */

export type OrderEmailData = {
  firstName: string;
  orderNumber: string;
  items: EmailItem[];
  total: string;
  totalBs: string;
  rate: string;
  deliveryLabel: string;
  expiresAt: string;
  orderUrl: string;
};

export function OrderConfirmationEmail(d: OrderEmailData) {
  return (
    <EmailLayout preview={`Recibimos tu pedido ${d.orderNumber}. Te enviaremos el enlace de cobro.`}>
      <H1>¡Gracias, {d.firstName}! Recibimos tu pedido</H1>
      <P>
        Tu número de pedido es <strong style={{ color: "#161616" }}>{d.orderNumber}</strong>. Te enviaremos
        por WhatsApp o por correo el <strong>enlace de cobro</strong> para completar tu compra.
      </P>
      <ItemsTable items={d.items} total={d.total} totalBs={d.totalBs} />
      <P style={{ fontSize: 13 }}>
        Monto en Bs referencial según la tasa del día ({d.rate}); el monto final se confirma en el enlace de
        cobro.
      </P>
      <Details
        rows={[
          ["Entrega", d.deliveryLabel],
          ["Apartado hasta", d.expiresAt],
        ]}
      />
      <P>Si el pago no se completa antes de esa fecha, el pedido se cancela automáticamente.</P>
      <Button href={d.orderUrl}>Ver mi pedido</Button>
      <P style={{ fontSize: 13 }}>Guarda este correo: el enlace es personal y no debes compartirlo.</P>
    </EmailLayout>
  );
}

/* ---------- Cliente: enlace de cobro ---------- */

export type PaymentLinkEmailData = {
  firstName: string;
  orderNumber: string;
  total: string;
  totalBs: string;
  paymentLink: string;
  orderUrl: string;
  expiresAt: string;
};

export function PaymentLinkEmail(d: PaymentLinkEmailData) {
  return (
    <EmailLayout preview={`Enlace de cobro de tu pedido ${d.orderNumber}`}>
      <H1>Tu enlace de cobro está listo</H1>
      <P>
        Hola, {d.firstName}. Aquí tienes el enlace para pagar tu pedido{" "}
        <strong style={{ color: "#161616" }}>{d.orderNumber}</strong>.
      </P>
      <Details
        rows={[
          ["Total", d.total],
          ["Referencia en Bs", d.totalBs],
          ["Pagar antes del", d.expiresAt],
        ]}
      />
      <Button href={d.paymentLink}>Pagar mi pedido</Button>
      <P style={{ fontSize: 13 }}>
        Si el botón no funciona, copia este enlace en tu navegador:
        <br />
        <span style={{ wordBreak: "break-all" }}>{d.paymentLink}</span>
      </P>
      <P style={{ fontSize: 13 }}>
        Puedes consultar el estado de tu pedido en <a href={d.orderUrl}>esta página</a>.
      </P>
    </EmailLayout>
  );
}

/* ---------- Empresa: nuevo pedido ---------- */

export type NewOrderAdminEmailData = {
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  deliveryLabel: string;
  shipping: string | null;
  notes: string | null;
  items: EmailItem[];
  total: string;
  totalBs: string;
  adminUrl: string;
};

export function NewOrderAdminEmail(d: NewOrderAdminEmailData) {
  return (
    <EmailLayout
      preview={`Nuevo pedido ${d.orderNumber} · ${d.total}`}
      footer="Aviso interno de la web de AVG Reparaciones."
    >
      <H1>Nuevo pedido {d.orderNumber}</H1>
      <P>Hay que enviar el enlace de cobro al cliente.</P>
      <ItemsTable items={d.items} total={d.total} totalBs={d.totalBs} />
      <Details
        rows={[
          ["Cliente", d.customerName],
          ["Teléfono", d.phone],
          ["Correo", d.email],
          ["Entrega", d.deliveryLabel],
          ["Envío a", d.shipping],
          ["Notas", d.notes],
        ]}
      />
      <Button href={d.adminUrl}>Abrir en el panel</Button>
    </EmailLayout>
  );
}

/* ---------- Empresa: nueva solicitud de reparación ---------- */

export type NewRepairAdminEmailData = {
  requestNumber: string;
  customerName: string;
  phone: string;
  email: string | null;
  location: string;
  equipment: string;
  model: string | null;
  issue: string;
  deliveryLabel: string;
  returnShipping: boolean;
  photos: number;
  adminUrl: string;
};

export function NewRepairAdminEmail(d: NewRepairAdminEmailData) {
  return (
    <EmailLayout
      preview={`Nueva solicitud ${d.requestNumber} · ${d.equipment}`}
      footer="Aviso interno de la web de AVG Reparaciones."
    >
      <H1>Nueva solicitud de reparación {d.requestNumber}</H1>
      <Details
        rows={[
          ["Cliente", d.customerName],
          ["Teléfono", d.phone],
          ["Correo", d.email],
          ["Ubicación", d.location],
          ["Equipo", d.equipment],
          ["Modelo", d.model],
          ["Falla", d.issue],
          ["Entrega", d.deliveryLabel],
          ["Devolución por envío", d.returnShipping ? "Sí (coste extra)" : "No"],
          ["Fotos", d.photos ? `${d.photos} (ver en el panel)` : "Sin fotos"],
        ]}
      />
      <Button href={d.adminUrl}>Abrir en el panel</Button>
    </EmailLayout>
  );
}

/* ---------- Empresa: nuevo mensaje de contacto ---------- */

export type NewContactAdminEmailData = {
  name: string;
  phone: string;
  email: string | null;
  topic: string;
  message: string;
  adminUrl: string;
};

export function NewContactAdminEmail(d: NewContactAdminEmailData) {
  return (
    <EmailLayout preview={`Nuevo mensaje: ${d.topic}`} footer="Aviso interno de la web de AVG Reparaciones.">
      <H1>Nuevo mensaje de contacto</H1>
      <Details
        rows={[
          ["Nombre", d.name],
          ["Teléfono", d.phone],
          ["Correo", d.email],
          ["Tema", d.topic],
          ["Mensaje", d.message],
        ]}
      />
      <Button href={d.adminUrl}>Abrir en el panel</Button>
    </EmailLayout>
  );
}

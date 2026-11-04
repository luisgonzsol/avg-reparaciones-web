import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { LegalPage } from "@/components/legal/legal-page";
import { PendingTag } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Condiciones de compra, envíos y devoluciones, garantía de reparaciones y costes de recogida y devolución de AVG Reparaciones.",
  alternates: { canonical: "/terminos" },
};

export default function TermsPage() {
  const warranty = siteConfig.warrantyDuration;
  return (
    <LegalPage title="Términos y condiciones" crumb="Términos" updated="4 de noviembre de 2026">
      <p>
        Estos términos regulan el uso de esta web y los servicios de <strong>{siteConfig.legalName}</strong>{" "}
        (RIF {siteConfig.rif}). Al hacer un pedido o una solicitud de reparación, aceptas estas condiciones.
      </p>

      <h2>1. Compras en la tienda en línea</h2>
      <h3>Precios y moneda</h3>
      <ul>
        <li>Los precios se expresan en dólares estadounidenses (USD).</li>
        <li>
          El monto en bolívares (Bs) es referencial y se calcula con la tasa del día que publicamos en la web.
          El monto final se confirma en el enlace de cobro.
        </li>
        <li>
          Los precios pueden cambiar sin previo aviso, pero respetamos el precio que tenía tu pedido al
          hacerlo.
        </li>
      </ul>
      <h3>Cómo se compra</h3>
      <ul>
        <li>
          En la web <strong>no se realiza el pago</strong>. Al confirmar tu pedido, reservamos los productos y
          te enviamos por WhatsApp o por correo un enlace de cobro para completar la compra.
        </li>
        <li>
          Si el pedido no se paga en {siteConfig.orderExpirationHours} horas, se cancela automáticamente y los
          productos vuelven a estar disponibles.
        </li>
        <li>El pedido se prepara una vez confirmado el pago.</li>
        <li>
          Métodos de pago aceptados: {siteConfig.paymentMethods.join(", ")} y otros <PendingTag />.
        </li>
      </ul>
      <h3>Disponibilidad</h3>
      <p>
        Mostramos el stock disponible en tiempo real, pero si por un error un producto no estuviera
        disponible, te avisaremos y te devolveremos el dinero o te ofreceremos una alternativa.
      </p>

      <h2>2. Envíos y retiro</h2>
      <ul>
        <li>Puedes retirar tu pedido en nuestro local de Caracas sin coste.</li>
        <li>
          Hacemos envíos a toda Venezuela mediante agencias de encomiendas. El coste del envío corre por
          cuenta del cliente y se paga según las condiciones de la agencia <PendingTag>[REVISAR]</PendingTag>.
        </li>
        <li>
          Una vez entregado el paquete a la agencia, te enviamos el número de guía. Responsabilidad durante el
          transporte: <PendingTag>[REVISAR]</PendingTag>.
        </li>
      </ul>

      <h2>3. Cambios y devoluciones</h2>
      <p>
        Política de cambios y devoluciones de productos (plazos, estado del producto, quién paga el envío):{" "}
        <PendingTag />.
      </p>

      <h2>4. Piezas eléctricas sin garantía</h2>
      <p>
        <strong>Las piezas eléctricas vendidas sueltas no tienen garantía</strong> (por ejemplo: capacitores,
        motores, carbones, resistencias y similares), porque su funcionamiento depende de cómo se instalen.
        Esto se indica en la ficha de cada producto. Si quieres garantía, podemos instalar la pieza como parte
        de una reparación en nuestro taller.
      </p>

      <h2>5. Servicio de reparación</h2>
      <h3>Cómo nos haces llegar tu equipo</h3>
      <ul>
        <li>
          <strong>Traerlo al local:</strong> sin coste.
        </li>
        <li>
          <strong>Servicio de recogida:</strong> tiene un coste aparte, que te confirmamos antes.{" "}
          {siteConfig.pickupCostNote ?? <PendingTag />}
        </li>
        <li>
          <strong>Envío por agencia o mediador:</strong> el coste del envío hasta nuestro taller corre por tu
          cuenta.
        </li>
      </ul>
      <p>Todas las reparaciones se hacen en nuestro taller.</p>
      <h3>Diagnóstico y presupuesto</h3>
      <p>
        Revisamos el equipo y te informamos de la falla y del precio de la reparación. Solo reparamos cuando
        apruebas el presupuesto. Coste del diagnóstico si no se aprueba la reparación: <PendingTag />.
      </p>
      <h3>Devolución del equipo reparado</h3>
      <p>
        Puedes retirarlo en el local o pedir que te lo enviemos. El envío de vuelta tiene un coste extra a
        cargo del cliente. {siteConfig.returnShippingCostNote ?? <PendingTag />}
      </p>
      <h3>Equipos no retirados</h3>
      <p>
        Plazo para retirar el equipo una vez avisado de que está listo, y qué ocurre después: <PendingTag />.
      </p>

      <h2>6. Garantía de las reparaciones</h2>
      <ul>
        <li>Todas nuestras reparaciones tienen garantía. Duración: {warranty ?? <PendingTag />}.</li>
        <li>La garantía cubre la falla reparada y las piezas que instalamos en esa reparación.</li>
        <li>
          No cubre daños por mal uso, golpes, humedad, variaciones de voltaje, ni equipos abiertos o
          manipulados por terceros después de la reparación <PendingTag>[REVISAR]</PendingTag>.
        </li>
        <li>Para usar la garantía, conserva tu comprobante y escríbenos por WhatsApp.</li>
      </ul>

      <h2>7. Uso de la web</h2>
      <p>
        Las marcas mencionadas en la web se citan a título informativo y son propiedad de sus respectivos
        titulares. Los datos que nos envíes se tratan según nuestra{" "}
        <Link href="/privacidad">política de privacidad</Link>.
      </p>

      <h2>8. Contacto</h2>
      <p>
        Para cualquier duda sobre estos términos, escríbenos por WhatsApp al {siteConfig.phoneDisplay} o
        visítanos en nuestro local de Caracas.
      </p>
    </LegalPage>
  );
}

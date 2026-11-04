import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { PendingTag } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Qué datos personales recoge AVG Reparaciones, para qué los usa, cuánto tiempo los guarda y cómo pedir su eliminación.",
  alternates: { canonical: "/privacidad" },
};

export default async function PrivacyPage() {
  const cfg = await getSiteSettings();
  const email = cfg.email;
  return (
    <LegalPage title="Política de privacidad" crumb="Privacidad" updated="4 de noviembre de 2026">
      <p>
        En <strong>{cfg.legalName}</strong> (RIF {cfg.rif}) cuidamos tus datos personales. Aquí te explicamos,
        de forma clara, qué datos recogemos, para qué los usamos y qué derechos tienes.
      </p>

      <h2>1. Quién es responsable de tus datos</h2>
      <p>
        {cfg.legalName}, con domicilio en Caracas, Venezuela. Puedes contactarnos por WhatsApp al{" "}
        {cfg.phoneDisplay} o por correo: {email ?? <PendingTag />}.
      </p>

      <h2>2. Qué datos recogemos</h2>
      <p>Solo pedimos los datos necesarios para atenderte:</p>
      <ul>
        <li>
          <strong>Solicitud de reparación:</strong> nombre, teléfono, correo (opcional), estado y ciudad,
          datos del equipo y de la falla, y las fotos que decidas enviar.
        </li>
        <li>
          <strong>Pedidos en la tienda:</strong> nombre, cédula o RIF, teléfono, correo y, si pides envío, la
          dirección de entrega y la agencia de tu preferencia.
        </li>
        <li>
          <strong>Formulario de contacto:</strong> nombre, teléfono, correo (opcional) y tu mensaje.
        </li>
      </ul>
      <p>
        Antes de guardar las fotos les quitamos los metadatos, como la ubicación GPS que algunos teléfonos
        añaden automáticamente.
      </p>

      <h2>3. Para qué usamos tus datos</h2>
      <ul>
        <li>Responder tu solicitud o tu mensaje y darte un presupuesto.</li>
        <li>Gestionar tu pedido, enviarte el enlace de cobro y coordinar la entrega o el envío.</li>
        <li>Atender la garantía de las reparaciones.</li>
        <li>Cumplir nuestras obligaciones legales y fiscales.</li>
      </ul>
      <p>
        <strong>No vendemos ni compartimos tus datos con fines publicitarios</strong> ni te enviaremos
        publicidad sin tu permiso.
      </p>

      <h2>4. Con quién compartimos tus datos</h2>
      <p>Solo con los servicios que necesitamos para que la web funcione:</p>
      <ul>
        <li>Alojamiento de la web y de la base de datos (Vercel y Supabase).</li>
        <li>Envío de correos de confirmación (Resend).</li>
        <li>Protección contra spam en los formularios (Cloudflare Turnstile).</li>
        <li>La agencia de encomiendas que elijas, solo con los datos necesarios para el envío.</li>
      </ul>
      <p>
        El mapa de la página de contacto lo muestra Google Maps, que puede recoger datos de navegación según
        su propia política de privacidad.
      </p>

      <h2>5. Cuánto tiempo guardamos tus datos</h2>
      <p>
        Guardamos los datos mientras sean necesarios para atenderte y durante el periodo de garantía. Después
        los conservamos solo el tiempo que exija la ley (por ejemplo, la información de facturación). Plazo
        concreto de conservación: <PendingTag />.
      </p>

      <h2>6. Cookies</h2>
      <p>
        No usamos cookies de seguimiento ni de publicidad. Solo usamos cookies técnicas imprescindibles: una
        para recordar si prefieres ver los precios en dólares o en bolívares y, en el panel de administración,
        la sesión del personal autorizado. El carrito se guarda en tu propio navegador.
      </p>

      <h2>7. Tus derechos</h2>
      <p>
        Puedes pedirnos en cualquier momento que te digamos qué datos tenemos sobre ti, que los corrijamos o
        que los eliminemos (salvo los que debamos conservar por ley). Este derecho está reconocido en el
        artículo 28 de la Constitución de la República Bolivariana de Venezuela (habeas data).
      </p>
      <p>
        Para hacerlo, escríbenos por WhatsApp al {cfg.phoneDisplay} o por correo ({email ?? <PendingTag />}).
        Te responderemos lo antes posible.
      </p>

      <h2>8. Seguridad</h2>
      <p>
        Protegemos tus datos con conexiones cifradas (HTTPS), acceso restringido al personal autorizado y
        copias de seguridad. Nunca te pediremos contraseñas ni datos bancarios por WhatsApp o por correo.
      </p>

      <h2>9. Cambios en esta política</h2>
      <p>
        Si cambiamos esta política, publicaremos la nueva versión en esta página con su fecha de
        actualización. Si tienes dudas, consulta también nuestros{" "}
        <Link href="/terminos">términos y condiciones</Link>.
      </p>
    </LegalPage>
  );
}

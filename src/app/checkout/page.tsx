import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/primitives";
import { CheckoutForm } from "@/components/shop/checkout-form";

export const metadata: Metadata = {
  title: "Confirmar pedido",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/carrito", label: "Carrito" }, { label: "Confirmar pedido" }]}
        title="Confirma tu pedido"
        intro="No se paga dentro de la web: te enviaremos el enlace de cobro por WhatsApp o correo."
      />
      <Container className="py-10 sm:py-14">
        <CheckoutForm />
      </Container>
    </>
  );
}

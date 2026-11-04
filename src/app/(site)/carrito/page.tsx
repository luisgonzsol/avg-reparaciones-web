import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/primitives";
import { CartView } from "@/components/shop/cart-view";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <>
      <PageHeader crumbs={[{ href: "/tienda", label: "Tienda" }, { label: "Carrito" }]} title="Tu carrito" />
      <Container className="py-10 sm:py-14">
        <CartView />
      </Container>
    </>
  );
}

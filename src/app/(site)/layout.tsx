import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { SiteChrome } from "@/components/layout/site-chrome";

/** Web pública: cabecera, pie y botón flotante de WhatsApp. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <SiteChrome header={<Header />} footer={<Footer />} fab={<WhatsAppFab />}>
      {children}
    </SiteChrome>
  );
}

import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { siteConfig } from "@/config/site";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import "./globals.css";

// Fuentes autoalojadas por next/font (se descargan en el build, sin
// peticiones a Google desde el navegador del usuario).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "AVG Reparaciones C.A. · Reparación de electrodomésticos en Caracas",
    template: "%s · AVG Reparaciones",
  },
  description:
    "Reparación de electrodomésticos con garantía, embobinado de motores con cobre 100 % y tienda de repuestos en Caracas. Más de 20 años de experiencia. Envíos a toda Venezuela.",
  applicationName: siteConfig.shortName,
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "es_VE",
    siteName: siteConfig.legalName,
  },
};

export const viewport: Viewport = {
  themeColor: "#fafaf7",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Leer las cabeceras hace que cada página se renderice por petición,
  // necesario para que el nonce de la CSP (src/proxy.ts) se aplique.
  await headers();

  return (
    <html lang="es-VE" className={`${inter.variable} ${jakarta.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenido"
          className="sr-only z-50 rounded-full bg-ink px-5 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Saltar al contenido
        </a>
        <Header />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <Footer />
        <WhatsAppFab />
      </body>
    </html>
  );
}

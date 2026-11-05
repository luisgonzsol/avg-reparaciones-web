import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { siteConfig } from "@/config/site";
import "./globals.css";

// Fuentes autoalojadas por next/font (se descargan en el build, sin
// peticiones a Google desde el navegador del usuario).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["600", "700", "800"],
  // Sin cursiva: solo la usa el logotipo provisional (el navegador la sintetiza)
  // y así nos ahorramos ~28 KB de fuente en la primera carga.
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
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel AVG" },
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Zona de administración: sin cabecera ni pie de la web pública. */
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-dvh flex-col bg-canvas">{children}</div>;
}

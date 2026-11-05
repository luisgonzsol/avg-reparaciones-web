import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/seo/json-ld";

/** /robots.txt: el panel, el checkout, el carrito y los pedidos no se indexan. */
export default function robots(): MetadataRoute.Robots {
  // Fuera de producción (vista previa de Vercel, local) no se indexa nada.
  const isProduction = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;
  return {
    rules: isProduction
      ? { userAgent: "*", allow: "/", disallow: ["/admin", "/checkout", "/carrito", "/pedido/"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: absoluteUrl(siteConfig, "/sitemap.xml"),
  };
}

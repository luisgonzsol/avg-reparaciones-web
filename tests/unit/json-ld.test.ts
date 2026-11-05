import { describe, expect, it } from "vitest";
import { siteConfig } from "@/config/site";
import { getFaq } from "@/content/faq";
import type { ProductDetail } from "@/lib/catalog";
import { faqJsonLd, localBusinessJsonLd, productJsonLd, serializeJsonLd } from "@/lib/seo/json-ld";

const cfg = { ...siteConfig, url: "https://avg.example" };

describe("JSON-LD", () => {
  it("negocio local con horario agrupado y sin datos pendientes", () => {
    const ld = localBusinessJsonLd(cfg);
    expect(ld.telephone).toBe("+584127408970");
    expect(ld.url).toBe("https://avg.example/");
    expect(ld.openingHoursSpecification).toEqual([
      expect.objectContaining({
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "17:00",
      }),
      expect.objectContaining({ dayOfWeek: ["Saturday"], closes: "14:00" }),
    ]);
    expect("geo" in ld).toBe(false); // coordenadas [PENDIENTE]
    expect("email" in ld).toBe(false); // email [PENDIENTE]
    expect(JSON.stringify(ld)).not.toContain("PENDIENTE");
  });

  it("producto con precio, disponibilidad y vendedor", () => {
    const p = {
      id: "1",
      slug: "cuchilla",
      sku: "A-1",
      name: "Cuchilla",
      priceUsd: 12.5,
      available: 0,
      lowStockThreshold: 3,
      hasWarranty: false,
      featured: false,
      isSample: false,
      categoryName: "Licuadoras",
      categorySlug: "licuadoras",
      brandNames: ["Oster"],
      image: null,
      description: "",
      compatibility: "",
      images: [],
      active: true,
    } satisfies ProductDetail;
    const ld = productJsonLd(cfg, p);
    expect(ld.offers).toMatchObject({
      price: "12.50",
      priceCurrency: "USD",
      availability: "https://schema.org/OutOfStock",
    });
    expect(ld.brand).toEqual({ "@type": "Brand", name: "Oster" });
  });

  it("FAQ omite las respuestas con [PENDIENTE]", () => {
    const ld = faqJsonLd(getFaq(cfg));
    expect(JSON.stringify(ld)).not.toContain("PENDIENTE");
    expect(faqJsonLd([{ question: "¿?", answer: "[PENDIENTE]" }])).toBeNull();
  });

  it("serializa sin permitir cerrar el <script>", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});

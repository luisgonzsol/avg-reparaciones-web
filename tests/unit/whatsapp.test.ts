import { describe, expect, it } from "vitest";
import { orderMessage, productInquiryMessage, repairRequestMessage, whatsappUrl } from "@/lib/whatsapp";

describe("whatsappUrl", () => {
  it("sin mensaje devuelve el enlace base", () => {
    expect(whatsappUrl()).toBe("https://wa.me/584127408970");
  });

  it("codifica el texto con encodeURIComponent", () => {
    const url = whatsappUrl("Hola & adiós? #1\nñ");
    expect(url).toBe(`https://wa.me/584127408970?text=${encodeURIComponent("Hola & adiós? #1\nñ")}`);
    expect(url).not.toContain(" ");
    expect(url).not.toContain("&adi");
  });

  it("limpia el número de teléfono", () => {
    expect(whatsappUrl(undefined, "+58 412-7408970")).toBe("https://wa.me/584127408970");
  });

  it("no puede inyectar parámetros extra", () => {
    const url = new URL(whatsappUrl("hola&phone=123"));
    expect([...url.searchParams.keys()]).toEqual(["text"]);
    expect(url.searchParams.get("text")).toBe("hola&phone=123");
  });
});

describe("mensajes prellenados", () => {
  it("consulta de producto", () => {
    expect(productInquiryMessage("Vaso Oster", "EJ-0001")).toContain("Vaso Oster (ref. EJ-0001)");
  });

  it("solicitud de reparación", () => {
    const msg = repairRequestMessage({
      requestNumber: "REP-2026-0001",
      name: "Ana",
      equipment: "Lavadora",
      brand: "Whirlpool",
      issue: "No centrifuga",
      deliveryMethod: "Traer al local",
    });
    expect(msg).toContain("REP-2026-0001");
    expect(msg).toContain("Equipo: Lavadora Whirlpool");
  });

  it("pedido", () => {
    const msg = orderMessage({
      orderNumber: "AVG-2026-0001",
      items: [{ name: 'Aspa 18"', quantity: 2 }],
      totalUsd: "$10,50",
      totalBs: "Bs. 2.482,73",
    });
    expect(msg).toContain("AVG-2026-0001");
    expect(msg).toContain('• 2 × Aspa 18"');
    expect(msg).toContain("Total: $10,50 (ref. Bs. 2.482,73)");
  });
});

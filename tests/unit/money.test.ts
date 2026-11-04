import { describe, expect, it } from "vitest";
import { formatBs, formatPrice, formatUsd, subtotalUsd, toCents, usdToBs } from "@/lib/money";

// Normaliza espacios (Intl puede usar espacios no separables).
const n = (s: string) => s.replace(/\s/g, " ");

describe("conversión USD → Bs", () => {
  it("multiplica por la tasa y redondea a 2 decimales", () => {
    expect(usdToBs(10, 236.45)).toBe(2364.5);
    expect(usdToBs(14.5, 236.45)).toBe(3428.53); // 3428.525 → 3428.53
  });

  it("evita errores de coma flotante", () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(usdToBs(0.1, 3)).toBe(0.3);
  });

  it("rechaza tasas o importes no válidos", () => {
    expect(() => usdToBs(10, 0)).toThrow();
    expect(() => usdToBs(10, -5)).toThrow();
    expect(() => usdToBs(Number.NaN, 10)).toThrow();
  });
});

describe("subtotal", () => {
  it("suma en céntimos", () => {
    expect(
      subtotalUsd([
        { priceUsd: 14.5, quantity: 2 },
        { priceUsd: 0.1, quantity: 3 },
      ]),
    ).toBe(29.3);
  });

  it("rechaza cantidades no enteras o negativas", () => {
    expect(() => subtotalUsd([{ priceUsd: 1, quantity: 1.5 }])).toThrow();
    expect(() => subtotalUsd([{ priceUsd: 1, quantity: -1 }])).toThrow();
  });
});

describe("formato es-VE", () => {
  it("formatea bolívares con punto de miles y coma decimal", () => {
    expect(n(formatBs(1234567.8))).toBe("Bs. 1.234.567,80");
  });

  it("formatea dólares", () => {
    expect(n(formatUsd(14.5))).toMatch(/^\$ ?14,50$/);
  });

  it("formatPrice elige la moneda", () => {
    expect(n(formatPrice(10, "VES", 236.45))).toBe("Bs. 2.364,50");
    expect(n(formatPrice(10, "USD", 236.45))).toMatch(/10,00/);
  });
});

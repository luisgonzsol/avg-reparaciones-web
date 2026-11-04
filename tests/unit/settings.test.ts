import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { mergeSettings } = await import("@/lib/settings");
const { siteConfig } = await import("@/config/site");

const row = {
  email: "avg@gmail.com",
  phone_display: "+58 412-0000000",
  whatsapp_number: "584120000000",
  address_street: "Av. Este 12",
  address_between: "entre El Hoyo y",
  address_second_street: "Las Gradillas",
  instagram_url: "https://www.instagram.com/otra.cuenta/",
  schedule: { 0: null, 1: { open: "09:00", close: "18:00" }, 2: null, 3: null, 4: null, 5: null, 6: null },
  warranty_duration: "3 meses",
  pickup_cost_note: "",
  return_shipping_cost_note: null,
  order_expiration_hours: 24,
  payment_methods: ["Pago Móvil", "Zelle"],
  show_testimonials: false,
  updated_at: "2026-11-05T00:00:00Z",
};

describe("mergeSettings", () => {
  it("aplica los ajustes del panel sobre los valores del código", () => {
    const cfg = mergeSettings(row);
    expect(cfg.email).toBe("avg@gmail.com");
    expect(cfg.phoneE164).toBe("+584120000000");
    expect(cfg.instagramHandle).toBe("@otra.cuenta");
    expect(cfg.address.secondStreet).toBe("Las Gradillas");
    expect(cfg.schedule[1]).toEqual({ open: "09:00", close: "18:00" });
    expect(cfg.pickupCostNote).toBeNull(); // vacío = [PENDIENTE]
    expect(cfg.orderExpirationHours).toBe(24);
    expect(cfg.legalName).toBe(siteConfig.legalName);
  });

  it("ignora un horario mal formado", () => {
    const cfg = mergeSettings({ ...row, schedule: { 1: { open: "9", close: "x" } } });
    expect(cfg.schedule).toEqual(siteConfig.schedule);
  });
});

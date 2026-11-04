import { describe, expect, it } from "vitest";
import { cleanText, normalizeVePhone, toFieldErrors } from "@/lib/validation/common";
import { contactSchema, repairRequestSchema } from "@/lib/validation/forms";

describe("normalizeVePhone", () => {
  it.each([
    ["0412-7408970", "+584127408970"],
    ["04127408970", "+584127408970"],
    ["+58 412 740 8970", "+584127408970"],
    ["58 (414) 123.45.67", "+584141234567"],
    ["0424 1234567", "+584241234567"],
    ["0422-1234567", "+584221234567"],
    ["0212-5551234", "+582125551234"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeVePhone(input)).toBe(expected);
  });

  it.each(["", "12345", "0412-12345", "0413-1234567", "+34 612 345 678", "0412-12345678", "abc"])(
    "rechaza %s",
    (input) => {
      expect(normalizeVePhone(input)).toBeNull();
    },
  );
});

describe("cleanText", () => {
  it("quita caracteres de control y espacios sobrantes", () => {
    expect(cleanText("  hola\u0000   mundo \u0007 ")).toBe("hola mundo");
  });
  it("conserva los saltos de línea", () => {
    expect(cleanText("línea 1\nlínea 2")).toBe("línea 1\nlínea 2");
  });
});

const validRepair = {
  equipmentType: "Lavadora",
  brand: "Whirlpool",
  model: "",
  issue: "No centrifuga y hace mucho ruido al final del ciclo.",
  deliveryMethod: "dropoff",
  returnShipping: "no",
  name: "Ana Pérez",
  phone: "0414-1234567",
  email: "",
  state: "Distrito Capital",
  city: "Caracas",
  privacy: "on",
  website: "",
};

describe("repairRequestSchema", () => {
  it("acepta una solicitud válida y normaliza datos", () => {
    const r = repairRequestSchema.parse({ ...validRepair, email: " ANA@Gmail.com " });
    expect(r.phone).toBe("+584141234567");
    expect(r.email).toBe("ana@gmail.com");
    expect(r.returnShipping).toBe(false);
    expect(r.privacy).toBe(true);
  });

  it("exige aceptar la privacidad", () => {
    const r = repairRequestSchema.safeParse({ ...validRepair, privacy: undefined });
    expect(r.success).toBe(false);
    if (!r.success) expect(toFieldErrors(r.error).privacy).toMatch(/privacidad/);
  });

  it("rechaza valores fuera de las listas", () => {
    const r = repairRequestSchema.safeParse({
      ...validRepair,
      equipmentType: "Nave espacial",
      state: "Texas",
      deliveryMethod: "teleport",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = toFieldErrors(r.error);
      expect(Object.keys(e)).toEqual(expect.arrayContaining(["equipmentType", "state", "deliveryMethod"]));
    }
  });

  it("limita la longitud de la descripción", () => {
    const r = repairRequestSchema.safeParse({ ...validRepair, issue: "x".repeat(1501) });
    expect(r.success).toBe(false);
  });

  it("exige una descripción mínima", () => {
    const r = repairRequestSchema.safeParse({ ...validRepair, issue: "roto" });
    expect(r.success).toBe(false);
  });

  it("rechaza un correo mal escrito", () => {
    const r = repairRequestSchema.safeParse({ ...validRepair, email: "ana@" });
    expect(r.success).toBe(false);
  });
});

describe("contactSchema", () => {
  it("acepta un mensaje válido", () => {
    const r = contactSchema.safeParse({
      name: "Luis",
      phone: "0412 7408970",
      email: "",
      topic: "Repuestos",
      message: "¿Tienen vaso para licuadora Oster?",
      privacy: "on",
    });
    expect(r.success).toBe(true);
  });
});

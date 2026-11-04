import { describe, expect, it } from "vitest";
import {
  cleanText,
  maskIdDoc,
  normalizeIdDoc,
  normalizeVePhone,
  toFieldErrors,
} from "@/lib/validation/common";
import { checkoutSchema, contactSchema, repairRequestSchema } from "@/lib/validation/forms";

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

describe("cédula / RIF", () => {
  it.each([
    ["V12345678", "V-12345678"],
    ["v-12.345.678", "V-12345678"],
    ["E 8123456", "E-8123456"],
    ["J-12345678-9", "J-12345678-9"],
    ["j123456789", "J-12345678-9"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeIdDoc(input)).toBe(expected);
  });

  it.each(["", "12345678", "X-12345678", "V-12", "V-1234567890123"])("rechaza %s", (input) => {
    expect(normalizeIdDoc(input)).toBeNull();
  });

  it("enmascara para páginas públicas", () => {
    expect(maskIdDoc("V-12345678")).toBe("V-****5678");
    expect(maskIdDoc("J-12345678-9")).toBe("J-****5678-*");
    expect(maskIdDoc("basura")).toBe("****");
  });
});

describe("checkoutSchema", () => {
  const base = {
    name: "Ana Pérez",
    idDoc: "v12345678",
    phone: "0414-1234567",
    email: "ana@gmail.com",
    deliveryMethod: "store_pickup",
    terms: "on",
  };

  it("acepta retiro en tienda sin dirección", () => {
    const r = checkoutSchema.parse(base);
    expect(r.idDoc).toBe("V-12345678");
  });

  it("exige estado, ciudad y dirección para envío nacional", () => {
    const r = checkoutSchema.safeParse({ ...base, deliveryMethod: "national_shipping" });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(toFieldErrors(r.error)).sort()).toEqual(["address", "city", "state"]);
  });

  it("acepta envío nacional completo", () => {
    const r = checkoutSchema.safeParse({
      ...base,
      deliveryMethod: "national_shipping",
      state: "Zulia",
      city: "Maracaibo",
      address: "Av. 5 de Julio, edificio Sol, apto 3",
      agency: "MRW",
    });
    expect(r.success).toBe(true);
  });

  it("exige correo en el checkout", () => {
    expect(checkoutSchema.safeParse({ ...base, email: "" }).success).toBe(false);
  });
});

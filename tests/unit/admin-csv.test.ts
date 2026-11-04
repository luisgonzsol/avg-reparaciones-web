import { describe, expect, it } from "vitest";
import { csvCell, parseCsv, readProductsCsv, writeProductsCsv } from "@/lib/admin/csv";
import { slugify } from "@/lib/slug";

const HEADER =
  "sku;nombre;slug;categoria;marcas;precio_usd;stock;umbral_stock_bajo;garantia;destacado;activo;descripcion;compatibilidad";

describe("slugify", () => {
  it("quita tildes, eñes y símbolos", () => {
    expect(slugify("Válvula olla de presión 6 L")).toBe("valvula-olla-de-presion-6-l");
    expect(slugify("  Niño & Cía!! ")).toBe("nino-cia");
  });
});

describe("parseCsv", () => {
  it("detecta ; o , y respeta comillas y saltos de línea", () => {
    expect(parseCsv('a;b\n1;"x;y"\n')).toEqual([
      ["a", "b"],
      ["1", "x;y"],
    ]);
    expect(parseCsv('a,b\r\n"línea\nnueva","con ""comillas"""')).toEqual([
      ["a", "b"],
      ["línea\nnueva", 'con "comillas"'],
    ]);
  });

  it("ignora el BOM y las filas vacías", () => {
    expect(parseCsv("﻿a;b\n\n1;2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("readProductsCsv", () => {
  it("convierte filas válidas (coma decimal, sí/no, marcas, slug automático)", () => {
    const r = readProductsCsv(
      `${HEADER}\nA-1;Cuchilla Oster;;licuadoras;oster|Philips;12,50;4;;si;no;;Desc;Modelo X`,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows[0]).toMatchObject({
      sku: "A-1",
      slug: "cuchilla-oster",
      category: "licuadoras",
      brands: ["oster", "philips"],
      price_usd: "12.50",
      stock: 4,
      low_stock_threshold: 3,
      has_warranty: true,
      featured: false,
      active: true,
    });
  });

  it("solo exige las columnas obligatorias", () => {
    const r = readProductsCsv("sku,nombre,categoria,precio_usd,stock\nB-1,Correa lavadora,lavadoras,9.99,2");
    expect(r.ok).toBe(true);
  });

  it("informa de errores por fila y de duplicados", () => {
    const r = readProductsCsv(
      `${HEADER}\nA-1;X;;;;0;-1;;;;;;\nA-2;Correa;correa;lavadoras;;5;1;;quizas;;;;\nA-3;Correa;correa;lavadoras;;5;1;;;;;;\nA-3;Otra;otra;lavadoras;;5;1;;;;;;`,
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.startsWith("Fila 2:"))).toBe(true);
    expect(r.errors.some((e) => e.startsWith("Fila 3:") && e.includes("si"))).toBe(true);
    expect(r.errors.some((e) => e.includes("el sku A-3 ya aparece en la fila 4"))).toBe(true);
  });

  it("rechaza archivos sin columnas obligatorias o vacíos", () => {
    expect(readProductsCsv("sku;nombre\nA;B")).toMatchObject({ ok: false });
    expect(readProductsCsv(HEADER)).toMatchObject({ ok: false });
  });
});

describe("exportación", () => {
  it("neutraliza fórmulas y escapa separadores", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell('a;"b"')).toBe('"a;""b"""');
    expect(csvCell(true)).toBe("si");
  });

  it("lo exportado se puede volver a importar igual", () => {
    const csv = writeProductsCsv([
      {
        sku: "C-1",
        name: "Motor; universal",
        slug: "motor-universal",
        category: "motores",
        brands: ["oster"],
        price_usd: "28",
        stock: 3,
        low_stock_threshold: 1,
        has_warranty: false,
        featured: true,
        active: true,
        description: "Línea 1\nLínea 2",
        compatibility: "",
      },
    ]);
    expect(csv.startsWith("﻿")).toBe(true);
    const r = readProductsCsv(csv);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows[0]).toMatchObject({
      name: "Motor; universal",
      price_usd: "28.00",
      featured: true,
      description: "Línea 1\nLínea 2",
    });
  });
});

import { describe, expect, it } from "vitest";
import { checkPhoto, sniffImageType } from "@/lib/files";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const webp = new Uint8Array([
  ...new TextEncoder().encode("RIFF"),
  0,
  0,
  0,
  0,
  ...new TextEncoder().encode("WEBP"),
]);
const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const svg = new TextEncoder().encode("<svg xmlns=");

describe("sniffImageType", () => {
  it("detecta JPEG, PNG y WEBP por su contenido", () => {
    expect(sniffImageType(jpeg)).toBe("image/jpeg");
    expect(sniffImageType(png)).toBe("image/png");
    expect(sniffImageType(webp)).toBe("image/webp");
  });

  it("rechaza ejecutables y SVG aunque se llamen .jpg", () => {
    expect(sniffImageType(exe)).toBeNull();
    expect(sniffImageType(svg)).toBeNull();
  });
});

describe("checkPhoto", () => {
  it("acepta una imagen válida", async () => {
    const r = await checkPhoto(new File([jpeg], "foto.jpg", { type: "image/jpeg" }));
    expect(r).toEqual({ ok: true, type: "image/jpeg" });
  });

  it("no se fía de la extensión ni del tipo declarado", async () => {
    const r = await checkPhoto(new File([exe], "foto.jpg", { type: "image/jpeg" }));
    expect(r.ok).toBe(false);
  });

  it("rechaza archivos de más de 5 MB", async () => {
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    big.set(jpeg);
    const r = await checkPhoto(new File([big], "grande.jpg"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/5 MB/);
  });

  it("rechaza archivos vacíos", async () => {
    const r = await checkPhoto(new File([], "vacia.jpg"));
    expect(r.ok).toBe(false);
  });
});

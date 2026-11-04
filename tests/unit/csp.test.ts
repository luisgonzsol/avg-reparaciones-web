import { describe, expect, it } from "vitest";
import { buildCsp } from "@/lib/security/csp";

describe("Content-Security-Policy", () => {
  const prod = buildCsp({ nonce: "abc123", isDev: false, supabaseUrl: "https://xyz.supabase.co" });

  it("incluye el nonce y bloquea marcos externos", () => {
    expect(prod).toContain("'nonce-abc123'");
    expect(prod).toContain("frame-ancestors 'none'");
    expect(prod).toContain("object-src 'none'");
  });

  it("no permite unsafe-eval ni unsafe-inline en scripts en producción", () => {
    const scriptSrc = prod.split("; ").find((d) => d.startsWith("script-src"))!;
    expect(scriptSrc).not.toContain("unsafe-eval");
    expect(scriptSrc).not.toContain("unsafe-inline");
  });

  it("permite Supabase y Google Maps", () => {
    expect(prod).toContain("https://xyz.supabase.co");
    expect(prod).toContain("wss://xyz.supabase.co");
    expect(prod).toMatch(/frame-src[^;]*https:\/\/www\.google\.com/);
  });

  it("en desarrollo permite unsafe-eval (lo necesita React)", () => {
    expect(buildCsp({ nonce: "n", isDev: true })).toContain("'unsafe-eval'");
  });
});

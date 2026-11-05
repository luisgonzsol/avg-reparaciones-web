import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Revisión automática de accesibilidad (WCAG 2.1 A/AA) de las páginas públicas.
const PAGES = [
  "/",
  "/servicios",
  "/servicios/reparacion-electrodomesticos",
  "/tienda",
  "/tienda/motor-ventilador-pedestal",
  "/carrito",
  "/solicitar-reparacion",
  "/contacto",
  "/nosotros",
  "/preguntas-frecuentes",
  "/terminos",
  "/admin/login",
];

for (const path of PAGES) {
  test(`accesibilidad: ${path}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // El mapa de Google es un iframe de terceros que no controlamos.
      .exclude("iframe")
      .analyze();
    const summary = results.violations.map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help} → ${v.nodes
          .map((n) => n.target.join(" "))
          .slice(0, 3)
          .join(" | ")}`,
    );
    expect(summary, summary.join("\n")).toEqual([]);
  });
}

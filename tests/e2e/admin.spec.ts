import { expect, test } from "@playwright/test";
import { resetRateLimits } from "./helpers";

test.describe("panel de administración", () => {
  test.beforeEach(async () => {
    await resetRateLimits();
  });

  test("sin sesión, /admin y sus secciones redirigen al login", async ({ page }) => {
    for (const path of ["/admin", "/admin/pedidos", "/admin/ajustes", "/admin/productos/exportar"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login$/);
    }
    await expect(page.getByRole("heading", { name: "Panel de administración" })).toBeVisible();
  });

  test("el login no revela si la cuenta existe", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill("nadie@example.com");
    await page.getByLabel("Contraseña").fill("contraseña-incorrecta");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Email o contraseña incorrectos." }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("el panel no se indexa", async ({ request }) => {
    const res = await request.get("/admin/login");
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
    expect(await res.text()).toContain('content="noindex, nofollow"');
  });
});

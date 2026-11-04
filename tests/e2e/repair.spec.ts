import { expect, test } from "@playwright/test";
import { db, resetRateLimits } from "./helpers";

const created: string[] = [];

test.beforeAll(resetRateLimits);
test.afterAll(async () => {
  if (created.length) await db().from("repair_requests").delete().in("request_number", created);
});

test("enviar una solicitud de reparación", async ({ page }) => {
  await page.goto("/solicitar-reparacion");

  // Paso 1
  await page.getByLabel("Tipo de equipo").selectOption("Lavadora");
  await page.getByLabel("Marca").fill("Whirlpool");
  await page.getByLabel("¿Qué le pasa?").fill("Prueba automática: llena de agua pero no centrifuga.");
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 2
  await expect(page.getByRole("heading", { name: /¿Cómo nos harás llegar tu equipo\?/ })).toBeVisible();
  await page.getByText("Lo llevo al local", { exact: true }).click();
  await page.getByText("No, lo retiro en el local", { exact: true }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 3
  await page.getByLabel("Nombre y apellido").fill("Prueba Automática");
  await page.getByLabel("Teléfono (WhatsApp)").fill("0414 123 4567");
  await page.getByLabel("Estado").selectOption("Distrito Capital");
  await page.getByLabel("Ciudad").fill("Caracas");
  await page.locator('input[name="privacy"]').check();
  await page.getByRole("button", { name: "Enviar solicitud" }).click();

  // Confirmación con número real (no simulado)
  await expect(page.getByRole("heading", { name: "¡Recibimos tu solicitud, Prueba!" })).toBeVisible();
  const number = (await page.locator("strong", { hasText: /^REP-\d{4}-\d{4}$/ }).textContent())!;
  created.push(number);
  await expect(page.getByText("[SIMULACIÓN]")).toHaveCount(0);

  const { data } = await db()
    .from("repair_requests")
    .select("customer_phone, equipment_type, status")
    .eq("request_number", number)
    .single();
  expect(data).toEqual({ customer_phone: "+584141234567", equipment_type: "Lavadora", status: "new" });

  const wa = await page.getByRole("link", { name: /Enviar resumen por WhatsApp/ }).getAttribute("href");
  expect(decodeURIComponent(wa!.split("text=")[1]!)).toContain(number);
});

test("muestra errores claros si faltan datos", async ({ page }) => {
  await page.goto("/solicitar-reparacion");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Revisa los campos marcados en rojo." }),
  ).toBeVisible();
  await expect(page.getByText("Elige el tipo de equipo.")).toBeVisible();
  await expect(page.getByLabel("Tipo de equipo")).toBeFocused();
});

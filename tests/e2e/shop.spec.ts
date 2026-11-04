import { expect, test } from "@playwright/test";
import { cleanupOrder, db, emptyCart, fillCheckout, getProduct, resetRateLimits } from "./helpers";

const tokens: string[] = [];

test.beforeAll(resetRateLimits);
test.afterAll(async () => {
  for (const t of tokens) await cleanupOrder(t);
});

test("navegar → añadir al carrito → checkout → confirmación", async ({ page }) => {
  const slug = "aspa-ventilador-18";
  const before = await getProduct(slug);
  await emptyCart(page);

  // Catálogo con búsqueda
  await page.goto("/tienda?q=aspa");
  await expect(page.getByRole("heading", { name: /productos? para «aspa»/ })).toBeVisible();
  await page.getByRole("link", { name: "Aspa para ventilador de 18 pulgadas" }).click();

  // Ficha
  await expect(
    page.getByRole("heading", { level: 1, name: "Aspa para ventilador de 18 pulgadas" }),
  ).toBeVisible();
  await expect(page.getByText("SKU: EJ-0005")).toBeVisible();
  await expect(page.getByText("Pieza sin garantía.")).toBeVisible();
  await expect(page.getByText(/Monto en Bs referencial según la tasa del día/)).toBeVisible();
  await page.getByRole("button", { name: "Añadir una unidad" }).click();
  await page.getByRole("button", { name: "Añadir al carrito" }).click();
  await expect(page.getByText("2 unidades añadidas al carrito.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Carrito: 2 productos" })).toBeVisible();

  // Carrito: precios refrescados desde el servidor
  await page.goto("/carrito");
  await expect(page.getByRole("link", { name: "Aspa para ventilador de 18 pulgadas" })).toBeVisible();
  await expect(page.getByText("$10,50").first()).toBeVisible(); // 2 × 5,25
  await page.getByRole("link", { name: "Continuar con el pedido" }).click();

  // Checkout
  await expect(page).toHaveURL(/\/checkout$/);
  await fillCheckout(page);
  await page.getByRole("button", { name: "Confirmar pedido" }).click();

  // Confirmación por token
  await page.waitForURL(/\/pedido\/[0-9a-f]{64}$/);
  const token = page.url().split("/").pop()!;
  tokens.push(token);
  await expect(page.getByText(/^AVG-\d{4}-\d{4}$/)).toBeVisible();
  await expect(page.getByText("Pendiente de pago")).toBeVisible();
  await expect(
    page.getByText("Te enviaremos por WhatsApp o Gmail el enlace de cobro para completar tu compra."),
  ).toBeVisible();
  await expect(page.getByText("V-****5678")).toBeVisible();
  await expect(page.getByText("12345678")).toHaveCount(0); // la cédula nunca completa
  const wa = await page.getByRole("link", { name: /Continuar por WhatsApp/ }).getAttribute("href");
  expect(wa).toMatch(/^https:\/\/wa\.me\/584127408970\?text=/);
  expect(decodeURIComponent(wa!.split("text=")[1]!)).toContain("2 × Aspa para ventilador de 18 pulgadas");

  // El carrito se vació y el stock quedó reservado en la BD
  await expect(page.getByRole("link", { name: "Carrito: 0 productos" })).toBeVisible();
  const after = await getProduct(slug);
  expect(after.reserved).toBe(before.reserved + 2);
});

test("no permite añadir más unidades de las disponibles", async ({ page }) => {
  const p = await getProduct("cuchilla-licuadora-oster");
  const available = p.stock - p.reserved;
  await emptyCart(page);
  await page.goto("/tienda/cuchilla-licuadora-oster");
  const plus = page.getByRole("button", { name: "Añadir una unidad" });
  for (let i = 1; i < available; i++) await plus.click();
  await expect(plus).toBeDisabled();
  await page.getByRole("button", { name: "Añadir al carrito" }).click();
  await expect(
    page.getByText(`Ya tienes en tu carrito todas las unidades disponibles (${available}).`),
  ).toBeVisible();
});

test("comprar más stock del disponible falla en el servidor (alguien se adelantó)", async ({ page }) => {
  const slug = "cuchilla-licuadora-oster";
  const original = await getProduct(slug);
  await emptyCart(page);
  await page.goto(`/tienda/${slug}`);
  await page.getByRole("button", { name: "Añadir al carrito" }).click();
  await page.goto("/checkout");
  await fillCheckout(page);

  // Otra persona se lleva todo el stock mientras rellenamos el formulario.
  await db().from("products").update({ reserved: original.stock }).eq("id", original.id);
  try {
    await page.getByRole("button", { name: "Confirmar pedido" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Alguien se nos adelantó" })).toBeVisible();
    await expect(page).toHaveURL(/\/checkout$/);
    const p = await getProduct(slug);
    expect(p.reserved).toBe(original.stock); // no se reservó nada más
  } finally {
    await db().from("products").update({ reserved: original.reserved }).eq("id", original.id);
  }
});

test("un pedido no se puede ver con un token inventado", async ({ page }) => {
  const res = await page.goto(`/pedido/${"0".repeat(64)}`);
  expect(res?.status()).toBe(404);
  const res2 = await page.goto("/pedido/AVG-2026-0001");
  expect(res2?.status()).toBe(404);
});

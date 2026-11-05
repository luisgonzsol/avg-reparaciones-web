import { expect, test } from "@playwright/test";
import { cleanupOrder, createTempAdmin, createTestOrder, getProduct, resetRateLimits } from "./helpers";

const SLUG = "motor-ventilador-pedestal";

// Con Turnstile activo el login exige el reto de Cloudflare: esta prueba se omite.
test.skip(
  Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY),
  "Turnstile activo: el login automático no es posible",
);

test("login de administrador → cambiar estado de pedido (pagado descuenta stock)", async ({ page }) => {
  await resetRateLimits();
  const admin = await createTempAdmin();
  const before = await getProduct(SLUG);
  const order = await createTestOrder(SLUG);
  try {
    // Login
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(admin.email);
    await page.getByLabel("Contraseña").fill(admin.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Pedido → Pagado
    await page.goto(`/admin/pedidos/${order.id}`);
    await page.getByLabel("Nuevo estado").selectOption({ label: "Pagado" });
    await page.getByRole("button", { name: "Cambiar estado" }).click();
    await expect(page.getByRole("status").filter({ hasText: /guardad|actualizad|cambiad/i })).toBeVisible();

    await expect
      .poll(async () => getProduct(SLUG))
      .toEqual({ id: before.id, stock: before.stock - 1, reserved: before.reserved });

    // Una transición no permitida no se ofrece (Pagado → Pendiente de pago).
    await page.reload();
    await expect(
      page.getByLabel("Nuevo estado").locator("option", { hasText: "Pendiente de pago" }),
    ).toHaveCount(0);
  } finally {
    await cleanupOrder(order.token); // cancela (devuelve el stock) y borra
    await admin.remove();
  }
  expect(await getProduct(SLUG)).toEqual(before);
});

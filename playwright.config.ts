import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas E2E de los flujos críticos (escritorio y móvil).
 * Usan la base de datos de Supabase configurada en .env.local y limpian
 * los datos que crean (pedidos, solicitudes).
 *
 * Ejecutar: npm run test:e2e
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    locale: "es-VE",
    timezoneId: "America/Caracas",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "movil", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});

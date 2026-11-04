@AGENTS.md

# AVG Reparaciones C.A. — Web oficial

Web de un taller y tienda de repuestos de electrodomésticos en Caracas (RIF J-504740098).
Requisitos completos en `PROMPT.md`, que es la fuente de verdad del encargo. Este archivo resume el estado y las convenciones.

## Estado por fases

- [x] **Fase 1** — Base y diseño: setup, tokens, layout, Inicio con datos de ejemplo, cabeceras de seguridad.
- [x] **Fase 2** — Páginas informativas y formularios. Los formularios se validan en el servidor, pero el envío es **simulado**: no se guarda nada y el número de solicitud lleva la marca [SIMULACIÓN]. Las fotos se validan en el navegador y aún no se suben.
- [x] **Fase 3** — Supabase (proyecto real conectado), tienda, carrito, checkout con reserva atómica, expiración con pg_cron, formularios guardando en la BD.
- [ ] **Fase 4** — Panel admin, emails, Storage, rate limiting, Turnstile.
- [ ] **Fase 5** — SEO, accesibilidad, Lighthouse, E2E, despliegue.

Al cerrar cada fase: `npm run check` + `npm run build` + `npm audit`, commit, resumen al usuario y lista [PENDIENTE]. Luego se espera su confirmación.

## Stack

- **Next.js 16.4** (App Router, Turbopack), React 19.3, TypeScript estricto. **Lee `node_modules/next/dist/docs/` antes de usar APIs de Next**, porque cambian entre versiones:
  - `middleware` ahora se llama **`proxy`** (`src/proxy.ts`).
  - `<Image priority>` está obsoleto; se usa `preload`.
  - `LayoutProps` / `PageProps` son tipos globales generados por `next typegen`.
- **Tailwind CSS v4**, cargado con `@tailwindcss/turbopack` (configurado en `next.config.ts`; no hay postcss.config). Los tokens están en `@theme` dentro de `src/app/globals.css`.
- Zod, clsx. Vitest (lógica y BD con PGlite) y Playwright (E2E, escritorio y móvil).
- Supabase, Resend y Turnstile llegan en las Fases 3 y 4.
- npm como gestor de paquetes. Node ≥ 20.9 (el desarrollo se hace con Node 26).

## Decisiones de arquitectura

- **`cacheComponents` desactivado (a propósito).** La CSP usa un nonce por petición, y eso exige renderizado dinámico: el layout raíz hace `await headers()`. Si en el futuro se quieren páginas estáticas, hay que estudiar la SRI experimental (`experimental.sri`) en lugar del nonce.
- **CSP** en `src/lib/security/csp.ts`, aplicada desde `src/proxy.ts`. El resto de cabeceras de seguridad están en `next.config.ts`. Para añadir un dominio externo, edita `buildCsp` y su test.
- **Moneda:** el precio base está siempre en USD; los cálculos se hacen en céntimos (`src/lib/money.ts`). La preferencia USD/Bs va en una cookie `httpOnly` y se cambia con una Server Action (`src/lib/actions/currency.ts`).
- **Horario abierto/cerrado:** se calcula en el servidor con `America/Caracas` (`src/lib/schedule.ts`) y nunca con el reloj del cliente.
- **Carrito:** `localStorage` con try/catch y solo guarda `{slug, quantity}` (`src/lib/cart/store.ts`). Precios y stock se revalidan siempre en el servidor.
- **WhatsApp:** usar siempre `whatsappUrl()` de `src/lib/whatsapp.ts`, que codifica el texto con `encodeURIComponent`.
- Planificado para la Fase 3:
  - limitación de frecuencia con una tabla en Postgres, sin Upstash;
  - expiración de pedidos con `pg_cron`;
  - fotos comprimidas en el navegador antes de subirlas (límite de 4,5 MB por petición en Vercel) y validadas de nuevo en el servidor con `sharp`.

## Base de datos y tienda (Fase 3)

- **Migraciones** en `supabase/migrations/`:
  - `_schema`: tablas, CHECK e índices;
  - `_functions`: RPC;
  - `_rls`: políticas;
  - `_cron`: `pg_cron`, solo existe en Supabase.
- **Semilla** en `supabase/seed.sql`: 8 categorías, 11 marcas, 20 productos `EJ-xxxx` con `is_sample = true` y una tasa marcada «EJEMPLO».
- **Aplicar a Supabase:** `npm run db:push`. Con `-- --seed` carga también los datos de ejemplo; con `-- --dry` solo simula. Lee `SUPABASE_DB_URL` de `.env.local`.
- **Pruebas de BD:** `tests/db/` ejecuta las migraciones reales en PGlite (Postgres embebido) y simula los roles de Supabase. `tests/integration/` lanza la prueba de concurrencia real contra Supabase (`npm run test:integration`).
- **Stock:** `stock` = unidades físicas, `reserved` = apartadas, disponible = `stock - reserved`.
  - `create_order` bloquea las filas (`FOR UPDATE`, en orden por id) y reserva.
  - `mark_order_paid` descuenta el stock definitivamente.
  - `cancel_order` y `expire_orders` liberan la reserva; si el pedido ya estaba pagado, `cancel_order` devuelve las unidades al stock.
  - Las cuatro funciones están restringidas a `service_role`.
- **Precios y totales** los calcula SIEMPRE la BD. `src/lib/money.ts` usa aritmética entera (BigInt) para coincidir al céntimo con `round(numeric, 2)` de Postgres.
- **Clientes Supabase** (`src/lib/supabase/server.ts`):
  - `getPublicClient()`: clave publicable, sujeta a RLS; para el catálogo.
  - `getServiceClient()`: clave secreta, solo en el servidor; para RPC y altas.
  - Variables: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SECRET_KEY`. Se aceptan también los nombres antiguos `*_ANON_KEY` y `*_SERVICE_ROLE_KEY`.
- **Página `/pedido/[token]`:** solo con el token aleatorio de 64 hex. Muestra la cédula enmascarada. `noindex` y `no-referrer`.
- **Sin Supabase configurado:**
  - `/tienda` muestra el aviso `StoreUnavailable`;
  - Inicio oculta los destacados;
  - los formularios simulan el envío.
- **Rate limiting:** `src/lib/security/rate-limit.ts` usa la tabla `rate_limits` con el hash de la IP más una sal. Si la base de datos falla, deja pasar la petición (fail-open).
- **Pendiente para la Fase 4:**
  - la tabla `settings` existe, pero la web aún lee `src/config/site.ts`;
  - emails;
  - escritura desde el panel y auditoría;
  - bucket de Storage y subida de fotos.

## Entorno Supabase real

- Proyecto `ldudfupxmuqymiiidlab`, región **eu-west-1 (Irlanda)**, elegida por el cliente. Al desplegar en Vercel, pon las funciones en **`dub1`** (Dublín) para que queden cerca de la BD.
- Proyecto creado con "Automatically expose new tables" desactivado y "automatic RLS" activado. Las migraciones conceden los permisos de forma explícita; está probado en ambos modos (`tests/db/no-auto-expose.test.ts`).
- `.env.local` (no va a git): URL, clave publicable, secret key y `SUPABASE_DB_URL` (Session pooler).
  - Asistente para las claves secretas: `node scripts/setup-env.mjs`. En este Windows, PowerShell bloquea `npm.ps1`, así que hay que usar `node …` directamente.
- Consultas de solo lectura: `npm run db:query -- "select …"`. Nunca imprime la cadena de conexión.
- **Las pruebas E2E e integración se ejecutan contra esta BD** y limpian lo que crean. Efecto secundario: avanzan los contadores `counters`.
- **Antes de publicar:**
  - si no hay pedidos ni solicitudes reales, ejecutar `delete from public.counters;` (SQL Editor de Supabase) para empezar en AVG-AAAA-0001 / REP-AAAA-0001;
  - borrar los productos `is_sample`;
  - cargar la tasa real.
- Una vez en producción con clientes reales, no lanzar E2E contra esta BD: crear un proyecto Supabase de pruebas.

## Next.js: try/catch en Server Components

- Todo `catch` en código de servidor que envuelva `cookies()`, `headers()`, `notFound()` o `redirect()` debe llamar primero a `unstable_rethrow(e)` (de `next/navigation`). Si no, se tragan las señales internas de Next.js.

## Formularios (Fase 2)

- Los esquemas Zod están en `src/lib/validation/` (`common.ts`: teléfono VE, textos, honeypot; `forms.ts`: reparación por pasos y contacto). Los mismos esquemas validan en el cliente y en el servidor.
- Las Server Actions están en `src/lib/actions/forms.ts`. **En la Fase 3 hay que sustituir la simulación** por el guardado en Supabase y el número correlativo.
- Los campos accesibles están en `src/components/forms/fields.tsx`: label, ayuda y error asociados, y `aria-invalid`.
- Fotos: `src/lib/files.ts` comprueba los magic bytes y el límite de 5 MB. `PhotoPicker` muestra la vista previa en el navegador.
- Las listas cerradas (estados, tipos de equipo, modalidades de entrega) están en `src/content/forms.ts`.
- Las cabeceras de seguridad bloquean que la web se cargue dentro de un iframe (`frame-ancestors 'none'`).

## Estructura

```
src/app/            rutas (App Router). layout.tsx = header + footer + botón WhatsApp
src/proxy.ts        nonce + CSP (y en la Fase 4, protección de /admin)
src/config/site.ts  datos del negocio (contacto, horario, garantía…). null = [PENDIENTE]
src/content/        textos editables: home, services, faq, about, forms
src/lib/            money, schedule, whatsapp, currency, cart/, actions/, security/
src/components/     ui/ (botones, iconos, primitivas) · brand/ (logo, decoración) · layout/ · sections/ · shop/
public/images/      imágenes optimizadas (se generan con `npm run images` desde /assets)
tests/unit/         Vitest (lógica)
tests/db/           Vitest + PGlite (migraciones reales)
tests/integration/  concurrencia contra Supabase
tests/e2e/          Playwright
supabase/           migraciones, seed.sql, config.toml
scripts/            optimize-images, db-push, db-query, setup-env
```

## Convenciones

- Todo el texto, en español de Venezuela y tuteando. **No inventar datos del negocio.** Lo que falte se marca con `PendingTag` ([PENDIENTE], [PLACEHOLDER], [EJEMPLO]) o con `null` en `siteConfig`.
- Textos en `src/content/*` o en `siteConfig`, nunca sueltos en los componentes cuando sean editables.
- Server Components por defecto. `"use client"` solo para interacción (menú móvil, selector de moneda, carrito).
- Colores solo con tokens (`bg-brand`, `text-ink-soft`…). El rojo (`brand`) se reserva para la acción principal. Amarillo (`bolt`) y naranja (`flame`) solo como acentos. Para texto rojo sobre fondo claro, usar `text-brand-ink` (contraste AA).
- Áreas táctiles de 44 px como mínimo (los botones usan `min-h-12`). Respetar `prefers-reduced-motion`; la utilidad `reveal` ya lo hace.
- Cada enlace con `target="_blank"` lleva `rel="noopener noreferrer"`. Para botones externos, usar `ExternalButton`.
- Nada de `dangerouslySetInnerHTML` con datos externos. Los datos personales nunca van en URLs ni en logs.
- Logo: `src/components/brand/logo.tsx` muestra un logotipo PROVISIONAL. Para el oficial: copiar el archivo a `public/brand/logo.svg` y poner `OFFICIAL_LOGO = true`.

## Comandos

```bash
npm run dev          # servidor de desarrollo → http://localhost:3000
npm run check        # lint + typecheck + tests
npm run build        # build de producción
npm run format       # Prettier
npm run images       # reoptimiza las imágenes de /assets en /public/images
npm run db:push      # aplica migraciones a Supabase (-- --seed, -- --dry)
npm run db:query -- "select …"   # consulta de solo lectura
npm run test:integration         # concurrencia real contra Supabase
npm run test:e2e     # Playwright (necesita el dev server o lo arranca)
npm audit
```

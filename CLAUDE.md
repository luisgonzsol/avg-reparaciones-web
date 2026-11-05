@AGENTS.md

# AVG Reparaciones C.A. — Web oficial

Web de un taller y tienda de repuestos de electrodomésticos en Caracas (RIF J-504740098).
Requisitos completos en `PROMPT.md`, que es la fuente de verdad del encargo. Este archivo resume el estado y las convenciones.

## Estado por fases

- [x] **Fase 1** — Base y diseño: setup, tokens, layout, Inicio con datos de ejemplo, cabeceras de seguridad.
- [x] **Fase 2** — Páginas informativas y formularios. Los formularios se validan en el servidor, pero el envío es **simulado**: no se guarda nada y el número de solicitud lleva la marca [SIMULACIÓN]. Las fotos se validan en el navegador y aún no se suben.
- [x] **Fase 3** — Supabase (proyecto real conectado), tienda, carrito, checkout con reserva atómica, expiración con pg_cron, formularios guardando en la BD.
- [x] **Fase 4** — Panel admin con MFA, auditoría, ajustes desde la BD, emails (Resend), Storage, rate limiting, Turnstile.
- [x] **Fase 5** — SEO (sitemap, robots, OG, JSON-LD), accesibilidad (axe en E2E), Lighthouse ≥ 90 móvil, README y guía de Vercel.
- [x] **Despliegue** — Publicada en **https://avg-reparaciones-web-app.vercel.app** (Vercel, proyecto `avg-reparaciones-web-app`, plan Hobby, región `dub1`, rama `main` de GitHub `luisgonzsol/avg-reparaciones-web`, privado). Cada `git push` a `main` publica solo. Site URL de Supabase ya apunta a esa URL.

> **PROYECTO EN PAUSA (noviembre 2026)** hasta que la empresa defina sus necesidades. La web sigue publicada con **datos de ejemplo**: no está lista para abrirse al público. Ver «Pendientes» y «Al retomar» al final.

Al cerrar cada fase: `npm run check` + `npm run build` + `npm audit`, commit, resumen al usuario y lista [PENDIENTE]. Luego se espera su confirmación.

## Stack

- **Next.js 16.4** (App Router, Turbopack), React 19.3, TypeScript estricto. **Lee `node_modules/next/dist/docs/` antes de usar APIs de Next**, porque cambian entre versiones:
  - `middleware` ahora se llama **`proxy`** (`src/proxy.ts`).
  - `<Image priority>` está obsoleto. Para la imagen LCP se usa `loading="eager"` + `fetchPriority="high"` (con `preload` la imagen bajaba con prioridad baja y competía con las fuentes).
  - `LayoutProps` / `PageProps` son tipos globales generados por `next typegen`.
- **Tailwind CSS v4**, cargado con `@tailwindcss/turbopack` (configurado en `next.config.ts`; no hay postcss.config). Los tokens están en `@theme` dentro de `src/app/globals.css`.
- Zod, clsx. Vitest (lógica y BD con PGlite) y Playwright (E2E, escritorio y móvil).
- Supabase (`@supabase/ssr` para la sesión del panel), Resend + `@react-email/render` (no `@react-email/components`: arrastra una dependencia vulnerable), Cloudflare Turnstile, `sharp`.
- npm como gestor de paquetes. Node ≥ 20.9 (el desarrollo se hace con Node 26).

## Decisiones de arquitectura

- **`cacheComponents` desactivado (a propósito).** La CSP usa un nonce por petición, y eso exige renderizado dinámico: el layout raíz hace `await headers()`. Si en el futuro se quieren páginas estáticas, hay que estudiar la SRI experimental (`experimental.sri`) en lugar del nonce.
- **CSP** en `src/lib/security/csp.ts`, aplicada desde `src/proxy.ts`. El resto de cabeceras de seguridad están en `next.config.ts`. Para añadir un dominio externo, edita `buildCsp` y su test.
- **Moneda:** el precio base está siempre en USD; los cálculos se hacen en céntimos (`src/lib/money.ts`). La preferencia USD/Bs va en una cookie `httpOnly` y se cambia con una Server Action (`src/lib/actions/currency.ts`).
- **Horario abierto/cerrado:** se calcula en el servidor con `America/Caracas` (`src/lib/schedule.ts`) y nunca con el reloj del cliente.
- **Carrito:** `localStorage` con try/catch y solo guarda `{slug, quantity}` (`src/lib/cart/store.ts`). Precios y stock se revalidan siempre en el servidor.
- **WhatsApp:** usar siempre `whatsappUrl()` de `src/lib/whatsapp.ts`, que codifica el texto con `encodeURIComponent`.
- **Route groups:** las páginas públicas están en `src/app/(site)/` (su layout pone header/footer con `SiteChrome`); el panel en `src/app/admin/`. El layout raíz solo tiene `<body>`.
- **Imágenes subidas:** se comprimen en el navegador (`src/lib/images/compress.ts`, canvas, quita EXIF, < 3,8 MB por la cuota de 4,5 MB de Vercel) y en el servidor (`src/lib/images/server.ts`) se comprueban los magic bytes y se re-codifican con `sharp` (sin metadatos, nombre UUID). `serverActions.bodySizeLimit = "4mb"`.

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

## Panel, ajustes, emails y antispam (Fase 4)

- **Migraciones:** `_admin` (permisos de escritura por columna para `authenticated`, políticas de admin, auditoría por trigger, RPC del panel) y `_storage` (solo Supabase: buckets `products` público y `repair-photos` privado).
- **Acceso:** no hay registro. El usuario se crea en Supabase Auth y se le da acceso con `node scripts/make-admin.mjs email [owner|staff|--remove]`. `is_admin()` exige `aal2` si el usuario tiene un factor TOTP verificado.
- **Sesión:** `@supabase/ssr` con cookies httpOnly (`src/lib/supabase/auth.ts`). `src/proxy.ts` refresca la sesión, añade `noindex` + `no-store` y redirige a `/admin/login` sin sesión. Cada página llama a `requireAdmin()` (`src/lib/admin/session.ts`) y cada acción vuelve a comprobarlo: el proxy no es la única barrera.
- **Escrituras del panel:** con el cliente del usuario (RLS + grants por columna), nunca con la service key. `reserved` no se puede tocar a mano. Los cambios de estado de pedido pasan por `admin_update_order` (máquina de estados; llama a `mark_order_paid`/`cancel_order`). Producto + marcas: `admin_save_product`. Importación CSV todo-o-nada: `admin_import_products`.
- **Auditoría:** trigger `audit_row()`; solo registra cambios hechos con sesión (`auth.uid()` no nulo) y solo los campos que cambian. `admins.email` sirve para mostrar quién.
- **Estados** (etiquetas, transiciones, colores): `src/lib/status.ts`.
- **Ajustes:** la web lee `getSiteSettings()` (`src/lib/settings.ts`, tabla `settings` fusionada sobre `siteConfig`; si la BD falla, usa `siteConfig`). `whatsappUrl(msg, cfg.whatsappNumber)`.
- **Emails:** plantillas en `src/emails/`, envío en `src/lib/email/` y siempre dentro de `after()` (nunca bloquean ni rompen la respuesta). Sin `RESEND_API_KEY`/`EMAIL_FROM` se omiten. Destino de avisos: `EMAIL_NOTIFY_TO` o el email de Ajustes.
- **Turnstile:** `src/lib/security/turnstile.ts` + `src/components/forms/turnstile.tsx` (carga dinámica por la CSP `strict-dynamic`). Solo se exige si están las dos claves; ante un fallo de red de Cloudflare deja pasar.
- **Rate limiting:** checkout 5/10 min, reparación y contacto 5/h, login 20/15 min por IP y 5/15 min por cuenta (hash del email), MFA 10/15 min.
- **CSV de productos:** `src/lib/admin/csv.ts` (separador `;`, BOM, celdas con fórmula neutralizadas; acepta `;` o `,` al importar; celda vacía = valor por defecto).
- Guía para el usuario: `docs/panel-y-servicios.md`. Claves de Resend/Turnstile: `node scripts/setup-services.mjs`.

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

## SEO, accesibilidad y rendimiento (Fase 5)

- `src/app/robots.ts` (bloquea /admin, /checkout, /carrito, /pedido; todo bloqueado si `VERCEL_ENV` ≠ production), `src/app/sitemap.ts` (páginas, servicios y productos no `is_sample`), `src/app/opengraph-image.tsx`.
- JSON-LD con `src/lib/seo/json-ld.ts` + `<JsonLd>` (única excepción permitida a `dangerouslySetInnerHTML`: `serializeJsonLd` escapa `<`, `>`, `&`, U+2028/9). Nunca incluir datos [PENDIENTE]: `geo` y `email` solo aparecen cuando existen.
- Productos `is_sample` llevan `noindex` y no tienen JSON-LD.
- **Zod:** importar siempre `z` desde `@/lib/zod` (`jitless`, para que no intente `new Function` contra la CSP). ESLint lo impone.
- **Contraste:** verde de WhatsApp `#187a41` (hover `#146c39`), 5,4:1 con blanco. El amarillo `bolt` nunca como texto sobre fondo claro.
- Accesibilidad automática: `tests/e2e/a11y.spec.ts` (axe, WCAG 2.1 AA) en las páginas públicas. Si añades una página, añádela ahí.
- Lighthouse: informes en `docs/lighthouse/`. Para repetirlo: build + `next start -p 3100` + `npx lighthouse@12.8.2 http://localhost:3100/ --chrome-flags="--headless=new"`.
- E2E contra producción local: `E2E_BASE_URL=http://localhost:3100 npx playwright test`. `admin-orders.spec.ts` crea un admin temporal con contraseña aleatoria y lo borra (se omite si Turnstile está activo).
- Vercel: `vercel.json` fija la región `dub1`. Si falta `NEXT_PUBLIC_SITE_URL`, `siteConfig.url` usa `VERCEL_PROJECT_PRODUCTION_URL`.

## Next.js: try/catch en Server Components

- Todo `catch` en código de servidor que envuelva `cookies()`, `headers()`, `notFound()` o `redirect()` debe llamar primero a `unstable_rethrow(e)` (de `next/navigation`). Si no, se tragan las señales internas de Next.js.

## Formularios (Fase 2)

- Los esquemas Zod están en `src/lib/validation/` (`common.ts`: teléfono VE, textos, honeypot; `forms.ts`: reparación por pasos y contacto). Los mismos esquemas validan en el cliente y en el servidor.
- Las Server Actions están en `src/lib/actions/forms.ts`. Desde la Fase 3 guardan en Supabase con número correlativo. Solo simulan si Supabase no está configurado o si salta el honeypot.
- Los campos accesibles están en `src/components/forms/fields.tsx`: label, ayuda y error asociados, y `aria-invalid`.
- Fotos: `src/lib/files.ts` comprueba los magic bytes y el límite de 5 MB. `PhotoPicker` muestra la vista previa en el navegador.
- Las listas cerradas (estados, tipos de equipo, modalidades de entrega) están en `src/content/forms.ts`.
- Las cabeceras de seguridad bloquean que la web se cargue dentro de un iframe (`frame-ancestors 'none'`).

## Estructura

```
src/app/(site)/     web pública (layout = header + footer + botón WhatsApp)
src/app/admin/      panel: login/, (panel)/ con requireAdmin
src/proxy.ts        nonce + CSP, sesión y protección de /admin
src/config/site.ts  datos del negocio (contacto, horario, garantía…). null = [PENDIENTE]
src/content/        textos editables: home, services, faq, about, forms
src/lib/            money, schedule, whatsapp, currency, settings, status, cart/, actions/, admin/, email/, images/, security/
src/emails/         plantillas de email (React → HTML)
src/components/     ui/ · brand/ · layout/ · sections/ · shop/ · forms/ · admin/
public/images/      imágenes optimizadas (se generan con `npm run images` desde /assets)
tests/unit/         Vitest (lógica)
tests/db/           Vitest + PGlite (migraciones reales)
tests/integration/  concurrencia contra Supabase
tests/e2e/          Playwright
supabase/           migraciones, seed.sql, config.toml
scripts/            optimize-images, db-push, db-query, setup-env, setup-services, make-admin
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
node scripts/make-admin.mjs email owner   # dar acceso al panel
node scripts/setup-services.mjs           # claves de Resend y Turnstile
npm audit
```

## Despliegue (Vercel)

- Proyecto Vercel `avg-reparaciones-web-app` (cuenta `luisgonzsols-projects`), conectado a GitHub `luisgonzsol/avg-reparaciones-web` (rama `main`). `.vercel/` está enlazado en local e ignorado por git.
- Variables en Vercel: las de Supabase (URL, publicable, secreta). **Nunca** `SUPABASE_DB_URL`. Resend y Turnstile aún no configurados (sin dominio). `NEXT_PUBLIC_SITE_URL` cae en `VERCEL_PROJECT_PRODUCTION_URL` si falta.
- CLI: `npx -y vercel@65.11.0` (en Git Bash, `MSYS_NO_PATHCONV=1` para `vercel api /v9/...`).
- Repositorio vacío sobrante en GitHub: `-avg-reparaciones-web` (puede borrarlo el usuario).

## Reglas acordadas con el usuario

- Nunca mostrar ni pegar claves/secretos en el chat; solo comprobar presencia y formato. El usuario crea cuentas y escribe contraseñas.
- No arrancar el servidor ni abrir el navegador salvo que lo pida.
- No borrar proyectos, datos ni hacer deploy sin su OK explícito. Antes de subir a GitHub, comprobar que no hay secretos versionados.
- Respuestas cortas y pasos numerados y sencillos (no es experto en terminal).

## Pendientes

1. **Probar el panel publicado** (`/admin`, con MFA desde el móvil) y un pedido de prueba cancelado desde el panel.
2. **Datos del negocio** en Panel → Ajustes: email (Gmail), segunda calle, duración de la garantía, costes de recogida y envío, métodos de pago. Coordenadas del local (`geo` del JSON-LD, en `src/config/site.ts`).
3. **Inventario real:** productos (uno a uno o CSV) y tasa del día real.
4. **Limpieza (solo con OK del usuario):** `delete from public.products where is_sample;`, borrar la tasa de ejemplo, pedidos/solicitudes de prueba y `delete from public.counters;`. Desde entonces, E2E solo contra un proyecto Supabase de pruebas aparte.
5. **Antes de anunciar:** plan Pro de Vercel (Hobby no permite uso comercial), logo oficial (`public/brand/logo.svg` + `OFFICIAL_LOGO = true`), revisión legal de `/terminos` y `/privacidad`, desactivar «Allow new users to sign up» en Supabase (dejando el proveedor Email activo).
6. **Dominio:** conectarlo en Vercel, actualizar `NEXT_PUBLIC_SITE_URL` + Site URL/Redirect URLs de Supabase, Turnstile con el dominio, Resend (verificar dominio + `node scripts/setup-services.mjs` y variables en Vercel), Google Search Console (sitemap) y Google Business Profile.

**Datos [PENDIENTE]:** email, segunda calle, garantía, costes de recogida/envío, métodos de pago, coordenadas, logo oficial y flyers. No inventarlos.

## Al retomar

1. `git pull` y `npm.cmd install` (Node ≥ 20.9). Comprobar que `.env.local` sigue en la carpeta (no está en git).
2. `npm.cmd run check` y `npm.cmd run build` para confirmar que todo sigue verde; `npm.cmd audit --omit=dev`.
3. Si ha pasado tiempo, revisar actualizaciones de Next.js/Supabase (leer `node_modules/next/dist/docs/` antes de tocar APIs).
4. Preguntar al usuario qué ha definido la empresa y qué datos [PENDIENTE] ya tiene; actualizar `siteConfig`/Ajustes.
5. Seguir la lista «Pendientes» en orden. Ver `docs/despliegue-vercel.md` (checklist «Antes de abrir al público») y `docs/panel-y-servicios.md`.
6. Comprobar que la web publicada responde y que el último deploy en Vercel está «Ready».

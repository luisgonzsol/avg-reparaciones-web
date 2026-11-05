# AVG Reparaciones C.A. — Web oficial

Web de **AVG Reparaciones C.A.** (RIF J-504740098): reparación de electrodomésticos,
embobinado de motores y tienda de repuestos en Caracas, con envíos a toda Venezuela.

- **Web pública:** inicio, servicios, tienda con carrito y checkout (precios en USD y Bs),
  solicitud de reparación con fotos, contacto, preguntas frecuentes y páginas legales.
- **Panel `/admin`:** pedidos, solicitudes, mensajes, productos (con importación CSV),
  categorías y marcas, tasa del día, ajustes del negocio, auditoría y seguridad (MFA).

> En este equipo Windows, escribe `npm.cmd` en lugar de `npm` (PowerShell bloquea `npm`).

---

## 1. Instalación (desarrollo)

Necesitas [Node.js](https://nodejs.org) 20.9 o superior y la carpeta del proyecto.

```bash
npm install
cp .env.example .env.local     # y rellénalo (ver sección 2)
npm run dev                    # → http://localhost:3000
```

Sin las variables de Supabase la web funciona en «modo demostración»: la tienda muestra
un aviso y los formularios simulan el envío.

## 2. Variables de entorno

Se guardan en `.env.local` (nunca va a git). Plantilla: [`.env.example`](./.env.example).

| Variable                               | Obligatoria | Qué es                                                                                 |
| -------------------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | Sí          | URL pública, sin barra final (`https://tudominio.com`). Se usa en SEO y en los emails. |
| `NEXT_PUBLIC_SUPABASE_URL`             | Sí          | URL del proyecto de Supabase.                                                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sí          | Clave publicable (`sb_publishable_…`). Pública, protegida por RLS.                     |
| `SUPABASE_SECRET_KEY`                  | Sí          | Clave secreta (`sb_secret_…`). **Solo servidor.**                                      |
| `RESEND_API_KEY`                       | Para emails | API key de Resend (`re_…`). **Secreta.**                                               |
| `EMAIL_FROM`                           | Para emails | Remitente con dominio verificado: `AVG Reparaciones <avisos@tudominio.com>`.           |
| `EMAIL_NOTIFY_TO`                      | No          | Buzón de avisos. Vacío = el email de Panel → Ajustes.                                  |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`       | No          | Antispam de Cloudflare (clave pública).                                                |
| `TURNSTILE_SECRET_KEY`                 | No          | Antispam de Cloudflare (clave secreta). Sin las dos, no se pide la verificación.       |
| `RATE_LIMIT_SALT`                      | No          | Sal para el hash de IPs. Por defecto se deriva de la clave secreta.                    |
| `SUPABASE_DB_URL`                      | Solo local  | Conexión directa para migraciones. **Nunca en Vercel.**                                |

Asistentes que guardan las claves sin mostrarlas en pantalla:

```bash
node scripts/setup-env.mjs        # claves de Supabase
node scripts/setup-services.mjs   # Resend y Turnstile
```

## 3. Base de datos (Supabase)

Guía de creación del proyecto: [`docs/supabase-setup.md`](./docs/supabase-setup.md).

```bash
npm run db:push              # aplica las migraciones de supabase/migrations
npm run db:push -- --seed    # …y carga los datos de EJEMPLO
npm run db:push -- --dry     # solo muestra qué haría
npm run db:query -- "select count(*) from public.products"   # consulta de solo lectura
```

Dar acceso al panel (el usuario se crea antes en Supabase → Authentication → Users):

```bash
node scripts/make-admin.mjs correo@ejemplo.com owner     # owner o staff
node scripts/make-admin.mjs correo@ejemplo.com --remove  # quitar acceso
```

Guía del panel, emails y antispam: [`docs/panel-y-servicios.md`](./docs/panel-y-servicios.md).

## 4. Cómo añadir productos

**Uno a uno:** Panel → **Productos → Nuevo producto**. Rellena nombre, SKU, categoría,
precio en USD y stock; guarda y después sube las fotos (JPG, PNG o WebP; se optimizan solas).
Desmarca «Visible en la tienda» para ocultarlo sin borrarlo.

**Muchos a la vez (CSV):** Panel → **Productos → Exportar CSV** te da una plantilla con los
productos actuales. Ábrela con Excel o Google Sheets, añade filas y súbela en **Importar inventario (CSV)**.

| Columna                             | Ejemplo                         | Notas                                            |
| ----------------------------------- | ------------------------------- | ------------------------------------------------ |
| `sku`                               | `LIC-0001`                      | Obligatoria y única. Si ya existe, se actualiza. |
| `nombre`                            | `Cuchilla para licuadora Oster` | Obligatoria.                                     |
| `slug`                              | `cuchilla-licuadora-oster`      | Opcional (se genera del nombre).                 |
| `categoria`                         | `licuadoras`                    | Obligatoria: identificador de la categoría.      |
| `marcas`                            | `oster\|philips`                | Opcional, separadas por `\|`.                    |
| `precio_usd`                        | `12,50`                         | Obligatoria. Coma o punto decimal.               |
| `stock`                             | `4`                             | Obligatoria.                                     |
| `umbral_stock_bajo`                 | `3`                             | Opcional (por defecto 3).                        |
| `garantia` / `destacado` / `activo` | `si` / `no`                     | Opcionales (por defecto no / no / si).           |
| `descripcion` / `compatibilidad`    | texto                           | Opcionales.                                      |

Si una fila tiene un error no se importa nada y el panel te dice qué fila corregir.
Las fotos se suben después, desde la ficha de cada producto.

**Tasa del día:** Panel → **Tasa del día**. Los precios en Bs se calculan al momento con la
tasa vigente.

## 5. Copias de seguridad

- **Automáticas:** Supabase hace una copia diaria (plan gratuito: se guardan 7 días).
- **Propia (recomendada cada semana o antes de cambios grandes):**

  ```bash
  node node_modules/supabase/dist/supabase.js db dump --db-url "<SUPABASE_DB_URL>" -f respaldo-datos.sql --data-only
  node node_modules/supabase/dist/supabase.js db dump --db-url "<SUPABASE_DB_URL>" -f respaldo-esquema.sql
  ```

  Guarda los archivos fuera del proyecto y en un lugar seguro: contienen datos de clientes.

- **Productos rápidamente:** Panel → Productos → **Exportar CSV**.
- **Fotos:** Supabase → Storage (buckets `products` y `repair-photos`).
- **Restaurar:** en un proyecto nuevo, `npm run db:push` y luego carga `respaldo-datos.sql`
  desde el SQL Editor de Supabase.

## 6. Publicar en Vercel

Guía paso a paso (cuenta, variables, dominio y lista de comprobación antes de abrir al
público): [`docs/despliegue-vercel.md`](./docs/despliegue-vercel.md).

## 7. Comandos

| Comando                    | Para qué sirve                                                    |
| -------------------------- | ----------------------------------------------------------------- |
| `npm run dev`              | Web en modo desarrollo (http://localhost:3000)                    |
| `npm run check`            | Lint + tipos + tests de lógica y base de datos                    |
| `npm run build`            | Versión de producción                                             |
| `npm run test:e2e`         | Pruebas de navegador (escritorio y móvil), incluida accesibilidad |
| `npm run test:integration` | Prueba de concurrencia de stock contra Supabase                   |
| `npm run images`           | Optimiza las fotos de `assets/` en `public/images/`               |
| `npm run format`           | Formatea el código (Prettier)                                     |
| `npm audit --omit=dev`     | Vulnerabilidades de las dependencias que se publican              |

## 8. Calidad

- Informes de Lighthouse (móvil) en [`docs/lighthouse/`](./docs/lighthouse/): abre los `.html`.
- Pruebas: Vitest (`tests/unit`, `tests/db` con PGlite), integración (`tests/integration`)
  y Playwright (`tests/e2e`, con revisión automática de accesibilidad axe).
- Detalles técnicos y convenciones del código: [`CLAUDE.md`](./CLAUDE.md).

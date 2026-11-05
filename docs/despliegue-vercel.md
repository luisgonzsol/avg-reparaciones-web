# Publicar la web en Vercel

Vercel aloja la web gratis (plan _Hobby_) o con el plan _Pro_ si el negocio lo necesita.
La base de datos sigue en Supabase (Irlanda); la web se ejecuta en **Dublín** (`dub1`,
ya configurado en `vercel.json`) para que estén cerca.

> Tú creas las cuentas y pegas las claves. Yo nunca veo ni escribo contraseñas o claves.

---

## Paso 1 — Subir el código a GitHub (una sola vez)

1. Crea una cuenta en [github.com](https://github.com) si no tienes.
2. Botón **New repository** → nombre `avg-reparaciones-web` → **Private** → **Create repository**
   (no marques «Add a README»).
3. GitHub te muestra unos comandos. En PowerShell, en la carpeta del proyecto, ejecuta los
   de la sección «…or push an existing repository from the command line»:

   ```
   git remote add origin https://github.com/TU-USUARIO/avg-reparaciones-web.git
   git push -u origin main
   ```

   La primera vez se abre una ventana para iniciar sesión en GitHub.

`.env.local` **no** se sube (está en `.gitignore`): las claves no salen de tu equipo.

## Paso 2 — Crear el proyecto en Vercel

1. Entra en [vercel.com](https://vercel.com) → **Sign Up** → **Continue with GitHub**.
2. **Add New… → Project** → elige `avg-reparaciones-web` → **Import**.
3. _Framework Preset_: **Next.js** (lo detecta solo). No cambies los comandos.
4. Despliega **Environment Variables** y añade una por una (copia los valores de tu
   `.env.local`, abriéndolo con el Bloc de notas):

   | Name                                                     | Value                                                                         |
   | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_SITE_URL`                                   | por ahora `https://avg-reparaciones-web.vercel.app` (la URL que te dé Vercel) |
   | `NEXT_PUBLIC_SUPABASE_URL`                               | igual que en `.env.local`                                                     |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`                   | igual que en `.env.local`                                                     |
   | `SUPABASE_SECRET_KEY`                                    | igual que en `.env.local`                                                     |
   | `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_NOTIFY_TO`        | si ya configuraste Resend                                                     |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | si ya configuraste Turnstile                                                  |

   **No añadas `SUPABASE_DB_URL`**: solo se usa en tu equipo para las migraciones.

5. Pulsa **Deploy** y espera 2–3 minutos. Al terminar, Vercel muestra la URL
   (`https://….vercel.app`). Si es distinta de la que pusiste en `NEXT_PUBLIC_SITE_URL`,
   corrígela en **Settings → Environment Variables** y en **Deployments → ⋯ → Redeploy**.

A partir de ahí, cada `git push` publica una versión nueva automáticamente.

## Paso 3 — Ajustes en Supabase para la URL nueva

En Supabase → **Authentication → URL Configuration**:

- **Site URL:** la URL pública (`https://….vercel.app` o tu dominio).
- **Redirect URLs:** añade la misma URL seguida de `/**`.

## Paso 4 — Comprobar que todo funciona

En la URL publicada:

1. Abre Inicio, la tienda y una ficha de producto.
2. Entra en `/admin` con tu usuario y tu código de verificación.
3. Haz un pedido de prueba y cancélalo desde el panel.
4. Envía el formulario de contacto y mira que llegue a **Mensajes** (y el email, si Resend está activo).
5. Comprueba `https://TU-URL/robots.txt` y `https://TU-URL/sitemap.xml`.

## Paso 5 — Conectar un dominio (cuando lo tengas)

1. Compra el dominio (por ejemplo en Cloudflare, Namecheap o un proveedor venezolano).
2. Vercel → tu proyecto → **Settings → Domains → Add** → escribe `tudominio.com`
   (acepta también `www.tudominio.com` y que redirija a uno de los dos).
3. Vercel te dice qué registros DNS crear (normalmente un registro **A** y un **CNAME**).
   Añádelos en el panel de tu proveedor de dominio. Tarda de minutos a unas horas.
4. Cuando el dominio salga en verde:
   - cambia `NEXT_PUBLIC_SITE_URL` a `https://tudominio.com` y haz **Redeploy**;
   - actualiza la **Site URL** de Supabase (paso 3);
   - en Turnstile (Cloudflare), añade el dominio al widget;
   - en Resend, verifica el dominio y usa `EMAIL_FROM="AVG Reparaciones <avisos@tudominio.com>"`.
5. Da de alta la web en [Google Search Console](https://search.google.com/search-console)
   (propiedad de dominio) y envía `https://tudominio.com/sitemap.xml`.
6. Crea o reclama la ficha de **Google Business Profile** del local con la misma dirección,
   teléfono y horario de la web: es lo que más ayuda a aparecer en las búsquedas de Caracas.

## Antes de abrir al público (lista de comprobación)

En el SQL Editor de Supabase (o pídemelo y lo preparo):

- [ ] Borrar los productos de ejemplo: `delete from public.products where is_sample;`
- [ ] Cargar la tasa real en Panel → Tasa del día (y borrar la de ejemplo).
- [ ] Si no hay pedidos ni solicitudes reales: `delete from public.counters;` para empezar en
      AVG-AAAA-0001 / REP-AAAA-0001.
- [ ] Completar en Panel → Ajustes: email, segunda calle, garantía y costes orientativos.
- [ ] Desactivar el registro de usuarios en Supabase (ver `docs/panel-y-servicios.md`).
- [ ] Revisar los textos legales (`/terminos`, `/privacidad`) con quien lleve lo legal.
- [ ] Logo oficial: copiar el SVG a `public/brand/logo.svg` y activar `OFFICIAL_LOGO`.
- [ ] Desde ese momento, **no** lanzar las pruebas E2E contra esta base de datos: crear un
      proyecto de Supabase aparte para pruebas.

## Si algo falla

- **La web muestra «La tienda no está disponible»:** faltan o están mal las variables de
  Supabase en Vercel. Revísalas y haz **Redeploy**.
- **No puedo entrar al panel:** comprueba en Supabase que el proveedor **Email** está activado
  y que la **Site URL** es la de la web.
- **Registros de errores:** Vercel → tu proyecto → **Logs**.

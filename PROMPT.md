# PROYECTO: Web oficial de AVG Reparaciones C.A.

Actúa como desarrollador full-stack senior, especialista en seguridad web y diseñador de producto. Vas a construir la web oficial de AVG Reparaciones C.A. Es una versión final, en producción y escalable, que se irá ajustando por iteraciones.

## 0. Forma de trabajar (obligatorio)

1. Lee este documento completo antes de hacer nada.
2. Preséntame primero un **plan**: stack confirmado, estructura de carpetas, modelo de datos, fases y dudas. **No escribas código hasta que lo confirme.**
3. Trabaja **por fases** (sección 11). Al terminar cada fase:
   - ejecuta lint, comprobación de tipos y tests;
   - haz un commit de git con un mensaje descriptivo;
   - dame un resumen de lo hecho, cómo probarlo y la lista de datos [PENDIENTE];
   - detente y espera mi confirmación.
4. Crea al inicio un archivo `CLAUDE.md` con el resumen del proyecto, el stack, las convenciones y los comandos. Mantenlo actualizado para no perder contexto entre sesiones.
5. Los recursos gráficos están en `assets/`: logo, foto del local y flyers de servicios. Optimízalos y muévelos a la ubicación adecuada del proyecto.
6. Si algo es ambiguo o falta información, pregúntame. No inventes datos del negocio.
7. Explícame en lenguaje sencillo cualquier paso que deba hacer yo: crear cuentas, configurar variables, etc. No soy experto en terminal.

---

## 1. El negocio

**AVG Reparaciones C.A.** (RIF J-504740098). Taller y tienda en Caracas, Venezuela, con más de 20 años de experiencia ayudando a los vecinos del barrio. Ahora quiere expandirse y atender a clientes de toda Venezuela.

**Valores:** honestidad, transparencia, garantía en las reparaciones, cercanía.

**Líneas de negocio:**
1. **Reparación de electrodomésticos del hogar, multimarca:** lavadoras, microondas, licuadoras, ventiladores, ollas de presión, batidoras, cafeteras, etc.
2. **Embobinado de motores e inducidos (cobre 100%):** motores eléctricos, inducidos, motores de lavadora Whirlpool, ventiladores industriales.
3. **Servicio técnico de equipos industriales y comerciales:** batidoras KitchenAid, licuadoras industriales, rebanadoras, rayadores de queso.
4. **Tienda de repuestos para electrodomésticos:** aspas de ventilador, vasos y cuchillas de licuadora (Oster, etc.), capacitores, gomas de ollas de presión, motores, carbones, alambre de cobre, etc.

**Marcas habituales:** Samsung, Electrolux, Frigilux, Taurus, Oster, GE, Mabe, Haier, Daewoo, Whirlpool, KitchenAid.

**Funcionamiento del taller:**
- Todas las reparaciones se hacen en el local.
- El equipo llega de tres formas:
  1. El cliente lo trae al local (sin coste).
  2. Servicio de recogida (coste aparte).
  3. El cliente lo envía mediante un mediador o agencia de encomiendas.
- Devolución: se puede enviar el equipo reparado de vuelta al cliente, con un **coste extra** a su cargo.

**Garantía:**
- Las reparaciones tienen garantía (duración [PENDIENTE], configurable desde el panel).
- Las piezas eléctricas vendidas sueltas **NO tienen garantía**. Debe indicarse claramente en las fichas de producto y en la FAQ.

## 2. Datos de contacto

Fuente única de verdad: tabla `settings` editable desde el panel, con valores por defecto en un archivo de configuración.

- **Teléfono / WhatsApp:** +58 412-7408970. Enlace: `https://wa.me/584127408970`
- **Email:** [PENDIENTE, cuenta Gmail]
- **Dirección:** Av. Este 12, entre El Hoyo y [PENDIENTE de verificar], Caracas 1012, Distrito Capital, Venezuela.
- **Horario:** lunes a viernes 8:00–17:00 · sábado 8:00–14:00 · domingo cerrado.
- **Instagram:** https://www.instagram.com/avgreparaciones/
- Mostrar un indicador **"Abierto ahora / Cerrado"** calculado con la zona horaria `America/Caracas`, sin depender de la hora del dispositivo del usuario.

---

## 3. Dirección de diseño

**Objetivo:** elegancia y aspecto premium que transmita seguridad, con una **sencillez de uso absoluta**. Debe poder usarla cualquier vecino, incluidas personas mayores o poco habituadas a internet.

**Paleta derivada del logo, usada con sobriedad (todo como tokens o variables CSS):**
- Base: blanco cálido (#FAFAF7) y grafito o casi negro (#141414 a #1E1E1E).
- Rojo AVG (~#E31E24): color principal de acción (botones primarios, enlaces destacados).
- Amarillo rayo (~#FFC20E) y naranja (~#F57C20): solo acentos puntuales (iconos, subrayados, detalles).
- Nada del estilo saturado de sus flyers. Lo premium se consigue con espacio en blanco, jerarquía tipográfica y buena fotografía.

**Tipografía:**
- Títulos: Plus Jakarta Sans u Outfit.
- Texto: Inter.
- Fuentes autoalojadas con `next/font`.
- Tamaño base de 17–18 px y contraste WCAG AA como mínimo.

**Motivo visual:** el rayo y las curvas del logo como elementos decorativos sutiles: divisores, fondo del hero, estados hover.

**Interacción:**
- Microinteracciones fluidas y discretas: revelado al hacer scroll, hover en tarjetas, transiciones suaves.
- Respetar `prefers-reduced-motion`.
- Botones grandes (área táctil ≥ 44 px), textos claros y sin jerga técnica.
- Botón flotante de WhatsApp siempre visible, sin tapar contenido ni CTA en móvil.

**Mobile-first.** La mayoría de usuarios entrará desde el móvil.

**Rendimiento crítico.** Las conexiones en Venezuela suelen ser lentas o inestables:
- Imágenes con `next/image` (WebP/AVIF, tamaños responsivos, lazy loading).
- Server Components por defecto y el mínimo JavaScript en el cliente.
- Sin librerías pesadas innecesarias. Para animaciones, preferir CSS; usar Framer Motion solo si se justifica.
- Objetivo de Lighthouse ≥ 90 en móvil en rendimiento, accesibilidad, buenas prácticas y SEO.

**Imágenes:**
- Usar las de `assets/`. Donde falten, dejar placeholders elegantes y claramente marcados para sustituir.
- El logo actual es rasterizado: prepara el header para recibir una versión SVG en el futuro.

**Logo:** respetar sus proporciones y no deformarlo. Versión sobre fondo claro y, si hace falta, una versión adaptada para fondos oscuros.

---

## 4. Stack técnico

- **Next.js** (última versión estable, App Router) + **TypeScript** en modo estricto.
- **Tailwind CSS** con tokens de diseño. Componentes propios accesibles (puedes apoyarte en Radix UI / shadcn/ui).
- **Supabase:** PostgreSQL, Auth (solo para el administrador) y Storage (imágenes de productos y fotos de solicitudes).
- **Zod** para validar todos los datos de entrada en el servidor.
- **Resend** (o equivalente) para emails transaccionales, con plantillas en React Email.
- **Despliegue en Vercel.** Aún no hay dominio ni hosting: prepara el proyecto para un despliegue sencillo y documenta los pasos.
- **Calidad:** ESLint, Prettier, Vitest (lógica de negocio) y Playwright (flujos críticos).
- **Gestor de paquetes:** npm.
- Si propones cambios al stack, justifícalos en el plan.

---

## 5. Páginas y funcionalidades

### 5.1 Inicio (`/`)
1. **Header fijo:** logo, navegación (Servicios, Tienda, Cómo funciona, Nosotros, Contacto), selector de moneda USD/Bs, carrito con contador y CTA de WhatsApp. Menú móvil accesible.
2. **Hero:** mensaje claro (p. ej. "Reparamos tus electrodomésticos con garantía. Más de 20 años cuidando lo que usas cada día") y dos CTA: "Solicitar reparación" y "Comprar repuestos".
3. **Barra de confianza:** +20 años · Multimarca · Reparaciones con garantía · Envíos a toda Venezuela · Precios en USD y Bs.
4. **Servicios:** cuatro tarjetas, una por línea de negocio, que enlazan al detalle.
5. **Cómo funciona:** cuatro pasos:
   1. Elige cómo nos haces llegar tu equipo (tres modalidades).
   2. Diagnóstico en el taller.
   3. Reparación con garantía.
   4. Recógelo o te lo enviamos (coste extra).
6. **Marcas:** franja de marcas en escala de grises. Si se usan logos de marcas, añadir la nota "Marcas mencionadas a título informativo; propiedad de sus respectivos titulares".
7. **Repuestos destacados:** productos marcados como destacados desde el panel.
8. **Nosotros (resumen):** historia de barrio, honestidad, foto del local.
9. **Testimonios:** estructura lista, con datos de ejemplo marcados [PLACEHOLDER] y ocultos por defecto hasta que existan reseñas reales.
10. **Cobertura:** "Atendemos en Caracas y recibimos equipos de toda Venezuela".
11. **FAQ:** garantía, tiempos, modalidades de entrega, coste de recogida y devolución, cómo se paga, piezas eléctricas sin garantía.
12. **Contacto:** mapa embebido (Google Maps iframe con carga diferida), dirección, horario con indicador de abierto o cerrado, teléfono, email, Instagram.
13. **Footer:** AVG Reparaciones C.A., RIF, enlaces, redes, enlaces legales.

### 5.2 Servicios (`/servicios`, `/servicios/[slug]`)
Detalle de cada línea: equipos atendidos, ejemplos, proceso y CTA a solicitar reparación. Contenido gestionado desde archivos de contenido en el código; no hace falta panel para esto.

### 5.3 Solicitar reparación (`/solicitar-reparacion`)
**Formulario sencillo, en pocos pasos y con validación clara:**
- Nombre, teléfono (formato venezolano), email (opcional), estado y ciudad.
- Tipo de equipo, marca, modelo (opcional) y descripción de la falla.
- Hasta 3 fotos opcionales (validación en la sección 7).
- Modalidad de entrega: traer al local / recogida (aviso de coste aparte) / envío por agencia.
- ¿Desea devolución por envío? (aviso de coste extra).
- Aceptación de la política de privacidad.

**Al enviar:**
- Guardar en la base de datos con número de solicitud (p. ej. `REP-2026-0001`).
- Avisar a la empresa por email.
- Mostrar pantalla de confirmación con botón para abrir WhatsApp con un mensaje prellenado con el resumen. El texto debe ir codificado con `encodeURIComponent`.

### 5.4 Tienda (`/tienda`, `/tienda/[slug]`)
**Catálogo:**
- Búsqueda por texto.
- Filtros por categoría (ventiladores, licuadoras, lavadoras, ollas de presión, capacitores, motores, embobinado y cobre…) y por marca compatible.
- Orden por precio o novedad.
- Paginación.

**Ficha de producto:**
- Galería, descripción, compatibilidad, SKU.
- Precio en USD y en Bs.
- Disponibilidad ("Disponible", "Últimas unidades", "Agotado").
- Aviso de garantía según el producto.

**Stock digital:**
- No se puede añadir al carrito más cantidad que la disponible.
- La disponibilidad se revalida siempre en el servidor al confirmar.

**Doble moneda:**
- Precio base guardado en USD.
- El precio en Bs se calcula con la **tasa del día** que el administrador actualiza desde el panel.
- Mostrar la tasa y su fecha.
- Aviso: "Monto en Bs referencial según la tasa del día; el monto final se confirma en el enlace de cobro".
- Formato `es-VE`.

### 5.5 Carrito y checkout (`/carrito`, `/checkout`)
**Carrito:**
- Persistido en el navegador (localStorage, con try/catch).
- Al cargarlo, los precios y el stock se refrescan desde el servidor.

**No hay pago dentro de la web.** El checkout solicita:
- Nombre, cédula o RIF, teléfono, email.
- Entrega: retiro en tienda o envío nacional (estado, ciudad, dirección, agencia preferida).
- Notas.
- Aceptación de términos y privacidad.

**Al confirmar (Server Action o Route Handler):**
1. Validar con Zod.
2. **Recalcular en el servidor precios y totales a partir de la base de datos.** Nunca confiar en los precios del cliente.
3. Crear el pedido y **reservar el stock de forma atómica** mediante una función de PostgreSQL (RPC) con transacción y bloqueo de filas, para evitar sobreventa si dos personas compran a la vez.
4. Guardar con el pedido una **instantánea** del nombre y precio de cada producto y de la tasa usada.
5. Estado inicial: "Pendiente de pago". Número legible (p. ej. `AVG-2026-0001`) y un **token público aleatorio** para la página de seguimiento.
6. Enviar email de confirmación al cliente y aviso a la empresa.

**Página de confirmación** (`/pedido/[token]`, accesible solo con el token aleatorio y no con el número correlativo):
- Resumen del pedido.
- Explicación: "Te enviaremos por WhatsApp o Gmail el enlace de cobro para completar tu compra".
- Botón para continuar por WhatsApp con el resumen.

**Expiración:** los pedidos en "Pendiente de pago" o "Enlace enviado" sin pagar caducan tras un plazo configurable (por defecto 48 h). Un proceso programado (Vercel Cron o pg_cron) los marca como "Cancelado (expirado)" y libera el stock reservado.

### 5.6 Nosotros (`/nosotros`) y Contacto (`/contacto`)
Contacto incluye un formulario simple que guarda el mensaje y avisa por email, además del mapa, el horario y los datos de contacto.

### 5.7 Páginas legales
- `/privacidad`: qué datos se recogen, para qué, cuánto tiempo se conservan, cómo solicitar su eliminación.
- `/terminos`: condiciones de compra, envíos y devoluciones, garantía de reparaciones, piezas eléctricas sin garantía, costes de recogida y devolución.
- Redáctalas como borrador claro y márcalas [REVISAR CON EL CLIENTE].
- No usar cookies de seguimiento por ahora. Si en el futuro se añade analítica, que respete la privacidad (p. ej. Vercel Analytics o Plausible).

### 5.8 Panel de administración (`/admin`)
**Acceso:**
- Login con Supabase Auth, email y contraseña, con MFA (TOTP) recomendado.
- Sin registro público: los administradores se dan de alta manualmente.

**Dashboard:** pedidos pendientes, solicitudes nuevas, productos con stock bajo, tasa vigente.

**Productos:**
- Crear, editar y desactivar (no borrar si tienen pedidos).
- Imágenes subidas a Storage.
- Campos: categoría, marcas compatibles, precio USD, stock, umbral de stock bajo, garantía sí/no, destacado, activo.
- Importación y exportación CSV para la carga inicial del inventario.

**Categorías y marcas:** gestión básica.

**Tasa del día:** actualizar la tasa USD→Bs, con historial.

**Pedidos:**
- Lista con filtros por estado y búsqueda.
- Flujo de estados: Pendiente de pago → Enlace enviado → Pagado → En preparación → Enviado / Listo para retirar → Entregado → Cancelado.
- Campo para pegar el **enlace de cobro**: validar que sea una URL `https://`.
- Botones para enviarlo por WhatsApp (mensaje prellenado con número de pedido, total y enlace) o por email.
- Al marcar "Pagado", el stock se descuenta definitivamente; al cancelar, se libera la reserva. Todo mediante funciones atómicas en la base de datos.

**Solicitudes de reparación:** lista, detalle con fotos y cambio de estado (Nueva → Contactado → Recibido en taller → En reparación → Listo → Entregado / Descartado).

**Mensajes de contacto:** lista y marcar como leído.

**Ajustes:** datos de contacto, horario, duración de la garantía, costes orientativos de recogida y envío, horas de expiración de pedidos.

**Registro de auditoría:** quién cambió qué y cuándo (precios, stock, estados, tasa).

**Fuera de alcance por ahora, con la arquitectura preparada:**
- consulta pública del estado de una reparación por número de orden;
- pasarela de pago integrada;
- versión en inglés;
- reseñas verificadas.

---

## 6. Modelo de datos (propuesta, ajústala en el plan)

- `categories` (id, nombre, slug, orden)
- `brands` (id, nombre, slug)
- `products` (id, sku, nombre, slug, descripción, category_id, price_usd numeric(10,2), stock int ≥ 0, reserved int ≥ 0, low_stock_threshold, has_warranty, featured, active, created_at, updated_at)
- `product_brands` (product_id, brand_id)
- `product_images` (id, product_id, path, alt, orden)
- `exchange_rates` (id, rate numeric, effective_date, created_by, created_at)
- `orders` (id uuid, order_number único, public_token único y aleatorio, datos del cliente, delivery_method, datos de envío, status, subtotal_usd, exchange_rate, total_bs, payment_link, notes, admin_notes, expires_at, created_at, updated_at)
- `order_items` (id, order_id, product_id, nombre_snapshot, price_usd_snapshot, quantity)
- `repair_requests` (id, request_number, datos del cliente, equipo, marca, modelo, falla, delivery_method, return_shipping, status, admin_notes, created_at)
- `repair_request_photos` (id, request_id, path)
- `contact_messages`
- `settings` (clave/valor tipado o fila única)
- `admins` (user_id → auth.users, rol)
- `audit_log` (id, admin_id, acción, entidad, entidad_id, antes, después, created_at)

**Restricciones e índices:**
- `CHECK` en la base de datos (stock ≥ 0, reserved ≤ stock, precios > 0).
- Índices en slug, status y created_at.

**Migraciones y datos de ejemplo:**
- Migraciones SQL versionadas en el repositorio (`supabase/migrations`).
- Script de semilla con categorías, marcas y unos 20 productos de ejemplo marcados como tales.

---

## 7. Seguridad (requisitos no negociables)

**Secretos y variables de entorno**
- Todas las claves en variables de entorno, con `.env.example` documentado. `.env*` va en `.gitignore`.
- La clave `service_role` de Supabase solo se usa en el servidor y nunca se expone al cliente. Solo las variables públicas imprescindibles llevan `NEXT_PUBLIC_`.

**Base de datos (Supabase)**
- **Row Level Security activado en TODAS las tablas.**
- Público (anónimo): solo lectura de productos activos, categorías, marcas, imágenes, tasa vigente y ajustes públicos. Sin acceso directo de escritura a ninguna tabla.
- Las altas públicas (pedidos, solicitudes, mensajes) pasan siempre por el servidor (Server Actions o Route Handlers) con validación y limitación de frecuencia.
- Administración: solo usuarios presentes en `admins`, comprobado en las políticas RLS **y** en el servidor (middleware y cada acción).
- Funciones RPC críticas (crear pedido, marcar pagado, cancelar, expirar) con `SECURITY DEFINER` bien acotado, `search_path` fijado y permisos `EXECUTE` revocados para `anon` donde no corresponda.

**Validación y datos de entrada**
- Zod en el servidor para todo dato de entrada, con longitudes máximas y formatos (teléfono, cédula o RIF, email, URL `https://` del enlace de cobro).
- No renderizar HTML introducido por usuarios. Escapar siempre. Nada de `dangerouslySetInnerHTML` con datos externos.
- Consultas siempre parametrizadas o mediante el cliente de Supabase; nunca SQL concatenado.

**Protección contra abuso**
- Limitación de frecuencia por IP en formularios y checkout (p. ej. Upstash Ratelimit, o una tabla en Postgres si se prefiere no añadir servicios).
- Antispam: campo honeypot y Cloudflare Turnstile en los formularios públicos (configurable por variable de entorno).

**Subida de archivos**
- Solo `image/jpeg`, `image/png` y `image/webp`, máximo 5 MB por archivo y 3 por solicitud.
- Validar el tipo real del archivo (magic bytes) y no solo la extensión.
- Renombrar con UUID y eliminar metadatos EXIF (contienen ubicación GPS).
- Buckets de Storage privados para las fotos de solicitudes (acceso del admin con URLs firmadas temporales) y bucket público solo para imágenes de productos.

**Autenticación del panel**
- Sesión con cookies `httpOnly`, `secure` y `sameSite`.
- Protección de rutas `/admin` en middleware y verificación de rol en el servidor.
- Bloqueo o limitación tras varios intentos fallidos de login.
- MFA disponible.

**Cabeceras HTTP**
- Content-Security-Policy estricta (permitiendo solo Supabase, Google Maps, Turnstile y lo imprescindible).
- `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictiva y `frame-ancestors 'none'`.

**Enlaces externos**
- `rel="noopener noreferrer"` en todos los `target="_blank"`.

**Privacidad**
- Recoger solo los datos necesarios.
- Los datos personales nunca en URLs ni en logs.
- Las páginas públicas de pedido usan un token aleatorio y no muestran la cédula completa (enmascarada).

**Errores y registro**
- Mensajes de error genéricos al usuario y detalle solo en los logs del servidor.
- Página 404 y página de error personalizadas y con estilo de marca.

**Dependencias**
- Sin paquetes abandonados.
- Ejecutar `npm audit` al cerrar cada fase y reportar el resultado.

**Copias de seguridad**
- Documentar en el README cómo exportar o respaldar la base de datos.

---

## 8. SEO y accesibilidad

**SEO local:**
- Metadatos por página, Open Graph con imagen de marca, `sitemap.xml`, `robots.txt` (excluyendo `/admin`, `/checkout` y `/pedido`) y URLs canónicas.
- Datos estructurados JSON-LD:
  - `LocalBusiness` / `ElectronicsRepair` con dirección, teléfono, horario y geolocalización;
  - `Product` en las fichas;
  - `FAQPage` en la FAQ.
- Palabras clave orientativas: "reparación de electrodomésticos Caracas", "embobinado de motores Caracas", "repuestos de electrodomésticos Venezuela", "servicio técnico licuadoras industriales".
- `lang="es-VE"`.

**Accesibilidad:**
- HTML semántico y navegación completa por teclado con foco visible.
- `alt` descriptivo en las imágenes.
- Etiquetas y mensajes de error asociados a cada campo.
- Contraste AA.
- Probar con lector de pantalla en los flujos principales.

---

## 9. Contenido

- Todo en **español de Venezuela**, con un tono cercano, claro y profesional. Tutear al usuario.
- Redacta textos reales y persuasivos para todas las secciones a partir de la información de este documento.
- **No inventes** reseñas, cifras (salvo "más de 20 años"), certificaciones ni datos legales. Usa [PENDIENTE] o [PLACEHOLDER] visibles.
- Centraliza los textos y datos editables para poder modificarlos fácilmente.

---

## 10. Pruebas y calidad

- **Vitest:** cálculo de precios y conversión de moneda, validaciones Zod, lógica del horario abierto/cerrado (zona America/Caracas) y generación de mensajes de WhatsApp.
- **Playwright** (escritorio y móvil):
  - navegar → añadir al carrito → checkout → confirmación;
  - enviar solicitud de reparación;
  - login de administrador → cambiar estado de pedido;
  - intentar comprar más stock del disponible (debe fallar);
  - acceder a `/admin` sin sesión (debe redirigir).
- **Prueba de concurrencia** de la función de reserva de stock: dos pedidos simultáneos por la última unidad, solo uno debe tener éxito.
- Sin errores de TypeScript ni de ESLint al cerrar cada fase.

---

## 11. Fases

1. **Fase 1 — Base y diseño:**
   - setup del proyecto, git y `CLAUDE.md`;
   - tokens de diseño, tipografía y componentes base;
   - layout, header, footer y botón de WhatsApp;
   - página de Inicio completa con datos de ejemplo locales;
   - cabeceras de seguridad.

   → Arranca el servidor de desarrollo, dime cómo verla en el navegador y detente para la revisión visual.
2. **Fase 2 — Páginas informativas:** Servicios y detalles, Nosotros, Contacto, FAQ, páginas legales, 404 y error. Formularios de solicitud de reparación y contacto, con validación (aún sin backend: guardar en local o simular).
3. **Fase 3 — Backend y tienda:**
   - Supabase (guíame paso a paso para crear el proyecto y obtener las claves);
   - migraciones, RLS, semilla;
   - catálogo, ficha, carrito, checkout con reserva atómica, doble moneda y expiración;
   - conectar los formularios de la fase 2.
4. **Fase 4 — Panel y emails:** autenticación del admin con MFA, todas las secciones del panel, auditoría, emails transaccionales, Storage con validación de imágenes, rate limiting y Turnstile.
5. **Fase 5 — Pulido y despliegue:**
   - SEO, JSON-LD, accesibilidad, rendimiento (informe Lighthouse) y tests E2E;
   - `npm audit`;
   - README completo (instalación, variables, backups, cómo añadir productos);
   - guía paso a paso para desplegar en Vercel y conectar un dominio cuando lo haya.

---

## 12. Datos pendientes del cliente (márcalos [PENDIENTE] y recuérdamelos al final de cada fase)

- Duración de la garantía.
- Email Gmail.
- Segunda calle de la dirección.
- Costes orientativos de recogida y envío.
- Reseñas reales.
- Inventario inicial (productos, precios, stock, fotos).
- Logo en SVG o alta calidad.
- Fotos adicionales del local y de trabajos realizados.
- Métodos de pago aceptados (en el local aceptan Pago Móvil).
- Revisión de los textos legales.

Empieza leyendo los archivos de `assets/` y presentándome el plan. No escribas código todavía.

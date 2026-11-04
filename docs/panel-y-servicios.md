# Panel de administración, emails y antispam (Fase 4)

Guía paso a paso. No hace falta saber programar. Donde dice «PowerShell», abre
PowerShell en la carpeta del proyecto (`avg-reparaciones-web`).

> En este equipo, escribe `npm.cmd` en lugar de `npm` (Windows bloquea `npm`).

---

## 1. Crear tu usuario administrador

El panel **no tiene registro público**: los administradores se dan de alta a mano.

1. Entra en [supabase.com](https://supabase.com) → tu proyecto **avg-reparaciones**.
2. Menú izquierdo → **Authentication** → **Users** → botón **Add user** → **Create new user**.
3. Escribe tu email y una contraseña **larga** (mínimo 12 caracteres; una frase vale).
4. Marca **Auto Confirm User** y pulsa **Create user**.
5. En PowerShell:

   ```
   node scripts/make-admin.mjs tu-email@gmail.com owner
   ```

   Debe responder `✅ … ya es administrador (propietario)`.

6. Abre <http://localhost:3000/admin> y entra con ese email y contraseña.

Para dar acceso a otra persona del equipo: repite los pasos con su email y `staff`
en lugar de `owner`. Para quitarlo: `node scripts/make-admin.mjs su-email --remove`.

### Activar la verificación en dos pasos (muy recomendado)

1. Instala en tu móvil **Google Authenticator** o **Microsoft Authenticator**.
2. En el panel → **Mi cuenta** → **Activar verificación en dos pasos**.
3. Escanea el código QR con la app y escribe el código de 6 números.

A partir de ahí, al entrar se pedirá también el código del móvil.
Si pierdes el móvil: en Supabase → Authentication → Users → tu usuario → borra el
factor MFA, y vuelve a activarlo desde el panel.

### Ajustes de seguridad en Supabase (una sola vez)

- **Authentication → Sign In / Providers → Email**: desactiva **Allow new users to sign up**
  (así nadie puede crearse una cuenta por su cuenta).
- **Authentication → Multi-Factor**: comprueba que **TOTP** está habilitado.

---

## 2. Emails con Resend

La web envía: confirmación de pedido al cliente, enlace de cobro (desde el panel) y
avisos a la empresa de pedidos, solicitudes y mensajes. Sin configurar, la web
funciona igual pero **no envía emails**.

Resend solo envía a cualquier dirección si **verificas un dominio propio** (por
ejemplo `avgreparaciones.com`). Con una dirección de Gmail no se pueden enviar
emails automáticos de forma fiable.

1. Crea una cuenta en [resend.com](https://resend.com).
2. **Domains → Add domain** → escribe tu dominio y añade en tu proveedor de dominio
   los registros DNS que te indica (te ayudo con esto cuando llegues).
3. **API Keys → Create API key** (permiso _Sending access_). Cópiala con el botón de copiar.
4. En PowerShell ejecuta el asistente y responde a sus preguntas
   (la clave se ve como asteriscos):

   ```
   node scripts/setup-services.mjs
   ```

   Te pedirá la API key, el remitente (`AVG Reparaciones <avisos@tudominio.com>`)
   y el Gmail donde quieres recibir los avisos. Las preguntas de Turnstile
   puedes saltarlas con Enter.

---

## 3. Antispam con Cloudflare Turnstile (opcional)

Añade una casilla «no soy un robot» (casi siempre invisible) a los formularios
públicos y al login.

1. Crea una cuenta gratuita en [cloudflare.com](https://dash.cloudflare.com).
2. **Turnstile → Add widget**: nombre «AVG web», dominios `localhost` y el de la web,
   modo **Managed**.
3. Ejecuta `node scripts/setup-services.mjs`, salta las preguntas de Resend con
   Enter y pega la **Site Key** y la **Secret Key**.
4. Reinicia el servidor (`npm.cmd run dev`).

---

## 4. Uso diario del panel

| Sección                 | Para qué                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resumen**             | Pedidos sin pagar, por preparar, solicitudes nuevas, stock bajo y tasa.                                                                                             |
| **Pedidos**             | Pega el enlace de cobro → envíalo por WhatsApp o email → marca _Pagado_ (descuenta stock) → _Enviado / Listo para retirar_ → _Entregado_. Cancelar libera el stock. |
| **Solicitudes**         | Datos y fotos del equipo, estado de la reparación y notas internas.                                                                                                 |
| **Mensajes**            | Formulario de contacto; marcar como leído.                                                                                                                          |
| **Productos**           | Crear, editar, imágenes, destacar, ocultar. Importar/exportar CSV para cargar el inventario.                                                                        |
| **Categorías y marcas** | Filtros de la tienda.                                                                                                                                               |
| **Tasa del día**        | Actualízala cada día: los precios en Bs de la tienda la usan al momento.                                                                                            |
| **Ajustes**             | Email, teléfono, WhatsApp, dirección, horario, garantía, costes, horas para pagar.                                                                                  |
| **Auditoría**           | Quién cambió precios, stock, estados, tasa o ajustes, y cuándo.                                                                                                     |
| **Mi cuenta**           | Verificación en dos pasos y cambio de contraseña.                                                                                                                   |

Si alguien falla la contraseña 5 veces en 15 minutos, esa cuenta queda bloqueada 15 minutos.

---

## 5. Copias de seguridad

Supabase hace copias diarias automáticas (plan gratuito: 7 días, sin restauración
a un punto exacto). Para tener una copia propia, en PowerShell:

```
node node_modules/supabase/dist/supabase.js db dump --db-url "<SUPABASE_DB_URL>" -f respaldo.sql --data-only
```

(La cadena está en `.env.local`. Guarda el archivo en un lugar seguro: contiene
datos de clientes.) Las imágenes están en Supabase → Storage.

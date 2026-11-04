# Cómo crear la base de datos en Supabase (paso a paso)

Supabase es el servicio que guarda los productos, los pedidos y las solicitudes. El plan gratuito es suficiente para empezar.

Tiempo estimado: 10 minutos.

## 1. Crear la cuenta

1. Entra en <https://supabase.com> y pulsa **Start your project**.
2. Regístrate. Lo más sencillo es hacerlo con la cuenta de GitHub o con el correo del negocio.

## 2. Crear el proyecto

1. Pulsa **New project**.
2. Rellena:
   - **Name:** `avg-reparaciones`
   - **Database Password:** pulsa **Generate a password** y **guárdala en un lugar seguro**, por ejemplo en un gestor de contraseñas. La necesitarás en el paso 4.
   - **Region:** elige **East US (North Virginia)**, que es la más cercana a Venezuela.
3. Pulsa **Create new project** y espera 1 o 2 minutos.

## 3. Copiar las claves de la API

1. En el menú de la izquierda, entra en **Project Settings** (el engranaje) y luego en **API Keys**.
2. Vas a necesitar:
   - la **URL del proyecto**, que se parece a `https://abcdefgh.supabase.co`. Está en **Project Settings → Data API**;
   - la **Publishable key**, que empieza por `sb_publishable_…`;
   - la **Secret key**, que empieza por `sb_secret_…`. Pulsa el ojo para verla.

> ⚠️ La **Secret key** da acceso total a la base de datos. No la compartas con nadie, no la envíes por chat ni por correo y no la subas a internet.

## 4. Copiar la cadena de conexión

1. Arriba, pulsa el botón **Connect**.
2. Elige la pestaña **Connection string** y, dentro, **Session pooler**.
3. Copia el texto, que se parece a:
   `postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
4. Sustituye `[YOUR-PASSWORD]` por la contraseña del paso 2. Quita también los corchetes.

## 5. Pegar los datos en el proyecto

1. Abre el archivo **`.env.local`** que está en la carpeta del proyecto. Puedes abrirlo con el Bloc de notas.
2. Pega cada valor después del signo `=`, sin espacios ni comillas:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_DB_URL=postgresql://postgres.abcdefgh:TU-CONTRASEÑA@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

3. Guarda el archivo.

`.env.local` **nunca se sube a git**: está excluido a propósito.

## 6. Avisar a Claude

Escribe en el chat: **«Listo, ya rellené .env.local»**.

**No pegues las claves en el chat.** Claude las leerá directamente del archivo para crear las tablas y cargar los datos de ejemplo.

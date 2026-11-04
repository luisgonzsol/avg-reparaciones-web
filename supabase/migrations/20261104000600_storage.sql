-- =====================================================================
-- AVG Reparaciones · Storage (solo Supabase)
--
--  products       PÚBLICO: imágenes de productos (las ve cualquiera).
--  repair-photos  PRIVADO: fotos de las solicitudes de reparación. Solo el
--                 administrador las ve, con URLs firmadas temporales.
--
-- Las subidas pasan SIEMPRE por el servidor, que valida el tipo real
-- (magic bytes), reescala y elimina los metadatos EXIF (ubicación GPS).
-- Los límites de tamaño y tipo se repiten aquí como defensa en profundidad.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('products', 'products', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('repair-photos', 'repair-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Imágenes de productos: el administrador sube, reemplaza y borra.
-- (La lectura pública va por la URL pública del bucket, sin política.)
create policy "Admin: listar imágenes de productos" on storage.objects
  for select to authenticated
  using (bucket_id = 'products' and (select public.is_admin()));
create policy "Admin: subir imágenes de productos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'products' and (select public.is_admin()));
create policy "Admin: actualizar imágenes de productos" on storage.objects
  for update to authenticated
  using (bucket_id = 'products' and (select public.is_admin()))
  with check (bucket_id = 'products' and (select public.is_admin()));
create policy "Admin: borrar imágenes de productos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'products' and (select public.is_admin()));

-- Fotos de solicitudes: solo lectura para el administrador (URLs firmadas).
-- Las sube el servidor con la clave secreta tras validarlas.
create policy "Admin: ver fotos de solicitudes" on storage.objects
  for select to authenticated
  using (bucket_id = 'repair-photos' and (select public.is_admin()));

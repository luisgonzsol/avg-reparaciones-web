-- =====================================================================
-- AVG Reparaciones · Row Level Security
-- RLS ACTIVADO EN TODAS LAS TABLAS.
-- Público: solo lectura del catálogo activo, tasa vigente y ajustes.
-- Las altas públicas (pedidos, solicitudes, mensajes) pasan por el
-- servidor con la clave service_role (que no está sujeta a RLS).
-- =====================================================================

alter table public.categories            enable row level security;
alter table public.brands                enable row level security;
alter table public.products              enable row level security;
alter table public.product_brands        enable row level security;
alter table public.product_images        enable row level security;
alter table public.exchange_rates        enable row level security;
alter table public.settings              enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.order_status_history  enable row level security;
alter table public.repair_requests       enable row level security;
alter table public.repair_request_photos enable row level security;
alter table public.contact_messages      enable row level security;
alter table public.admins                enable row level security;
alter table public.audit_log             enable row level security;
alter table public.counters              enable row level security;
alter table public.rate_limits           enable row level security;

-- ---------- Privilegios de tabla explícitos ----------
-- No dependemos de "Automatically expose new tables" de Supabase: se
-- concede exactamente lo necesario (y RLS filtra las filas).
grant usage on schema public to anon, authenticated, service_role;
grant select on public.categories, public.brands, public.products, public.product_brands,
  public.product_images, public.exchange_rates, public.settings
  to anon, authenticated;
grant select on public.orders, public.order_items, public.order_status_history,
  public.repair_requests, public.repair_request_photos, public.contact_messages,
  public.admins, public.audit_log
  to authenticated;
-- El servidor (service_role, no sujeto a RLS) opera con todas las tablas.
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- ---------- Privilegios de tabla (defensa en profundidad) ----------
-- anon: sin escritura en ninguna tabla y sin lectura de tablas privadas.
revoke insert, update, delete, truncate on all tables in schema public from anon;
revoke all on public.orders, public.order_items, public.order_status_history,
  public.repair_requests, public.repair_request_photos, public.contact_messages,
  public.admins, public.audit_log, public.counters, public.rate_limits
  from anon;
-- authenticated (administradores): sin acceso a tablas internas.
revoke all on public.counters, public.rate_limits from authenticated;
revoke truncate on all tables in schema public from authenticated;

alter default privileges in schema public revoke insert, update, delete, truncate on tables from anon;

-- ---------- Lectura pública ----------
create policy "Catálogo: categorías visibles" on public.categories
  for select to anon, authenticated using (true);

create policy "Catálogo: marcas visibles" on public.brands
  for select to anon, authenticated using (true);

create policy "Catálogo: productos activos" on public.products
  for select to anon, authenticated using (active or (select public.is_admin()));

create policy "Catálogo: marcas de productos activos" on public.product_brands
  for select to anon, authenticated using (
    (select public.is_admin())
    or exists (select 1 from public.products p where p.id = product_id and p.active)
  );

create policy "Catálogo: imágenes de productos activos" on public.product_images
  for select to anon, authenticated using (
    (select public.is_admin())
    or exists (select 1 from public.products p where p.id = product_id and p.active)
  );

create policy "Tasa vigente" on public.exchange_rates
  for select to anon, authenticated using (
    (select public.is_admin())
    or id = (select public.current_exchange_rate_id())
  );

create policy "Ajustes públicos" on public.settings
  for select to anon, authenticated using (true);

-- ---------- Administración (lectura; la escritura llega en la Fase 4) ----------
create policy "Admin: pedidos" on public.orders
  for select to authenticated using ((select public.is_admin()));
create policy "Admin: líneas de pedido" on public.order_items
  for select to authenticated using ((select public.is_admin()));
create policy "Admin: historial de pedidos" on public.order_status_history
  for select to authenticated using ((select public.is_admin()));
create policy "Admin: solicitudes" on public.repair_requests
  for select to authenticated using ((select public.is_admin()));
create policy "Admin: fotos de solicitudes" on public.repair_request_photos
  for select to authenticated using ((select public.is_admin()));
create policy "Admin: mensajes" on public.contact_messages
  for select to authenticated using ((select public.is_admin()));
create policy "Admin: auditoría" on public.audit_log
  for select to authenticated using ((select public.is_admin()));
create policy "Admin: ver su propio registro" on public.admins
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));

-- counters y rate_limits: sin políticas → inaccesibles salvo service_role.

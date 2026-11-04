-- =====================================================================
-- AVG Reparaciones · Panel de administración (Fase 4)
--
--  * is_admin() exige MFA (aal2) cuando el usuario tiene un factor TOTP
--    verificado: si alguien roba solo la contraseña, no entra.
--  * Escritura del admin SOLO en las columnas necesarias (privilegios por
--    columna) y filtrada por RLS con is_admin().
--  * Los pedidos NO se editan directamente: los cambios de estado pasan por
--    admin_update_order(), que aplica el flujo y mueve el stock de forma
--    atómica (mark_order_paid / cancel_order).
--  * Registro de auditoría automático mediante triggers: quién, qué, cuándo,
--    con los campos que cambiaron (antes / después).
-- =====================================================================

-- ---------- ¿Es administrador? (con MFA) ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid())
    and (
      coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (
        select 1 from auth.mfa_factors f
        where f.user_id = auth.uid() and f.status = 'verified'
      )
    );
$$;

-- Email visible del administrador (para la auditoría). Lo rellena el
-- script scripts/make-admin.mjs al dar de alta a alguien.
alter table public.admins add column email text check (email is null or char_length(email) <= 254);

-- Valores por defecto que identifican al administrador.
alter table public.exchange_rates alter column created_by set default auth.uid();

-- ---------- Auditoría automática ----------
-- Solo registra cambios hechos por un usuario con sesión (el panel). Las
-- operaciones del sistema (pedidos de clientes, expiración) no se registran
-- aquí: quedan en order_status_history.
create or replace function public.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  v_before jsonb := '{}'::jsonb;
  v_after jsonb := '{}'::jsonb;
  k text;
begin
  if v_uid is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'UPDATE' then
    -- Solo los campos que cambiaron (sin marcas de tiempo).
    for k in select jsonb_object_keys(v_new) loop
      if k not in ('updated_at', 'updated_by') and (v_old -> k) is distinct from (v_new -> k) then
        v_before := v_before || jsonb_build_object(k, v_old -> k);
        v_after := v_after || jsonb_build_object(k, v_new -> k);
      end if;
    end loop;
    if v_after = '{}'::jsonb then
      return new;
    end if;
  else
    v_before := v_old;
    v_after := v_new;
  end if;

  insert into public.audit_log (admin_id, action, entity, entity_id, before, after)
  values (
    v_uid,
    lower(tg_op),
    tg_table_name,
    coalesce(v_new ->> 'id', v_old ->> 'id'),
    v_before,
    v_after
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_products after insert or update or delete on public.products
  for each row execute function public.audit_row();
create trigger audit_categories after insert or update or delete on public.categories
  for each row execute function public.audit_row();
create trigger audit_brands after insert or update or delete on public.brands
  for each row execute function public.audit_row();
create trigger audit_exchange_rates after insert or update or delete on public.exchange_rates
  for each row execute function public.audit_row();
create trigger audit_settings after update on public.settings
  for each row execute function public.audit_row();
create trigger audit_orders after update on public.orders
  for each row execute function public.audit_row();
create trigger audit_repair_requests after update on public.repair_requests
  for each row execute function public.audit_row();

-- Quién modificó los ajustes por última vez.
create or replace function public.set_updated_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;
create trigger settings_updated_by before update on public.settings
  for each row execute function public.set_updated_by();

-- ---------- Privilegios de escritura del panel (por columna) ----------
-- Primero se quita cualquier escritura heredada (p. ej. si Supabase tiene
-- activado "Automatically expose new tables") y luego se concede lo justo.
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from authenticated;
grant insert, update, delete on public.categories, public.brands to authenticated;
grant insert (sku, name, slug, description, compatibility, category_id, price_usd, stock,
              low_stock_threshold, has_warranty, featured, active)
  on public.products to authenticated;
grant update (sku, name, slug, description, compatibility, category_id, price_usd, stock,
              low_stock_threshold, has_warranty, featured, active, is_sample)
  on public.products to authenticated;
grant delete on public.products to authenticated;
grant insert, delete on public.product_brands to authenticated;
grant insert (product_id, path, alt, sort_order), update (alt, sort_order), delete
  on public.product_images to authenticated;
grant insert (rate, effective_date, note) on public.exchange_rates to authenticated;
grant update (email, phone_display, whatsapp_number, address_street, address_between,
              address_second_street, instagram_url, schedule, warranty_duration,
              pickup_cost_note, return_shipping_cost_note, order_expiration_hours,
              payment_methods, show_testimonials)
  on public.settings to authenticated;
grant update (status, admin_notes) on public.repair_requests to authenticated;
grant update (read_at) on public.contact_messages to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ---------- Políticas de escritura (solo administradores) ----------
create policy "Admin: crear categorías" on public.categories
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin: editar categorías" on public.categories
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin: borrar categorías" on public.categories
  for delete to authenticated using ((select public.is_admin()));

create policy "Admin: crear marcas" on public.brands
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin: editar marcas" on public.brands
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin: borrar marcas" on public.brands
  for delete to authenticated using ((select public.is_admin()));

create policy "Admin: crear productos" on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin: editar productos" on public.products
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin: borrar productos" on public.products
  for delete to authenticated using ((select public.is_admin()));

create policy "Admin: asignar marcas" on public.product_brands
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin: quitar marcas" on public.product_brands
  for delete to authenticated using ((select public.is_admin()));

create policy "Admin: subir imágenes" on public.product_images
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin: editar imágenes" on public.product_images
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin: borrar imágenes" on public.product_images
  for delete to authenticated using ((select public.is_admin()));

create policy "Admin: cargar tasa" on public.exchange_rates
  for insert to authenticated with check ((select public.is_admin()));

create policy "Admin: editar ajustes" on public.settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admin: editar solicitudes" on public.repair_requests
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admin: marcar mensajes" on public.contact_messages
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Flujo de estados de pedidos ----------
create or replace function public.order_transition_allowed(p_from public.order_status, p_to public.order_status)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_from
    when 'pending_payment'  then p_to in ('link_sent', 'paid', 'cancelled')
    when 'link_sent'        then p_to in ('pending_payment', 'paid', 'cancelled')
    when 'paid'             then p_to in ('preparing', 'shipped', 'ready_for_pickup', 'cancelled')
    when 'preparing'        then p_to in ('shipped', 'ready_for_pickup', 'cancelled')
    when 'shipped'          then p_to in ('delivered', 'cancelled')
    when 'ready_for_pickup' then p_to in ('delivered', 'cancelled')
    else false
  end;
$$;

-- Cambia estado, enlace de cobro y notas internas de un pedido.
-- Errores: forbidden | order_not_found | invalid_transition (detail = de→a)
--          payment_link_required | invalid_payment_link
create or replace function public.admin_update_order(
  p_order_id uuid,
  p_status public.order_status default null,
  p_payment_link text default null,
  p_admin_notes text default null
)
returns public.order_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  o record;
  v_uid uuid := auth.uid();
  v_link text := nullif(trim(coalesce(p_payment_link, '')), '');
begin
  if not public.is_admin() then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;

  select id, status, payment_link into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'order_not_found';
  end if;

  if v_link is not null and (v_link !~ '^https://[^\s]+$' or char_length(v_link) > 2000) then
    raise exception using errcode = 'P0001', message = 'invalid_payment_link';
  end if;

  -- Enlace y notas (se guardan aunque no cambie el estado).
  update public.orders
    set payment_link = coalesce(v_link, payment_link),
        admin_notes = case when p_admin_notes is null then admin_notes
                           else nullif(left(trim(p_admin_notes), 2000), '') end
    where id = p_order_id;

  if p_status is null or p_status = o.status then
    return o.status;
  end if;

  if not public.order_transition_allowed(o.status, p_status) then
    raise exception using errcode = 'P0001', message = 'invalid_transition',
      detail = o.status::text || '→' || p_status::text;
  end if;

  if p_status = 'link_sent' and coalesce(v_link, o.payment_link) is null then
    raise exception using errcode = 'P0001', message = 'payment_link_required';
  end if;

  if p_status = 'paid' then
    perform public.mark_order_paid(p_order_id, v_uid);
  elsif p_status = 'cancelled' then
    perform public.cancel_order(p_order_id, v_uid);
  else
    update public.orders set status = p_status where id = p_order_id;
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
      values (p_order_id, o.status, p_status, v_uid);
  end if;
  return p_status;
end;
$$;

-- ---------- Guardar producto (con sus marcas) en una sola transacción ----------
-- SECURITY INVOKER: aplica RLS, privilegios por columna y auditoría.
-- p: {id?, sku, name, slug, description, compatibility, category_id, price_usd,
--     stock, low_stock_threshold, has_warranty, featured, active}
create or replace function public.admin_save_product(p jsonb, p_brand_ids bigint[])
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
begin
  if not public.is_admin() then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;

  if v_id is null then
    insert into public.products (sku, name, slug, description, compatibility, category_id, price_usd,
                                 stock, low_stock_threshold, has_warranty, featured, active)
    values (p ->> 'sku', p ->> 'name', p ->> 'slug', coalesce(p ->> 'description', ''),
            coalesce(p ->> 'compatibility', ''), (p ->> 'category_id')::bigint,
            (p ->> 'price_usd')::numeric, (p ->> 'stock')::int, (p ->> 'low_stock_threshold')::int,
            (p ->> 'has_warranty')::boolean, (p ->> 'featured')::boolean, (p ->> 'active')::boolean)
    returning id into v_id;
  else
    update public.products set
      sku = p ->> 'sku', name = p ->> 'name', slug = p ->> 'slug',
      description = coalesce(p ->> 'description', ''), compatibility = coalesce(p ->> 'compatibility', ''),
      category_id = (p ->> 'category_id')::bigint, price_usd = (p ->> 'price_usd')::numeric,
      stock = (p ->> 'stock')::int, low_stock_threshold = (p ->> 'low_stock_threshold')::int,
      has_warranty = (p ->> 'has_warranty')::boolean, featured = (p ->> 'featured')::boolean,
      active = (p ->> 'active')::boolean,
      -- Un producto editado a mano deja de ser "de ejemplo".
      is_sample = false
    where id = v_id;
    if not found then
      raise exception using errcode = 'P0001', message = 'product_not_found';
    end if;
    delete from public.product_brands where product_id = v_id;
  end if;

  insert into public.product_brands (product_id, brand_id)
  select v_id, b from unnest(coalesce(p_brand_ids, '{}')) b
  on conflict do nothing;
  return v_id;
end;
$$;

-- ---------- Importación CSV (todo o nada) ----------
-- p_rows: [{sku, name, slug, category, brands: [slug], price_usd, stock,
--           low_stock_threshold, has_warranty, featured, active, description, compatibility}]
-- Errores: unknown_category (detail = fila|slug) | unknown_brand (detail = fila|slug)
create or replace function public.admin_import_products(p_rows jsonb)
returns table (inserted int, updated int)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  r jsonb;
  i int := 0;
  v_cat bigint;
  v_id uuid;
  v_brand text;
  v_brand_id bigint;
  v_ins int := 0;
  v_upd int := 0;
  v_existing uuid;
begin
  if not public.is_admin() then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 2000 then
    raise exception using errcode = 'P0001', message = 'invalid_rows';
  end if;

  for r in select * from jsonb_array_elements(p_rows) loop
    i := i + 1;
    select id into v_cat from public.categories where slug = r ->> 'category';
    if v_cat is null then
      raise exception using errcode = 'P0001', message = 'unknown_category', detail = i || '|' || (r ->> 'category');
    end if;

    select id into v_existing from public.products where sku = r ->> 'sku';
    if v_existing is null then
      insert into public.products (sku, name, slug, description, compatibility, category_id, price_usd,
                                   stock, low_stock_threshold, has_warranty, featured, active)
      values (r ->> 'sku', r ->> 'name', r ->> 'slug', coalesce(r ->> 'description', ''),
              coalesce(r ->> 'compatibility', ''), v_cat, (r ->> 'price_usd')::numeric,
              (r ->> 'stock')::int, (r ->> 'low_stock_threshold')::int, (r ->> 'has_warranty')::boolean,
              (r ->> 'featured')::boolean, (r ->> 'active')::boolean)
      returning id into v_id;
      v_ins := v_ins + 1;
    else
      update public.products set
        name = r ->> 'name', slug = r ->> 'slug', description = coalesce(r ->> 'description', ''),
        compatibility = coalesce(r ->> 'compatibility', ''), category_id = v_cat,
        price_usd = (r ->> 'price_usd')::numeric, stock = (r ->> 'stock')::int,
        low_stock_threshold = (r ->> 'low_stock_threshold')::int,
        has_warranty = (r ->> 'has_warranty')::boolean, featured = (r ->> 'featured')::boolean,
        active = (r ->> 'active')::boolean, is_sample = false
      where id = v_existing;
      v_id := v_existing;
      v_upd := v_upd + 1;
      delete from public.product_brands where product_id = v_id;
    end if;

    for v_brand in select jsonb_array_elements_text(coalesce(r -> 'brands', '[]'::jsonb)) loop
      select id into v_brand_id from public.brands where slug = v_brand;
      if v_brand_id is null then
        raise exception using errcode = 'P0001', message = 'unknown_brand', detail = i || '|' || v_brand;
      end if;
      insert into public.product_brands (product_id, brand_id) values (v_id, v_brand_id)
      on conflict do nothing;
    end loop;
  end loop;

  return query select v_ins, v_upd;
end;
$$;

-- ---------- Resumen del panel ----------
create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  return jsonb_build_object(
    'pending_orders', (select count(*) from public.orders where status in ('pending_payment', 'link_sent')),
    'to_prepare', (select count(*) from public.orders where status in ('paid', 'preparing')),
    'new_requests', (select count(*) from public.repair_requests where status = 'new'),
    'unread_messages', (select count(*) from public.contact_messages where read_at is null),
    'low_stock', coalesce((
      select jsonb_agg(x order by x.available, x.name)
      from (
        select p.id, p.name, p.sku, p.stock, p.reserved, p.low_stock_threshold,
               greatest(p.stock - p.reserved, 0) as available
        from public.products p
        where p.active and p.stock - p.reserved <= p.low_stock_threshold
        order by greatest(p.stock - p.reserved, 0), p.name
        limit 20
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------- Permisos de ejecución ----------
-- Postgres concede EXECUTE a PUBLIC por defecto en cada función nueva (y
-- Supabase, además, a anon y authenticated): se revoca explícitamente.
revoke execute on function public.audit_row() from public, anon, authenticated;
revoke execute on function public.set_updated_by() from public, anon, authenticated;
revoke execute on function public.order_transition_allowed(public.order_status, public.order_status) from public, anon;
revoke execute on function public.admin_update_order(uuid, public.order_status, text, text) from public, anon;
revoke execute on function public.admin_save_product(jsonb, bigint[]) from public, anon;
revoke execute on function public.admin_import_products(jsonb) from public, anon;
revoke execute on function public.admin_dashboard() from public, anon;
-- is_admin se redefinió arriba: conserva sus permisos, pero por si acaso.
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.order_transition_allowed(public.order_status, public.order_status) to authenticated, service_role;
grant execute on function public.admin_update_order(uuid, public.order_status, text, text) to authenticated;
grant execute on function public.admin_save_product(jsonb, bigint[]) to authenticated;
grant execute on function public.admin_import_products(jsonb) to authenticated;
grant execute on function public.admin_dashboard() to authenticated;

-- =====================================================================
-- AVG Reparaciones · Funciones (RPC)
--
-- Reglas de seguridad:
--  * SECURITY DEFINER solo donde hace falta, siempre con search_path = ''
--    y nombres totalmente cualificados.
--  * EXECUTE revocado a PUBLIC / anon / authenticated en las funciones
--    críticas: solo el servidor (service_role) puede llamarlas.
--
-- Modelo de stock:
--  products.stock    = unidades físicas en la tienda
--  products.reserved = unidades apartadas por pedidos sin pagar
--  disponible        = stock - reserved
--  Pedido creado   → reserved += qty                     (stock_state = reserved)
--  Pedido pagado   → stock -= qty, reserved -= qty       (stock_state = committed)
--  Cancelado/expirado sin pagar → reserved -= qty         (stock_state = released)
--  Cancelado tras pagar         → stock += qty (reingreso)(stock_state = released)
-- =====================================================================

-- ---------- ¿Es administrador? ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- ---------- Id de la tasa vigente (evita recursión en la política RLS) ----------
create or replace function public.current_exchange_rate_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select x.id from public.exchange_rates x
  order by x.effective_date desc, x.created_at desc
  limit 1;
$$;

-- ---------- Año actual en Caracas ----------
create or replace function public.caracas_year()
returns int
language sql
stable
set search_path = ''
as $$
  select extract(year from (now() at time zone 'America/Caracas'))::int;
$$;

-- ---------- Numeración correlativa ----------
create or replace function public.next_number(p_scope text, p_prefix text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year int := public.caracas_year();
  v_value int;
begin
  insert into public.counters as c (scope, year, value)
  values (p_scope, v_year, 1)
  on conflict (scope, year) do update set value = c.value + 1
  returning c.value into v_value;

  return p_prefix || '-' || v_year || '-' || lpad(v_value::text, 4, '0');
end;
$$;

-- ---------- Liberar / consolidar stock de un pedido (internas) ----------
create or replace function public._order_release_stock(p_order_id uuid, p_stock_state public.order_stock_state)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  -- Bloqueo en orden determinista (por id) para evitar interbloqueos.
  for r in
    select p.id, i.qty
    from public.products p
    join (
      select oi.product_id, sum(oi.quantity)::int as qty
      from public.order_items oi
      where oi.order_id = p_order_id
      group by oi.product_id
    ) i on i.product_id = p.id
    order by p.id
    for update of p
  loop
    if p_stock_state = 'reserved' then
      update public.products set reserved = reserved - r.qty where id = r.id;
    elsif p_stock_state = 'committed' then
      update public.products set stock = stock + r.qty where id = r.id;
    end if;
  end loop;
end;
$$;

-- ---------- Expirar pedidos sin pagar ----------
create or replace function public.expire_orders()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  o record;
  n int := 0;
begin
  for o in
    select id, status, stock_state
    from public.orders
    where status in ('pending_payment', 'link_sent')
      and expires_at < now()
    order by id
    for update skip locked
  loop
    perform public._order_release_stock(o.id, o.stock_state);
    update public.orders
      set status = 'expired', stock_state = 'released', cancelled_at = now()
      where id = o.id;
    insert into public.order_status_history (order_id, from_status, to_status)
      values (o.id, o.status, 'expired');
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- ---------- Crear pedido con reserva atómica ----------
-- p_customer: {name, id_doc, phone, email, delivery_method, state, city, address, agency, notes}
-- p_items:    [{slug, quantity}, ...]
-- Errores (message / detail):
--   invalid_items | product_not_found (detail = slugs) | product_unavailable (detail = slug)
--   insufficient_stock (detail = slug|disponible) | no_exchange_rate
create or replace function public.create_order(p_customer jsonb, p_items jsonb)
returns table (order_id uuid, order_number text, public_token text, subtotal_usd numeric, total_bs numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lines int;
  v_found int := 0;
  v_rate numeric;
  v_hours int;
  v_subtotal numeric(10, 2) := 0;
  v_total_bs numeric(16, 2);
  v_order_id uuid := gen_random_uuid();
  v_number text;
  v_token text;
  v_items jsonb := '[]'::jsonb;
  r record;
begin
  -- Libera primero las reservas caducadas (por si el cron va con retraso).
  perform public.expire_orders();

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception using errcode = 'P0001', message = 'invalid_items';
  end if;

  select count(distinct e ->> 'slug') into v_lines from jsonb_array_elements(p_items) e;
  if v_lines < 1 or v_lines > 30 then
    raise exception using errcode = 'P0001', message = 'invalid_items';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where jsonb_typeof(e -> 'quantity') <> 'number'
       or (e ->> 'quantity')::numeric <> floor((e ->> 'quantity')::numeric)
       or (e ->> 'quantity')::int < 1
  ) then
    raise exception using errcode = 'P0001', message = 'invalid_items';
  end if;

  select x.rate into v_rate
  from public.exchange_rates x
  order by x.effective_date desc, x.created_at desc
  limit 1;
  if v_rate is null then
    raise exception using errcode = 'P0001', message = 'no_exchange_rate';
  end if;

  -- Bloquea las filas de los productos (orden determinista) y valida stock.
  for r in
    select p.id, p.slug, p.sku, p.name, p.price_usd, p.stock, p.reserved, p.active, q.qty
    from public.products p
    join (
      select e ->> 'slug' as slug, sum((e ->> 'quantity')::int)::int as qty
      from jsonb_array_elements(p_items) e
      group by e ->> 'slug'
    ) q on q.slug = p.slug
    order by p.id
    for update of p
  loop
    v_found := v_found + 1;
    if not r.active then
      raise exception using errcode = 'P0001', message = 'product_unavailable', detail = r.slug;
    end if;
    if r.qty > 99 then
      raise exception using errcode = 'P0001', message = 'invalid_items';
    end if;
    if r.stock - r.reserved < r.qty then
      raise exception using errcode = 'P0001', message = 'insufficient_stock',
        detail = r.slug || '|' || greatest(r.stock - r.reserved, 0);
    end if;

    update public.products set reserved = reserved + r.qty where id = r.id;

    v_subtotal := v_subtotal + r.price_usd * r.qty;
    v_items := v_items || jsonb_build_object(
      'product_id', r.id, 'name', r.name, 'sku', r.sku, 'price', r.price_usd, 'qty', r.qty
    );
  end loop;

  if v_found <> v_lines then
    raise exception using errcode = 'P0001', message = 'product_not_found';
  end if;

  select s.order_expiration_hours into v_hours from public.settings s where s.id = 1;
  v_hours := coalesce(v_hours, 48);
  v_total_bs := round(v_subtotal * v_rate, 2);
  v_number := public.next_number('order', 'AVG');
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.orders (
    id, order_number, public_token,
    customer_name, customer_id_doc, customer_phone, customer_email,
    delivery_method, shipping_state, shipping_city, shipping_address, shipping_agency, notes,
    subtotal_usd, exchange_rate, total_bs, expires_at
  ) values (
    v_order_id, v_number, v_token,
    p_customer ->> 'name', p_customer ->> 'id_doc', p_customer ->> 'phone', p_customer ->> 'email',
    (p_customer ->> 'delivery_method')::public.order_delivery,
    nullif(p_customer ->> 'state', ''), nullif(p_customer ->> 'city', ''),
    nullif(p_customer ->> 'address', ''), nullif(p_customer ->> 'agency', ''),
    nullif(p_customer ->> 'notes', ''),
    v_subtotal, v_rate, v_total_bs, now() + make_interval(hours => v_hours)
  );

  insert into public.order_items (order_id, product_id, name_snapshot, sku_snapshot, price_usd_snapshot, quantity)
  select v_order_id, (i ->> 'product_id')::uuid, i ->> 'name', i ->> 'sku', (i ->> 'price')::numeric, (i ->> 'qty')::int
  from jsonb_array_elements(v_items) i;

  insert into public.order_status_history (order_id, from_status, to_status)
  values (v_order_id, null, 'pending_payment');

  return query select v_order_id, v_number, v_token, v_subtotal::numeric, v_total_bs::numeric;
end;
$$;

-- ---------- Marcar pedido como pagado ----------
create or replace function public.mark_order_paid(p_order_id uuid, p_actor uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  o record;
  r record;
begin
  select id, status, stock_state into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'order_not_found';
  end if;
  if o.status not in ('pending_payment', 'link_sent') or o.stock_state <> 'reserved' then
    raise exception using errcode = 'P0001', message = 'order_not_payable', detail = o.status::text;
  end if;

  for r in
    select p.id, i.qty
    from public.products p
    join (
      select oi.product_id, sum(oi.quantity)::int as qty
      from public.order_items oi where oi.order_id = p_order_id group by oi.product_id
    ) i on i.product_id = p.id
    order by p.id
    for update of p
  loop
    update public.products set stock = stock - r.qty, reserved = reserved - r.qty where id = r.id;
  end loop;

  update public.orders
    set status = 'paid', stock_state = 'committed', paid_at = now()
    where id = p_order_id;
  insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (p_order_id, o.status, 'paid', p_actor);
end;
$$;

-- ---------- Cancelar pedido ----------
create or replace function public.cancel_order(p_order_id uuid, p_actor uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  o record;
begin
  select id, status, stock_state into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'order_not_found';
  end if;
  if o.status in ('cancelled', 'expired', 'delivered') then
    raise exception using errcode = 'P0001', message = 'order_not_cancellable', detail = o.status::text;
  end if;

  perform public._order_release_stock(p_order_id, o.stock_state);
  update public.orders
    set status = 'cancelled', stock_state = 'released', cancelled_at = now()
    where id = p_order_id;
  insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (p_order_id, o.status, 'cancelled', p_actor);
end;
$$;

-- ---------- Solicitud de reparación ----------
create or replace function public.create_repair_request(p jsonb)
returns table (id uuid, request_number text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
  v_number text := public.next_number('repair', 'REP');
begin
  insert into public.repair_requests (
    id, request_number, customer_name, customer_phone, customer_email, state, city,
    equipment_type, brand, model, issue, delivery_method, return_shipping
  ) values (
    v_id, v_number, p ->> 'name', p ->> 'phone', nullif(p ->> 'email', ''), p ->> 'state', p ->> 'city',
    p ->> 'equipment_type', p ->> 'brand', nullif(p ->> 'model', ''), p ->> 'issue',
    (p ->> 'delivery_method')::public.repair_delivery, coalesce((p ->> 'return_shipping')::boolean, false)
  );
  return query select v_id, v_number;
end;
$$;

-- ---------- Limitación de frecuencia ----------
-- Devuelve true si la petición está permitida.
create or replace function public.check_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count int;
begin
  insert into public.rate_limits as rl (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set count = rl.count + 1
  returning rl.count into v_count;

  -- Limpieza ocasional de ventanas antiguas.
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_limit;
end;
$$;

-- ---------- Búsqueda del catálogo (respeta RLS: SECURITY INVOKER) ----------
create or replace function public.search_products(
  p_query text default null,
  p_category text default null,
  p_brand text default null,
  p_sort text default 'newest',
  p_limit int default 12,
  p_offset int default 0
)
returns table (
  id uuid, slug text, sku text, name text, price_usd numeric,
  available int, low_stock_threshold int, has_warranty boolean, featured boolean, is_sample boolean,
  category_name text, category_slug text, brand_names text[],
  image_path text, image_alt text, created_at timestamptz, total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select nullif(public.normalize_text(trim(left(coalesce(p_query, ''), 80))), '') as term
  )
  select
    p.id, p.slug, p.sku, p.name, p.price_usd,
    greatest(p.stock - p.reserved, 0) as available,
    p.low_stock_threshold, p.has_warranty, p.featured, p.is_sample,
    c.name, c.slug,
    coalesce(array(
      select b.name from public.product_brands pb join public.brands b on b.id = pb.brand_id
      where pb.product_id = p.id order by b.name
    ), '{}'),
    img.path, img.alt,
    p.created_at,
    count(*) over () as total_count
  from public.products p
  join public.categories c on c.id = p.category_id
  cross join q
  left join lateral (
    select pi.path, pi.alt from public.product_images pi
    where pi.product_id = p.id order by pi.sort_order, pi.id limit 1
  ) img on true
  where p.active
    and (p_category is null or c.slug = p_category)
    and (p_brand is null or exists (
      select 1 from public.product_brands pb join public.brands b on b.id = pb.brand_id
      where pb.product_id = p.id and b.slug = p_brand
    ))
    and (
      q.term is null
      or strpos(public.normalize_text(p.name || ' ' || p.sku || ' ' || p.description || ' ' || p.compatibility), q.term) > 0
    )
  order by
    case when p_sort = 'price_asc' then p.price_usd end asc,
    case when p_sort = 'price_desc' then p.price_usd end desc,
    p.created_at desc,
    p.id
  limit least(greatest(coalesce(p_limit, 12), 1), 48)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- =====================================================================
-- Permisos de ejecución
-- =====================================================================
revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon, authenticated;

-- Usables por cualquiera (solo lectura / helpers de políticas RLS).
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.current_exchange_rate_id() to anon, authenticated;
grant execute on function public.normalize_text(text) to anon, authenticated;
grant execute on function public.search_products(text, text, text, text, int, int) to anon, authenticated;

-- Críticas: solo el servidor.
grant execute on function public.create_order(jsonb, jsonb) to service_role;
grant execute on function public.mark_order_paid(uuid, uuid) to service_role;
grant execute on function public.cancel_order(uuid, uuid) to service_role;
grant execute on function public.expire_orders() to service_role;
grant execute on function public.create_repair_request(jsonb) to service_role;
grant execute on function public.check_rate_limit(text, int, int) to service_role;
grant execute on function public.next_number(text, text) to service_role;

-- Las funciones nuevas no se podrán ejecutar públicamente por defecto.
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

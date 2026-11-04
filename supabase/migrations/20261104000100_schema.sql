-- =====================================================================
-- AVG Reparaciones · Esquema base
-- Tablas, tipos, restricciones e índices.
-- =====================================================================

-- ---------- Tipos ----------
create type public.order_status as enum (
  'pending_payment',   -- Pendiente de pago
  'link_sent',         -- Enlace enviado
  'paid',              -- Pagado
  'preparing',         -- En preparación
  'shipped',           -- Enviado
  'ready_for_pickup',  -- Listo para retirar
  'delivered',         -- Entregado
  'cancelled',         -- Cancelado
  'expired'            -- Cancelado (expirado)
);

-- Estado del stock asociado a un pedido.
create type public.order_stock_state as enum ('reserved', 'committed', 'released');

create type public.order_delivery as enum ('store_pickup', 'national_shipping');

create type public.repair_status as enum (
  'new', 'contacted', 'received', 'in_repair', 'ready', 'delivered', 'discarded'
);

create type public.repair_delivery as enum ('dropoff', 'pickup', 'courier');

-- ---------- Utilidades ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Minúsculas y sin tildes, para búsquedas.
create or replace function public.normalize_text(p text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select translate(lower(coalesce(p, '')), 'áàäâéèëêíìïîóòöôúùüûñç', 'aaaaeeeeiiiioooouuuunc');
$$;

-- ---------- Catálogo ----------
create table public.categories (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(name) between 1 and 80),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table public.brands (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(name) between 1 and 80),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at  timestamptz not null default now()
);

create table public.products (
  id                   uuid primary key default gen_random_uuid(),
  sku                  text not null unique check (char_length(sku) between 1 and 40),
  name                 text not null check (char_length(name) between 2 and 140),
  slug                 text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description          text not null default '' check (char_length(description) <= 4000),
  compatibility        text not null default '' check (char_length(compatibility) <= 1000),
  category_id          bigint not null references public.categories (id) on delete restrict,
  price_usd            numeric(10, 2) not null check (price_usd > 0),
  stock                int not null default 0 check (stock >= 0),
  reserved             int not null default 0 check (reserved >= 0),
  low_stock_threshold  int not null default 3 check (low_stock_threshold >= 0),
  has_warranty         boolean not null default false,
  featured             boolean not null default false,
  active               boolean not null default true,
  is_sample            boolean not null default false,   -- datos de ejemplo
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint products_reserved_le_stock check (reserved <= stock)
);
create index products_category_idx on public.products (category_id);
create index products_active_featured_idx on public.products (active, featured);
create index products_created_at_idx on public.products (created_at desc);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_brands (
  product_id  uuid not null references public.products (id) on delete cascade,
  brand_id    bigint not null references public.brands (id) on delete restrict,
  primary key (product_id, brand_id)
);
create index product_brands_brand_idx on public.product_brands (brand_id);

create table public.product_images (
  id          bigint generated always as identity primary key,
  product_id  uuid not null references public.products (id) on delete cascade,
  path        text not null check (char_length(path) between 1 and 300),
  alt         text not null default '' check (char_length(alt) <= 200),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

-- ---------- Tasa del día ----------
create table public.exchange_rates (
  id              bigint generated always as identity primary key,
  rate            numeric(14, 4) not null check (rate > 0),
  effective_date  date not null default (now() at time zone 'America/Caracas')::date,
  note            text check (char_length(note) <= 200),
  created_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);
create index exchange_rates_latest_idx on public.exchange_rates (effective_date desc, created_at desc);

-- ---------- Ajustes (fila única) ----------
create table public.settings (
  id                         smallint primary key default 1 check (id = 1),
  email                      text check (email is null or char_length(email) <= 254),
  phone_display              text not null default '+58 412-7408970',
  whatsapp_number            text not null default '584127408970' check (whatsapp_number ~ '^[0-9]{8,15}$'),
  address_street             text not null default 'Av. Este 12',
  address_between            text not null default 'entre El Hoyo y',
  address_second_street      text,
  instagram_url              text not null default 'https://www.instagram.com/avgreparaciones/',
  schedule                   jsonb not null default '{"0":null,"1":{"open":"08:00","close":"17:00"},"2":{"open":"08:00","close":"17:00"},"3":{"open":"08:00","close":"17:00"},"4":{"open":"08:00","close":"17:00"},"5":{"open":"08:00","close":"17:00"},"6":{"open":"08:00","close":"14:00"}}',
  warranty_duration          text check (char_length(warranty_duration) <= 80),
  pickup_cost_note           text check (char_length(pickup_cost_note) <= 200),
  return_shipping_cost_note  text check (char_length(return_shipping_cost_note) <= 200),
  order_expiration_hours     int not null default 48 check (order_expiration_hours between 1 and 720),
  payment_methods            text[] not null default array['Pago Móvil'],
  show_testimonials          boolean not null default false,
  updated_by                 uuid references auth.users (id) on delete set null,
  updated_at                 timestamptz not null default now()
);
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();
insert into public.settings (id) values (1);

-- ---------- Pedidos ----------
create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique,
  public_token      text not null unique check (char_length(public_token) >= 48),
  customer_name     text not null check (char_length(customer_name) between 2 and 100),
  customer_id_doc   text not null check (char_length(customer_id_doc) between 5 and 15),
  customer_phone    text not null check (customer_phone ~ '^\+58[0-9]{10}$'),
  customer_email    text not null check (char_length(customer_email) between 3 and 254),
  delivery_method   public.order_delivery not null,
  shipping_state    text check (char_length(shipping_state) <= 40),
  shipping_city     text check (char_length(shipping_city) <= 80),
  shipping_address  text check (char_length(shipping_address) <= 300),
  shipping_agency   text check (char_length(shipping_agency) <= 80),
  notes             text check (char_length(notes) <= 1000),
  admin_notes       text check (char_length(admin_notes) <= 2000),
  status            public.order_status not null default 'pending_payment',
  stock_state       public.order_stock_state not null default 'reserved',
  subtotal_usd      numeric(10, 2) not null check (subtotal_usd > 0),
  exchange_rate     numeric(14, 4) not null check (exchange_rate > 0),
  total_bs          numeric(16, 2) not null check (total_bs > 0),
  payment_link      text check (payment_link is null or (payment_link ~ '^https://' and char_length(payment_link) <= 2000)),
  expires_at        timestamptz not null,
  paid_at           timestamptz,
  cancelled_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint orders_shipping_complete check (
    delivery_method = 'store_pickup'
    or (shipping_state is not null and shipping_city is not null and shipping_address is not null)
  )
);
create index orders_status_idx on public.orders (status, expires_at);
create index orders_created_at_idx on public.orders (created_at desc);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id                  bigint generated always as identity primary key,
  order_id            uuid not null references public.orders (id) on delete cascade,
  product_id          uuid not null references public.products (id) on delete restrict,
  name_snapshot       text not null,
  sku_snapshot        text not null,
  price_usd_snapshot  numeric(10, 2) not null check (price_usd_snapshot > 0),
  quantity            int not null check (quantity between 1 and 99)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.order_status_history (
  id           bigint generated always as identity primary key,
  order_id     uuid not null references public.orders (id) on delete cascade,
  from_status  public.order_status,
  to_status    public.order_status not null,
  changed_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

-- ---------- Solicitudes de reparación ----------
create table public.repair_requests (
  id               uuid primary key default gen_random_uuid(),
  request_number   text not null unique,
  customer_name    text not null check (char_length(customer_name) between 2 and 100),
  customer_phone   text not null check (customer_phone ~ '^\+58[0-9]{10}$'),
  customer_email   text check (customer_email is null or char_length(customer_email) <= 254),
  state            text not null check (char_length(state) <= 40),
  city             text not null check (char_length(city) between 2 and 80),
  equipment_type   text not null check (char_length(equipment_type) <= 60),
  brand            text not null check (char_length(brand) between 1 and 60),
  model            text check (char_length(model) <= 80),
  issue            text not null check (char_length(issue) between 10 and 1500),
  delivery_method  public.repair_delivery not null,
  return_shipping  boolean not null default false,
  status           public.repair_status not null default 'new',
  admin_notes      text check (char_length(admin_notes) <= 2000),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index repair_requests_status_idx on public.repair_requests (status, created_at desc);
create index repair_requests_created_at_idx on public.repair_requests (created_at desc);
create trigger repair_requests_updated_at before update on public.repair_requests
  for each row execute function public.set_updated_at();

create table public.repair_request_photos (
  id          bigint generated always as identity primary key,
  request_id  uuid not null references public.repair_requests (id) on delete cascade,
  path        text not null check (char_length(path) between 1 and 300),
  created_at  timestamptz not null default now()
);
create index repair_request_photos_request_idx on public.repair_request_photos (request_id);

-- ---------- Mensajes de contacto ----------
create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 100),
  phone       text not null check (phone ~ '^\+58[0-9]{10}$'),
  email       text check (email is null or char_length(email) <= 254),
  topic       text not null check (char_length(topic) <= 60),
  message     text not null check (char_length(message) between 10 and 2000),
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index contact_messages_created_at_idx on public.contact_messages (created_at desc);

-- ---------- Administración ----------
create table public.admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'staff' check (role in ('owner', 'staff')),
  created_at  timestamptz not null default now()
);

create table public.audit_log (
  id          bigint generated always as identity primary key,
  admin_id    uuid references auth.users (id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  before      jsonb,
  after       jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity, entity_id, created_at desc);
create index audit_log_created_at_idx on public.audit_log (created_at desc);

-- ---------- Infraestructura ----------
-- Numeración correlativa por año (AVG-2026-0001, REP-2026-0001).
create table public.counters (
  scope  text not null,
  year   int not null,
  value  int not null default 0,
  primary key (scope, year)
);

-- Limitación de frecuencia (ventanas fijas).
create table public.rate_limits (
  key           text not null,
  window_start  timestamptz not null,
  count         int not null default 0,
  primary key (key, window_start)
);
create index rate_limits_window_idx on public.rate_limits (window_start);

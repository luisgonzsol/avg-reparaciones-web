-- =====================================================================
-- AVG Reparaciones · Datos de EJEMPLO
-- Productos, precios y stock FICTICIOS (is_sample = true, SKU "EJ-…").
-- Sustitúyelos por el inventario real desde el panel (Fase 4) o por CSV.
-- Se puede ejecutar varias veces (no duplica).
-- =====================================================================

insert into public.categories (name, slug, sort_order) values
  ('Ventiladores', 'ventiladores', 10),
  ('Licuadoras', 'licuadoras', 20),
  ('Lavadoras', 'lavadoras', 30),
  ('Ollas de presión', 'ollas-de-presion', 40),
  ('Capacitores', 'capacitores', 50),
  ('Motores', 'motores', 60),
  ('Embobinado y cobre', 'embobinado-y-cobre', 70),
  ('Otros repuestos', 'otros-repuestos', 80)
on conflict (slug) do nothing;

insert into public.brands (name, slug) values
  ('Samsung', 'samsung'), ('Electrolux', 'electrolux'), ('Frigilux', 'frigilux'),
  ('Taurus', 'taurus'), ('Oster', 'oster'), ('GE', 'ge'), ('Mabe', 'mabe'),
  ('Haier', 'haier'), ('Daewoo', 'daewoo'), ('Whirlpool', 'whirlpool'), ('KitchenAid', 'kitchenaid')
on conflict (slug) do nothing;

-- Tasa de EJEMPLO (el administrador la actualizará cada día).
insert into public.exchange_rates (rate, note)
select 236.45, 'EJEMPLO: tasa ficticia'
where not exists (select 1 from public.exchange_rates);

with data (sku, name, slug, category, brands, price, stock, threshold, warranty, featured, description, compatibility) as (
  values
  ('EJ-0001', 'Vaso de vidrio para licuadora Oster', 'vaso-vidrio-licuadora-oster', 'licuadoras', array['oster'], 14.50, 8, 3, false, true,
   'Vaso de vidrio de repuesto con tapa. Producto de demostración.', 'Licuadoras Oster de vaso clásico.'),
  ('EJ-0002', 'Cuchilla para licuadora Oster', 'cuchilla-licuadora-oster', 'licuadoras', array['oster'], 6.00, 2, 3, false, true,
   'Cuchilla de acero inoxidable de 4 aspas. Producto de demostración.', 'Licuadoras Oster.'),
  ('EJ-0003', 'Acople de goma para licuadora', 'acople-goma-licuadora', 'licuadoras', array['oster', 'taurus'], 2.50, 25, 5, false, false,
   'Acople (dentado) de goma entre motor y cuchilla. Producto de demostración.', 'Varios modelos Oster y Taurus.'),
  ('EJ-0004', 'Sello de goma para vaso de licuadora', 'sello-goma-vaso-licuadora', 'licuadoras', array['oster'], 1.50, 40, 5, false, false,
   'Empaque de goma para la base del vaso. Producto de demostración.', 'Licuadoras Oster.'),
  ('EJ-0005', 'Aspa para ventilador de 18 pulgadas', 'aspa-ventilador-18', 'ventiladores', array['taurus', 'frigilux'], 5.25, 15, 4, false, true,
   'Aspa de 3 hojas para ventilador de pedestal. Producto de demostración.', 'Ventiladores de 18" Taurus y Frigilux.'),
  ('EJ-0006', 'Aspa para ventilador de 16 pulgadas', 'aspa-ventilador-16', 'ventiladores', array['taurus', 'samsung'], 4.75, 3, 4, false, false,
   'Aspa de 5 hojas para ventilador de mesa. Producto de demostración.', 'Ventiladores de 16".'),
  ('EJ-0007', 'Rejilla delantera para ventilador', 'rejilla-ventilador', 'ventiladores', array['frigilux'], 6.50, 6, 2, false, false,
   'Rejilla metálica con logo central. Producto de demostración.', 'Ventiladores de 16" y 18".'),
  ('EJ-0008', 'Capacitor de ventilador 1,5 µF', 'capacitor-ventilador-1-5uf', 'capacitores', array[]::text[], 2.00, 50, 10, false, false,
   'Capacitor de arranque para motor de ventilador. Producto de demostración.', 'Ventiladores de pedestal y techo.'),
  ('EJ-0009', 'Capacitor de lavadora 12 µF', 'capacitor-lavadora-12uf', 'capacitores', array['whirlpool', 'mabe'], 4.50, 12, 4, false, true,
   'Capacitor de marcha para motor de lavadora. Producto de demostración.', 'Lavadoras semiautomáticas.'),
  ('EJ-0010', 'Capacitor de arranque 35 µF', 'capacitor-arranque-35uf', 'capacitores', array[]::text[], 5.00, 0, 3, false, false,
   'Capacitor para motores monofásicos. Producto de demostración.', 'Motores monofásicos de uso general.'),
  ('EJ-0011', 'Goma para olla de presión 22 cm', 'goma-olla-presion-22', 'ollas-de-presion', array['oster', 'taurus'], 3.50, 0, 5, false, true,
   'Empaque de silicona para tapa. Producto de demostración.', 'Ollas de presión de 22 cm de diámetro.'),
  ('EJ-0012', 'Válvula de seguridad para olla de presión', 'valvula-olla-presion', 'ollas-de-presion', array['taurus'], 4.00, 9, 3, false, false,
   'Válvula de alivio de presión. Producto de demostración.', 'Ollas Taurus.'),
  ('EJ-0013', 'Motor para ventilador de pedestal', 'motor-ventilador-pedestal', 'motores', array['taurus', 'frigilux'], 28.00, 4, 2, false, false,
   'Motor de 4 velocidades. Producto de demostración.', 'Ventiladores de pedestal de 18".'),
  ('EJ-0014', 'Motor de centrifugado para lavadora', 'motor-centrifugado-lavadora', 'lavadoras', array['whirlpool', 'daewoo'], 45.00, 2, 2, false, true,
   'Motor de centrifugado para lavadora semiautomática. Producto de demostración.', 'Lavadoras semiautomáticas Whirlpool y Daewoo.'),
  ('EJ-0015', 'Bomba de desagüe para lavadora', 'bomba-desague-lavadora', 'lavadoras', array['samsung', 'electrolux', 'mabe'], 18.00, 7, 3, false, false,
   'Bomba de drenaje universal. Producto de demostración.', 'Lavadoras automáticas Samsung, Electrolux y Mabe.'),
  ('EJ-0016', 'Correa para lavadora', 'correa-lavadora', 'lavadoras', array['whirlpool', 'ge'], 7.50, 10, 3, false, false,
   'Correa de transmisión. Producto de demostración.', 'Lavadoras Whirlpool y GE.'),
  ('EJ-0017', 'Carbones para motor universal (par)', 'carbones-motor-universal', 'motores', array['oster', 'kitchenaid'], 3.00, 30, 6, false, false,
   'Par de escobillas de carbón. Producto de demostración.', 'Licuadoras y batidoras con motor universal.'),
  ('EJ-0018', 'Alambre de cobre esmaltado 0,5 mm (250 g)', 'alambre-cobre-0-5mm', 'embobinado-y-cobre', array[]::text[], 9.00, 14, 4, false, false,
   'Alambre de cobre esmaltado para embobinado. Producto de demostración.', 'Embobinado de motores pequeños.'),
  ('EJ-0019', 'Alambre de cobre esmaltado 0,8 mm (500 g)', 'alambre-cobre-0-8mm', 'embobinado-y-cobre', array[]::text[], 16.00, 5, 3, false, false,
   'Alambre de cobre esmaltado para embobinado. Producto de demostración.', 'Embobinado de motores de lavadora y ventilador.'),
  ('EJ-0020', 'Engranaje para batidora KitchenAid', 'engranaje-batidora-kitchenaid', 'otros-repuestos', array['kitchenaid'], 12.00, 6, 2, false, false,
   'Engranaje de repuesto. Producto de demostración.', 'Batidoras de pedestal KitchenAid.')
)
insert into public.products (sku, name, slug, category_id, price_usd, stock, low_stock_threshold, has_warranty, featured, is_sample, description, compatibility)
select d.sku, d.name, d.slug, c.id, d.price, d.stock, d.threshold, d.warranty, d.featured, true,
       '[EJEMPLO] ' || d.description, d.compatibility
from data d join public.categories c on c.slug = d.category
on conflict (sku) do nothing;

-- Marcas compatibles de cada producto de ejemplo.
with data (sku, brands) as (
  values
  ('EJ-0001', array['oster']), ('EJ-0002', array['oster']), ('EJ-0003', array['oster', 'taurus']),
  ('EJ-0004', array['oster']), ('EJ-0005', array['taurus', 'frigilux']), ('EJ-0006', array['taurus', 'samsung']),
  ('EJ-0007', array['frigilux']), ('EJ-0009', array['whirlpool', 'mabe']), ('EJ-0011', array['oster', 'taurus']),
  ('EJ-0012', array['taurus']), ('EJ-0013', array['taurus', 'frigilux']), ('EJ-0014', array['whirlpool', 'daewoo']),
  ('EJ-0015', array['samsung', 'electrolux', 'mabe']), ('EJ-0016', array['whirlpool', 'ge']),
  ('EJ-0017', array['oster', 'kitchenaid']), ('EJ-0020', array['kitchenaid'])
)
insert into public.product_brands (product_id, brand_id)
select p.id, b.id
from data d
cross join lateral unnest(d.brands) as bs(slug)
join public.products p on p.sku = d.sku
join public.brands b on b.slug = bs.slug
on conflict do nothing;

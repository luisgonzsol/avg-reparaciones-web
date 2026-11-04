-- =====================================================================
-- AVG Reparaciones · Tareas programadas (solo Supabase)
-- Cada 15 minutos marca como "expirado" los pedidos sin pagar cuyo plazo
-- venció y libera el stock reservado.
-- =====================================================================
create extension if not exists pg_cron;

select cron.schedule(
  'expire-unpaid-orders',
  '*/15 * * * *',
  $$ select public.expire_orders(); $$
);

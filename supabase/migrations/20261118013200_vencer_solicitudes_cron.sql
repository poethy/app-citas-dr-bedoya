-- =====================================================================
-- App Citas Dr. Camilo Bedoya · Migración 9: vencimiento automático (pg_cron)
-- Cada minuto, las solicitudes pendientes cuya hora de inicio ya llegó pasan a
-- vencida (migración 8). Las RPC también lo tienen en cuenta entre corridas.
-- =====================================================================

create extension if not exists pg_cron;

select cron.schedule('vencer-solicitudes', '* * * * *', $$ select public.vencer_solicitudes(); $$);

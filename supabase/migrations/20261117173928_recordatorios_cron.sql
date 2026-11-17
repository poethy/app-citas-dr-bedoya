-- =====================================================================
-- App Citas Dr. Camilo Bedoya · Migración 4: tareas programadas (pg_cron)
-- RF-16: recordatorios cada 15 minutos.
-- RF-17: resumen del día a las 8:00 a. m. de Bogotá (13:00 UTC).
-- En Supabase, pg_cron se activa en Database → Extensions, o con esta línea.
-- =====================================================================

create extension if not exists pg_cron;

select cron.schedule('recordatorios-citas', '*/15 * * * *', $$ select public.generar_recordatorios(); $$);
select cron.schedule('resumen-diario',      '0 13 * * *',   $$ select public.generar_resumen_diario(); $$);

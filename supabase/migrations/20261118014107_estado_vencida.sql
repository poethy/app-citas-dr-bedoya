-- =====================================================================
-- App Citas Dr. Camilo Bedoya · Migración 7: estado «vencida»
-- Una solicitud pendiente que llega a su hora de inicio sin respuesta pasa a
-- vencida (especificación, F2 y B4). Va sola en este archivo porque Postgres
-- no deja usar un valor nuevo de un enum en la misma transacción que lo crea.
-- =====================================================================

alter type public.estado_cita add value if not exists 'vencida';

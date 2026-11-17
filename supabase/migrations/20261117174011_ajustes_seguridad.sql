-- =====================================================================
-- App Citas Dr. Camilo Bedoya · Migración 5: ajustes del asesor de seguridad de Supabase
-- 1. search_path fijo en las funciones auxiliares (lint 0011).
-- 2. Las funciones de trigger no se pueden llamar por la API (lint 0029).
--    Las RPC de la app sí quedan expuestas a propósito: validan el rol por dentro.
-- =====================================================================

alter function public.zona_consultorio()                set search_path = public;
alter function public.solo_digitos(text)                set search_path = public;
alter function public.lanzar(text, text)                set search_path = public;
alter function public.hora_es(timestamptz)              set search_path = public;
alter function public.fecha_corta_es(timestamptz)       set search_path = public;

revoke execute on function public.trg_citas_validar()      from authenticated, anon, public;
revoke execute on function public.trg_bloqueos_validar()   from authenticated, anon, public;
revoke execute on function public.trg_citas_avisar()       from authenticated, anon, public;
revoke execute on function public.trg_nuevo_usuario()      from authenticated, anon, public;
revoke execute on function public.trg_perfil_sincronizar() from authenticated, anon, public;

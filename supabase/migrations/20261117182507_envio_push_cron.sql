-- =====================================================================
-- App Citas Dr. Camilo Bedoya · Migración 6: envío de notificaciones push
-- RF-11, RF-13, RF-16, RF-17. La base crea las notificaciones (migración 2);
-- la Edge Function `enviar-notificaciones` las manda a los teléfonos por Expo Push.
--
-- Requiere dos secretos en Supabase Vault (ver supabase/README.md, «Notificaciones push»):
--   project_url        → URL del proyecto
--   secreto_cron_push  → texto aleatorio que solo conocen la base y la función
-- No se guardan en el repo.
-- =====================================================================

create extension if not exists pg_net with schema extensions;

-- La Edge Function la llama con service_role para comprobar el encabezado x-secreto-cron
create or replace function public.validar_secreto_cron(p_secreto text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'secreto_cron_push' and decrypted_secret = p_secreto and p_secreto <> ''
  );
$$;
revoke execute on function public.validar_secreto_cron(text) from public, anon, authenticated;
grant  execute on function public.validar_secreto_cron(text) to service_role;

-- Cada minuto, solo si hay notificaciones sin enviar, invoca la Edge Function
select cron.schedule('enviar-push', '* * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/enviar-notificaciones',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-secreto-cron', (select decrypted_secret from vault.decrypted_secrets where name = 'secreto_cron_push')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  )
  where exists (select 1 from public.notificaciones where not enviada_push);
$$);

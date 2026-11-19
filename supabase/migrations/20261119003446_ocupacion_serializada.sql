-- =====================================================================
-- App Citas Dr. Camilo Bedoya · Migración 11: ocupación serializada por fecha (B3)
--
-- La restricción de exclusión impide dos citas cruzadas, pero no una cita y un
-- bloqueo creados al mismo tiempo: cada uno revisa la tabla del otro antes de
-- que el otro confirme. Ahora toda escritura que ocupa tiempo toma primero un
-- candado de transacción por fecha del consultorio, así que la segunda espera a
-- la primera y luego ve su fila.
--
-- - validar_franja (citas: solicitar, registrar, reprogramar) y el trigger de
--   bloqueos toman el candado de la fecha antes de revisar.
-- - validar_franja pasa de STABLE a VOLATILE: una función STABLE usa la foto de
--   la base del inicio de la sentencia y no vería la fila que el otro acaba de
--   confirmar mientras esperaba el candado.
-- =====================================================================

-- Candado de transacción para una fecha de Bogotá. Se libera solo al terminar la transacción.
create or replace function public.bloquear_ocupacion(p_instante timestamptz)
returns void language sql volatile security definer set search_path = public as $$
  select pg_advisory_xact_lock(
    hashtext('ocupacion_consultorio'),
    ((p_instante at time zone zona_consultorio())::date - date '2000-01-01')
  );
$$;

revoke execute on function public.bloquear_ocupacion(timestamptz) from authenticated, anon, public;

-- Igual que en la migración 2, más el candado y VOLATILE
create or replace function public.validar_franja(p_inicio timestamptz, p_fin timestamptz, p_ignorar_cita uuid default null)
returns void language plpgsql volatile security definer set search_path = public as $$
declare
  v_ini_local timestamp := p_inicio at time zone zona_consultorio();
  v_fin_local timestamp := p_fin    at time zone zona_consultorio();
  v_dia       smallint  := extract(dow from v_ini_local);
  v_horario   horario_atencion;
begin
  perform bloquear_ocupacion(p_inicio);

  if v_ini_local::date <> (v_fin_local - interval '1 microsecond')::date then
    perform lanzar('FUERA_DE_HORARIO', 'La cita no puede pasar de un día a otro');
  end if;

  select * into v_horario from horario_atencion where dia_semana = v_dia;
  if not found or v_ini_local::time < v_horario.hora_inicio or v_fin_local::time > v_horario.hora_fin
     or v_fin_local::time = '00:00' then
    perform lanzar('FUERA_DE_HORARIO');
  end if;

  if exists (select 1 from bloqueos_recurrentes b
             where b.dia_semana = v_dia
               and v_ini_local::time < b.hora_fin and v_fin_local::time > b.hora_inicio) then
    perform lanzar('HORARIO_NO_DISPONIBLE', 'Choca con un bloqueo recurrente');
  end if;

  if exists (select 1 from bloqueos b where b.rango && tstzrange(p_inicio, p_fin)) then
    perform lanzar('HORARIO_NO_DISPONIBLE', 'Choca con un bloqueo');
  end if;

  if exists (select 1 from citas c
             where c.estado in ('pendiente', 'confirmada')
               and c.id is distinct from p_ignorar_cita
               and tstzrange(c.inicio, c.fin) && tstzrange(p_inicio, p_fin)) then
    perform lanzar('HORARIO_NO_DISPONIBLE');
  end if;
end $$;

-- RF-19, escenario 2: igual que en la migración 2, más el candado de la fecha
create or replace function public.trg_bloqueos_validar()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform bloquear_ocupacion(lower(new.rango));
  if exists (select 1 from citas c
             where c.estado in ('pendiente', 'confirmada')
               and tstzrange(c.inicio, c.fin) && new.rango) then
    perform lanzar('CHOQUE_CON_CITA');
  end if;
  return new;
end $$;

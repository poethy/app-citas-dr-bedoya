-- =====================================================================
-- App Citas Dr. Camilo Bedoya · Migración 8: precio y duración acordados, y vencimiento
-- Ver docs/especificaciones-tecnicas.md, F2, B4 y B5.
--
-- 1. Cada cita guarda el precio y la duración del servicio al crearla. Editar el
--    catálogo afecta solo a las citas nuevas; reprogramar conserva esos valores.
-- 2. Una solicitud pendiente pasa a «vencida» al llegar su hora de inicio. Deja
--    de ocupar la franja, no se puede aprobar y el paciente recibe un aviso.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Precio y duración acordados
-- ---------------------------------------------------------------------

alter table public.citas
  add column precio_acordado_cop   int,
  add column duracion_acordada_min int;

-- Las citas que ya existen toman los valores actuales de su servicio
update public.citas c
set precio_acordado_cop   = s.precio_cop,
    duracion_acordada_min = round(extract(epoch from (c.fin - c.inicio)) / 60)::int
from public.servicios s
where s.id = c.servicio_id;

alter table public.citas
  alter column precio_acordado_cop   set not null,
  alter column duracion_acordada_min set not null,
  add constraint citas_precio_acordado_valido   check (precio_acordado_cop >= 0),
  add constraint citas_duracion_acordada_valida check (duracion_acordada_min > 0);

-- ---------------------------------------------------------------------
-- 2. Avisos: nuevo tipo «vencida»
-- ---------------------------------------------------------------------

alter table public.notificaciones drop constraint notificaciones_tipo_check;
alter table public.notificaciones add constraint notificaciones_tipo_check
  check (tipo in ('confirmada', 'rechazada', 'cancelada', 'reprogramada', 'vencida',
                  'solicitud_nueva', 'cita_registrada', 'recordatorio', 'resumen_dia'));

-- Igual que en la migración 2, más el aviso de solicitud vencida
create or replace function public.trg_citas_avisar()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_txt      text := texto_cita(new);
  v_paciente text;
  v_es_dueno boolean;
begin
  select nombre, perfil_id = auth.uid() into v_paciente, v_es_dueno from pacientes where id = new.paciente_id;

  if tg_op = 'INSERT' then
    if new.estado = 'pendiente' then
      perform avisar_odontologos(new, 'solicitud_nueva', 'Nueva solicitud de cita', v_paciente || ' · ' || v_txt);
    elsif new.origen = 'consultorio' then
      perform avisar_paciente(new, 'cita_registrada', 'El consultorio te agendó una cita', v_txt);
    end if;
    return new;
  end if;

  -- RF-14: un cambio de horario se avisa a la otra parte (si queda pendiente, el odontólogo debe aprobarla)
  if new.inicio <> old.inicio then
    if coalesce(v_es_dueno, false) then
      perform avisar_odontologos(new, 'reprogramada',
        case when new.estado = 'pendiente' then 'Cita reprogramada: requiere aprobación' else 'Un paciente reprogramó su cita' end,
        v_paciente || ' · ' || v_txt);
    else
      perform avisar_paciente(new, 'reprogramada', 'Tu cita fue reprogramada', v_txt);
    end if;
  elsif new.estado <> old.estado then
    if new.estado = 'confirmada' and old.estado = 'pendiente' then
      perform avisar_paciente(new, 'confirmada', 'Tu cita fue confirmada', v_txt);                       -- RF-11
    elsif new.estado = 'rechazada' then
      perform avisar_paciente(new, 'rechazada', 'Solicitud rechazada', v_txt);                            -- RF-11
    elsif new.estado = 'vencida' then
      -- La transición pendiente → vencida ocurre una sola vez, así que el aviso también
      perform avisar_paciente(new, 'vencida', 'Tu solicitud venció sin respuesta', v_txt);
    elsif new.estado = 'cancelada' and coalesce(v_es_dueno, false) then
      perform avisar_odontologos(new, 'cancelada', 'Un paciente canceló su cita', v_paciente || ' · ' || v_txt); -- RF-13
    elsif new.estado = 'cancelada' then
      perform avisar_paciente(new, 'cancelada', 'Tu cita fue cancelada', v_txt);                          -- RF-11
    end if;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 3. Vencimiento
-- ---------------------------------------------------------------------

-- Pendientes cuya hora de inicio ya llegó pasan a vencida. Es idempotente: la
-- segunda corrida no encuentra nada. La ejecuta pg_cron cada minuto (migración 9).
create or replace function public.vencer_solicitudes()
returns int language plpgsql security definer set search_path = public as $$
declare
  v_total int;
begin
  update citas set estado = 'vencida'
  where estado = 'pendiente' and inicio <= now();
  get diagnostics v_total = row_count;
  return v_total;
end $$;

revoke execute on function public.vencer_solicitudes() from authenticated, anon, public;

-- ---------------------------------------------------------------------
-- 4. RPC que cambian
-- ---------------------------------------------------------------------

-- Disponibilidad: una pendiente cuya hora ya llegó no ocupa la franja aunque el
-- cron todavía no la haya marcado como vencida.
create or replace function public.disponibilidad_dia(p_fecha date)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_dia     smallint := extract(dow from p_fecha);
  v_horario horario_atencion;
  v_desde   timestamptz;
  v_hasta   timestamptz;
  v_cfg     configuracion;
begin
  if auth.uid() is null then perform lanzar('NO_AUTORIZADO'); end if;
  select * into v_cfg from configuracion where id = 1;
  select * into v_horario from horario_atencion where dia_semana = v_dia;
  if not found then
    return jsonb_build_object('fecha', p_fecha, 'abierto', false, 'ocupados', '[]'::jsonb,
                              'anticipacion_agendar_horas', v_cfg.anticipacion_agendar_horas);
  end if;

  v_desde := (p_fecha + v_horario.hora_inicio) at time zone zona_consultorio();
  v_hasta := (p_fecha + v_horario.hora_fin)    at time zone zona_consultorio();

  return jsonb_build_object(
    'fecha', p_fecha,
    'abierto', true,
    'apertura', v_desde,
    'cierre', v_hasta,
    'anticipacion_agendar_horas', v_cfg.anticipacion_agendar_horas,
    'ocupados', coalesce((
      select jsonb_agg(jsonb_build_object('inicio', o.inicio, 'fin', o.fin, 'tipo', o.tipo) order by o.inicio)
      from (
        select c.inicio, c.fin, 'cita' as tipo from citas c
        where (c.estado = 'confirmada' or (c.estado = 'pendiente' and c.inicio > now()))
          and tstzrange(c.inicio, c.fin) && tstzrange(v_desde, v_hasta)
        union all
        select greatest(lower(b.rango), v_desde), least(upper(b.rango), v_hasta), 'bloqueo' from bloqueos b
        where b.rango && tstzrange(v_desde, v_hasta)
        union all
        select (p_fecha + r.hora_inicio) at time zone zona_consultorio(),
               (p_fecha + r.hora_fin)    at time zone zona_consultorio(), 'bloqueo'
        from bloqueos_recurrentes r where r.dia_semana = v_dia
      ) o
    ), '[]'::jsonb)
  );
end $$;

-- Solicitar: copia precio y duración del servicio
create or replace function public.solicitar_cita(p_servicio_id uuid, p_inicio timestamptz)
returns public.citas language plpgsql security definer set search_path = public as $$
declare
  v_paciente uuid := paciente_actual_id();
  v_servicio servicios;
  v_cfg      configuracion;
  v_cita     citas;
begin
  if v_paciente is null then perform lanzar('NO_AUTORIZADO'); end if;
  select * into v_servicio from servicios where id = p_servicio_id and activo;
  if not found then perform lanzar('SERVICIO_NO_EXISTE'); end if;
  select * into v_cfg from configuracion where id = 1;

  if p_inicio < now() + make_interval(hours => v_cfg.anticipacion_agendar_horas) then
    perform lanzar('FUERA_DE_ANTICIPACION', v_cfg.anticipacion_agendar_horas::text);
  end if;

  begin
    insert into citas (paciente_id, servicio_id, inicio, fin, estado, origen, creado_por,
                       precio_acordado_cop, duracion_acordada_min)
    values (v_paciente, v_servicio.id, p_inicio, p_inicio + make_interval(mins => v_servicio.duracion_min),
            case v_servicio.confirmacion when 'inmediata' then 'confirmada'::estado_cita else 'pendiente'::estado_cita end,
            'app', auth.uid(), v_servicio.precio_cop, v_servicio.duracion_min)
    returning * into v_cita;
  exception when exclusion_violation then
    perform lanzar('HORARIO_NO_DISPONIBLE');
  end;
  return v_cita;
end $$;

-- Registrar desde el consultorio: copia precio y duración del servicio
create or replace function public.registrar_cita_consultorio(p_nombre text, p_telefono text, p_servicio_id uuid, p_inicio timestamptz)
returns public.citas language plpgsql security definer set search_path = public as $$
declare
  v_tel      text := solo_digitos(p_telefono);
  v_paciente uuid;
  v_servicio servicios;
  v_cita     citas;
begin
  if not es_odontologo() then perform lanzar('NO_AUTORIZADO'); end if;
  if coalesce(trim(p_nombre), '') = '' then perform lanzar('NOMBRE_REQUERIDO'); end if;
  if v_tel !~ '^3\d{9}$' then perform lanzar('TELEFONO_INVALIDO'); end if;
  select * into v_servicio from servicios where id = p_servicio_id and activo;
  if not found then perform lanzar('SERVICIO_NO_EXISTE'); end if;

  select id into v_paciente from pacientes where solo_digitos(telefono) = v_tel order by creado_en limit 1;
  if v_paciente is null then
    insert into pacientes (nombre, telefono) values (trim(p_nombre), v_tel) returning id into v_paciente;
  end if;

  begin
    insert into citas (paciente_id, servicio_id, inicio, fin, estado, origen, creado_por,
                       precio_acordado_cop, duracion_acordada_min)
    values (v_paciente, v_servicio.id, p_inicio, p_inicio + make_interval(mins => v_servicio.duracion_min),
            'confirmada', 'consultorio', auth.uid(), v_servicio.precio_cop, v_servicio.duracion_min)
    returning * into v_cita;
  exception when exclusion_violation then
    perform lanzar('HORARIO_NO_DISPONIBLE');
  end;
  return v_cita;
end $$;

-- Cancelar: solo una pendiente que no ha vencido o una confirmada que no ha empezado
create or replace function public.cancelar_cita(p_cita_id uuid)
returns public.citas language plpgsql security definer set search_path = public as $$
declare
  v_cita citas;
  v_cfg  configuracion;
  v_odo  boolean := es_odontologo();
begin
  select * into v_cita from citas where id = p_cita_id for update;
  if not found or not (v_odo or v_cita.paciente_id = paciente_actual_id()) then perform lanzar('CITA_NO_EXISTE'); end if;
  if v_cita.estado not in ('pendiente', 'confirmada') or v_cita.inicio <= now() then perform lanzar('ESTADO_INVALIDO'); end if;

  if not v_odo then
    select * into v_cfg from configuracion where id = 1;
    if v_cita.inicio < now() + make_interval(hours => v_cfg.anticipacion_cambios_horas) then
      perform lanzar('FUERA_DE_PLAZO', v_cfg.anticipacion_cambios_horas::text);
    end if;
  end if;

  update citas set estado = 'cancelada' where id = p_cita_id returning * into v_cita;
  return v_cita;
end $$;

-- Reprogramar: conserva la duración acordada (el nuevo fin no depende del catálogo)
create or replace function public.reprogramar_cita(p_cita_id uuid, p_nuevo_inicio timestamptz)
returns public.citas language plpgsql security definer set search_path = public as $$
declare
  v_cita     citas;
  v_servicio servicios;
  v_cfg      configuracion;
  v_odo      boolean := es_odontologo();
begin
  select * into v_cita from citas where id = p_cita_id for update;
  if not found or not (v_odo or v_cita.paciente_id = paciente_actual_id()) then perform lanzar('CITA_NO_EXISTE'); end if;
  if v_cita.estado not in ('pendiente', 'confirmada') or v_cita.inicio <= now() then perform lanzar('ESTADO_INVALIDO'); end if;
  select * into v_servicio from servicios where id = v_cita.servicio_id;
  select * into v_cfg from configuracion where id = 1;

  if not v_odo then
    if v_cita.inicio < now() + make_interval(hours => v_cfg.anticipacion_cambios_horas) then
      perform lanzar('FUERA_DE_PLAZO', v_cfg.anticipacion_cambios_horas::text);
    end if;
    if p_nuevo_inicio < now() + make_interval(hours => v_cfg.anticipacion_agendar_horas) then
      perform lanzar('FUERA_DE_ANTICIPACION', v_cfg.anticipacion_agendar_horas::text);
    end if;
  end if;

  begin
    update citas set
      inicio = p_nuevo_inicio,
      fin    = p_nuevo_inicio + make_interval(mins => v_cita.duracion_acordada_min),
      estado = case when v_odo or v_servicio.confirmacion = 'inmediata' then 'confirmada'::estado_cita
                    else 'pendiente'::estado_cita end,
      -- si vuelve a quedar pendiente, sale de «Aprobadas» (O04) hasta que el odontólogo responda otra vez
      respondida_en = case when v_odo or v_servicio.confirmacion = 'inmediata' then respondida_en end,
      recordatorio_enviado_para = null
    where id = p_cita_id
    returning * into v_cita;
  exception when exclusion_violation then
    perform lanzar('HORARIO_NO_DISPONIBLE');
  end;
  return v_cita;
end $$;

-- Responder: si la solicitud ya llegó a su hora, se guarda como vencida y se devuelve
-- así, sin lanzar error, para que el cambio no se deshaga (B4). La app ve
-- estado = 'vencida' y muestra el mensaje de SOLICITUD_VENCIDA.
create or replace function public.responder_solicitud(p_cita_id uuid, p_aprobar boolean)
returns public.citas language plpgsql security definer set search_path = public as $$
declare
  v_cita citas;
begin
  if not es_odontologo() then perform lanzar('NO_AUTORIZADO'); end if;
  select * into v_cita from citas where id = p_cita_id for update;
  if not found then perform lanzar('CITA_NO_EXISTE'); end if;
  if v_cita.estado = 'pendiente' and v_cita.inicio <= now() then
    update citas set estado = 'vencida' where id = p_cita_id returning * into v_cita;
    return v_cita;
  end if;
  if v_cita.estado <> 'pendiente' then perform lanzar('ESTADO_INVALIDO'); end if;
  update citas set estado = case when p_aprobar then 'confirmada'::estado_cita else 'rechazada'::estado_cita end,
                   respondida_en = now()
  where id = p_cita_id returning * into v_cita;
  return v_cita;
end $$;

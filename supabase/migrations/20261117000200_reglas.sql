-- =====================================================================
-- App Citas Dr. Camilo Bedoya · Migración 2: reglas de negocio
-- Funciones auxiliares, validaciones (triggers), avisos y funciones RPC.
-- Ver docs/especificaciones-tecnicas.md, sección 4.
--
-- Errores: se lanzan con un mensaje fijo (por ejemplo HORARIO_NO_DISPONIBLE)
-- y errcode P0001. PostgREST los devuelve como { code, message } y la app
-- los traduce a texto para el usuario (sección 5.4).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Auxiliares
-- ---------------------------------------------------------------------

create or replace function public.zona_consultorio()
returns text language sql immutable as $$ select 'America/Bogota'::text $$;

create or replace function public.solo_digitos(p text)
returns text language sql immutable as $$ select regexp_replace(coalesce(p, ''), '\D', '', 'g') $$;

create or replace function public.es_odontologo()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'odontologo');
$$;

create or replace function public.paciente_actual_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from pacientes where perfil_id = auth.uid();
$$;

create or replace function public.lanzar(p_codigo text, p_detalle text default null)
returns void language plpgsql as $$
begin
  raise exception using errcode = 'P0001', message = p_codigo, detail = coalesce(p_detalle, '');
end $$;

-- ---------------------------------------------------------------------
-- Validación de una franja: horario de atención, bloqueos y otras citas
-- ---------------------------------------------------------------------

create or replace function public.validar_franja(p_inicio timestamptz, p_fin timestamptz, p_ignorar_cita uuid default null)
returns void language plpgsql stable security definer set search_path = public as $$
declare
  v_ini_local timestamp := p_inicio at time zone zona_consultorio();
  v_fin_local timestamp := p_fin    at time zone zona_consultorio();
  v_dia       smallint  := extract(dow from v_ini_local);
  v_horario   horario_atencion;
begin
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

-- ---------------------------------------------------------------------
-- Triggers de validación
-- ---------------------------------------------------------------------

create or replace function public.trg_citas_validar()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.estado in ('pendiente', 'confirmada')
     and (tg_op = 'INSERT' or new.inicio <> old.inicio or new.fin <> old.fin or new.estado <> old.estado) then
    perform validar_franja(new.inicio, new.fin, new.id);
  end if;
  new.actualizado_en := now();
  return new;
end $$;

create trigger citas_validar
  before insert or update on public.citas
  for each row execute function public.trg_citas_validar();

-- RF-19, escenario 2: no se puede bloquear una franja con cita
create or replace function public.trg_bloqueos_validar()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from citas c
             where c.estado in ('pendiente', 'confirmada')
               and tstzrange(c.inicio, c.fin) && new.rango) then
    perform lanzar('CHOQUE_CON_CITA');
  end if;
  return new;
end $$;

create trigger bloqueos_validar
  before insert or update on public.bloqueos
  for each row execute function public.trg_bloqueos_validar();

-- ---------------------------------------------------------------------
-- Avisos (tabla notificaciones) al crear o cambiar una cita
-- ---------------------------------------------------------------------

create or replace function public.texto_cita(p_cita public.citas)
returns text language sql stable security definer set search_path = public as $$
  select s.nombre || ' · ' || to_char(p_cita.inicio at time zone zona_consultorio(), 'DD/MM/YYYY HH12:MI AM')
  from servicios s where s.id = p_cita.servicio_id;
$$;

create or replace function public.avisar_odontologos(p_cita public.citas, p_tipo text, p_titulo text, p_cuerpo text)
returns void language sql security definer set search_path = public as $$
  insert into notificaciones (destinatario_id, cita_id, tipo, titulo, cuerpo)
  select p.id, p_cita.id, p_tipo, p_titulo, p_cuerpo from perfiles p where p.rol = 'odontologo';
$$;

create or replace function public.avisar_paciente(p_cita public.citas, p_tipo text, p_titulo text, p_cuerpo text)
returns void language sql security definer set search_path = public as $$
  insert into notificaciones (destinatario_id, cita_id, tipo, titulo, cuerpo)
  select pa.perfil_id, p_cita.id, p_tipo, p_titulo, p_cuerpo
  from pacientes pa where pa.id = p_cita.paciente_id and pa.perfil_id is not null;
$$;

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
    elsif new.estado = 'cancelada' and coalesce(v_es_dueno, false) then
      perform avisar_odontologos(new, 'cancelada', 'Un paciente canceló su cita', v_paciente || ' · ' || v_txt); -- RF-13
    elsif new.estado = 'cancelada' then
      perform avisar_paciente(new, 'cancelada', 'Tu cita fue cancelada', v_txt);                          -- RF-11
    end if;
  end if;
  return new;
end $$;

create trigger citas_avisar
  after insert or update on public.citas
  for each row execute function public.trg_citas_avisar();

-- ---------------------------------------------------------------------
-- Registro: crear el perfil y vincular al paciente que el doctor ya había agendado (D2)
-- La app envía nombre y teléfono en options.data de supabase.auth.signUp.
-- ---------------------------------------------------------------------

create or replace function public.trg_nuevo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_nombre   text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1));
  v_telefono text := solo_digitos(new.raw_user_meta_data ->> 'telefono');
  v_paciente uuid;
begin
  insert into perfiles (id, rol, nombre, telefono, correo)
  values (new.id, 'paciente', v_nombre, v_telefono, new.email);

  if v_telefono <> '' then
    select id into v_paciente from pacientes
    where perfil_id is null and solo_digitos(telefono) = v_telefono
    order by creado_en limit 1;
  end if;

  if v_paciente is not null then
    update pacientes set perfil_id = new.id, correo = coalesce(correo, new.email) where id = v_paciente;
  else
    insert into pacientes (perfil_id, nombre, telefono, correo) values (new.id, v_nombre, v_telefono, new.email);
  end if;
  return new;
end $$;

create trigger nuevo_usuario
  after insert on auth.users
  for each row execute function public.trg_nuevo_usuario();

-- ---------------------------------------------------------------------
-- RPC · Disponibilidad de un día (entrada del cálculo de franjas en la app)
-- Devuelve el horario y los rangos ocupados, sin datos de pacientes (RF-03).
-- ---------------------------------------------------------------------

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
        where c.estado in ('pendiente', 'confirmada') and tstzrange(c.inicio, c.fin) && tstzrange(v_desde, v_hasta)
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

-- ---------------------------------------------------------------------
-- RPC · Solicitar cita (paciente) · RF-05, RF-06, RF-08, RF-09, RF-29
-- ---------------------------------------------------------------------

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
    insert into citas (paciente_id, servicio_id, inicio, fin, estado, origen, creado_por)
    values (v_paciente, v_servicio.id, p_inicio, p_inicio + make_interval(mins => v_servicio.duracion_min),
            case v_servicio.confirmacion when 'inmediata' then 'confirmada'::estado_cita else 'pendiente'::estado_cita end,
            'app', auth.uid())
    returning * into v_cita;
  exception when exclusion_violation then
    perform lanzar('HORARIO_NO_DISPONIBLE');
  end;
  return v_cita;
end $$;

-- ---------------------------------------------------------------------
-- RPC · Cancelar cita · RF-12, RF-13 (el odontólogo no tiene límite, D6)
-- ---------------------------------------------------------------------

create or replace function public.cancelar_cita(p_cita_id uuid)
returns public.citas language plpgsql security definer set search_path = public as $$
declare
  v_cita citas;
  v_cfg  configuracion;
  v_odo  boolean := es_odontologo();
begin
  select * into v_cita from citas where id = p_cita_id for update;
  if not found or not (v_odo or v_cita.paciente_id = paciente_actual_id()) then perform lanzar('CITA_NO_EXISTE'); end if;
  if v_cita.estado not in ('pendiente', 'confirmada') then perform lanzar('ESTADO_INVALIDO'); end if;

  if not v_odo then
    select * into v_cfg from configuracion where id = 1;
    if v_cita.inicio < now() + make_interval(hours => v_cfg.anticipacion_cambios_horas) then
      perform lanzar('FUERA_DE_PLAZO', v_cfg.anticipacion_cambios_horas::text);
    end if;
  end if;

  update citas set estado = 'cancelada' where id = p_cita_id returning * into v_cita;
  return v_cita;
end $$;

-- ---------------------------------------------------------------------
-- RPC · Reprogramar cita · RF-14 (vuelve a aplicar la regla de confirmación)
-- ---------------------------------------------------------------------

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
  if v_cita.estado not in ('pendiente', 'confirmada') then perform lanzar('ESTADO_INVALIDO'); end if;
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
      fin    = p_nuevo_inicio + make_interval(mins => v_servicio.duracion_min),
      estado = case when v_odo or v_servicio.confirmacion = 'inmediata' then 'confirmada'::estado_cita
                    else 'pendiente'::estado_cita end,
      recordatorio_enviado_para = null
    where id = p_cita_id
    returning * into v_cita;
  exception when exclusion_violation then
    perform lanzar('HORARIO_NO_DISPONIBLE');
  end;
  return v_cita;
end $$;

-- ---------------------------------------------------------------------
-- RPC · Aprobar o rechazar una solicitud (odontólogo) · RF-09
-- ---------------------------------------------------------------------

create or replace function public.responder_solicitud(p_cita_id uuid, p_aprobar boolean)
returns public.citas language plpgsql security definer set search_path = public as $$
declare
  v_cita citas;
begin
  if not es_odontologo() then perform lanzar('NO_AUTORIZADO'); end if;
  select * into v_cita from citas where id = p_cita_id for update;
  if not found then perform lanzar('CITA_NO_EXISTE'); end if;
  if v_cita.estado <> 'pendiente' then perform lanzar('ESTADO_INVALIDO'); end if;
  update citas set estado = case when p_aprobar then 'confirmada'::estado_cita else 'rechazada'::estado_cita end
  where id = p_cita_id returning * into v_cita;
  return v_cita;
end $$;

-- ---------------------------------------------------------------------
-- RPC · Registrar una cita desde el consultorio (odontólogo) · RF-07
-- Busca al paciente por teléfono; si no existe, lo crea sin cuenta.
-- ---------------------------------------------------------------------

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
    insert into citas (paciente_id, servicio_id, inicio, fin, estado, origen, creado_por)
    values (v_paciente, v_servicio.id, p_inicio, p_inicio + make_interval(mins => v_servicio.duracion_min),
            'confirmada', 'consultorio', auth.uid())
    returning * into v_cita;
  exception when exclusion_violation then
    perform lanzar('HORARIO_NO_DISPONIBLE');
  end;
  return v_cita;
end $$;

-- ---------------------------------------------------------------------
-- RPC · Crear un bloqueo de horario (odontólogo) · RF-19
-- ---------------------------------------------------------------------

create or replace function public.crear_bloqueo(p_inicio timestamptz, p_fin timestamptz, p_motivo text)
returns public.bloqueos language plpgsql security definer set search_path = public as $$
declare
  v_bloqueo bloqueos;
begin
  if not es_odontologo() then perform lanzar('NO_AUTORIZADO'); end if;
  if p_fin <= p_inicio then perform lanzar('RANGO_INVALIDO'); end if;
  begin
    insert into bloqueos (rango, motivo, creado_por)
    values (tstzrange(p_inicio, p_fin), coalesce(nullif(trim(p_motivo), ''), 'Bloqueado'), auth.uid())
    returning * into v_bloqueo;
  exception when exclusion_violation then
    perform lanzar('BLOQUEO_EXISTENTE');
  end;
  return v_bloqueo;
end $$;

-- ---------------------------------------------------------------------
-- Recordatorios y resumen diario (RF-16, RF-17). Las ejecuta pg_cron
-- (migración 4); el envío push lo hará una Edge Function en el Hito 4.
-- ---------------------------------------------------------------------

create or replace function public.generar_recordatorios()
returns int language plpgsql security definer set search_path = public as $$
declare
  v_cfg   configuracion;
  v_total int := 0;
  v_cita  citas;
begin
  select * into v_cfg from configuracion where id = 1;
  for v_cita in
    select * from citas
    where estado = 'confirmada'
      and inicio > now()
      and inicio - make_interval(hours => v_cfg.recordatorio_horas_antes) <= now()
      and recordatorio_enviado_para is distinct from inicio
    for update
  loop
    perform avisar_paciente(v_cita, 'recordatorio', 'Recordatorio de cita', texto_cita(v_cita));
    update citas set recordatorio_enviado_para = v_cita.inicio where id = v_cita.id;
    v_total := v_total + 1;
  end loop;
  return v_total;
end $$;

create or replace function public.generar_resumen_diario()
returns int language plpgsql security definer set search_path = public as $$
declare
  v_hoy    date := (now() at time zone zona_consultorio())::date;
  v_cuerpo text;
  v_total  int;
begin
  select count(*), string_agg(to_char(c.inicio at time zone zona_consultorio(), 'HH12:MI AM') || ' · ' || p.nombre || ' · ' || s.nombre, E'\n' order by c.inicio)
  into v_total, v_cuerpo
  from citas c join pacientes p on p.id = c.paciente_id join servicios s on s.id = c.servicio_id
  where c.estado = 'confirmada' and (c.inicio at time zone zona_consultorio())::date = v_hoy;

  insert into notificaciones (destinatario_id, tipo, titulo, cuerpo)
  select pf.id, 'resumen_dia',
         'Citas de hoy: ' || v_total,
         coalesce(v_cuerpo, 'No hay citas confirmadas para hoy.')
  from perfiles pf where pf.rol = 'odontologo';
  return v_total;
end $$;

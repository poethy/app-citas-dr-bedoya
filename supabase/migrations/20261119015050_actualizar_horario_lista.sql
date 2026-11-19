-- =====================================================================
-- App Citas Dr. Camilo Bedoya · Migración 12: C10 con todas las citas afectadas
--
-- Regla decidida (B9): un cambio de horario que deja citas activas futuras fuera
-- del horario o cruzando el almuerzo no se guarda. Antes el detalle del error
-- nombraba solo la primera cita; ahora es un JSON con todas (hasta 50), para que
-- C10 muestre la lista y el odontólogo abra cada una:
--   [{"id": "…", "paciente": "Carlos Ruiz", "inicio": "2026-11-26T13:00:00+00:00"}, …]
-- El resto de actualizar_horario no cambia.
-- =====================================================================

create or replace function public.actualizar_horario(p_dias jsonb, p_almuerzo jsonb default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_afectadas jsonb;
begin
  if not es_odontologo() then perform lanzar('NO_AUTORIZADO'); end if;
  if p_dias is null or jsonb_typeof(p_dias) <> 'array' then perform lanzar('HORARIO_INVALIDO'); end if;
  if p_almuerzo is not null and jsonb_typeof(p_almuerzo) = 'null' then p_almuerzo := null; end if;

  -- Validación de los datos (C09: el cierre debe ser posterior a la apertura)
  begin
    if exists (
      select 1 from jsonb_array_elements(p_dias) d
      where (d ->> 'dia_semana')::smallint not between 0 and 6
         or (d ->> 'hora_fin')::time <= (d ->> 'hora_inicio')::time
    ) or (select count(*) <> count(distinct (d ->> 'dia_semana')::smallint) from jsonb_array_elements(p_dias) d)
    then
      perform lanzar('HORARIO_INVALIDO');
    end if;
    if p_almuerzo is not null and (
         (p_almuerzo ->> 'hora_fin')::time <= (p_almuerzo ->> 'hora_inicio')::time
         or jsonb_typeof(p_almuerzo -> 'dias') <> 'array'
         or exists (select 1 from jsonb_array_elements_text(p_almuerzo -> 'dias') x where x::smallint not between 0 and 6)
       ) then
      perform lanzar('HORARIO_INVALIDO');
    end if;
  exception when invalid_text_representation or invalid_datetime_format or datetime_field_overflow
                 or numeric_value_out_of_range or null_value_not_allowed then
    perform lanzar('HORARIO_INVALIDO');
  end;

  -- Nadie puede crear ni mover citas mientras se revisa el cambio
  lock table citas in share mode;

  delete from horario_atencion where true;
  insert into horario_atencion (dia_semana, hora_inicio, hora_fin)
  select (d ->> 'dia_semana')::smallint, (d ->> 'hora_inicio')::time, (d ->> 'hora_fin')::time
  from jsonb_array_elements(p_dias) d;

  delete from bloqueos_recurrentes where motivo = 'Almuerzo';
  if p_almuerzo is not null then
    insert into bloqueos_recurrentes (dia_semana, hora_inicio, hora_fin, motivo)
    select x::smallint, (p_almuerzo ->> 'hora_inicio')::time, (p_almuerzo ->> 'hora_fin')::time, 'Almuerzo'
    from jsonb_array_elements_text(p_almuerzo -> 'dias') x;
  end if;

  -- C10: todas las citas activas futuras que no caben en el nuevo horario o cruzan el almuerzo
  select jsonb_agg(jsonb_build_object('id', a.id, 'paciente', a.nombre, 'inicio', a.inicio) order by a.inicio)
    into v_afectadas
  from (
    select c.id, p.nombre, c.inicio
    from citas c
    join pacientes p on p.id = c.paciente_id
    left join horario_atencion h on h.dia_semana = extract(dow from c.inicio at time zone zona_consultorio())
    where c.estado in ('pendiente', 'confirmada') and c.inicio > now()
      and (
        h.dia_semana is null
        or (c.inicio at time zone zona_consultorio())::time < h.hora_inicio
        or (c.fin    at time zone zona_consultorio())::time > h.hora_fin
        or exists (
          select 1 from bloqueos_recurrentes r
          where r.motivo = 'Almuerzo'
            and r.dia_semana = extract(dow from c.inicio at time zone zona_consultorio())
            and (c.inicio at time zone zona_consultorio())::time < r.hora_fin
            and (c.fin    at time zone zona_consultorio())::time > r.hora_inicio
        )
      )
    order by c.inicio
    limit 50
  ) a;

  if v_afectadas is not null then
    -- La excepción deshace los cambios de arriba
    perform lanzar('CITAS_FUERA_DE_HORARIO', v_afectadas::text);
  end if;

  return jsonb_build_object(
    'dias', coalesce((select jsonb_agg(jsonb_build_object('dia_semana', dia_semana,
                                                          'hora_inicio', to_char(hora_inicio, 'HH24:MI'),
                                                          'hora_fin', to_char(hora_fin, 'HH24:MI')) order by dia_semana)
                      from horario_atencion), '[]'::jsonb),
    'almuerzo', (select jsonb_build_object('hora_inicio', to_char(min(hora_inicio), 'HH24:MI'),
                                           'hora_fin', to_char(min(hora_fin), 'HH24:MI'),
                                           'dias', jsonb_agg(dia_semana order by dia_semana))
                 from bloqueos_recurrentes where motivo = 'Almuerzo' having count(*) > 0)
  );
end $$;

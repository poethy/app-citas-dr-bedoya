-- Pruebas de las reglas de negocio. Las corre correr.mjs después de las migraciones y el seed.
-- Usa fechas de noviembre de 2026; si se corren después del 19/11/2026 hay que moverlas.
-- Ayuda: ejecuta una sentencia y muestra OK o el código de error
create schema if not exists prueba;
grant usage on schema prueba to authenticated, anon;
create or replace function prueba.probar(p_nombre text, p_sql text, p_esperado text default 'OK')
returns text language plpgsql as $$
declare v text;
begin
  begin
    execute p_sql;
    v := 'OK';
  exception when others then
    v := sqlerrm;
  end;
  return case when v = p_esperado then '✔ ' else '✘ ' end || p_nombre || ' → ' || v || case when v <> p_esperado then '   (esperado: ' || p_esperado || ')' else '' end;
end $$;
grant execute on function prueba.probar(text, text, text) to authenticated, anon;

-- Cuentas: odontólogo y Ana (con el teléfono de su ficha, en otro formato)
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', 'doctor@consultorio.test', '{"nombre":"Camilo Bedoya","telefono":"3000000000"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'ana.gomez@correo.com',   '{"nombre":"Ana Gómez","telefono":"310 555 1234"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'otro@correo.com',        '{"nombre":"Paciente Nuevo","telefono":"3112223344"}');
update public.perfiles set rol = 'odontologo' where correo = 'doctor@consultorio.test';

select 'Ana vinculada a su ficha: ' || (select count(*) from public.pacientes where nombre = 'Ana Gómez' and perfil_id is not null) as r
union all select 'Pacientes totales: ' || count(*) from public.pacientes;

-- ===== Como Ana =====
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select 'Ana ve citas: ' || count(*) from public.citas;
select 'Ocupados el jueves 19: ' || jsonb_array_length(public.disponibilidad_dia('2026-11-19') -> 'ocupados');
select 'Domingo 22 abierto: ' || (public.disponibilidad_dia('2026-11-22') ->> 'abierto');

select prueba.probar('RF-05 solicitar Limpieza 19/11 11:00', $$ select public.solicitar_cita((select id from public.servicios where nombre='Limpieza dental'), '2026-11-19 11:00-05') $$);
select 'Estado de la cita de Limpieza: ' || estado from public.citas where inicio = '2026-11-19 11:00-05';
select prueba.probar('RF-06 franja ocupada (11:15)', $$ select public.solicitar_cita((select id from public.servicios where nombre='Valoración general'), '2026-11-19 11:15-05') $$, 'HORARIO_NO_DISPONIBLE');
select prueba.probar('Cruza el almuerzo (12:15)', $$ select public.solicitar_cita((select id from public.servicios where nombre='Valoración general'), '2026-11-19 12:15-05') $$, 'HORARIO_NO_DISPONIBLE');
select prueba.probar('Termina después de las 6 p. m.', $$ select public.solicitar_cita((select id from public.servicios where nombre='Limpieza dental'), '2026-11-19 17:30-05') $$, 'FUERA_DE_HORARIO');
select prueba.probar('Domingo cerrado', $$ select public.solicitar_cita((select id from public.servicios where nombre='Limpieza dental'), '2026-11-22 09:00-05') $$, 'FUERA_DE_HORARIO');
select prueba.probar('RF-29 menos de 24 h para agendar', $$ select public.solicitar_cita((select id from public.servicios where nombre='Limpieza dental'), now() + interval '2 hours') $$, 'FUERA_DE_ANTICIPACION');
select prueba.probar('RF-09 Resina queda pendiente', $$ select public.solicitar_cita((select id from public.servicios where nombre='Resina'), '2026-11-20 08:00-05') $$);
select 'Estado de Resina: ' || estado from public.citas where inicio = '2026-11-20 08:00-05';
select 'Ana ve citas ahora: ' || count(*) from public.citas;
select prueba.probar('RF-03 Ana no puede insertar citas directo', $$ insert into public.citas (paciente_id, servicio_id, inicio, fin, estado) select paciente_id, servicio_id, inicio + interval '1 day', fin + interval '1 day', 'confirmada' from public.citas limit 1 $$, 'permission denied for table citas');
select prueba.probar('RF-03 Ana no puede hacerse odontóloga', $$ update public.perfiles set rol = 'odontologo' where id = auth.uid() $$, 'permission denied for table perfiles');
select prueba.probar('Ana sí puede cambiar su teléfono', $$ update public.perfiles set telefono = '3105551234' where id = auth.uid() $$);
select prueba.probar('RF-03 Ana no ve bloqueos', $$ do $x$ begin if (select count(*) from public.bloqueos) <> 0 then raise exception 've bloqueos'; end if; end $x$ $$);
select prueba.probar('RF-03 Ana no puede aprobar', $$ select public.responder_solicitud((select id from public.citas where inicio = '2026-11-20 08:00-05'), true) $$, 'NO_AUTORIZADO');
reset role;

-- ===== Otro paciente no ve las citas de Ana =====
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
select 'Otro paciente ve citas: ' || count(*) from public.citas;
select prueba.probar('No puede cancelar la cita de Ana', $$ select public.cancelar_cita((select id from public.citas where inicio = '2026-11-19 11:00-05')) $$, 'CITA_NO_EXISTE');
reset role;
-- (la consulta de arriba no ve la cita, así que el id es null → CITA_NO_EXISTE)

-- ===== Como odontólogo =====
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
select 'Odontólogo ve citas: ' || count(*) from public.citas;
select 'Odontólogo tiene avisos: ' || count(*) || ' (' || string_agg(tipo, ', ') || ')' from public.notificaciones;
select prueba.probar('RF-09 aprobar Resina de Ana', $$ select public.responder_solicitud((select id from public.citas where inicio = '2026-11-20 08:00-05'), true) $$);
select prueba.probar('RF-19 bloquear sobre la cita de Jorge', $$ select public.crear_bloqueo('2026-11-19 14:00-05', '2026-11-19 15:00-05', 'Reunión') $$, 'CHOQUE_CON_CITA');
select prueba.probar('RF-19 bloquear franja libre 16:30–17:15', $$ select public.crear_bloqueo('2026-11-19 16:30-05', '2026-11-19 17:15-05', 'Diligencia') $$);
select prueba.probar('No se puede agendar sobre el bloqueo', $$ select public.registrar_cita_consultorio('Pedro Gil', '311 222 3344', (select id from public.servicios where nombre='Valoración general'), '2026-11-19 16:45-05') $$, 'HORARIO_NO_DISPONIBLE');
select prueba.probar('RF-07 registrar cita (paciente sin cuenta)', $$ select public.registrar_cita_consultorio('Pedro Gil', '311 222 3344', (select id from public.servicios where nombre='Valoración general'), '2026-11-19 15:45-05') $$);
select prueba.probar('RF-07 teléfono inválido', $$ select public.registrar_cita_consultorio('Pedro Gil', '12345', (select id from public.servicios where nombre='Valoración general'), '2026-11-19 08:45-05') $$, 'TELEFONO_INVALIDO');
-- Cita de Ana para dentro de unas horas (para probar el plazo de cancelación)
select prueba.probar('Cita de Ana muy cercana', $$ select public.registrar_cita_consultorio('Ana Gómez', '3105551234', (select id from public.servicios where nombre='Valoración general'), date_trunc('hour', now()) + interval '3 hours') $$);
reset role;

-- ===== Ana de nuevo: plazos y avisos =====
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select prueba.probar('RF-12 cancelar con menos de 24 h', $$ select public.cancelar_cita((select id from public.citas where inicio = date_trunc('hour', now()) + interval '3 hours')) $$, 'FUERA_DE_PLAZO');
select prueba.probar('RF-12 cancelar la del jueves', $$ select public.cancelar_cita((select id from public.citas where inicio = '2026-11-19 11:00-05')) $$);
select prueba.probar('RF-14 reprogramar Resina al 20/11 10:00', $$ select public.reprogramar_cita((select id from public.citas where inicio = '2026-11-20 08:00-05'), '2026-11-20 10:00-05') $$);
select 'Resina tras reprogramar: ' || estado || ' ' || to_char(inicio at time zone 'America/Bogota', 'DD/MM HH24:MI') from public.citas where servicio_id = (select id from public.servicios where nombre='Resina');
select 'Avisos de Ana: ' || string_agg(tipo, ', ' order by creado_en) from public.notificaciones;
select prueba.probar('Ana marca un aviso como leído', $$ update public.notificaciones set leida = true $$);
select prueba.probar('Ana no puede borrar avisos', $$ delete from public.notificaciones $$, 'permission denied for table notificaciones');
reset role;

-- ===== RF-06 escenario 2: la restricción de la base frena dos citas cruzadas aunque se salten las validaciones =====
alter table public.citas disable trigger citas_validar;
select prueba.probar('Exclusión en la base (sin trigger)', $$ insert into public.citas (paciente_id, servicio_id, inicio, fin, estado) select paciente_id, servicio_id, inicio, fin, 'pendiente' from public.citas where estado = 'confirmada' limit 1 $$, 'conflicting key value violates exclusion constraint "citas_sin_solapamiento"');
alter table public.citas enable trigger citas_validar;

-- ===== Recordatorios y resumen =====
select 'Recordatorios generados: ' || public.generar_recordatorios();
select 'Recordatorios en la segunda corrida: ' || public.generar_recordatorios();
select 'Resumen diario (citas de hoy): ' || public.generar_resumen_diario();
select 'Avisos del odontólogo: ' || string_agg(n.tipo, ', ' order by n.creado_en) from public.notificaciones n join public.perfiles p on p.id = n.destinatario_id where p.rol = 'odontologo';

-- ===== anon no ve nada =====
set role anon;
select prueba.probar('anon no lee servicios', $$ select * from public.servicios $$, 'permission denied for table servicios');
select prueba.probar('anon no llama RPC', $$ select public.disponibilidad_dia('2026-11-19') $$, 'permission denied for function disponibilidad_dia');
reset role;

-- ===== Datos que piden las pantallas del Figma =====
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select prueba.probar('M03 número de cita «#A-»', $$ do $x$ begin if (select min(numero) from public.citas) < 1001 then raise exception 'numero'; end if; end $x$ $$);
select 'M03 ejemplo: Cita #A-' || numero from public.citas order by numero limit 1;
select prueba.probar('P05 el paciente lee el consultorio', $$ do $x$ begin if (select nombre_profesional || ' · ' || especialidad || ' · ' || lugar from public.configuracion) <> 'Dr. Camilo Bedoya Orozco · Odontología general · Consultorio 201, Ed. Torcoroma' then raise exception 'config'; end if; end $x$ $$);
select prueba.probar('P05 el paciente lee el horario', $$ do $x$ begin if (select count(*) from public.horario_atencion) <> 6 then raise exception 'horario'; end if; end $x$ $$);
select prueba.probar('RF-03 el paciente no ve el perfil del doctor', $$ do $x$ begin if (select count(*) from public.perfiles) <> 1 then raise exception 've otros perfiles'; end if; end $x$ $$);
select prueba.probar('P04 cambiar nombre y teléfono', $$ update public.perfiles set nombre = 'Ana María Gómez', telefono = '310 555 9999' where id = auth.uid() $$);
select 'P03 aviso: ' || titulo || ' — ' || cuerpo from public.notificaciones order by creado_en limit 1;
reset role;
select prueba.probar('P04 la ficha del paciente se actualiza', $$ do $x$ begin if not exists (select 1 from public.pacientes where nombre = 'Ana María Gómez' and telefono = '3105559999') then raise exception 'no sincronizó'; end if; end $x$ $$);

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
select prueba.probar('O04 pestaña Aprobadas (respondida_en)', $$ do $x$ begin if (select count(*) from public.citas where estado = 'confirmada' and respondida_en is not null) <> 0 then raise exception 'la reprogramada volvió a pendiente, no debería contar'; end if; end $x$ $$);
select prueba.probar('O05 aprobar de nuevo la Resina reprogramada', $$ select public.responder_solicitud((select c.id from public.citas c join public.servicios s on s.id = c.servicio_id where s.nombre = 'Resina'), true) $$);
select 'O04 Aprobadas: ' || count(*) from public.citas where estado = 'confirmada' and respondida_en is not null;
select 'O08 agendada por: ' || c.origen || ' · ' || coalesce(pf.nombre, '—') from public.citas c left join public.perfiles pf on pf.id = c.creado_por where c.servicio_id = (select id from public.servicios where nombre = 'Resina');
select 'O11 aviso: ' || titulo || ' — ' || replace(cuerpo, E'\n', ' / ') from public.notificaciones where tipo in ('reprogramada', 'resumen_dia') order by creado_en;
reset role;

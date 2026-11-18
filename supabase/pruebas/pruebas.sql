-- Pruebas de las reglas de negocio. Las corre correr.mjs después de las migraciones y el seed.
-- Las fechas 2026-11-19, 20 y 22 son la agenda del seed (jueves, viernes y domingo). correr.mjs
-- las cambia por el próximo jueves que esté a más de 48 h, así que las pruebas no dependen del día.
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
reset role;

-- Cita de Ana para dentro de 3 horas, para probar el plazo de cancelación. Se inserta directo
-- (sin validar el horario) porque dentro de 3 horas el consultorio puede estar cerrado.
alter table public.citas disable trigger citas_validar;
insert into public.citas (paciente_id, servicio_id, inicio, fin, estado, origen, precio_acordado_cop, duracion_acordada_min)
select pa.id, s.id, date_trunc('hour', now()) + interval '3 hours', date_trunc('hour', now()) + interval '3 hours 30 minutes',
       'confirmada', 'consultorio', s.precio_cop, s.duracion_min
from public.pacientes pa, public.servicios s
where pa.perfil_id = '00000000-0000-0000-0000-0000000000a1' and s.nombre = 'Valoración general';
alter table public.citas enable trigger citas_validar;

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
select prueba.probar('Exclusión en la base (sin trigger)', $$ insert into public.citas (paciente_id, servicio_id, inicio, fin, estado, precio_acordado_cop, duracion_acordada_min) select paciente_id, servicio_id, inicio, fin, 'pendiente', precio_acordado_cop, duracion_acordada_min from public.citas where estado = 'confirmada' limit 1 $$, 'conflicting key value violates exclusion constraint "citas_sin_solapamiento"');
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

-- ===== Precio y duración acordados (F2) =====
select prueba.probar('Todas las citas guardan precio y duración acordados', $$ do $x$ begin if exists (select 1 from public.citas where precio_acordado_cop is null or duracion_acordada_min is null) then raise exception 'faltan'; end if; end $x$ $$);
select prueba.probar('La Resina guardó $180.000 y 60 min', $$ do $x$ begin if not exists (select 1 from public.citas c join public.servicios s on s.id = c.servicio_id where s.nombre = 'Resina' and c.precio_acordado_cop = 180000 and c.duracion_acordada_min = 60) then raise exception 'no copió'; end if; end $x$ $$);
update public.servicios set precio_cop = 200000, duracion_min = 90 where nombre = 'Resina';
select prueba.probar('Editar el catálogo no cambia la cita', $$ do $x$ begin if not exists (select 1 from public.citas c join public.servicios s on s.id = c.servicio_id where s.nombre = 'Resina' and c.precio_acordado_cop = 180000 and c.duracion_acordada_min = 60) then raise exception 'cambió'; end if; end $x$ $$);
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
select prueba.probar('Reprogramar la Resina al viernes 3:00 p. m.', $$ select public.reprogramar_cita((select c.id from public.citas c join public.servicios s on s.id = c.servicio_id where s.nombre = 'Resina'), '2026-11-20 15:00-05') $$);
reset role;
select prueba.probar('Reprogramar conserva la duración acordada (60 min, no 90)', $$ do $x$ begin if not exists (select 1 from public.citas c join public.servicios s on s.id = c.servicio_id where s.nombre = 'Resina' and c.fin - c.inicio = interval '60 minutes' and c.precio_acordado_cop = 180000) then raise exception 'usó el catálogo'; end if; end $x$ $$);
update public.servicios set precio_cop = 180000, duracion_min = 60 where nombre = 'Resina';

-- ===== Solicitudes vencidas (F2, B4) =====
-- Dos solicitudes de Ana cuya hora ya pasó, insertadas directo
alter table public.citas disable trigger citas_validar;
insert into public.citas (paciente_id, servicio_id, inicio, fin, estado, origen, precio_acordado_cop, duracion_acordada_min)
select pa.id, s.id, now() - x.horas, now() - x.horas + interval '60 minutes', 'pendiente', 'app', s.precio_cop, s.duracion_min
from public.pacientes pa, public.servicios s, (values (interval '5 hours'), (interval '3 hours')) as x(horas)
where pa.perfil_id = '00000000-0000-0000-0000-0000000000a1' and s.nombre = 'Resina';
alter table public.citas enable trigger citas_validar;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
select prueba.probar('Aprobar una solicitud que ya llegó a su hora la deja vencida', $$ do $x$ begin if (public.responder_solicitud((select id from public.citas where estado = 'pendiente' and inicio <= now() order by inicio limit 1), true)).estado <> 'vencida' then raise exception 'la aprobó'; end if; end $x$ $$);
reset role;
select prueba.probar('La vencida quedó guardada y no se aprobó', $$ do $x$ begin if (select count(*) from public.citas where estado = 'vencida' and respondida_en is null) <> 1 then raise exception 'no persistió'; end if; end $x$ $$);
select 'Vencidas por el cron: ' || public.vencer_solicitudes();
select prueba.probar('vencer_solicitudes no repite (idempotente)', $$ do $x$ begin if public.vencer_solicitudes() <> 0 then raise exception 'repitió'; end if; end $x$ $$);
select prueba.probar('Ana recibe un aviso por cada solicitud vencida', $$ do $x$ begin if (select count(*) from public.notificaciones where tipo = 'vencida') <> 2 then raise exception 'avisos: %', (select count(*) from public.notificaciones where tipo = 'vencida'); end if; end $x$ $$);
select prueba.probar('Las confirmadas no vencen', $$ do $x$ begin if exists (select 1 from public.citas where estado = 'vencida' and respondida_en is not null) then raise exception 'venció una confirmada'; end if; end $x$ $$);
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
select prueba.probar('No se puede cancelar una vencida', $$ select public.cancelar_cita((select id from public.citas where estado = 'vencida' limit 1)) $$, 'ESTADO_INVALIDO');
select prueba.probar('No se puede aprobar una vencida', $$ select public.responder_solicitud((select id from public.citas where estado = 'vencida' limit 1), true) $$, 'ESTADO_INVALIDO');
reset role;

-- ===== C08–C10 horario de atención =====
-- La cita de Ana de dentro de 3 horas puede caer fuera de cualquier horario: se cancela antes
update public.citas set estado = 'cancelada' where estado in ('pendiente', 'confirmada') and inicio < '2026-11-19 00:00-05';

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select prueba.probar('Ana no puede cambiar el horario', $$ select public.actualizar_horario('[]'::jsonb, null) $$, 'NO_AUTORIZADO');
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
select prueba.probar('C10 cerrar el jueves a las 10:00 deja citas fuera', $$ select public.actualizar_horario('[{"dia_semana":1,"hora_inicio":"08:00","hora_fin":"18:00"},{"dia_semana":2,"hora_inicio":"08:00","hora_fin":"18:00"},{"dia_semana":3,"hora_inicio":"08:00","hora_fin":"18:00"},{"dia_semana":4,"hora_inicio":"08:00","hora_fin":"10:00"},{"dia_semana":5,"hora_inicio":"08:00","hora_fin":"18:00"},{"dia_semana":6,"hora_inicio":"08:00","hora_fin":"12:00"}]', '{"hora_inicio":"12:30","hora_fin":"13:30","dias":[1,2,3,4,5]}') $$, 'CITAS_FUERA_DE_HORARIO');
select prueba.probar('C10 el horario no cambió', $$ do $x$ begin if (select hora_fin from public.horario_atencion where dia_semana = 4) <> '18:00' or (select count(*) from public.horario_atencion) <> 6 then raise exception 'cambió'; end if; end $x$ $$);
select prueba.probar('C10 un almuerzo que cruza la cita de Jorge', $$ select public.actualizar_horario('[{"dia_semana":4,"hora_inicio":"08:00","hora_fin":"18:00"},{"dia_semana":5,"hora_inicio":"08:00","hora_fin":"18:00"}]', '{"hora_inicio":"14:00","hora_fin":"15:00","dias":[4]}') $$, 'CITAS_FUERA_DE_HORARIO');
select prueba.probar('C09 cierre antes de la apertura', $$ select public.actualizar_horario('[{"dia_semana":4,"hora_inicio":"18:00","hora_fin":"08:00"}]', null) $$, 'HORARIO_INVALIDO');
select prueba.probar('Día repetido', $$ select public.actualizar_horario('[{"dia_semana":4,"hora_inicio":"08:00","hora_fin":"18:00"},{"dia_semana":4,"hora_inicio":"09:00","hora_fin":"17:00"}]', null) $$, 'HORARIO_INVALIDO');
select prueba.probar('Hora mal escrita', $$ select public.actualizar_horario('[{"dia_semana":4,"hora_inicio":"ocho","hora_fin":"18:00"}]', null) $$, 'HORARIO_INVALIDO');
select prueba.probar('C08 guardar: miércoles cerrado, sábado hasta la 1 p. m.', $$ select public.actualizar_horario('[{"dia_semana":1,"hora_inicio":"08:00","hora_fin":"18:00"},{"dia_semana":2,"hora_inicio":"08:00","hora_fin":"18:00"},{"dia_semana":4,"hora_inicio":"08:00","hora_fin":"18:00"},{"dia_semana":5,"hora_inicio":"08:00","hora_fin":"18:00"},{"dia_semana":6,"hora_inicio":"08:00","hora_fin":"13:00"}]', '{"hora_inicio":"12:30","hora_fin":"13:30","dias":[1,2,4,5]}') $$);
select prueba.probar('C08 el horario nuevo quedó guardado', $$ do $x$ begin if (select count(*) from public.horario_atencion) <> 5 or (select hora_fin from public.horario_atencion where dia_semana = 6) <> '13:00' or exists (select 1 from public.horario_atencion where dia_semana = 3) or (select count(*) from public.bloqueos_recurrentes where motivo = 'Almuerzo') <> 4 then raise exception 'no guardó'; end if; end $x$ $$);
select 'C08 respuesta: ' || public.actualizar_horario('[{"dia_semana":1,"hora_inicio":"08:00","hora_fin":"18:00"},{"dia_semana":2,"hora_inicio":"08:00","hora_fin":"18:00"},{"dia_semana":3,"hora_inicio":"08:00","hora_fin":"18:00"},{"dia_semana":4,"hora_inicio":"08:00","hora_fin":"18:00"},{"dia_semana":5,"hora_inicio":"08:00","hora_fin":"18:00"},{"dia_semana":6,"hora_inicio":"08:00","hora_fin":"12:00"}]', '{"hora_inicio":"12:30","hora_fin":"13:30","dias":[1,2,3,4,5]}')::text;
select prueba.probar('Sin almuerzo (null) se guarda', $$ select public.actualizar_horario('[{"dia_semana":4,"hora_inicio":"08:00","hora_fin":"18:00"},{"dia_semana":5,"hora_inicio":"08:00","hora_fin":"18:00"}]', null) $$);
reset role;
select prueba.probar('Sin almuerzo no quedan bloqueos de almuerzo', $$ do $x$ begin if exists (select 1 from public.bloqueos_recurrentes where motivo = 'Almuerzo') then raise exception 'quedó'; end if; end $x$ $$);

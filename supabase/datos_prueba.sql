-- =====================================================================
-- Datos de prueba para presentar la app (no es una migración).
-- Se corre en el SQL Editor de Supabase; se puede repetir antes de cada presentación.
--
-- Qué hace:
-- 1. Coordenadas de prueba del consultorio (centro de Pereira) y un teléfono de prueba.
--    Cambiarlas por las reales cuando el consultorio las confirme.
-- 2. Borra solo las citas de las fichas de ejemplo (pacientes SIN cuenta) y crea una
--    agenda para los próximos días hábiles, desde mañana. No toca citas de cuentas reales.
-- =====================================================================

begin;

-- 1. Datos del consultorio (de prueba)
update public.configuracion
set latitud  = 4.8143,
    longitud = -75.6946,
    telefono = coalesce(telefono, '3000000000')
where id = 1;

-- Ficha de ejemplo que registra el odontólogo por teléfono (RF-07)
insert into public.pacientes (nombre, telefono)
select 'Pedro Gil', '3112223344'
where not exists (select 1 from public.pacientes where solo_digitos(telefono) = '3112223344');

-- 2. Agenda de ejemplo
delete from public.notificaciones
where cita_id in (
  select c.id from public.citas c join public.pacientes p on p.id = c.paciente_id
  where p.perfil_id is null
    and p.nombre in ('Carlos Ruiz', 'Laura Pérez', 'Jorge Díaz', 'Sofía Mejía', 'Pedro Gil'));
delete from public.citas
where paciente_id in (
  select id from public.pacientes
  where perfil_id is null
    and nombre in ('Carlos Ruiz', 'Laura Pérez', 'Jorge Díaz', 'Sofía Mejía', 'Pedro Gil'));

-- Próximos 3 días hábiles (lunes a viernes) en hora de Bogotá, empezando mañana
with dias as (
  select d::date as fecha, row_number() over (order by d) as n
  from generate_series((now() at time zone 'America/Bogota')::date + 1,
                       (now() at time zone 'America/Bogota')::date + 10, interval '1 day') d
  where extract(isodow from d) between 1 and 5
),
agenda (dia, paciente, servicio, hora, estado) as (
  values
    (1, 'Carlos Ruiz', 'Limpieza dental',    '08:00', 'confirmada'),
    (1, 'Laura Pérez', 'Endodoncia',         '09:30', 'pendiente'),
    (1, 'Jorge Díaz',  'Endodoncia',         '14:15', 'confirmada'),
    (1, 'Sofía Mejía', 'Limpieza dental',    '16:30', 'cancelada'),
    (2, 'Pedro Gil',   'Valoración general', '09:00', 'confirmada'),
    (2, 'Carlos Ruiz', 'Resina',             '10:00', 'pendiente'),
    (3, 'Sofía Mejía', 'Valoración general', '08:30', 'confirmada'),
    (3, 'Jorge Díaz',  'Limpieza dental',    '15:00', 'confirmada')
)
insert into public.citas (paciente_id, servicio_id, inicio, fin, estado, origen,
                          precio_acordado_cop, duracion_acordada_min)
select p.id, s.id,
       ((d.fecha + a.hora::time) at time zone 'America/Bogota'),
       ((d.fecha + a.hora::time) at time zone 'America/Bogota') + make_interval(mins => s.duracion_min),
       a.estado::public.estado_cita, 'consultorio', s.precio_cop, s.duracion_min
from agenda a
join dias d on d.n = a.dia
join public.pacientes p on p.nombre = a.paciente and p.perfil_id is null
join public.servicios s on s.nombre = a.servicio;

commit;

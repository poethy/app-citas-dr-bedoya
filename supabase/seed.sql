-- =====================================================================
-- App Citas Dr. Camilo Bedoya · Datos de ejemplo
-- Son los de docs/Datos_ejemplo_wireframes.md, para que la app y el Figma
-- cuenten la misma historia. Horario, servicios y precios son supuestos
-- hasta que el cliente los confirme.
--
-- No crea cuentas: el odontólogo se crea a mano (ver supabase/README.md) y
-- los pacientes se registran desde la app. Si un paciente se registra con el
-- teléfono de una de estas fichas, queda vinculado a ella y ve sus citas.
-- =====================================================================

insert into public.configuracion (id, anticipacion_agendar_horas, anticipacion_cambios_horas, recordatorio_horas_antes,
                                  nombre_profesional, especialidad, lugar, direccion, telefono, latitud, longitud)
values (1, 24, 24, 24,
        'Dr. Camilo Bedoya Orozco', 'Odontología general',
        'Consultorio 201, Ed. Torcoroma', 'Calle 18 # 5-27, Pereira',
        null,       -- teléfono del consultorio: por confirmar con el cliente
        null, null) -- coordenadas exactas: por confirmar con el cliente
on conflict (id) do nothing;

-- Lunes (1) a viernes (5): 8:00 a. m. – 6:00 p. m.; sábado (6): 8:00 a. m. – 12:00 m.; domingo cerrado
insert into public.horario_atencion (dia_semana, hora_inicio, hora_fin) values
  (1, '08:00', '18:00'), (2, '08:00', '18:00'), (3, '08:00', '18:00'),
  (4, '08:00', '18:00'), (5, '08:00', '18:00'), (6, '08:00', '12:00')
on conflict (dia_semana) do nothing;

-- Almuerzo de lunes a viernes
insert into public.bloqueos_recurrentes (dia_semana, hora_inicio, hora_fin, motivo)
select d, '12:30', '13:30', 'Almuerzo' from generate_series(1, 5) d;

insert into public.servicios (nombre, duracion_min, precio_cop, confirmacion) values
  ('Valoración general', 30,  60000, 'inmediata'),
  ('Limpieza dental',    45, 120000, 'inmediata'),
  ('Resina',             60, 180000, 'aprobacion'),
  ('Endodoncia',         90, 450000, 'aprobacion')
on conflict (nombre) do nothing;

-- Fichas de pacientes sin cuenta (como si el doctor los hubiera registrado)
insert into public.pacientes (nombre, telefono, correo) values
  ('Carlos Ruiz', '3001112233', null),
  ('Laura Pérez', '3014445566', null),
  ('Ana Gómez',   '3105551234', 'ana.gomez@correo.com'),
  ('Jorge Díaz',  '3157778899', null),
  ('Sofía Mejía', '3209990011', null);

-- Agenda del jueves 19 de noviembre de 2026 (hora de Bogotá, UTC−5).
-- La cita de Ana Gómez (11:00 a. m.) no se crea: es la que se agenda en vivo
-- en la demo, y así S03 muestra las 7 franjas del diseño.
insert into public.citas (paciente_id, servicio_id, inicio, fin, estado, origen, precio_acordado_cop, duracion_acordada_min)
select p.id, s.id, x.inicio::timestamptz, x.inicio::timestamptz + make_interval(mins => s.duracion_min), x.estado::public.estado_cita, 'consultorio',
       s.precio_cop, s.duracion_min
from (values
  ('Carlos Ruiz', 'Limpieza dental', '2026-11-19 08:00-05', 'confirmada'),
  ('Laura Pérez', 'Endodoncia',      '2026-11-19 09:30-05', 'pendiente'),
  ('Jorge Díaz',  'Endodoncia',      '2026-11-19 14:15-05', 'confirmada'),
  ('Sofía Mejía', 'Limpieza dental', '2026-11-19 16:30-05', 'cancelada')
) as x(paciente, servicio, inicio, estado)
join public.pacientes p on p.nombre = x.paciente
join public.servicios s on s.nombre = x.servicio;

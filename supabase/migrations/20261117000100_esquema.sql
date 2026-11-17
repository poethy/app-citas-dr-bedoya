-- =====================================================================
-- App Citas Dr. Camilo Bedoya · Migración 1: tablas
-- Ver docs/especificaciones-tecnicas.md, sección 3.
-- =====================================================================

-- Las restricciones de exclusión solo comparan rangos (&&), que GiST soporta
-- sin extensiones adicionales.

create type public.rol_usuario       as enum ('paciente', 'odontologo');
create type public.tipo_confirmacion as enum ('inmediata', 'aprobacion');
create type public.estado_cita       as enum ('pendiente', 'confirmada', 'rechazada', 'cancelada');
create type public.origen_cita       as enum ('app', 'consultorio');

-- Datos y rol de cada cuenta (1 a 1 con auth.users)
create table public.perfiles (
  id        uuid primary key references auth.users on delete cascade,
  rol       public.rol_usuario not null default 'paciente',
  nombre    text not null,
  telefono  text not null default '',
  correo    text not null unique,
  creado_en timestamptz not null default now()
);

-- Paciente como persona. Puede no tener cuenta si el doctor lo agendó por teléfono (RF-07)
create table public.pacientes (
  id        uuid primary key default gen_random_uuid(),
  perfil_id uuid unique references public.perfiles on delete set null,
  nombre    text not null,
  telefono  text not null,
  correo    text,
  creado_en timestamptz not null default now()
);

-- Catálogo de servicios (RF-08, RF-10, RF-28, RF-30)
create table public.servicios (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null unique,
  duracion_min int  not null check (duracion_min between 15 and 180 and duracion_min % 15 = 0),
  precio_cop   int  not null check (precio_cop >= 0),
  confirmacion public.tipo_confirmacion not null,
  activo       boolean not null default true
);

-- Horario por día de la semana (0 = domingo … 6 = sábado). Un día sin fila está cerrado.
create table public.horario_atencion (
  dia_semana  smallint primary key check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin    time not null,
  check (hora_fin > hora_inicio)
);

-- Bloqueos que se repiten cada semana, como el almuerzo
create table public.bloqueos_recurrentes (
  id          uuid primary key default gen_random_uuid(),
  dia_semana  smallint not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin    time not null,
  motivo      text not null,
  check (hora_fin > hora_inicio)
);

-- Bloqueos puntuales (RF-19)
create table public.bloqueos (
  id         uuid primary key default gen_random_uuid(),
  rango      tstzrange not null check (not isempty(rango)),
  motivo     text not null,
  creado_por uuid references public.perfiles on delete set null,
  creado_en  timestamptz not null default now(),
  constraint bloqueos_sin_solapamiento exclude using gist (rango with &&)
);

-- Una sola fila con las reglas y los datos del consultorio
create table public.configuracion (
  id                         smallint primary key default 1 check (id = 1),
  anticipacion_agendar_horas int not null default 24 check (anticipacion_agendar_horas between 0 and 72), -- RF-29
  anticipacion_cambios_horas int not null default 24 check (anticipacion_cambios_horas between 0 and 72), -- RF-15
  recordatorio_horas_antes   int not null default 24 check (recordatorio_horas_antes > 0),               -- RF-16
  hora_resumen_diario        time not null default '08:00',                                              -- RF-17
  direccion                  text not null,
  telefono                   text,
  latitud                    double precision,
  longitud                   double precision
);

-- Citas y solicitudes
create table public.citas (
  id                        uuid primary key default gen_random_uuid(),
  paciente_id               uuid not null references public.pacientes,
  servicio_id               uuid not null references public.servicios,
  inicio                    timestamptz not null,
  fin                       timestamptz not null,
  estado                    public.estado_cita not null,
  origen                    public.origen_cita not null default 'app',
  creado_por                uuid references public.perfiles on delete set null,
  recordatorio_enviado_para timestamptz,
  creado_en                 timestamptz not null default now(),
  actualizado_en            timestamptz not null default now(),
  check (fin > inicio),
  -- RF-06: dos citas activas no se pueden cruzar, aunque las pidan al mismo tiempo
  constraint citas_sin_solapamiento exclude using gist (
    tstzrange(inicio, fin) with &&
  ) where (estado in ('pendiente', 'confirmada'))
);

-- Avisos de P03 y O11; también alimentan los push (RF-11, RF-13, RF-16, RF-17)
create table public.notificaciones (
  id              uuid primary key default gen_random_uuid(),
  destinatario_id uuid not null references public.perfiles on delete cascade,
  cita_id         uuid references public.citas on delete cascade,
  tipo            text not null check (tipo in ('confirmada', 'rechazada', 'cancelada', 'reprogramada',
                                               'solicitud_nueva', 'cita_registrada', 'recordatorio', 'resumen_dia')),
  titulo          text not null,
  cuerpo          text not null,
  leida           boolean not null default false,
  enviada_push    boolean not null default false,
  creado_en       timestamptz not null default now()
);

-- Token de Expo Push de cada dispositivo
create table public.tokens_push (
  token          text primary key,
  perfil_id      uuid not null references public.perfiles on delete cascade,
  actualizado_en timestamptz not null default now()
);

create index citas_inicio_idx            on public.citas (inicio);
create index citas_paciente_idx          on public.citas (paciente_id);
create index pacientes_telefono_idx      on public.pacientes (telefono);
create index notificaciones_destino_idx  on public.notificaciones (destinatario_id, creado_en desc);

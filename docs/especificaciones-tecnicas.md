# Especificaciones técnicas — App Citas Dr. Camilo Bedoya

Versión 1.1 · 10 de noviembre de 2026 · Estado: **propuesta para revisar con el equipo**

Este documento define cómo se va a construir la app: stack, base de datos, reglas de negocio en el servidor, API, estructura del código y entorno. Sale de los requerimientos (RF-01 a RF-29), de los requisitos académicos de Móvil II y del diseño en Figma.

Las decisiones que dependen de los huecos de los requerimientos están marcadas con **⚠ Por confirmar**. Cada una tiene una opción propuesta para no frenar el desarrollo, y la sección 11 las reúne todas.

---

## 1. Resumen de decisiones

| Tema | Decisión |
| --- | --- |
| App | React Native + TypeScript + Expo **SDK 58** (React Native 0.88), Expo Router |
| Estilos | NativeWind con la versión trabajada en clase (si no hay otra indicación, 4.2.x con Tailwind 3.4) |
| Backend y base de datos | **Supabase**: PostgreSQL + Auth + Edge Functions + pg_cron |
| Autenticación | Supabase Auth (correo y contraseña) con `@supabase/supabase-js` |
| Datos por HTTP | **Axios** contra la API REST de Supabase (PostgREST), con interfaces de respuesta, mappers y hooks de **TanStack Query** |
| Estado compartido | **Zustand** (sesión, borrador del agendamiento, seguimiento del mapa) |
| Mapa | OpenStreetMap + Leaflet dentro de `react-native-webview`, con `expo-location` |
| Notificaciones | Avisos dentro de la app (tabla `notificaciones`) + push con Expo Notifications · ⚠ Por confirmar |
| Prevención de solapamientos | Restricción de exclusión en PostgreSQL (no solo en la app) |
| Zona horaria | `America/Bogota` (UTC−5, sin horario de verano). En la base todo se guarda como `timestamptz` |

---

## 2. Base de datos: por qué Supabase

### 2.1 Qué tiene que resolver la base

| Necesidad | De dónde sale |
| --- | --- |
| Datos compartidos entre el teléfono del paciente y el del odontólogo | Requisitos académicos §4 «Conservación de la información»: guardar solo en el teléfono no cumple |
| Dos pacientes no pueden quedarse con la misma franja, ni siquiera al mismo tiempo | RF-06, escenario 2 |
| Cada rol ve solo lo suyo | RF-03 |
| Cuentas con correo y contraseña y dos roles | RF-01, RF-02 |
| Consumirse por HTTP con Axios, con listado y detalle por id | Requisitos académicos §4 |
| Recordatorios y resumen diario aunque la app esté cerrada | RF-16, RF-17 |
| Sin construir un backend propio completo | Requisitos académicos §4 |

### 2.2 Opciones comparadas

| Opción | A favor | En contra | Veredicto |
| --- | --- | --- | --- |
| **Supabase (PostgreSQL)** | Restricción de exclusión para RF-06 garantizada por la base. Row Level Security para RF-03. API REST automática que se consume con Axios. Auth incluida. pg_cron y Edge Functions para recordatorios. Plan gratuito | Hay que escribir SQL (tablas, políticas y funciones). En el plan gratuito el proyecto se pausa tras unos días sin uso | **Elegida** |
| Firebase (Firestore) | Auth y push muy integrados | Sin restricciones de rango: evitar solapamientos exige transacciones o funciones a mano. El SDK no pasa por Axios, así que costaría cumplir el requisito HTTP. Reglas de seguridad menos expresivas para este caso | Descartada |
| Backend propio (Node + PostgreSQL) | Control total | Hay que construir, desplegar y mantener un servidor. El curso no lo exige | Descartada |
| SQLite o AsyncStorage locales | Funciona sin red | No se comparte entre dispositivos, así que no cumple el requisito de persistencia | Descartada |

**Límites que hay que documentar en el informe:** el plan gratuito de Supabase pausa el proyecto tras un periodo sin actividad, y hay que reactivarlo desde el panel antes de una demo. La clave pública (`publishable`/`anon`) viaja dentro de la app y no es un secreto; la seguridad la dan las políticas RLS.

---

## 3. Modelo de datos

### 3.1 Diagrama

```
auth.users 1─1 perfiles 1─0..1 pacientes 1─* citas *─1 servicios
                  │                          │
                  └─1─* notificaciones *─0..1┘
                  └─1─* tokens_push
horario_atencion   bloqueos_recurrentes   bloqueos   configuracion (1 fila)
```

### 3.2 Tablas

| Tabla | Para qué | Campos principales |
| --- | --- | --- |
| `perfiles` | Datos y rol de cada cuenta (1 a 1 con `auth.users`) | `id`, `rol` (`paciente`/`odontologo`), `nombre`, `telefono`, `correo` |
| `pacientes` | Paciente como persona. Puede no tener cuenta si el doctor lo agendó por teléfono (RF-07) | `id`, `perfil_id` (opcional), `nombre`, `telefono`, `correo` |
| `servicios` | Catálogo con duración, precio y tipo de confirmación (RF-08, RF-10, RF-28) | `nombre`, `duracion_min` (15–180, múltiplo de 15), `precio_cop`, `confirmacion` (`inmediata`/`aprobacion`), `activo` |
| `horario_atencion` | Horario por día de la semana | `dia_semana` (0 = domingo), `hora_inicio`, `hora_fin` |
| `bloqueos_recurrentes` | Bloqueos que se repiten, como el almuerzo | `dia_semana`, `hora_inicio`, `hora_fin`, `motivo` |
| `bloqueos` | Bloqueos puntuales (RF-19) | `rango` (`tstzrange`), `motivo` |
| `configuracion` | Una sola fila con reglas y datos del consultorio | `anticipacion_agendar_horas`, `anticipacion_cambios_horas` (RF-15), `recordatorio_horas_antes`, `direccion`, `telefono`, `latitud`, `longitud` |
| `citas` | Citas y solicitudes | `paciente_id`, `servicio_id`, `inicio`, `fin`, `estado`, `origen` (`app`/`consultorio`), `recordatorio_enviado_para` |
| `notificaciones` | Avisos de P03 y O11, que también alimentan los push (RF-11, RF-13, RF-16, RF-17) | `destinatario_id`, `cita_id`, `tipo`, `titulo`, `cuerpo`, `leida`, `enviada_push` |
| `tokens_push` | Token de Expo Push de cada dispositivo | `perfil_id`, `token` |

Estados de una cita: `pendiente` → `confirmada` o `rechazada`; `pendiente` o `confirmada` → `cancelada`. Una cita **ocupa su franja** mientras está `pendiente` o `confirmada` (RF-09, escenario 1).

### 3.3 Esquema SQL inicial

Va en `supabase/migrations/0001_esquema.sql`. Las funciones y políticas van en migraciones aparte (sección 4).

```sql
create extension if not exists btree_gist;

create type rol_usuario       as enum ('paciente', 'odontologo');
create type tipo_confirmacion as enum ('inmediata', 'aprobacion');
create type estado_cita       as enum ('pendiente', 'confirmada', 'rechazada', 'cancelada');
create type origen_cita       as enum ('app', 'consultorio');

create table perfiles (
  id        uuid primary key references auth.users on delete cascade,
  rol       rol_usuario not null default 'paciente',
  nombre    text not null,
  telefono  text not null,
  correo    text not null unique,
  creado_en timestamptz not null default now()
);

create table pacientes (
  id        uuid primary key default gen_random_uuid(),
  perfil_id uuid unique references perfiles on delete set null,
  nombre    text not null,
  telefono  text not null,
  correo    text,
  creado_en timestamptz not null default now()
);

create table servicios (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null unique,
  duracion_min int  not null check (duracion_min between 15 and 180 and duracion_min % 15 = 0),
  precio_cop   int  not null check (precio_cop >= 0), -- pesos colombianos, sin decimales
  confirmacion tipo_confirmacion not null,
  activo       boolean not null default true
);

create table horario_atencion (
  dia_semana  smallint primary key check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin    time not null check (hora_fin > hora_inicio)
);

create table bloqueos_recurrentes (
  id          uuid primary key default gen_random_uuid(),
  dia_semana  smallint not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin    time not null check (hora_fin > hora_inicio),
  motivo      text not null
);

create table bloqueos (
  id         uuid primary key default gen_random_uuid(),
  rango      tstzrange not null,
  motivo     text not null,
  creado_por uuid references perfiles,
  constraint bloqueos_sin_solapamiento exclude using gist (rango with &&)
);

create table configuracion (
  id                       smallint primary key default 1 check (id = 1),
  anticipacion_agendar_horas int not null default 24 check (anticipacion_agendar_horas >= 0), -- para agendar
  anticipacion_cambios_horas int not null default 24 check (anticipacion_cambios_horas >= 0), -- para cancelar o reprogramar (RF-15)
  recordatorio_horas_antes int not null default 24 check (recordatorio_horas_antes > 0),
  direccion                text not null,
  telefono                 text,
  latitud                  double precision,
  longitud                 double precision
);

create table citas (
  id                        uuid primary key default gen_random_uuid(),
  paciente_id               uuid not null references pacientes,
  servicio_id               uuid not null references servicios,
  inicio                    timestamptz not null,
  fin                       timestamptz not null check (fin > inicio),
  estado                    estado_cita not null,
  origen                    origen_cita not null default 'app',
  creado_por                uuid references perfiles,
  recordatorio_enviado_para timestamptz,
  creado_en                 timestamptz not null default now(),
  actualizado_en            timestamptz not null default now(),
  -- RF-06: dos citas activas no pueden cruzarse, aunque lleguen al mismo tiempo
  constraint citas_sin_solapamiento exclude using gist (
    tstzrange(inicio, fin) with &&
  ) where (estado in ('pendiente', 'confirmada'))
);

create table notificaciones (
  id              uuid primary key default gen_random_uuid(),
  destinatario_id uuid not null references perfiles on delete cascade,
  cita_id         uuid references citas on delete cascade,
  tipo            text not null, -- confirmada | rechazada | cancelada | solicitud_nueva | recordatorio | resumen_dia
  titulo          text not null,
  cuerpo          text not null,
  leida           boolean not null default false,
  enviada_push    boolean not null default false,
  creado_en       timestamptz not null default now()
);

create table tokens_push (
  token          text primary key,
  perfil_id      uuid not null references perfiles on delete cascade,
  actualizado_en timestamptz not null default now()
);

create index on citas (inicio);
create index on citas (paciente_id);
create index on notificaciones (destinatario_id, creado_en desc);
```

### 3.4 Datos iniciales (`supabase/seed.sql`)

Son los de [Datos_ejemplo_wireframes.md](Datos_ejemplo_wireframes.md), para que la app y el Figma cuenten la misma historia:

- **Horario:** lunes a viernes de 8:00 a. m. a 6:00 p. m.; sábado de 8:00 a. m. a 12:00 m.; domingo cerrado.
- **Almuerzo:** bloqueo recurrente de 12:30 a 1:30 p. m. de lunes a viernes.
- **Servicios:** Valoración general (30 min, $60.000, inmediata), Limpieza dental (45 min, $120.000, inmediata), Resina (60 min, $180.000, con aprobación) y Endodoncia (90 min, $450.000, con aprobación). Los precios son de ejemplo hasta que el cliente los confirme.
- **Configuración:** 24 h de anticipación para agendar y 24 h para cancelar o reprogramar, recordatorio 24 h antes, Calle 18 # 5-27, Edificio Torcoroma, Consultorio 201, Pereira. Las coordenadas están pendientes.
- **Agenda del jueves 19 de noviembre de 2026:** las citas de ejemplo (Carlos Ruiz, Laura Pérez, Ana Gómez, Jorge Díaz, Sofía Mejía).

---

## 4. Reglas de negocio en el servidor

La regla general: **la app calcula y muestra, y el servidor valida y decide.** Así nadie puede saltarse las reglas llamando a la API a mano.

### 4.1 Seguridad por rol (RLS, RF-03)

Una función auxiliar `es_odontologo()` (`security definer`) consulta el rol del usuario actual.

| Tabla | Paciente | Odontólogo |
| --- | --- | --- |
| `perfiles` | Lee y edita solo el suyo | Lee todos |
| `pacientes` | Lee solo su fila (`perfil_id = auth.uid()`) | Todo |
| `citas` | **Solo lectura** de sus citas. Crear, cancelar y reprogramar se hace solo con las funciones de 4.2 | Todo, a través de las funciones |
| `servicios`, `horario_atencion`, `bloqueos_recurrentes`, `configuracion` | Lectura | Lectura y escritura |
| `bloqueos` | No lee la tabla; ve la ocupación con `disponibilidad_dia` | Todo |
| `notificaciones` | Solo las suyas; puede marcarlas como leídas | Solo las suyas |
| `tokens_push` | Solo los suyos | Solo los suyos |

**Clave para RF-03:** el paciente necesita saber qué horas están ocupadas sin ver de quién son las citas. Para eso existe `disponibilidad_dia`, que devuelve solo rangos de tiempo, sin nombres ni servicios.

### 4.2 Funciones (RPC)

Todas son `security definer`, comprueban el rol al inicio y devuelven errores con un código fijo (sección 5.4).

| Función | Quién | Qué hace |
| --- | --- | --- |
| `disponibilidad_dia(fecha date)` | Ambos | Devuelve el horario del día y los rangos ocupados (citas activas, bloqueos puntuales y recurrentes). Es la entrada del cálculo de franjas en la app |
| `solicitar_cita(servicio_id, inicio)` | Paciente | Calcula `fin` con la duración del servicio. Valida que la cita caiga dentro del horario, que no choque con bloqueos y que respete `anticipacion_agendar_horas` (RF-29; si no, `FUERA_DE_ANTICIPACION`). El estado queda `confirmada` o `pendiente` según el servicio (RF-08, RF-09). Si la franja ya no está libre, la restricción de exclusión hace fallar la inserción con `HORARIO_NO_DISPONIBLE` (RF-06) |
| `cancelar_cita(cita_id)` | Paciente (sus citas) / Odontólogo | Para el paciente, exige que falten al menos `anticipacion_cambios_horas` (RF-12). Si no, devuelve `FUERA_DE_PLAZO` (M06). Deja la cita en `cancelada`, lo que libera la franja, y avisa al odontólogo (RF-13) |
| `reprogramar_cita(cita_id, nuevo_inicio)` | Paciente / Odontólogo (⚠ D6) | Mismas validaciones que solicitar. Mueve `inicio` y `fin` y vuelve a aplicar la regla de confirmación del servicio (RF-14) |
| `responder_solicitud(cita_id, aprobar boolean)` | Odontólogo | Pasa la cita de `pendiente` a `confirmada` o `rechazada` y avisa al paciente (RF-09, RF-11) |
| `registrar_cita_consultorio(nombre, telefono, servicio_id, inicio)` | Odontólogo | Busca o crea el paciente por teléfono y crea la cita con `origen = consultorio` (RF-07, ⚠ D2) |
| `crear_bloqueo(inicio, fin, motivo)` | Odontólogo | Rechaza el bloqueo con `CHOQUE_CON_CITA` si cruza una cita activa (RF-19, escenario 2, C06) |

**Triggers:**

- En `citas`, antes de insertar o actualizar: rechaza la cita si cruza un bloqueo, porque la restricción de exclusión solo compara citas entre sí.
- En `citas`, después de cambiar el estado: crea la fila de `notificaciones` que corresponda (RF-11, RF-13).
- En `auth.users`, después de insertar: crea el `perfil` (rol `paciente`) y lo vincula con un `paciente` existente si coincide el teléfono (⚠ D2).
- En todas las tablas con `actualizado_en`: actualiza la fecha.

### 4.3 Cálculo de franjas (RF-04, RF-28)

El cálculo vive en la app, en una función pura `calcularFranjas` usada por el hook `useFranjasDisponibles`. Así cumple el requisito académico del cálculo contextual. El servidor lo vuelve a validar al guardar.

**Entradas:** duración del servicio (que viene del contador de C02), horario del día, rangos ocupados (de `disponibilidad_dia`), hora actual y anticipación para agendar.

**Validaciones (RF-28, escenario 3, C03):**

| Caso | Mensaje |
| --- | --- |
| Vacío | «Escribe la duración del servicio.» |
| No numérico | «Escribe solo números.» |
| Negativo o cero | «La duración debe ser mayor que 0.» |
| Fuera de rango o no múltiplo de 15 | «Usa un valor entre 15 y 180 minutos, en pasos de 15.» |

Nunca se divide entre cero.

**Algoritmo:**

1. Libre = horario del día − rangos ocupados. El resultado son tramos libres.
2. En cada tramo libre `[a, b)`, ofrecer inicios en `a, a + d, a + 2d…` mientras `inicio + d ≤ b`, donde `d` es la duración.
3. Descartar los inicios anteriores a «ahora + `anticipacion_agendar_horas`».
4. Si no queda ninguno, mostrar S04 («no hay franjas disponibles, elige otra fecha»; RF-28, escenario 4).

**Capacidad (C02):** `⌊(horario − citas agendadas − bloqueos) ÷ duración⌋`, la fórmula del RF-28.

> El paciente ya no ve el número de franjas en S03 (se quitó el cuadro por feedback del equipo); solo ve la lista. La fórmula da el **máximo teórico**. Si los huecos libres no son múltiplos de la duración, la lista real del paso 2 puede tener menos franjas. Con los datos de ejemplo las dos coinciden: 7 en S03, 6 en S05 y 12 de capacidad en C02. ⚠ D1: confirmar que el paciente ve la lista real y que la fórmula se usa como capacidad.

### 4.4 Recordatorios y resumen diario (RF-16, RF-17)

- **pg_cron** ejecuta cada 15 minutos la Edge Function `enviar-notificaciones`.
- **Recordatorio (RF-16):** citas `confirmada` cuyo `inicio − recordatorio_horas_antes ≤ ahora < inicio` y cuyo `recordatorio_enviado_para` sea distinto de `inicio`. Crea la notificación y guarda `recordatorio_enviado_para = inicio`.
  - Si la cita se cancela, deja de estar confirmada y no se envía nada (escenario 2).
  - Si se reprograma, cambia `inicio` y se programa un recordatorio nuevo.
- **Resumen del día (RF-17):** a la hora de inicio de la jornada (8:00 a. m. en Bogotá), una notificación para el odontólogo con las citas confirmadas del día.
- **Envío:** la misma función manda por **Expo Push** las notificaciones con `enviada_push = false` a los tokens del destinatario, y las marca como enviadas.

---

## 5. API (HTTP con Axios)

### 5.1 Cliente

`src/services/http/cliente.ts` centraliza la configuración:

- `baseURL = ${EXPO_PUBLIC_SUPABASE_URL}/rest/v1`
- Cabeceras `apikey` y `Content-Type: application/json`.
- Un interceptor de petición añade `Authorization: Bearer <access_token>` con la sesión actual de supabase-js, que refresca el token sola.
- Un interceptor de respuesta convierte los errores en un `ErrorApi` tipado (sección 5.4).
- Timeout de 10 s.

supabase-js se usa **solo para Auth**: registro, login, logout, sesión y escucha de cambios. Todos los datos pasan por Axios.

### 5.2 Endpoints

| Uso | Método y ruta | Pantallas |
| --- | --- | --- |
| Servicios activos | `GET /servicios?activo=eq.true&order=nombre` | S01, C01 |
| Detalle de un servicio | `GET /servicios?id=eq.{id}` | C02 |
| Editar servicio | `PATCH /servicios?id=eq.{id}` | C02 |
| **Listado** de citas (RLS filtra por rol) | `GET /citas?select=*,servicio:servicios(*),paciente:pacientes(nombre,telefono)&order=inicio` + filtros (`estado=in.(...)`, `inicio=gte...`) | M01, O01, O02 |
| **Detalle** de una cita por id | `GET /citas?id=eq.{id}&select=...` (si viene vacío → M04) | M03, O08 |
| Solicitudes pendientes | `GET /citas?estado=eq.pendiente&select=...` | O04, O05 |
| Disponibilidad | `POST /rpc/disponibilidad_dia` | S03, M07, O09 |
| Solicitar cita | `POST /rpc/solicitar_cita` | S06 |
| Cancelar | `POST /rpc/cancelar_cita` | M05 |
| Reprogramar | `POST /rpc/reprogramar_cita` | M07 |
| Aprobar o rechazar | `POST /rpc/responder_solicitud` | O04, O05 |
| Registrar cita (consultorio) | `POST /rpc/registrar_cita_consultorio` | O09 |
| Bloqueos | `GET /bloqueos?rango=ov...`, `POST /rpc/crear_bloqueo`, `DELETE /bloqueos?id=eq.{id}` | C05 |
| Configuración y consultorio | `GET /configuracion`, `PATCH /configuracion?id=eq.1` (C04 edita las dos anticipaciones) | C04, P05, MP01 |
| Notificaciones | `GET /notificaciones?order=creado_en.desc`, `PATCH /notificaciones?id=eq.{id}` | P03, O11 |
| Perfil | `GET` y `PATCH /perfiles?id=eq.{uid}` | P04 |
| Token push | `POST /tokens_push` (con `Prefer: resolution=merge-duplicates`) | Al iniciar sesión |

### 5.3 Tipos y mappers

- `src/types/api.ts`: interfaces **tal como llegan** de la API (`snake_case`), por ejemplo `CitaRespuesta`.
- `src/models/`: modelos internos (`camelCase`, fechas como `Date`), por ejemplo `Cita`, `Servicio` y `Franja`.
- `src/mappers/`: funciones puras como `mapCita(r: CitaRespuesta): Cita`, con pruebas unitarias.
- Prohibido usar `any`. Los resultados de funciones usan tipos explícitos, por ejemplo `ResultadoFranjas = { franjas: Franja[]; capacidad: number }`.

### 5.4 Errores

| Código | Origen | Mensaje para el usuario | Pantalla |
| --- | --- | --- | --- |
| `HORARIO_NO_DISPONIBLE` | Exclusión `23P01` o validación de la RPC | «Ese horario acaba de ocuparse. Elige otro.» | S05 |
| `FUERA_DE_PLAZO` | `cancelar_cita` / `reprogramar_cita` | «Faltan menos de 24 h. Comunícate con el consultorio.» | M06 |
| `CHOQUE_CON_CITA` | `crear_bloqueo` | «Hay una cita en esa franja. Cancélala o reprográmala primero.» | C06 |
| `FUERA_DE_HORARIO` | RPC | «Ese horario está fuera de la atención del consultorio.» | — |
| `FUERA_DE_ANTICIPACION` | `solicitar_cita` | «Las citas se agendan con al menos 24 h de anticipación.» | S03 |
| `NO_AUTORIZADO` | RLS / RPC | Pantalla de acceso denegado | G04 |
| `SIN_CONEXION` | Axios sin respuesta | «Sin conexión. Revisa tu internet e intenta de nuevo.» | G02 |
| `CORREO_EN_USO` | Supabase Auth | «Este correo ya está registrado.» | A05 |
| `CREDENCIALES_INVALIDAS` | Supabase Auth | «Correo o contraseña incorrectos.» | A03 |

---

## 6. Estructura del código

### 6.1 Rutas (Expo Router)

Siguen el mapa de navegación del Figma.

```
app/
  _layout.tsx                     Stack raíz: fuentes, QueryClientProvider, escucha de sesión
  index.tsx                       A00: lee la sesión y redirige según el rol (replace)
  (auth)/
    _layout.tsx                   Stack
    bienvenida.tsx                A01
    login.tsx                     A02 / A03
    registro.tsx                  A04 / A05
  (paciente)/
    _layout.tsx                   Drawer + guardia de rol (G04)
    (tabs)/
      _layout.tsx                 Tabs: Inicio · Agendar · Mis citas · Mapa
      index.tsx                   P01
      agendar/
        _layout.tsx               Stack interno
        index.tsx                 S01
        fecha.tsx                 S02
        horario.tsx               S03 / S04 / S05
        resumen.tsx               S06
        resultado.tsx             S07 / S08 (replace + dismissAll)
      mis-citas.tsx               M01 / M02
      mapa.tsx                    MP01–MP07
    perfil.tsx                    P04
    notificaciones.tsx            P03
  (odontologo)/
    _layout.tsx                   Drawer + guardia de rol
    (tabs)/
      _layout.tsx                 Tabs: Agenda · Solicitudes · Nueva cita · Avisos
      index.tsx                   O01 / O02 / O10
      solicitudes.tsx             O04 / O06 / O07
      nueva-cita.tsx              O09
      avisos.tsx                  O11
    servicios/index.tsx           C01
    servicios/[id].tsx            C02 / C03
    anticipacion.tsx              C04
    bloqueos.tsx                  C05 / C06 / C07
  cita/[id]/index.tsx             M03 / O08 / M04 (vista según el rol; modal M05 / M06)
  cita/[id]/reprogramar.tsx       M07 → M08
  solicitud/[id].tsx              O05
  consultorio.tsx                 P05
```

> El mapa del Figma dice `cita/[id].tsx`. Como esa ruta también tiene `cita/[id]/reprogramar`, en Expo Router el detalle va en `cita/[id]/index.tsx`.

Los modales de cerrar sesión (P06, O12) y cancelar (M05) son componentes de modal dentro de la pantalla, no rutas.

### 6.2 Carpeta `src/`

```
src/
  components/      Boton, Campo, TarjetaCita, ChipEstado, Aviso, Contador,
                   EstadoCarga, EstadoVacio, EstadoError, EstadoSinConexion, ModalConfirmacion
  hooks/           useFranjasDisponibles, useSeguimientoUbicacion, useConexion,
                   useSesion, useGuardiaRol, y los hooks de consulta (useCitas, useCita, ...)
  services/
    http/cliente.ts
    api/           servicios.api.ts, citas.api.ts, bloqueos.api.ts, notificaciones.api.ts, ...
  lib/supabase.ts  Cliente de supabase-js (solo Auth, sesión en AsyncStorage)
  types/api.ts     Interfaces de respuesta
  models/          Modelos internos
  mappers/
  store/           sesion.store.ts, agendar.store.ts, mapa.store.ts
  utils/           franjas.ts (cálculo puro), fechas.ts, validaciones.ts
  constants/       tema.ts (colores de Fundamentos), rutas.ts
assets/            fuentes (Poppins, Libre Baskerville), logos, mapa.html (Leaflet)
supabase/          migrations/, seed.sql, functions/enviar-notificaciones/
```

### 6.3 Estado: qué va en cada lugar

| Dónde | Qué | Ejemplo |
| --- | --- | --- |
| **TanStack Query** (estado remoto) | Todo lo que viene del servidor | Citas, servicios, disponibilidad, notificaciones |
| **Zustand** (estado compartido local) | Lo que comparten varias pantallas y no está en el servidor | `useSesionStore` (perfil y rol), `useAgendarStore` (servicio, fecha y franja elegidos entre S01 y S06; se limpia en S07/S08), `useMapaStore` (seguimiento `inactivo`/`activo`/`pausado`, permiso y última posición) |
| **useState / useEffect** | Estado de una sola pantalla | Valores del formulario, filtro de Mis citas, modal abierto |

**Claves de consulta y caché:**

| Clave | `staleTime` | Notas |
| --- | --- | --- |
| `['servicios']` | 10 min | Casi no cambia |
| `['configuracion']` | 10 min | Casi no cambia |
| `['citas', filtros]` | 30 s | Se invalida después de solicitar, cancelar, reprogramar o responder |
| `['cita', id]` | 30 s | Se invalida después de cancelar o reprogramar |
| `['disponibilidad', fecha]` | 0 | Siempre fresca; se vuelve a consultar antes de confirmar |
| `['solicitudes']` | 30 s | Se invalida al responder |
| `['notificaciones']` | 30 s | También al volver a la app (`refetchOnAppFocus`) |

Toda consulta muestra carga, error con «Reintentar», vacío y sin conexión, con los componentes `Estado*` (G01 a G03).

### 6.4 Hooks propios

| Hook | Entradas | Estado y efectos | Resultado |
| --- | --- | --- | --- |
| `useFranjasDisponibles(servicio, fecha)` | Servicio y fecha | Consulta `disponibilidad_dia` y aplica `calcularFranjas` | `{ franjas, capacidad, cargando, error, reintentar }` |
| `useSeguimientoUbicacion()` | — | Pide el permiso en primer plano. `watchPositionAsync` al activar; `remove()` al pausar, al salir de la pantalla o al pasar a segundo plano (RF-27). Vuelve a revisar el permiso al volver de ajustes (RF-24) | `{ permiso, posicion, estado, activar, pausar, reanudar, centrar }` |
| `useConexion()` | — | Escucha NetInfo | `{ conectado }` para mostrar G02 y no confirmar nada sin red |
| `useGuardiaRol(rol)` | Rol esperado | Lee `useSesionStore` | Redirige o muestra G04 |

### 6.5 Mapa (RF-20 a RF-27)

- `assets/mapa.html` carga Leaflet 1.9.4 y teselas de OpenStreetMap, con la atribución obligatoria. La app y el mapa se comunican con `postMessage`: la app envía `{tipo: 'posicion', lat, lng}` o `{tipo: 'centrar'}`, y el mapa responde `{tipo: 'cargado'}` o `{tipo: 'error'}`.
- Marcadores distintos para el paciente y el consultorio. Las coordenadas del consultorio salen de `configuracion` (⚠ pendientes).
- **Estados:**
  - Sin permiso → MP03.
  - Permiso denegado → MP04, con `Linking.openSettings()`.
  - Sin ubicación → MP05: solo se ve el consultorio y agendar sigue funcionando.
  - GPS no disponible → MP06, con reintentar.
  - Falla de la WebView o sin red → MP07, con reintentar y «Ver dirección».
- No se dibujan rutas ni líneas entre los dos puntos: el curso pide no presentar una línea recta como si fuera una ruta.

### 6.6 Formularios

- Validación con **zod** y mensajes específicos en español. Los formularios se manejan con `useState` para que sea fácil explicarlos en la sustentación.
- `KeyboardAvoidingView` y `ScrollView` para que el teclado no tape los campos.
- **Registro (RF-01):** nombre obligatorio; teléfono de 10 dígitos que empiece por 3; correo válido; contraseña de mínimo 8 caracteres con al menos una letra y un número, como dice A04.

---

## 7. Notificaciones ⚠ D4

| Tipo | Cómo llega |
| --- | --- |
| Aviso en la app (P03, O11) | Siempre. Es la fuente principal y funciona en Expo Go |
| Push (RF-11, RF-13, RF-16, RF-17) | Expo Push desde la Edge Function |

Desde SDK 53, **Expo Go en Android no recibe push**; las notificaciones locales sí funcionan. Para probar push hace falta un **development build**: `expo-dev-client` + EAS Build (perfil `development`), con credenciales de Firebase Cloud Messaging. Opciones:

1. **Recomendada:** desarrollar en Expo Go y generar un development build o APK con EAS para probar push y para la demo con el cliente.
2. **Plan B:** sin build propio, mostrar los avisos dentro de la app y programar el recordatorio RF-16 como notificación local al confirmar la cita (y cancelarla al cancelar o reprogramar). Desventaja: si el odontólogo cancela desde su teléfono, el recordatorio local del paciente no se entera hasta que el paciente abra la app.

---

## 8. Entorno y ejecución

### 8.1 Versiones de referencia (npm, 10 de noviembre de 2026)

| Paquete | Versión | Cómo se instala |
| --- | --- | --- |
| `expo` | 58.0.x | `npx create-expo-app@latest` con plantilla de SDK 58 |
| Paquetes nativos (`expo-router`, `expo-location`, `expo-notifications`, `react-native-webview`, `react-native-reanimated`, `react-native-gesture-handler`, `@react-navigation/drawer`, `@react-native-async-storage/async-storage`, `@react-native-community/netinfo`, `expo-font`) | La que fije SDK 58 | **Siempre con `npx expo install`** para que coincidan con el SDK |
| `nativewind` | La de clase (latest estable: 4.2.7; v5 sigue en RC) | `npm i`, con `tailwindcss` 3.4 |
| `@supabase/supabase-js` | 2.x | `npm i` |
| `axios` | 1.x | `npm i` |
| `@tanstack/react-query` | 5.x | `npm i` |
| `zustand` | 5.x | `npm i` |
| `zod` | 4.x | `npm i` |
| `date-fns` + `@date-fns/tz` | Última | `npm i` |

SDK 58 trae TypeScript estricto por defecto en la API de React Native: no se pueden hacer imports profundos de `react-native/Libraries/*`.

Se entregan `package.json` y `package-lock.json`. Se usa **npm** en todo el equipo, sin mezclar con yarn ni pnpm.

### 8.2 Variables de entorno

`.env.template` (se sube al repo):

```
EXPO_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=<clave publishable o anon del proyecto>
```

- `.env` no se sube (ya está en `.gitignore`).
- La clave `service_role` / `secret` **nunca** va en la app: solo como secreto de la Edge Function.

### 8.3 Comandos

```bash
npm install
npx expo start               # Expo Go en Android (misma red o --tunnel)
npx supabase db push         # aplica las migraciones al proyecto
npx supabase db seed         # carga los datos de ejemplo (o se ejecuta seed.sql en el SQL Editor)
eas build -p android --profile development   # build con push
```

---

## 9. Calidad y forma de trabajo

- **Pruebas unitarias** con `jest-expo`: `calcularFranjas` (los casos de 7, 6, 0 y 12 franjas de los datos de ejemplo), validaciones de duración y registro, y mappers.
- **Pruebas de la base:** script SQL con los casos de RF-06 (dos inserciones en la misma franja), RF-12 (cancelación fuera de plazo) y RF-19 (bloquear sobre una cita).
- **Pruebas manuales** en un Android real antes de cada hito, siguiendo el recorrido del prototipo.
- **Git:**
  - `main` siempre ejecutable; ramas `feature/<tema>`, Pull Request y revisión de otro integrante.
  - Commits en español, en imperativo, **sin coautor**.
- **Bitácora:** `docs/bitacora.md` con fecha, objetivo, tarea, responsable, commit, dificultad, observación del docente y siguiente paso.
- **Matriz de requisitos:** `docs/matriz-requisitos.md` con requisito → función → pantalla → archivo → evidencia.

---

## 10. Orden de trabajo por hito

| Hito | Entregable técnico |
| --- | --- |
| **1 · Definición y base** | Proyecto Expo SDK 58 creado; rutas vacías de la sección 6.1 navegables; fuentes y tema; proyecto Supabase con la migración 0001 y el seed; `.env.template`; matriz inicial |
| **2 · Interfaz y lógica** | Componentes reutilizables; Stack, Tabs y Drawer con guardias de rol; contador de C02; `calcularFranjas` con pruebas; formularios de registro, login y nueva cita; stores de Zustand |
| **3 · Datos y ubicación** | Cliente Axios, interfaces, mappers y hooks de TanStack Query (listado de citas y detalle por id); RPC y RLS; mapa con WebView, permisos y seguimiento |
| **4 · Integración y ajustes** | Notificaciones y recordatorios; pruebas de fallos (sin red, choques, fuera de plazo); prueba con el cliente; README, informe y bitácora |

---

## 11. Decisiones por confirmar con el equipo

Cada una tiene una propuesta para poder avanzar. Si el equipo decide otra cosa, se cambian este documento y las partes afectadas.

| # | Pregunta | Propuesta | Afecta |
| --- | --- | --- | --- |
| D1 | ¿El paciente ve la lista real de franjas o el número que da la fórmula? | Lista real (algoritmo de 4.3); la fórmula se muestra como capacidad en C02 | `calcularFranjas`, S03, C02 |
| D2 | ¿Cómo se crea la cuenta del odontólogo y qué pasa con el paciente que llamó y no tiene cuenta? | El odontólogo se crea a mano en Supabase (Auth + `rol = odontologo` en el seed). El paciente sin cuenta queda en `pacientes` sin `perfil_id`, y si después se registra con el mismo teléfono se vincula solo | `pacientes`, trigger de registro, O09 |
| D3 | ~~¿La anticipación también aplica para agendar?~~ | **Decidido:** son dos valores aparte en C04, «para agendar» y «para cancelar o reprogramar», ambos en 24 h por defecto | `configuracion`, `solicitar_cita`, `calcularFranjas` |
| D9 | ¿Precios reales de cada servicio? | Precio fijo por servicio en COP, con valores de ejemplo. El pago se hace en el consultorio; la app no cobra | `servicios.precio_cop`, S01, S06, C01, C02 |
| D4 | ¿Push reales (development build) o solo avisos en la app y recordatorio local? | Push reales con un build de EAS, y avisos en la app como respaldo | Sección 7, Edge Function |
| D5 | ¿Cuánto antes llega el recordatorio y a qué hora el resumen diario? | 24 h antes; resumen a las 8:00 a. m. | `configuracion`, pg_cron |
| D6 | ¿El odontólogo puede cancelar y reprogramar? ¿Con el mismo límite de 24 h? | Sí, sin límite de anticipación (es su agenda); el paciente recibe el aviso | `cancelar_cita`, `reprogramar_cita`, O08 |
| D7 | ¿Datos reales del consultorio? | Pedir al cliente horario, servicios con su duración, teléfono y coordenadas exactas | `seed.sql` |
| D8 | ¿Qué versión exacta de NativeWind y demás librerías se usó en clase? | Usar la de clase; si no hay, NativeWind 4.2.x + Tailwind 3.4 | `package.json` |

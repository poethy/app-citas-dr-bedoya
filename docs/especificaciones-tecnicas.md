# Especificaciones técnicas de App Citas Dr Camilo Bedoya

Versión 2.0 · 17 de noviembre de 2026 · Decisiones de negocio acordadas.

El documento separa el trabajo del frontend del trabajo del backend. La etapa actual implementará únicamente el frontend con datos simulados persistentes. Otra persona implementará el backend; su diseño, SQL, seguridad y contrato HTTP se conservan en la Parte II. Los ejemplos SQL describen trabajo por realizar: no se han creado ni desplegado migraciones.

## Parte I Frontend

### F1 Tecnologías y estilo de código

React Native, TypeScript y Expo SDK 58 como versión objetivo del proyecto; Expo Router; NativeWind 4.2.7 y Tailwind 3.4.19, observados en el proyecto de clase; Zustand, TanStack Query, Axios, Zod, AsyncStorage, OpenStreetMap, Leaflet, WebView y expo-location. Poppins para la interfaz y Libre Baskerville para el monograma, conservando los recursos de Figma.

El proyecto de referencia es `C:/Users/StivenM/Documents/react-native-parcial`: `navegacion-app` orienta componentes y rutas; `movies` orienta servicios, mappers y hooks. Se priorizan componentes pequeños, props mediante interfaces, funciones con nombres claros, imports con alias y separación entre rutas, consultas y reglas de negocio. No utilizar `any` para eludir TypeScript.

SDK 58 es una exigencia del proyecto; antes de instalar se comprobará su disponibilidad y compatibilidad en documentación oficial. No se deduce una versión de React Native a partir de la especificación anterior. Paquetes nativos con `npx expo install`; dependencias y versiones exactas en package.json y package-lock.json. Se mantiene npm para este proyecto, aunque una referencia use pnpm.

### F2 Reglas que debe representar la interfaz

- Un consultorio y un odontólogo; roles paciente y odontólogo. No hay pagos en línea ni historia clínica.
- El paciente respeta dos anticipaciones independientes: para agendar y para cancelar o reprogramar. Ambas se configuran entre 1 y 72 horas, en pasos de 1 hora; valor inicial de ejemplo: 24 horas. El límite exacto está permitido: debe faltar al menos el número de horas configurado.
- El odontólogo no está sujeto a esas anticipaciones al agendar, cancelar o reprogramar. Puede gestionar por llamada una excepción solicitada por el paciente. Sigue respetando horarios de atención, bloqueos y ausencia de solapamientos; la exención no autoriza agendar en el pasado.
- Las citas nuevas registradas por el odontólogo quedan confirmadas directamente, aunque el servicio normalmente requiera aprobación. Las del paciente quedan confirmadas o pendientes según el servicio.
- Una solicitud pendiente reserva su franja. Al llegar su hora de inicio sin respuesta pasa a vencida; ya no puede aprobarse ni tratarse como solicitud activa. Las citas confirmadas no vencen por esta regla.
- El paciente puede cancelar una cita pendiente o confirmada dentro del plazo. Al reprogramar debe respetar el plazo respecto de la cita original y la anticipación para agendar respecto del nuevo inicio. Se aplica nuevamente la regla de confirmación del servicio. Si falla el cambio, conserva la cita original.
- Cada cita conserva el precio en COP y la duración acordados al crearla. Editar el catálogo afecta citas nuevas, sin recalcular las existentes. Reprogramar conserva esos valores; el nuevo fin se calcula con la duración guardada.
- La disponibilidad se calcula por tramos libres de una fecha concreta, sin sumar huecos separados para encajar una cita. Los mensajes muestran la anticipación configurada, no un texto fijo de 24 horas.
- La información del consultorio continúa siendo de solo lectura. El catálogo permite configurar nombre, precio, duración y tipo de confirmación.

### F2.1 Servicio mock y persistencia de la demo

- Simular registro, login, roles, consultas, citas, solicitudes, bloqueos, catálogo, configuración y avisos. La cuenta demo del odontólogo se entrega preparada; el registro público crea pacientes.
- Guardar los cambios durante cada operación y esperar a que termine la escritura antes de anunciar éxito. No esperar al cierre de la app para persistir. Al abrir, hidratar antes de redirigir desde A00.
- Un paciente puede solicitar una cita, cerrar sesión, entrar como doctor en el mismo teléfono, aprobarla y volver como paciente para ver el resultado. No hay sincronización entre teléfonos ni autenticación real.
- Reutilizar datos guardados al reiniciar; cargar ejemplos solo si no existe almacenamiento. Un fallo al leer o escribir muestra error y permite reintentar, sin reemplazar silenciosamente los datos.
- Exponer funciones asíncronas tipadas mediante servicios; TanStack Query consume esas funciones. Axios queda preparado para el contrato remoto, pero una promesa local o un adaptador mock no se presenta como petición HTTP real.
- Proporcionar escenarios reproducibles de carga, vacío, error, franja ocupada y solicitud vencida. El fallo simulado de conexión no debe impedir distinguir una operación local de un envío remoto. El mapa sí requiere red para cargar sus teselas.
- Al hidratar, volver a primer plano, consultar solicitudes y antes de aprobar, actualizar las pendientes con `inicio <= ahora` a vencidas. Con la app abierta, programar la actualización al próximo vencimiento. Cerrada no ejecuta un servidor: al reabrir refleja el vencimiento efectivo desde la hora de inicio.
- Los avisos de la demo se conservan localmente. Push reales, cron y sincronización entre dispositivos pertenecen al backend. El mecanismo definitivo de recordatorios permanece pendiente; la demo no promete entrega con la app cerrada.
- La demo no guarda contraseñas reales ni solicita credenciales de producción. Su sesión y sus guardias de navegación representan los roles, sin ofrecer seguridad de servidor.

### F3 Cálculo de disponibilidad

La función pura `calcularFranjas` recibe fecha, duración válida, horario, citas activas, bloqueos puntuales y recurrentes, instante actual, rol y anticipación. Devuelve los tramos, la lista de franjas y su cantidad. Usa `America/Bogota` para interpretar fechas del consultorio.

1. Construir los intervalos de atención de la fecha y unir los rangos ocupados antes de restarlos, para no descontar dos veces un solapamiento.
2. Restar las citas pendientes no vencidas y confirmadas, y todos los bloqueos. Usar intervalos semiabiertos `[inicio, fin)`: una cita puede empezar justo cuando termina otra.
3. Para el paciente, recortar los tramos al instante `ahora + anticipacion_agendar_horas`; para el odontólogo, excluir solamente el pasado. Alinear hacia adelante a la cuadrícula de 15 minutos del consultorio.
4. En cada tramo efectivo `[a,b)`, ofrecer inicios `a, a+d, a+2d...` mientras `inicio+d <= b`, donde `d` es la duración. No crear franjas que crucen un bloqueo o el cierre.
5. Sumar `floor(longitud_tramo_efectivo / d)` por cada tramo. Esa cantidad coincide con la lista ofrecida para los mismos parámetros. Dos huecos de 30 minutos no permiten una cita de 45 minutos: el resultado es cero.
6. Al confirmar, volver a comprobar tiempo y disponibilidad. Si otra cita ocupa la franja, rechazar el intento y conservar el formulario para elegir otra.

S03 muestra la lista, sin recuperar el cuadro de cantidad eliminado del diseño. C02 conserva su pantalla y su tarjeta de cálculo, identificando la fecha y mostrando la disponibilidad para paciente de ese día; no presenta un número universal por servicio. La fecha puede seleccionarse dentro de la misma pantalla. Las cifras 7, 6 y 12 del prototipo son ejemplos, no resultados obligatorios sin un conjunto de datos reproducible.

La duración es editable además de ajustable con + y −, en pasos de 15, entre 15 y 180 minutos. Se rechazan vacío, texto no numérico, negativo, cero, fuera de rango y valores no múltiplos de 15. Los mensajes distinguen cada caso.

### F4 Rutas y navegación

La fuente visual es exclusivamente la página Flujo de navegación del Figma. Las rutas se ubican en `src/app/`, siguiendo el proyecto de referencia.

```
src/app/
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
  cita/[id]/index.tsx             M03 / O08 / M04 (vista según el rol; modal M05; estado M06)
  cita/[id]/reprogramar.tsx       M07 → M08
  solicitud/[id].tsx              O05
  consultorio.tsx                 P05
```

> El mapa del Figma dice `cita/[id].tsx`. Como esa ruta también tiene `cita/[id]/reprogramar`, en Expo Router el detalle va en `cita/[id]/index.tsx`.

Los modales de cerrar sesión (P06, O12) y cancelar (M05) son componentes de modal dentro de la pantalla, no rutas.

### F5 Estado y consultas

| Dónde | Qué | Ejemplo |
| --- | --- | --- |
| **TanStack Query** (consultas) | Consultas al servicio mock; al integrar, datos del servidor | Citas, servicios, disponibilidad, notificaciones |
| **Zustand** (estado compartido local) | Lo que comparten varias pantallas y no está en el servidor | `useSesionStore` (perfil y rol), `useAgendarStore` (servicio, fecha y franja elegidos entre S01 y S06; se limpia en S07/S08), `useMapaStore` (seguimiento `inactivo`/`activo`/`pausado`, permiso y última posición) |
| **useState / useEffect** | Estado de una sola pantalla | Valores del formulario, filtro de Mis citas, modal abierto |

**Claves de consulta y caché:**

| Clave | `staleTime` | Notas |
| --- | --- | --- |
| `['servicios']` | 10 min | Casi no cambia |
| `['configuracion']` | 10 min | Casi no cambia |
| `['citas', filtros]` | 30 s | Se invalida después de solicitar, cancelar, reprogramar o responder |
| `['cita', id]` | 30 s | Se invalida después de cancelar o reprogramar |
| `['disponibilidad', fecha, rol]` | 0 | Siempre fresca; se vuelve a consultar antes de confirmar |
| `['solicitudes']` | 30 s | Se invalida al responder |
| `['notificaciones']` | 30 s | También al volver a la app (integración de AppState con focusManager de TanStack Query) |

Toda consulta muestra carga, error con «Reintentar», vacío y sin conexión, con los componentes `Estado*` (G01 a G03).

La disponibilidad base puede cachearse por fecha; las franjas calculadas también dependen de rol, duración y tiempo actual. Al cambiar de usuario, limpiar las consultas del usuario anterior. Tras cada mutación, invalidar todas las listas, detalles, solicitudes, disponibilidad y avisos afectados, también al cambiar de rol en la demo.

Los datos persistentes pertenecen a un único repositorio mock versionado en AsyncStorage. TanStack Query no es la base de datos. Zustand mantiene sesión y borradores; no se persiste la posición GPS ni una suscripción activa. Los formularios y modales usan estado local.


### F6 Formularios

- Validación con **zod** y mensajes específicos en español. Los formularios se manejan con `useState` para que sea fácil explicarlos en la sustentación.
- `KeyboardAvoidingView` y `ScrollView` para que el teclado no tape los campos.
- **Precio del servicio (RF-30, C02):** obligatorio, solo números enteros en pesos y no negativo. Mensajes: «Escribe el precio del servicio.», «Escribe solo números, sin puntos ni signos.» y «El precio no puede ser negativo.».
- **Registro (RF-01):** nombre obligatorio; teléfono de 10 dígitos que empiece por 3; correo válido; contraseña de mínimo 8 caracteres con al menos una letra y un número, como dice A04.

El precio se escribe como entero sin separadores; el valor formateado se muestra fuera de la edición. Cerrar sesión borra la sesión activa y el borrador, no las citas ni los datos de otros usuarios de la demo.


### F7 Mapa y ubicación

- `assets/mapa.html` carga Leaflet 1.9.4 y teselas de OpenStreetMap, con la atribución obligatoria. La app y el mapa se comunican con `postMessage`: la app envía `{tipo: 'posicion', lat, lng}` o `{tipo: 'centrar'}`, y el mapa responde `{tipo: 'cargado'}` o `{tipo: 'error'}`.
- Marcadores distintos para el paciente y el consultorio. Las coordenadas del consultorio salen de `configuracion` (⚠ pendientes).
- **Estados:**
  - Sin permiso → MP03.
  - Permiso denegado → MP04, con `Linking.openSettings()`.
  - Sin ubicación → MP05: solo se ve el consultorio y agendar sigue funcionando.
  - GPS no disponible → MP06, con reintentar.
  - Falla de la WebView o sin red → MP07, con reintentar y «Ver dirección».
- No se dibujan rutas ni líneas entre los dos puntos: el curso pide no presentar una línea recta como si fuera una ruta.

### F8 Hooks propios

| Hook | Entradas | Estado y efectos | Resultado |
| --- | --- | --- | --- |
| `useFranjasDisponibles(servicio, fecha)` | Servicio y fecha | Consulta el servicio de disponibilidad (mock o remoto) y aplica `calcularFranjas` | `{ franjas, capacidad, cargando, error, reintentar }` |
| `useSeguimientoUbicacion()` | — | Pide el permiso en primer plano. `watchPositionAsync` al activar; `remove()` al pausar, al salir de la pantalla o al pasar a segundo plano (RF-27). Vuelve a revisar el permiso al volver de ajustes (RF-24) | `{ permiso, posicion, estado, activar, pausar, reanudar, centrar }` |
| `useConexion()` | — | Escucha NetInfo | `{ conectado }` para mostrar G02 y gestionar el fallo de un servicio remoto |
| `useGuardiaRol(rol)` | Rol esperado | Lee `useSesionStore` | Redirige o muestra G04 |

### F9 Organización del código

```text
src/
  app/                 Rutas de F4
  components/          Boton, Campo, TarjetaCita, ChipEstado, Aviso, Contador, Estado*, ModalConfirmacion
  hooks/               Consultas y lógica reutilizable
  services/
    mock/              Repositorio y almacenamiento de la demo
    api/               Contrato de servicios y futura implementación HTTP
    http/cliente.ts    Axios para la integración posterior
  types/api.ts         Interfaces de respuesta
  models/              Cita, Servicio, Franja, Perfil y Configuracion
  mappers/             Respuestas externas a modelos internos
  store/               Sesión, borrador de agendamiento y estado temporal del mapa
  utils/               franjas.ts, fechas.ts, validaciones.ts
  constants/           tema.ts y rutas.ts
assets/                Fuentes, logos y mapa.html
```

### F10 Ajustes del flujo que se resolverán al programar

- S06: servicio, duración, precio, confirmación y botón dependen de la selección; con aprobación, «Enviar solicitud» y resultado S08.
- O06: distinguir aprobación de rechazo en el aviso y el estado resultante.
- M08: la reprogramación hecha por el paciente vuelve a pendiente si el servicio requiere aprobación.
- O04 y O05: representar Vencida, mantenerla consultable como antecedente y deshabilitar Aprobar. La ubicación del filtro se resolverá dentro de las pantallas existentes, sin añadir una ruta.
- M06: mostrar «Para solicitar una excepción, llama al consultorio» y la anticipación vigente; el paciente sigue sin poder ejecutar el cambio fuera de plazo.
- O09: no filtrar con la anticipación del paciente; una cita registrada por el doctor termina confirmada.
- Conservar las pantallas de precio y duración. Guardar ambos valores en cada cita sin añadir una pantalla específica.
- Mantener Stack, Tabs y Drawer, los modales de confirmación y los estados de mapa del flujo. No copiar los toques artificiales del prototipo como lógica de la aplicación.

### F11 Verificación y entrega del frontend

Probar cálculo con huecos separados, intervalos contiguos, bloqueos solapados, límites de duración, anticipación exacta y paso del tiempo entre selección y confirmación. Probar cancelación fuera de plazo del paciente y excepción del doctor; vencimiento al inicio y prohibición de aprobación posterior; conservación de precio y duración tras editar y reprogramar; persistencia después de cerrar y abrir; separación de consultas al cambiar de rol; liberación del GPS al salir.

Ejecutar TypeScript y lint cuando exista código, probar en Android, registrar avances en `docs/bitacora.md` y relacionar requisito, pantalla, archivo y evidencia en `docs/matriz-requisitos.md` cuando se creen. `main` debe ser ejecutable; conservar commits en español, imperativos y sin coautor. La convención previa de ramas es `feature/<tema>`; no se crean ramas ni commits en esta revisión documental.

Orden: base y rutas; componentes, formularios y cálculo; persistencia y consultas mock; mapa y escenarios; prueba de uso y documentación. El backend se integra después, sin afirmar que los mocks cumplen HTTP o intercambio entre dispositivos de una entrega integrada.

## Parte II Backend

La persona responsable implementará Supabase Auth, PostgreSQL, RLS, RPC, Edge Functions y tareas programadas. El frontend cambia el proveedor mock por el remoto manteniendo modelos y firmas de servicio. El servidor es autoridad para rol, reloj, disponibilidad, vencimiento y persistencia; nunca confía en el rol enviado por el cliente.

### B1 Elección de Supabase

#### B1.1 Qué tiene que resolver la base

| Necesidad | De dónde sale |
| --- | --- |
| Datos compartidos entre el teléfono del paciente y el del odontólogo | Requisitos académicos §4 «Conservación de la información»: guardar solo en el teléfono no cumple |
| Dos pacientes no pueden quedarse con la misma franja, ni siquiera al mismo tiempo | RF-06, escenario 2 |
| Cada rol ve solo lo suyo | RF-03 |
| Cuentas con correo y contraseña y dos roles | RF-01, RF-02 |
| Consumirse por HTTP con Axios, con listado y detalle por id | Requisitos académicos §4 |
| Recordatorios y resumen diario aunque la app esté cerrada | RF-16, RF-17 |
| Sin construir un backend propio completo | Requisitos académicos §4 |

#### B1.2 Opciones comparadas

| Opción | A favor | En contra | Veredicto |
| --- | --- | --- | --- |
| **Supabase (PostgreSQL)** | Restricción de exclusión para RF-06 garantizada por la base. Row Level Security para RF-03. API REST automática que se consume con Axios. Auth incluida. pg_cron y Edge Functions para recordatorios. Plan gratuito | Hay que escribir SQL (tablas, políticas y funciones). Revisar las condiciones vigentes del plan antes del despliegue | **Elegida** |
| Firebase (Firestore) | Auth y push muy integrados | Sin restricciones de rango: evitar solapamientos exige transacciones o funciones a mano. El SDK no pasa por Axios, así que costaría cumplir el requisito HTTP. Reglas de seguridad menos expresivas para este caso | Descartada |
| Backend propio (Node + PostgreSQL) | Control total | Hay que construir, desplegar y mantener un servidor. El curso no lo exige | Descartada |
| SQLite o AsyncStorage locales | Funciona sin red | No se comparte entre dispositivos, así que no cumple el requisito de persistencia | Descartada |

**Límites que hay que documentar en el informe:** verificar las condiciones de disponibilidad del plan y la operatividad del proyecto antes de una demo. La clave pública (`publishable`/`anon`) viaja dentro de la app y no es un secreto; la seguridad la dan las políticas RLS.

### B2 Modelo de datos

#### B2.1 Diagrama

```
auth.users 1─1 perfiles 1─0..1 pacientes 1─* citas *─1 servicios
                  │                          │
                  └─1─* notificaciones *─0..1┘
                  └─1─* tokens_push
horario_atencion   bloqueos_recurrentes   bloqueos   configuracion (1 fila)
```

#### B2.2 Tablas

| Tabla | Para qué | Campos principales |
| --- | --- | --- |
| `perfiles` | Datos y rol de cada cuenta (1 a 1 con `auth.users`) | `id`, `rol` (`paciente`/`odontologo`), `nombre`, `telefono`, `correo` |
| `pacientes` | Paciente como persona. Puede no tener cuenta si el doctor lo agendó por teléfono (RF-07) | `id`, `perfil_id` (opcional), `nombre`, `telefono`, `correo` |
| `servicios` | Catálogo con duración, precio y tipo de confirmación (RF-08, RF-10, RF-28, RF-30) | `nombre`, `duracion_min` (15–180, múltiplo de 15), `precio_cop`, `confirmacion` (`inmediata`/`aprobacion`), `activo` |
| `horario_atencion` | Horario por día de la semana | `dia_semana` (0 = domingo), `hora_inicio`, `hora_fin` |
| `bloqueos_recurrentes` | Bloqueos que se repiten, como el almuerzo | `dia_semana`, `hora_inicio`, `hora_fin`, `motivo` |
| `bloqueos` | Bloqueos puntuales (RF-19) | `rango` (`tstzrange`), `motivo` |
| `configuracion` | Una sola fila con reglas y datos del consultorio | `anticipacion_agendar_horas`, `anticipacion_cambios_horas` (RF-15), `recordatorio_horas_antes`, `direccion`, `telefono`, `latitud`, `longitud` |
| `citas` | Citas y solicitudes | `paciente_id`, `servicio_id`, `inicio`, `fin`, `estado`, `origen` (`app`/`consultorio`), `recordatorio_enviado_para`, `precio_acordado_cop`, `duracion_acordada_min` |
| `notificaciones` | Avisos de P03 y O11, que también alimentan los push (RF-11, RF-13, RF-16, RF-17) | `destinatario_id`, `cita_id`, `tipo`, `titulo`, `cuerpo`, `leida`, `enviada_push` |
| `tokens_push` | Token de Expo Push de cada dispositivo | `perfil_id`, `token` |

Estados de una cita: `pendiente` → `vencida` al llegar `inicio` sin respuesta; no admite aprobación posterior. Los precios y duraciones acordados se copian del servicio al crear y no cambian al editar el catálogo ni al reprogramar.

Otras transiciones: `pendiente` → `confirmada` o `rechazada`; `pendiente` o `confirmada` → `cancelada`. Una cita **ocupa su franja** mientras está `pendiente` o `confirmada` (RF-09, escenario 1).

#### B2.3 Esquema SQL inicial

Va en `supabase/migrations/0001_esquema.sql`. Las funciones y políticas van en migraciones aparte (B3).

```sql
create extension if not exists btree_gist;

create type rol_usuario       as enum ('paciente', 'odontologo');
create type tipo_confirmacion as enum ('inmediata', 'aprobacion');
create type estado_cita       as enum ('pendiente', 'confirmada', 'rechazada', 'cancelada', 'vencida');
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
  anticipacion_agendar_horas int not null default 24 check (anticipacion_agendar_horas between 1 and 72), -- para agendar
  anticipacion_cambios_horas int not null default 24 check (anticipacion_cambios_horas between 1 and 72), -- para cancelar o reprogramar (RF-15)
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
  precio_acordado_cop       int not null check (precio_acordado_cop >= 0),
  duracion_acordada_min     int not null check (duracion_acordada_min between 15 and 180 and duracion_acordada_min % 15 = 0),
  inicio                    timestamptz not null,
  fin                       timestamptz not null check (fin > inicio),
  constraint fin_segun_duracion check (fin = inicio + duracion_acordada_min * interval '1 minute'),
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

#### B2.4 Datos iniciales (`supabase/seed.sql`)

Valores representativos conservados de la especificación anterior; horario, precios y coordenadas deben confirmarse con el cliente. El archivo Datos_ejemplo_wireframes.md no está disponible y no se usa como dependencia de esta versión:

- **Horario:** lunes a viernes de 8:00 a. m. a 6:00 p. m.; sábado de 8:00 a. m. a 12:00 m.; domingo cerrado.
- **Almuerzo:** bloqueo recurrente de 12:30 a 1:30 p. m. de lunes a viernes.
- **Servicios:** Valoración general (30 min, $60.000, inmediata), Limpieza dental (45 min, $120.000, inmediata), Resina (60 min, $180.000, con aprobación) y Endodoncia (90 min, $450.000, con aprobación). Los precios son de ejemplo hasta que el cliente los confirme.
- **Configuración:** 24 h de anticipación para agendar y 24 h para cancelar o reprogramar, recordatorio 24 h antes, Calle 18 # 5-27, Edificio Torcoroma, Consultorio 201, Pereira. Las coordenadas están pendientes.
- **Agenda del jueves 19 de noviembre de 2026:** las citas de ejemplo (Carlos Ruiz, Laura Pérez, Ana Gómez, Jorge Díaz, Sofía Mejía).

### B3 Seguridad por rol

Una función auxiliar `es_odontologo()` (`security definer`) consulta el rol del usuario actual.

| Tabla | Paciente | Odontólogo |
| --- | --- | --- |
| `perfiles` | Lee y edita solo el suyo | Lee todos |
| `pacientes` | Lee solo su fila (`perfil_id = auth.uid()`) | Todo |
| `citas` | **Solo lectura** de sus citas. Crear, cancelar y reprogramar se hace solo con las funciones de B4 | Lectura autorizada; mutaciones solo a través de las funciones |
| `servicios`, `horario_atencion`, `bloqueos_recurrentes`, `configuracion` | Lectura | Lectura; catálogo y anticipaciones se editan por operaciones autorizadas |
| `bloqueos` | No lee la tabla; ve la ocupación con `disponibilidad_dia` | Lectura; creación solo por RPC y eliminación autorizada |
| `notificaciones` | Solo las suyas; puede marcarlas como leídas | Solo las suyas |
| `tokens_push` | Solo los suyos | Solo los suyos |

**Clave para RF-03:** el paciente necesita saber qué horas están ocupadas sin ver de quién son las citas. Para eso existe `disponibilidad_dia`, que devuelve solo rangos de tiempo, sin nombres ni servicios.

La información de contacto del consultorio es de solo lectura desde la app. Las políticas no deben permitir elevar el rol editando el propio perfil, modificar precio o duración acordados desde el cliente ni escribir directamente en citas evitando las RPC. El rol sale de auth.uid().

Para crear una cita o un bloqueo se debe serializar la validación y escritura de ocupación por consultorio y fecha, en una transacción (por ejemplo, con bloqueo transaccional compartido por ambas RPC). La exclusión entre citas no impide por sí sola una carrera entre una cita y un bloqueo; un trigger aislado tampoco garantiza esa exclusión concurrente. Todas las mutaciones afectadas deben usar el mismo mecanismo.


### B4 Operaciones y transiciones

Todas las RPC verifican autenticación, rol, propiedad y parámetros; fijan un search_path seguro y ejecutan validación y escritura de forma atómica. Las restricciones de la base complementan esas comprobaciones.

| Operación | Regla |
| --- | --- |
| `disponibilidad_dia(fecha)` | Devuelve horario y rangos ocupados, sin datos personales ajenos al paciente. Actualiza o excluye pendientes ya vencidas. El frontend calcula F3. |
| `solicitar_cita(servicio_id, inicio)` | Solo paciente. Valida anticipación para agendar, horario, bloqueos y cruces; copia precio y duración y decide pendiente o confirmada según servicio. |
| `registrar_cita_consultorio(nombre, telefono, servicio_id, inicio)` | Doctor. Busca o crea paciente, copia precio y duración, origen consultorio y estado confirmada. Sin anticipación mínima, pero con inicio futuro y disponibilidad válida. |
| `cancelar_cita(cita_id)` | Pendiente no vencida o confirmada futura. Paciente: propiedad y plazo de cambios. Doctor: exento del plazo. Libera la franja y crea aviso para el destinatario correspondiente. |
| `reprogramar_cita(cita_id, nuevo_inicio)` | Cambio atómico. Paciente: propiedad, plazo de cambios de la cita original y anticipación de agendamiento del nuevo inicio; reaplica confirmación del servicio. Doctor: exento de anticipaciones. Ambos: disponibilidad válida y duración/precio acordados intactos. Si falla, conserva la cita anterior. |
| `responder_solicitud(cita_id, aprobar)` | Solo doctor, solo pendiente y `ahora < inicio`. Con `ahora >= inicio`, persistir vencida y devolver `SOLICITUD_VENCIDA` sin aprobar. Rechazar y aprobar generan estados y avisos diferentes. |
| `vencer_solicitudes()` | Operación interna idempotente: pendientes con `inicio <= ahora` pasan a vencida. Aviso asociado una sola vez; no modifica citas confirmadas. |
| `crear_bloqueo(inicio, fin, motivo)` | Solo doctor. Rechaza cruce con citas activas y otros bloqueos, dentro de la transacción común de ocupación. |

El error SOLICITUD_VENCIDA debe comunicarse sin deshacer la escritura del vencimiento: devolver un resultado de negocio, o resolver el vencimiento en una transacción independiente antes del error. No actualizar a vencida y luego lanzar una excepción que revierta ese cambio.

Los triggers de citas crean avisos según transición y actualizan actualizado_en. En registro, el perfil público siempre es paciente. La creación inicial del doctor es administrativa. La vinculación de un paciente sin cuenta por teléfono sigue siendo propuesta pendiente de definir y verificar; no atribuir citas a una cuenta solo por un número no verificado.

### B5 Vencimiento y recordatorios

El vencimiento es efectivo en la hora de inicio. El job de vencimientos materializa el estado, pero ninguna lectura operativa o aprobación puede depender de que el job haya corrido: debe comprobar `inicio <= reloj_servidor`. Programar ejecución frecuente y comprobar las pendientes antes de mutaciones. Un cliente desconectado verá la actualización al sincronizar.

#### B5.1 Propuesta de recordatorios y resumen diario

- **pg_cron** ejecuta cada 15 minutos la Edge Function `enviar-notificaciones`.
- **Recordatorio (RF-16):** citas `confirmada` cuyo `inicio − recordatorio_horas_antes ≤ ahora < inicio` y cuyo `recordatorio_enviado_para` sea distinto de `inicio`. Crea la notificación y guarda `recordatorio_enviado_para = inicio`.
  - Si la cita se cancela, deja de estar confirmada y no se envía nada (escenario 2).
  - Si se reprograma, cambia `inicio` y se programa un recordatorio nuevo.
- **Resumen del día (RF-17):** a la hora de inicio de la jornada (8:00 a. m. en Bogotá), una notificación para el odontólogo con las citas confirmadas del día.
- **Envío:** la misma función manda por **Expo Push** las notificaciones con `enviada_push = false` a los tokens del destinatario, y las marca como enviadas.

Se mantienen como propuestas por confirmar los 24 h de recordatorio, la hora del resumen y el mecanismo push/local. Un recordatorio se basa en el inicio vigente y nunca en una solicitud vencida. Al reprogramar o cancelar, anular el recordatorio anterior. El resumen diario incluye las confirmadas; las pendientes pueden mostrarse aparte sin presentarlas como confirmadas.

### B6 Contrato HTTP y errores


#### B6.1 Cliente

`src/services/http/cliente.ts` centraliza la configuración:

- `baseURL = ${EXPO_PUBLIC_SUPABASE_URL}/rest/v1`
- Cabeceras `apikey` y `Content-Type: application/json`.
- Un interceptor de petición añade `Authorization: Bearer <access_token>` con la sesión actual de supabase-js, que refresca el token sola.
- Un interceptor de respuesta convierte los errores en un `ErrorApi` tipado (B6.4).
- Timeout de 10 s.

supabase-js se usa **solo para Auth**: registro, login, logout, sesión y escucha de cambios. Todos los datos pasan por Axios.

#### B6.2 Endpoints

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

#### B6.3 Tipos y mappers

- `src/types/api.ts`: interfaces **tal como llegan** de la API (`snake_case`), por ejemplo `CitaRespuesta`.
- `src/models/`: modelos internos (`camelCase`, fechas como `Date`), por ejemplo `Cita`, `Servicio` y `Franja`.
- `src/mappers/`: funciones puras como `mapCita(r: CitaRespuesta): Cita`, con pruebas unitarias.
- Prohibido usar `any`. Los resultados de funciones usan tipos explícitos, por ejemplo `ResultadoFranjas = { franjas: Franja[]; capacidad: number }`.

#### B6.4 Errores

| Código | Origen | Mensaje para el usuario | Pantalla |
| --- | --- | --- | --- |
| `HORARIO_NO_DISPONIBLE` | Exclusión `23P01` o validación de la RPC | «Ese horario acaba de ocuparse. Elige otro.» | S05 |
| `FUERA_DE_PLAZO` | `cancelar_cita` / `reprogramar_cita` | «No se cumple la anticipación de {horas} h. Llama al consultorio para solicitar una excepción.» | M06 |
| `CHOQUE_CON_CITA` | `crear_bloqueo` | «Hay una cita en esa franja. Cancélala o reprográmala primero.» | C06 |
| `FUERA_DE_HORARIO` | RPC | «Ese horario está fuera de la atención del consultorio.» | — |
| `FUERA_DE_ANTICIPACION` | `solicitar_cita` | «Las citas se agendan con al menos {horas} h de anticipación.» | S03 |
| `NO_AUTORIZADO` | RLS / RPC | Pantalla de acceso denegado | G04 |
| `SIN_CONEXION` | Axios sin respuesta | «Sin conexión. Revisa tu internet e intenta de nuevo.» | G02 |
| `SOLICITUD_VENCIDA` | Reloj del servidor y estado de solicitud | «Esta solicitud venció al llegar la hora de la cita.» | O04, O05 y detalle del paciente |
| `CORREO_EN_USO` | Supabase Auth | «Este correo ya está registrado.» | A05 |
| `CREDENCIALES_INVALIDAS` | Supabase Auth | «Correo o contraseña incorrectos.» | A03 |

Las respuestas de citas incluyen precio_acordado_cop y duracion_acordada_min; el detalle no los deriva del catálogo actual. ErrorApi incluye código y, cuando corresponde, anticipacionHoras para construir el mensaje. `vencida` forma parte del tipo de estado y los filtros. Listado y detalle usan los mismos identificadores que el mock y no exponen información ajena al rol.

### B7 Notificaciones y despliegue


| Tipo | Cómo llega |
| --- | --- |
| Aviso en la app (P03, O11) | Siempre. Es la fuente principal y funciona en Expo Go |
| Push (RF-11, RF-13, RF-16, RF-17) | Expo Push desde la Edge Function |

La especificación anterior requiere un development build para push en Android; confirmar los requisitos de Expo Notifications y del SDK elegido al integrar. Para probar push hace falta un **development build**: `expo-dev-client` + EAS Build (perfil `development`), con credenciales de Firebase Cloud Messaging. Opciones:

1. **Recomendada:** desarrollar en Expo Go y generar un development build o APK con EAS para probar push y para la demo con el cliente.
2. **Plan B:** sin build propio, mostrar los avisos dentro de la app y programar el recordatorio RF-16 como notificación local al confirmar la cita (y cancelarla al cancelar o reprogramar). Desventaja: si el odontólogo cancela desde su teléfono, el recordatorio local del paciente no se entera hasta que el paciente abra la app.

La integración de Auth usará `src/lib/supabase.ts` y persistirá la sesión según las recomendaciones del SDK. Antes de implementarla, verificar compatibilidad exacta de SDK 58 y dependencias. La propuesta anterior de Supabase JS 2.x, Axios 1.x, TanStack Query 5.x, Zustand 5.x y Zod 4.x es una referencia a validar, no un lockfile. date-fns y @date-fns/tz quedan previstos para fechas.

```text
supabase/
  migrations/0001_esquema.sql
  migrations/               Políticas, RPC, triggers y jobs
  seed.sql
  functions/enviar-notificaciones/
```

`.env.template` para la futura integración:

```text
EXPO_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=<clave publishable o anon del proyecto>
```

No se requiere Supabase para la demo mock. La clave pública no es un secreto; RLS protege los datos. Nunca incluir service_role ni secretos de Edge Functions en la app o el repositorio. Conservar `.env` excluido.

Comandos previstos una vez exista la implementación: `npm install`, `npx expo start`, `npx supabase db push` y `npx eas-cli@latest build -p android --profile development`. Cargar el seed con el procedimiento soportado por la versión de Supabase CLI elegida o con el SQL Editor. No afirmar que estos comandos ya ejecutan este repositorio, que todavía contiene documentación.

### B8 Validación y coordinación con frontend

El backend debe demostrar concurrencia entre dos solicitudes de la misma franja y entre cita/bloqueo; RLS por rol; excepciones del doctor sin violar disponibilidad; rechazo de aprobación al inicio exacto; transiciones idempotentes; precio y duración históricos; reprogramación atómica y deduplicación de avisos. La prueba integrada exige dos dispositivos y HTTP real con Axios, listado y detalle por id.

El frontend entrega modelos, interfaces de respuesta, mappers, firmas de servicio, códigos de error y escenarios mock; el backend entrega URL, clave pública, cuenta de prueba, esquema aplicado y datos de prueba compatibles. Las claves de caché se invalidan después de cada mutación. Conservar una matriz de responsabilidades para no presentar simulación como funcionalidad remota terminada.

### B9 Pendientes que no cambian las decisiones cerradas

- Confirmar horario, almuerzo, servicios, precios, teléfono y coordenadas reales del consultorio.
- Definir recordatorios y resumen diario (horario, canal y build requerido).
- Definir vinculación segura de pacientes que llamaron y después crean cuenta; la propuesta original usaba teléfono, pero requiere verificación.
- Definir si una reprogramación hecha por el doctor de un servicio con aprobación confirma directamente o conserva el estado previo. Lo acordado de confirmación directa cubre citas nuevas registradas por él; el paciente sí reaplica la regla del servicio.
- Confirmar requisitos de verificación de correo de Supabase para que el registro y la sesión inicial coincidan con RF-01.
- Validar versiones exactas al crear el proyecto y conservar las dependencias de clase compatibles con SDK 58.

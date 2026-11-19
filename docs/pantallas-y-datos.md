# Pantallas y datos

Qué lee y qué escribe cada pantalla del Figma («Flujo de usuario por rol») en la base de Supabase. Sirve para construir los servicios de `src/services/api/` y para revisar que ninguna pantalla pida un dato que la base no tiene.

Se revisó contra los textos de las 58 pantallas de alta fidelidad el 17 de noviembre de 2026. Las consultas usan Axios contra `/rest/v1`; «RPC» es `POST /rest/v1/rpc/<función>`.

## Paciente

### 1 · Acceso e inicio de sesión

| Pantalla | Ruta | Lee | Escribe / acción |
| --- | --- | --- | --- |
| A00 Splash | `app/index.tsx` | Sesión de supabase-js + `perfiles.rol` (su propio perfil) | Redirige con `replace` a P01 o O01 |
| A01 Bienvenida | `(auth)/bienvenida.tsx` | — | — |
| A02 / A03 Iniciar sesión | `(auth)/login.tsx` | — | `supabase.auth.signInWithPassword`. Error → A03 «Correo o contraseña incorrectos» |
| A04 / A05 Crear cuenta | `(auth)/registro.tsx` | — | `supabase.auth.signUp` con `options.data = { nombre, telefono }`. El trigger `nuevo_usuario` crea el perfil y la ficha de paciente (o la vincula si el teléfono ya existía). Correo repetido → A05 |

### 2 · Agendar cita

| Pantalla | Ruta | Lee | Escribe / acción |
| --- | --- | --- | --- |
| S01 Servicio | `agendar/index.tsx` | `servicios` (`activo = true`): nombre, `duracion_min`, `precio_cop`, `confirmacion`. Búsqueda y filtro «Inmediata / Con aprobación» en la app | Guarda el servicio en `useAgendarStore` |
| S02 Fecha | `agendar/fecha.tsx` | `horario_atencion` (días cerrados: domingo) | Guarda la fecha |
| S03 / S04 / S05 Horario | `agendar/horario.tsx` | RPC `disponibilidad_dia(fecha)` → `calcularFranjas`. Sin franjas → S04 | Guarda la franja. Si al confirmar llega `HORARIO_NO_DISPONIBLE`, se vuelve aquí con el aviso de S05 |
| S06 Resumen | `agendar/resumen.tsx` | Store + `configuracion.lugar`, `anticipacion_cambios_horas` + `perfiles.nombre` (propio) | RPC `solicitar_cita(servicio_id, inicio)` |
| S07 / S08 Resultado | `agendar/resultado.tsx` | La cita que devuelve la RPC (`estado` confirmada → S07, pendiente → S08) + `configuracion.lugar`, `direccion` | `replace` y reinicio del Stack |

### 3 · Mis citas, detalle y cambios

| Pantalla | Ruta | Lee | Escribe / acción |
| --- | --- | --- | --- |
| M01 / M02 Mis citas | `(tabs)/mis-citas.tsx` | `citas` con `servicio:servicios(...)` (RLS: solo las suyas). Filtros: Próximas (`inicio >= ahora`, activas), Pendientes, Pasadas, Canceladas. Búsqueda por servicio o fecha | — |
| M03 Detalle | `cita/[id]/index.tsx` | `citas?id=eq.{id}`: `numero` («Cita #A-1024»), estado, servicio, `inicio`/`fin`, + `configuracion.lugar`, `direccion`, `anticipacion_cambios_horas` («Puedes cancelar o reprogramar hasta…»). Vacío → M04 | — |
| M05 Cancelar (modal) | en `cita/[id]` | — | RPC `cancelar_cita(id)` → M01 con aviso |
| M06 Fuera de plazo | en `cita/[id]` | La app calcula «faltan N horas»; si llega `FUERA_DE_PLAZO`, también. `configuracion.telefono` para «Llamar al consultorio» | — |
| M07 Reprogramar | `cita/[id]/reprogramar.tsx` | RPC `disponibilidad_dia` para cada día | RPC `reprogramar_cita(id, nuevo_inicio)` |
| M08 Reprogramada | `cita/[id]/index.tsx` | Igual que M03, con los datos nuevos | — |

### 4 · Mapa

| Pantalla | Ruta | Lee | Escribe / acción |
| --- | --- | --- | --- |
| MP01–MP07 | `(tabs)/mapa.tsx` | `configuracion.latitud`, `longitud`, `lugar`, `direccion` + próxima cita propia («Tu cita de hoy»). La ubicación del paciente **no** se guarda | — |

### 5 · Menú lateral

| Pantalla | Ruta | Lee | Escribe / acción |
| --- | --- | --- | --- |
| P01 Inicio | `(tabs)/index.tsx` | Próxima cita activa propia, conteo de próximas y pendientes, `perfiles.nombre` | — |
| P02 Drawer | `(paciente)/_layout.tsx` | `perfiles.nombre`, `correo` | — |
| P03 Notificaciones | `(paciente)/notificaciones.tsx` | `notificaciones` propias (tipos confirmada, rechazada, cancelada, reprogramada, cita_registrada). El tipo `recordatorio` no se lista aquí: llega como push y como aviso en P01 | `PATCH leida = true`. Tocar → `cita/[cita_id]` |
| P04 Perfil | `(paciente)/perfil.tsx` | `perfiles` propio | `PATCH perfiles` (solo `nombre` y `telefono`; el trigger actualiza la ficha del paciente). El correo es de solo lectura |
| P05 Consultorio | `app/consultorio.tsx` | `configuracion` (`nombre_profesional`, `especialidad`, `lugar`, `direccion`, `anticipacion_cambios_horas`) + `horario_atencion` + `bloqueos_recurrentes` (almuerzo) | — |
| P06 Cerrar sesión | modal | — | `supabase.auth.signOut` → A01 con `replace` |

## Odontólogo

| Pantalla | Ruta | Lee | Escribe / acción |
| --- | --- | --- | --- |
| O01 / O02 / O10 Agenda | `(odontologo)/(principal)/(tabs)/index.tsx` | `citas` del día o la semana con `paciente:pacientes(nombre,telefono)` y `servicio:servicios(...)`, todas las de estado; `bloqueos` y `bloqueos_recurrentes`. Contadores por estado | — |
| O03 Drawer | `(odontologo)/_layout.tsx` | `perfiles.nombre` + `configuracion.lugar` | — |
| O04 / O06 / O07 Solicitudes | `(tabs)/solicitudes.tsx` | Pendientes: `estado = pendiente`. Aprobadas: `estado = confirmada` y `respondida_en` no nulo. Rechazadas: `estado = rechazada` | RPC `responder_solicitud(id, aprobar)` |
| O05 Detalle de solicitud | `solicitud/[id].tsx` | `citas?id=eq.{id}` con paciente (nombre, teléfono) y servicio | RPC `responder_solicitud` |
| O08 Detalle de cita | `cita/[id]/index.tsx` (vista odontólogo) | Igual que M03 + paciente (nombre, teléfono) + `origen` y `creado_por` («Agendada por») | RPC `cancelar_cita`, `reprogramar_cita` (sin límite de anticipación) |
| O09 Nueva cita | `(tabs)/nueva-cita.tsx` | `servicios`, RPC `disponibilidad_dia` | RPC `registrar_cita_consultorio(nombre, telefono, servicio_id, inicio)` → O10 |
| O11 Avisos | `(tabs)/avisos.tsx` | `notificaciones` propias: resumen_dia, solicitud_nueva, cancelada, reprogramada | `PATCH leida`. Tocar → O08 o O05 según el estado de la cita |
| C01 Servicios | `servicios/index.tsx` | `servicios` (todos) | «+ Nuevo servicio» → `POST servicios` |
| C02 / C03 Editar servicio | `servicios/[id].tsx` | `servicios?id=eq.{id}` + `horario_atencion` y `bloqueos_recurrentes` para la capacidad | `PATCH servicios` (nombre, precio, duración, confirmación) |
| C04 Anticipación | `anticipacion.tsx` | `configuracion` | `PATCH configuracion` (`anticipacion_agendar_horas`, `anticipacion_cambios_horas`, de 1 a 72) |
| C05 / C06 / C07 Bloqueos | `bloqueos.tsx` | Citas del día con paciente, `bloqueos` (con `motivo`, p. ej. «Ausencia»), `bloqueos_recurrentes` | RPC `crear_bloqueo(inicio, fin, motivo)`; `CHOQUE_CON_CITA` → C06. Desbloquear: `DELETE bloqueos?id=eq.{id}` |
| C08 / C09 / C10 Horario de atención | `horario.tsx` | `horario_atencion` (un día sin fila = cerrado) y `bloqueos_recurrentes` con `motivo = 'Almuerzo'` | C08: interruptor por día (abierto o cerrado) y almuerzo. C09: hoja para elegir la hora de apertura y de cierre de un día; la app valida que el cierre sea posterior a la apertura. «Guardar» → RPC `actualizar_horario(dias, almuerzo)`; si alguna cita activa futura queda fuera del nuevo horario, la RPC devuelve `CITAS_FUERA_DE_HORARIO` con la lista de citas → C10 las muestra y cada una abre su detalle |
| O12 Cerrar sesión | modal | — | `supabase.auth.signOut` → A01 |

## Estados globales

| Pantalla | Cuándo |
| --- | --- |
| G01 Cargando | Mientras una consulta de TanStack Query está en `isLoading` |
| G02 Sin conexión | NetInfo sin red, o Axios sin respuesta (`SIN_CONEXION`). No se envían RPC sin red |
| G03 Error | Cualquier otro error del servicio, con «Reintentar» |
| G04 Acceso denegado | La guardia de cada `_layout` ve un rol distinto, o la base responde `NO_AUTORIZADO` |

## Datos que se agregaron al revisar el Figma

| Pantalla | Dato | Cambio en la base |
| --- | --- | --- |
| M03, M05, M06, M08 | «Cita #A-1024» | `citas.numero` (consecutivo desde 1001) |
| O04 | Pestaña «Aprobadas» | `citas.respondida_en` |
| P05, O03, S06, S07, M03, mapa | Nombre del doctor, especialidad, «Consultorio 201, Ed. Torcoroma», «Calle 18 # 5-27, Pereira» | `configuracion.nombre_profesional`, `especialidad`, `lugar`, `direccion` |
| C04 | Mínimo 1 h, máximo 72 h | Restricción `between 1 and 72` |
| C08 | El odontólogo edita su horario y el almuerzo | Ninguna en las tablas (ya existen y el odontólogo puede escribirlas). RPC `actualizar_horario` |
| P04 | Editar nombre y teléfono | Trigger que actualiza también la ficha del paciente |
| P03, O11 | «Jue 19 nov, 11:00 a. m.» y «Resumen del día · jueves 19 — 4 citas confirmadas y 1 pendiente · Primera cita…» | Formato de fechas en español en los avisos, sin depender del idioma del servidor |

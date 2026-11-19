# Bitácora de avances

Requisito del curso (sección 7 del documento del proyecto). Una fila por avance o PR, agregada después de cada merge.

| Fecha | Objetivo de clase | Tarea realizada | Responsable | PR / commit | Dificultad | Observación del docente | Siguiente paso |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-09 | Hito 1 · Definición | Diseño completo en Figma: wireframes, flujo de navegación y alta fidelidad | | | | | Revisión del equipo |
| 2026-11-10 | Hito 1 · Definición | Especificación técnica, feedback del equipo (precios, anticipación para agendar, flujo por rol) y prueba del prototipo | | | | | Base de datos |
| 2026-11-17 | Hito 1 · Definición | Base de datos en Supabase: tablas, reglas, seguridad por rol, datos de ejemplo y pruebas | | | | | Crear el proyecto Expo |
| 2026-11-17 | Hito 2 · Interfaz y lógica | Frontend completo de los dos roles (A, P, S, M, O, C y MP) con datos simulados persistentes, Stack, Tabs y Drawer, contador, cálculo de franjas, formularios y mapa | John Stiven | #4 | Rutas del Drawer dentro de Fragment no se registraban en Expo Router 58 | | Conectar con Supabase |
| 2026-11-17 | Hito 2 · Interfaz y lógica | Diseño de C08–C10 «Horario de atención» (Figma y especificación) y C05 con el diseño nuevo en alta fidelidad | Juan José Ospina | #5 | Regla de citas que quedan fuera del horario: se propuso igual que C06 (por confirmar) | | Programar C08 |
| 2026-11-17 | Hito 3 · Datos y ubicación | Capa remota: cliente Axios con token, Supabase Auth, traducción de errores, mappers y pruebas (reemplaza los PR #2 y #3) | Juan José Ospina | #6 | Los PR #2 y #3 chocaban con la estructura del #4 | | Migraciones que faltaban |
| 2026-11-18 | Hito 4 · Integración | Base: estado vencida, precio y duración acordados, RPC actualizar_horario; pruebas de la base sin depender de la hora | Juan José Ospina | #7, #9 | Postgres no deja usar un valor nuevo de un enum en la misma transacción; dos pruebas fallaban según la hora | | Aplicar en Supabase |
| 2026-11-18 | Hito 2 · Interfaz y lógica | Pantallas C08–C10: horario por día, edición en pasos de 15 min y aviso de citas fuera del horario | Juan José Ospina | #8 | Las hojas inferiores perdían el margen en la web | | Integración remota |
| 2026-11-18 | Hito 3 · Datos y ubicación | App conectada a Supabase: Auth real, listado y detalle de citas por HTTP con Axios, RPC para las escrituras y datos de prueba para presentar | Juan José Ospina | #10 | El paciente no ve citas ajenas: sus franjas salen de disponibilidad_dia; `declare` rompía el empaquetado de Metro | | Prueba en Android y con el cliente |
| 2026-11-18 | Hito 4 · Integración | Concurrencia entre citas y bloqueos (B3): candado por fecha en la base, aplicado en Supabase; bitácora, matriz académica, informe y guía de prueba con el cliente | Juan José Ospina | #11, #12, #13 | Una función STABLE no veía la fila que otra transacción acababa de confirmar | | Prueba en Android y con el cliente |

## Implementación del frontend en revisión

## 17 de noviembre de 2026

Objetivo: implementar el frontend del flujo de navegación con datos simulados persistentes y las reglas consensuadas.

Trabajo realizado: base Expo SDK 58 y configuración NativeWind; Stack, Drawer y Tabs por rol; componentes tipados; formularios; cálculo de franjas; repositorio AsyncStorage; citas, solicitudes, servicios, anticipaciones y bloqueos; avisos locales; mapa con Leaflet y gestión de permisos. Se conservaron los documentos y el diseño del backend.

Responsable y revisión de cada integrante: por confirmar en la revisión del PR. Observación del docente pendiente.

Evidencia: código en src; pruebas en tests; matriz en docs/matriz-requisitos.md. En navegador se creó una solicitud como paciente, se recargó para comprobar persistencia, se cerró sesión y se aprobó como doctor. También se registró una cita de Resina para el mismo día desde el doctor, quedando confirmada directamente.

Dificultades resueltas: aislamiento del servidor local durante la verificación; configuración de modo de color con NativeWind; declaración explícita de pantallas del Drawer en Expo 58; tipado genérico de WebView; prioridad de clases en componentes de texto.

Siguiente paso de validación: probar la app en Android real con Expo Go compatible, comprobar permisos/GPS/segundo plano y confirmar coordenadas y teléfono del consultorio. La integración con el backend, la sincronización entre dispositivos y los push requieren coordinación con la otra persona responsable.

### Corrección de navegación del menú

Se reprodujo que Mi perfil cerraba el menú y dejaba visible el inicio. Las pantallas adicionales de ambos roles estaban dentro de Fragment, que Expo Router ignora al registrar las rutas del Drawer. Se declararon directamente sus componentes Screen en MenuRol.

Verificación en navegador: Mi perfil, Notificaciones desde menú y campana, Anticipación mínima, Bloquear horarios y Servicios y confirmación abren su contenido. También se comprobó el regreso desde las pantallas del menú. TypeScript y ESLint pasaron. La comprobación de esta corrección en Expo Go desde un teléfono sigue pendiente.

### Preparación del PR

Rama `codex/frontend-citas-flujo-completo`, con los cambios recientes de main integrados y sin modificar el backend. Se conservó el historial previo de la bitácora y la configuración pública para la integración de Supabase. El frontend pasó TypeScript, ESLint y sus 32 pruebas después de combinar ambas ramas.

La suite existente de `supabase/pruebas` presentó dos fallos: «Cita de Ana muy cercana» devuelve FUERA_DE_HORARIO y «RF-12 cancelar con menos de 24 h» devuelve CITA_NO_EXISTE. El primer caso calcula su inicio con `date_trunc('hour', now()) + interval '3 hours'`; el segundo depende de esa cita. Los archivos de supabase son idénticos a origin/main y no se cambiaron pruebas ni migraciones. Se abre el PR en borrador con estos resultados y la validación Android pendiente.

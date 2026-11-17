# Handoff — App Citas Dr. Camilo Bedoya

Actualizado el 17 de noviembre de 2026 (versión anterior: 9 de noviembre)

## Contexto

El diseño está completo en Figma y el **backend está terminado y desplegado en Supabase**. Falta construir la app móvil, que todavía no tiene código.

- **Proyecto:** proyecto final de Móvil II, una app en React Native + TypeScript + Expo (SDK 58), NativeWind y Expo Router. Vale el 30 % de la nota.
- **Cliente:** Dr. Camilo Bedoya Orozco, odontólogo independiente en Pereira (Calle 18 # 5-27, Edificio Torcoroma, Consultorio 201).
- **Problema:** hoy recibe las citas por WhatsApp y llamadas y las anota en una agenda de papel, lo que genera citas cruzadas en la misma franja.
- **Roles:** paciente y odontólogo; cada uno ve solo lo suyo.

**Documentos fuente** (en `docs/`)

- Proyecto_Final_Movil_II.docx: requisitos académicos (navegación, estado, HTTP, mapas, entrega).
- CLIENTE Y PROBLEMA (actualizado).docx: alcance acordado con el cliente.
- requerimientos_funcionales_app_citasFinal (actualizado).pdf: RF-01 a RF-27, más el RF-28, el RF-29 y el RF-30 que agregamos.
- especificaciones-tecnicas.md: stack, base de datos, reglas, API y estructura del código.
- pantallas-y-datos.md: qué lee y escribe cada pantalla del Figma en la base.
- Datos_ejemplo_wireframes.md: datos de ejemplo que comparten el Figma, el seed y las pruebas.
- Auditoria_Wireframes_Navegacion.md: auditoría externa de los wireframes (no está en el repo).

**Dónde está todo**

- Repositorio (privado): [poethy/app-citas-dr-bedoya](https://github.com/poethy/app-citas-dr-bedoya). Carpeta local en el Escritorio: **AppCitasCamilo**.
- Figma (archivo del team): [App Citas Dr. Camilo Bedoya (Final)](https://www.figma.com/design/nyTAxFuw0CJ5hxoIqvsAIk)
- Supabase: proyecto **app-citas-dr-bedoya** (organización de poethy, plan gratuito, us-east-1), `https://hiechbnorpgzrwfgufjp.supabase.co`. La URL y la clave pública van en el `.env` (ver `.env.template`) y se comparten por un canal privado.

## Lo que está hecho

### Diseño

Hay 4 páginas en Figma con 58 pantallas en gris y las mismas 58 a color, más 3 documentos actualizados.

| Entregable | Dónde | Qué contiene |
| --- | --- | --- |
| CLIENTE Y PROBLEMA (actualizado).docx | `docs/` | Fila nueva "Cálculo de franjas disponibles (contador contextual)" en la tabla de alcance; las filas de agendamiento y de cancelar y reprogramar mencionan las dos anticipaciones (24 h por defecto); fila nueva "Precio por servicio" y los pagos en línea quedan fuera del alcance |
| requerimientos_funcionales_app_citasFinal (actualizado).pdf | `docs/` | Páginas 1–7 originales + página 8 con el RF-28 (4 escenarios) + página 9 con el RF-29, anticipación mínima para agendar (3 escenarios) + página 10 con el RF-30, precio por servicio (3 escenarios) |
| Datos_ejemplo_wireframes.md | `docs/` | Fechas, agenda, servicios con precio y la fórmula única de franjas que usan todas las pantallas |
| 🧱 Fundamentos | Figma | 4 logos vectoriales (logotipo y monograma CB, en navy y blanco), 22 variables de color, 9 estilos de texto Poppins |
| 📐 Wireframes | Figma | 58 pantallas en 7 secciones + componentes; cada pantalla con su ruta de Expo Router y una nota de navegación; corregidas según la auditoría |
| 🧭 Flujo de navegación | Figma | **"Flujo de usuario por rol"** (principal): una columna por rol con su color (paciente en azul navy, odontólogo en verde) y una fila por flujo que se lee de izquierda a derecha, con las ramas abajo, notas amarillas de condición y etiquetas de salto en vez de líneas largas. Incluye las 58 pantallas. A la derecha quedan como referencia las dos versiones anteriores |
| 🎨 Alta fidelidad | Figma | 14 componentes reutilizables (HF/…), 58 pantallas en 7 secciones, prototipo con 276 enlaces y 2 puntos de inicio (Paciente y Odontólogo) |

**Cobertura del diseño**

- **Navegación:** Stack, Tabs y Drawer para los dos roles; inicio definido (A00) con redirección por rol; rutas dinámicas `cita/[id]` (con caso inexistente) y `solicitud/[id]`.
- **Requerimientos:** RF-01 a RF-30 tienen pantalla (RF-29 en C04 y S03; RF-30 en S01, S06, C01 y C02), incluidos registro, agendamiento, confirmación o aprobación, cancelar y reprogramar, recordatorios, agenda diaria y semanal, bloqueos y mapa.
- **Estados:** carga, vacío, error con reintentar, sin conexión, acceso denegado, permiso de ubicación, GPS no disponible y fallo del mapa.
- **Requisitos académicos:** contador con límites, cálculo con validaciones, formularios con mensajes específicos, búsqueda y filtros, componentes reutilizables y cambios observables (avisos breves tras cada acción).

### Backend (Supabase)

Todo está en `supabase/` y documentado en [supabase/README.md](../supabase/README.md).

| Pieza | Qué hace | RF |
| --- | --- | --- |
| 10 tablas | perfiles, pacientes, servicios (con precio), horario, bloqueos recurrentes y puntuales, configuración, citas, notificaciones y tokens push | — |
| Restricción de exclusión en `citas` | Dos citas activas no se pueden cruzar, aunque lleguen al mismo tiempo | RF-06 |
| Funciones RPC | `disponibilidad_dia`, `solicitar_cita`, `cancelar_cita`, `reprogramar_cita`, `responder_solicitud`, `registrar_cita_consultorio`, `crear_bloqueo`. Validan horario, almuerzo, bloqueos, anticipación, plazos y rol, y devuelven códigos de error fijos | RF-04 a RF-10, RF-12, RF-14, RF-15, RF-19, RF-29 |
| Seguridad por rol (RLS) | El paciente solo lee lo suyo y nunca escribe citas directamente; sin sesión no se ve nada | RF-01 a RF-03 |
| Avisos automáticos | Triggers que crean notificaciones al confirmar, rechazar, cancelar, reprogramar o pedir aprobación | RF-11, RF-13 |
| Recordatorios y resumen diario | pg_cron: recordatorio cada 15 min y resumen a las 8:00 a. m. de Bogotá | RF-16, RF-17 |
| Envío push | Edge Function `enviar-notificaciones`: manda los avisos por Expo Push cada minuto, protegida con un secreto de Vault | RF-11, RF-13, RF-16, RF-17 |
| Datos de ejemplo | Horario, almuerzo, 4 servicios con precio, 5 fichas de pacientes y la agenda del jueves 19 de noviembre de 2026 | — |
| Cuenta del odontólogo | Dr. Camilo Bedoya Orozco, con rol `odontologo` | — |
| Tipos TypeScript | `src/types/database.ts`, para construir los servicios de la app | — |
| Pruebas | `supabase/pruebas`: 36 casos en PostgreSQL local (PGlite), más pruebas de humo en el proyecto real | — |

### Forma de trabajo

- [AGENTS.md](../AGENTS.md): instrucciones para las IA del equipo. [CONTRIBUTING.md](../CONTRIBUTING.md): ramas, commits y Pull Requests.
- Todo entra por PR con la aprobación de otra persona; el primero fue el [PR #1](https://github.com/poethy/app-citas-dr-bedoya/pull/1) (notificaciones push).
- **Ningún commit ni PR lleva coautoría de IA.** Lo revisa el chequeo de GitHub «Sin coautor de IA» en cada PR.
- Bitácora del curso en [bitacora.md](bitacora.md).

## Decisiones tomadas

Estas decisiones ya están aplicadas en los documentos, en Figma y en la base; cambiarlas obliga a tocar los tres.

- **Contador + cálculo (RF-28):** el contador ajusta la duración de cada servicio (+ / −, pasos de 15 min, entre 15 y 180). Ese valor alimenta el cálculo de franjas que ve el paciente.
- **Fórmula única:** franjas = (horario de atención − citas agendadas − horarios bloqueados) ÷ duración, redondeando hacia abajo. Valida vacío, no numérico, negativo y cero. La app muestra la lista real de franjas; la fórmula es la capacidad que se ve en C02.
- **Datos de ejemplo:** el día de ejemplo es el jueves 19 de noviembre de 2026. Almuerzo de 12:30 a 1:30 p. m., anticipación mínima de 24 h. Resultado: 7 franjas (S03), 6 tras un choque (S05) y 12 de capacidad diaria (C02).
- **Estructura de rutas:** Stack raíz → `(auth)`, `(paciente)` y `(odontologo)`, cada rol con Drawer → Tabs. Paciente: Inicio, Agendar (Stack interno), Mis citas, Mapa. Odontólogo: Agenda, Solicitudes, Nueva cita, Avisos.
- **Rutas compartidas:** `cita/[id]` (una sola ruta que muestra la vista según el rol; en Expo Router va en `cita/[id]/index.tsx`), `cita/[id]/reprogramar`, `solicitud/[id]` y `consultorio`.
- **Fin del Stack de agendar:** el resultado se abre con replace y reinicia el Stack, para que Atrás no vuelva al resumen.
- **Alcance:** la información del consultorio es de solo lectura (editarla no está en el alcance). Los resultados de aprobar, registrar, reprogramar o bloquear se muestran con un aviso breve, no con pantallas extra.
- **Precio por servicio:** cada servicio tiene un precio fijo en COP. Se muestra en S01, S06 (resumen), C01 y C02 (campo editable). Los valores son de ejemplo y el pago se hace en el consultorio.
- **Dos anticipaciones:** C04 tiene un contador «para agendar» y otro «para cancelar o reprogramar», ambos en 24 h por defecto.
- **Ajustes por feedback del equipo (10 de noviembre):** se quitó el cuadro «7 franjas libres» de S03 (y el de S05) y la tarjeta «Recordatorio» de P03. Ahora el aviso de recordatorio de P01 lleva a M06.
- **Cerrar sesión con confirmación en los dos roles:** el paciente confirma en P06 y el odontólogo en O12 (modal sobre la Agenda, abierto desde el Drawer O03). Confirmar hace replace a Bienvenida (A01) y Cancelar cierra el modal.
- **Identidad visual:** paleta azul navy, Poppins y los dos logos del cliente (el monograma CB usa Libre Baskerville).
- **Base de datos:** Supabase (PostgreSQL + Auth + Edge Functions). La app usa supabase-js **solo para Auth**; todos los datos pasan por **Axios** contra la API REST, como pide el curso.
- **Reglas en el servidor:** la app calcula y muestra; la base valida y decide. El paciente no puede escribir citas directamente: todo pasa por las funciones RPC.
- **Paciente sin cuenta (RF-07):** el doctor registra fichas por teléfono. Si después la persona se registra con el mismo teléfono, la cuenta queda vinculada a su ficha y ve sus citas.
- **El odontólogo** cancela y reprograma sin límite de anticipación; el paciente, con 24 h.
- **Notificaciones:** se guardan en la base (P03, O11) y además se envían por push. P03 no lista los recordatorios; esos llegan como push y como aviso en P01.

## Lo que falta por hacer

**Cerrar el Hito 1**

- [x] Recorrer el prototipo en modo Present y corregir enlaces rotos (10 de noviembre).
- [x] Enlazar en el prototipo los estados del recorrido del paciente con toques simulados (34 pantallas alcanzables).
- [x] Especificación técnica y base de datos.
- [x] Backend desplegado en Supabase: tablas, reglas, seguridad, recordatorios, push y datos de ejemplo (17 de noviembre).
- [ ] Revisión del equipo y del docente sobre wireframes y alta fidelidad. Ya se aplicó el primer feedback del equipo: precios, dos anticipaciones, S03, P03 y flujo por rol.
- [ ] Armar la matriz requisito → función → pantalla → archivo → evidencia. Ya existe la base en [pantallas-y-datos.md](pantallas-y-datos.md).
- [ ] Confirmar con el cliente los datos supuestos: horario (L–V 8:00 a. m.–6:00 p. m., sábado 8:00 a. m.–12:00 m.), almuerzo, 24 h de anticipación, servicios con duración y precio, y teléfono del consultorio.
- [ ] Obtener las coordenadas exactas del consultorio y guardarlas en `configuracion`.
- [ ] Crear el proyecto Expo con las primeras rutas navegables (el Hito 1 lo pide).

**Desarrollo de la app (Hitos 2 y 3)**

- [ ] Crear el proyecto Expo SDK 58 con TypeScript, NativeWind y Expo Router, siguiendo la estructura de rutas del flujo de navegación.
- [ ] Pasar a código los componentes de alta fidelidad (botón, campo, tarjeta de cita, chip de estado, aviso, tabs) con props tipadas.
- [ ] Autenticación con Supabase Auth (registro con nombre y teléfono en `options.data`) y guardia de rol en cada `_layout`.
- [ ] Cliente Axios, interfaces, mappers y hooks de TanStack Query (listado de citas y detalle por id, con carga, error y reintentar).
- [ ] Estado compartido con Zustand y el hook `useFranjasDisponibles` con `calcularFranjas` (RF-28).
- [ ] Mapa con OpenStreetMap + Leaflet en WebView y expo-location: permisos, centrar, pausar y reanudar, y liberar la suscripción (RF-20 a RF-27).
- [ ] Guardar el token de Expo en `tokens_push` al iniciar sesión, y probar el push con un development build de EAS.
- [x] ~~Persistencia de citas, solicitudes y bloqueos, y prevención de solapamientos en el servidor (RF-06)~~: hecho en Supabase.
- [x] ~~Avisos de estado y recordatorios en el servidor (RF-11, RF-13, RF-16, RF-17)~~: hecho en Supabase; falta mostrarlos en la app.

**Entrega final (Hito 4)**

- [ ] Prueba con el cliente o un usuario representativo, con al menos un ajuste documentado.
- [ ] Bitácora de avances, README, informe breve y `.env.template` (este último ya existe).

## Riesgos y notas para quien continúe

- **Datos supuestos:** el horario, el almuerzo, la anticipación, los servicios, los precios y los teléfonos de los pacientes son de ejemplo. Si el cliente da otros, hay que actualizar `Datos_ejemplo_wireframes.md`, `supabase/seed.sql` (o la base directamente) y las pantallas.
- **Fechas del seed:** la agenda de ejemplo es del jueves 19 de noviembre de 2026. Para demos posteriores hay que mover las citas de ejemplo a fechas futuras.
- **Supabase gratuito:** el proyecto se pausa tras unos días sin uso; antes de una demo hay que reactivarlo en el panel.
- **Push en Android:** no funciona en Expo Go (desde SDK 53); hace falta un development build o un APK de EAS con credenciales de FCM. Mientras tanto, los avisos se ven dentro de la app.
- **Decisiones abiertas:** las que quedan están en la sección 11 de la especificación (por ejemplo, D4 sobre el development build y D7 sobre los datos reales del consultorio).
- **Cambios en la base:** siempre con una migración nueva en `supabase/migrations/` y sus pruebas; nunca editar una ya aplicada.
- **Prototipo:** el recorrido de Present es el del paciente. M04 y G01 a G03 quedan como pantallas de referencia; del odontólogo, C03, O07 y G04 tampoco se alcanzan.
- **S06 con aprobación:** con Resina o Endodoncia, el resumen S06 del Figma sigue mostrando «Limpieza dental · Confirmación inmediata». En la app el botón debe decir «Enviar solicitud».
- **Archivos:** el PDF de requerimientos original es una imagen; solo las páginas 8 a 10 tienen texto seleccionable. El archivo de Figma en borradores ya no se usa: trabajar solo en el del team.
- **Copias de los originales:** los documentos sin modificar siguen en Descargas.

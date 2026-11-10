# Handoff — App Citas Dr. Camilo Bedoya

9 de noviembre de 2026

## Contexto

El diseño del frontend está completo en Figma (wireframes, flujo de navegación y alta fidelidad con prototipo). El desarrollo de la app todavía no ha empezado.

- **Proyecto:** proyecto final de Móvil II, una app en React Native + TypeScript + Expo (SDK 58), NativeWind y Expo Router. Vale el 30 % de la nota.
- **Cliente:** Dr. Camilo Bedoya Orozco, odontólogo independiente en Pereira (Calle 18 # 5-27, Edificio Torcoroma, Consultorio 201).
- **Problema:** hoy recibe las citas por WhatsApp y llamadas y las anota en una agenda de papel, lo que genera citas cruzadas en la misma franja.
- **Roles:** paciente y odontólogo; cada uno ve solo lo suyo.

**Documentos fuente**

- Proyecto_Final_Movil_II.docx: requisitos académicos (navegación, estado, HTTP, mapas, entrega).
- CLIENTE Y PROBLEMA.docx: alcance acordado con el cliente.
- requerimientos_funcionales_app_citasFinal.pdf: RF-01 a RF-27, más el RF-28 que agregamos.
- Auditoria_Wireframes_Navegacion.md: auditoría externa de los wireframes.

**Dónde está todo**

- Figma (archivo del team): [App Citas Dr. Camilo Bedoya (Copy)](https://www.figma.com/design/nyTAxFuw0CJ5hxoIqvsAIk)
- Carpeta en el Escritorio: **AppCitasCamilo** (documentos actualizados, auditoría y datos de ejemplo).

## Lo que está hecho

Hay 4 páginas en Figma con 58 pantallas en gris y las mismas 58 a color, más 3 documentos actualizados.

| Entregable | Dónde | Qué contiene |
| --- | --- | --- |
| CLIENTE Y PROBLEMA (actualizado).docx | Carpeta del Escritorio | Fila nueva "Cálculo de franjas disponibles (contador contextual)" en la tabla de alcance |
| requerimientos_funcionales_app_citasFinal (actualizado).pdf | Carpeta del Escritorio | Páginas 1–7 originales + página 8 con el RF-28 y 4 escenarios |
| Datos_ejemplo_wireframes.md | Carpeta del Escritorio | Fechas, agenda, servicios y la fórmula única de franjas que usan todas las pantallas |
| 🧱 Fundamentos | Figma | 4 logos vectoriales (logotipo y monograma CB, en navy y blanco), 22 variables de color, 9 estilos de texto Poppins |
| 📐 Wireframes | Figma | 58 pantallas en 7 secciones + componentes; cada pantalla con su ruta de Expo Router y una nota de navegación; corregidas según la auditoría |
| 🧭 Flujo de navegación | Figma | "Mapa de navegación con pantallas": Stack raíz, (auth), Drawer y Tabs por rol y rutas compartidas, con las 58 pantallas de alta fidelidad en miniatura (cada ruta con sus estados), 28 flechas y leyenda push / replace. Arriba sigue la versión anterior, solo con texto |
| 🎨 Alta fidelidad | Figma | 14 componentes reutilizables (HF/…), 58 pantallas en 7 secciones, prototipo con 266 enlaces y 2 puntos de inicio (Paciente y Odontólogo) |

**Cobertura del diseño**

- **Navegación:** Stack, Tabs y Drawer para los dos roles; inicio definido (A00) con redirección por rol; rutas dinámicas `cita/[id]` (con caso inexistente) y `solicitud/[id]`.
- **Requerimientos:** RF-01 a RF-28 tienen pantalla, incluidos registro, agendamiento, confirmación o aprobación, cancelar y reprogramar, recordatorios, agenda diaria y semanal, bloqueos y mapa.
- **Estados:** carga, vacío, error con reintentar, sin conexión, acceso denegado, permiso de ubicación, GPS no disponible y fallo del mapa.
- **Requisitos académicos:** contador con límites, cálculo con validaciones, formularios con mensajes específicos, búsqueda y filtros, componentes reutilizables y cambios observables (avisos breves tras cada acción).

## Decisiones tomadas

Estas decisiones ya están aplicadas en los documentos y en Figma; cambiarlas obliga a tocar ambos.

- **Contador + cálculo (RF-28):** el contador ajusta la duración de cada servicio (+ / −, pasos de 15 min, entre 15 y 180). Ese valor alimenta el cálculo de franjas que ve el paciente.
- **Fórmula única:** franjas = (horario de atención − citas agendadas − horarios bloqueados) ÷ duración, redondeando hacia abajo. Valida vacío, no numérico, negativo y cero.
- **Datos de ejemplo:** hoy es lunes 9 de noviembre de 2026; el día de ejemplo es el jueves 19. Almuerzo de 12:30 a 1:30 p. m., anticipación mínima de 24 h. Resultado: 7 franjas (S03), 6 tras un choque (S05) y 12 de capacidad diaria (C02).
- **Estructura de rutas:** Stack raíz → `(auth)`, `(paciente)` y `(odontologo)`, cada rol con Drawer → Tabs. Paciente: Inicio, Agendar (Stack interno), Mis citas, Mapa. Odontólogo: Agenda, Solicitudes, Nueva cita, Avisos.
- **Rutas compartidas:** `cita/[id]` (una sola ruta que muestra la vista según el rol), `cita/[id]/reprogramar`, `solicitud/[id]` y `consultorio`.
- **Fin del Stack de agendar:** el resultado se abre con replace y reinicia el Stack, para que Atrás no vuelva al resumen.
- **Alcance:** la información del consultorio es de solo lectura (editarla no está en el alcance). Los resultados de aprobar, registrar, reprogramar o bloquear se muestran con un aviso breve, no con pantallas extra.
- **Cerrar sesión con confirmación en los dos roles:** el paciente confirma en P06 y el odontólogo en O12 (modal sobre la Agenda, abierto desde el Drawer O03). Confirmar hace replace a Bienvenida (A01) y Cancelar cierra el modal.
- **Identidad visual:** paleta azul navy, Poppins y los dos logos del cliente (el monograma CB usa Libre Baskerville).

## Lo que falta por hacer

Lo siguiente es cerrar el diseño con una revisión y la matriz del Hito 1, y luego empezar el desarrollo, que aún no ha comenzado.

**Cerrar el diseño (Hito 1)**

- [x] Recorrer el prototipo en modo Present con los dos puntos de inicio y corregir enlaces rotos (10 de noviembre). No hay enlaces rotos ni pantallas sin salida. Se corrigió:
  - Los modales y Drawers (P02, O03, P06, O12, M05, C06) dejaban activas las zonas detrás del fondo oscurecido. Ahora tocar el fondo cierra el modal o el Drawer.
  - En A04 el enlace a P01 estaba en toda la barra superior; ahora lo tiene el botón «Crear cuenta».
  - Se enlazaron botones y tarjetas que no hacían nada: Resina y Endodoncia en S01, Cancelar y Reprogramar en M08, tarjetas de cita en P01, M01, O01 y O10, y «+ Nuevo servicio» en C01.
  - Se quitó un punto de inicio duplicado que había quedado en O12.
- [ ] Decidir si se enlazan en el prototipo las pantallas de estado que hoy no se alcanzan tocando (ver Riesgos).
- [ ] Revisión del equipo y del docente sobre wireframes y alta fidelidad.
- [ ] Armar la matriz requisito → función → pantalla → archivo → evidencia; las rutas de cada pantalla ya están en los wireframes.
- [ ] Confirmar con el cliente los datos que se supusieron: horario (L–V 8:00 a. m.–6:00 p. m., sábado 8:00 a. m.–12:00 m.), almuerzo, 24 h de anticipación, servicios con su duración y teléfono del consultorio.
- [ ] Obtener las coordenadas exactas del consultorio para el marcador del mapa.

**Desarrollo (Hitos 2 y 3)**

- [ ] Crear el proyecto Expo SDK 58 con TypeScript, NativeWind y Expo Router, siguiendo la estructura de rutas del flujo de navegación.
- [ ] Pasar a código los componentes de alta fidelidad (botón, campo, tarjeta de cita, chip de estado, aviso, tabs) con props tipadas.
- [ ] Autenticación y roles con Supabase Auth; acceso restringido por rol en cada `_layout`.
- [ ] Servicio HTTP con Axios, interfaces, mapper y hooks de TanStack Query (listado y detalle por id, carga, error y reintentar).
- [ ] Estado compartido con Zustand y un hook propio para el cálculo de franjas (RF-28).
- [ ] Persistencia de citas, solicitudes y bloqueos, y prevención de solapamientos en el servidor (RF-06).
- [ ] Mapa con OpenStreetMap + Leaflet en WebView y expo-location: permisos, centrar, pausar y reanudar, y liberar la suscripción (RF-20 a RF-27).
- [ ] Avisos de estado y recordatorios (RF-11, RF-13, RF-16, RF-17).

**Entrega final (Hito 4)**

- [ ] Prueba con el cliente o un usuario representativo, con al menos un ajuste documentado.
- [ ] Bitácora de avances, README, informe breve y `.env.template`.

## Riesgos y notas para quien continúe

- **Datos supuestos:** el horario, el almuerzo, la anticipación, los servicios y los teléfonos de los pacientes son de ejemplo. Si el cliente da otros, hay que actualizar Datos_ejemplo_wireframes.md y las pantallas.
- **Solapamientos (RF-06):** dos pacientes pueden pedir la misma franja a la vez. Bloquearlo solo en la app no basta; hace falta una restricción o función en Supabase.
- **Recordatorios (RF-16 y RF-17):** requieren notificaciones programadas (por ejemplo, Expo Notifications). Falta decidir el mecanismo y probarlo en Android.
- **Prototipo:** el registro con correo repetido (A05) no enlaza a sí mismo a propósito.
- **Pantallas que no se alcanzan en el prototipo:** S08 (la ruta de aprobación termina siempre en S07), A03, A05, S04, S05, M02, M04, M06, MP03 a MP07, C03, O07 y G01 a G04. Son estados o errores que dependen de datos, así que hoy solo se muestran como pantallas sueltas. Para la demo se pueden enlazar con disparadores simulados.
- **Archivos:** el PDF de requerimientos original es una imagen; solo la página 8 tiene texto seleccionable. El archivo de Figma en borradores ya no se usa: trabajar solo en el del team.
- **Copias de los originales:** los documentos sin modificar siguen en Descargas.

# Matriz de implementación del frontend

18 de noviembre de 2026. Con `.env` la app usa Supabase: Auth real, datos por HTTP con Axios (`src/services/remoto/`), RPC con las reglas en el servidor y datos compartidos entre teléfonos (RF-06 entre dispositivos). Sin `.env` se usa la demo local (`src/services/mock/`). Queda pendiente el push con la app cerrada (registro de tokens).

| Requisitos | Pantallas | Código principal | Verificación |
| --- | --- | --- | --- |
| RF-01 a RF-03 | A00 a A05, G04 | src/screens/AccesoScreen.tsx; src/components/MenuRol.tsx; src/services/mock/repositorio.ts | Sesión, registro validado y guardias por rol; acceso y persistencia en pruebas. |
| RF-04 a RF-06 | S01 a S08 | src/screens/AgendarScreen.tsx; src/utils/franjas.ts; src/services/mock/reglas.ts | Recorrido de Resina en navegador; pruebas de tramos, anticipación y registros simultáneos locales. |
| RF-07 | O09 y O10 | src/app/(odontologo)/(principal)/(tabs)/nueva-cita.tsx | Registro como doctor para el mismo día, con servicio de aprobación y confirmación directa. |
| RF-08 a RF-11 | S07, S08, O04 a O07, P03 | src/app/(odontologo)/(principal)/(tabs)/solicitudes.tsx; src/screens/DetalleCitaScreen.tsx; src/screens/AvisosScreen.tsx | Solicitud del paciente aprobada desde sesión del doctor; estados y avisos persistentes. |
| RF-12 a RF-15 | M03, M05 a M08, O08, C04 | src/screens/DetalleCitaScreen.tsx; src/app/cita/[id]/reprogramar.tsx; src/app/(odontologo)/anticipacion.tsx | Pruebas del plazo exacto, excepción por rol, reprogramación atómica y conservación de valores. |
| RF-16 y RF-17 | P03, O11 | src/services/mock/repositorio.ts; src/screens/AvisosScreen.tsx | Recordatorios locales al consultar y resumen calculado al abrir; sin push ni garantía con la app cerrada. |
| RF-18 | O01 y O02 | src/app/(odontologo)/(principal)/(tabs)/index.tsx; src/components/AgendaSemana.tsx | Vista diaria y cuadrícula semanal; tocar un día abre su agenda. |
| RF-19 | C05 a C07 | src/app/(odontologo)/bloqueos.tsx; src/services/mock/repositorio.ts | Validación local de citas, almuerzo y bloqueos; creación y eliminación persistentes. |
| RF-20 a RF-27 | MP01 a MP07 | src/hooks/useSeguimientoUbicacion.ts; src/components/MapaVista.tsx; src/components/MapaVista.web.tsx | Leaflet, WebView e iframe; código de permisos y limpieza de suscripciones. Prueba en Android real pendiente; coordenadas de referencia explícitamente identificadas. |
| RF-28 | C02, C03 y S03 | src/hooks/useFranjasDisponibles.ts; src/utils/franjas.ts; src/utils/validaciones.ts | Cálculo por tramos y fecha; pruebas de huecos separados, almuerzo y duración inválida. |
| RF-29 | C04, S03 y S06 | src/utils/franjas.ts; src/services/mock/reglas.ts | Solo paciente sujeto al límite; nueva comprobación al confirmar. |
| RF-30 | S01, S06, C01 y C02 | src/app/(odontologo)/servicios/[id].tsx; src/services/mock/reglas.ts | Precio y duración guardados en la cita; prueba de edición y reprogramación sin alterar valores históricos. |
| C08 a C10 (horario de atención) | C08, C09, C10, O03, P05 | src/app/(odontologo)/horario.tsx; src/utils/horario.ts; RPC `actualizar_horario` | Días, apertura, cierre y almuerzo editables; la base rechaza el cambio si deja citas activas fuera (tests/horario.test.ts y supabase/pruebas). |

## Requisitos académicos del proyecto (Proyecto_Final_Movil_II.docx)

| Requisito | Función o pantalla | Archivo | Evidencia |
| --- | --- | --- | --- |
| Expo SDK 58, TypeScript estricto y Expo Router, código separado por capas | Toda la app | package.json; tsconfig.json; src/app, src/components, src/hooks, src/services, src/models, src/mappers, src/types | `npx tsc --noEmit` sin errores y sin `any` |
| Stack, Tabs y Drawer conectados | Flujos de agendar y detalle (Stack), secciones por rol (Tabs), accesos complementarios (Drawer) | src/app/(paciente)/(tabs)/_layout.tsx; src/app/(odontologo)/_layout.tsx; src/components/MenuRol.tsx | Recorrido de los dos roles |
| Ruta dinámica por id con manejo de id inexistente | M03, O08, O05, M04 | src/app/cita/[id]/index.tsx; src/app/solicitud/[id].tsx; src/screens/DetalleCitaScreen.tsx | Abrir una cita de la lista; un id que no existe muestra M04 |
| NativeWind, fuente propia, áreas seguras | Toda la app | tailwind.config.js; src/global.css; src/app/_layout.tsx (Poppins) | Capturas y prueba en Android |
| Tres o más componentes reutilizables con props tipadas | Botón, tarjeta, estados, hoja inferior, selector de hora, contador | src/components/ui.tsx; src/components/Contador.tsx; src/components/SelectorHora.tsx; src/components/CitaCard.tsx | Usados en varias pantallas |
| Listas, tarjetas, búsqueda o filtro | S01 (buscar y filtrar servicios), M01 (pestañas por estado), O04 | src/screens/AgendarScreen.tsx; src/app/(paciente)/(tabs)/mis-citas.tsx | Filtrar servicios y citas |
| useState y useEffect con finalidad verificable; hook propio | Seguimiento GPS, franjas, ocupación, hora actual | src/hooks/useSeguimientoUbicacion.ts; src/hooks/useFranjasDisponibles.ts; src/hooks/useOcupacion.ts; src/hooks/useAhora.ts | Comentarios de entradas, estado y resultado en cada hook |
| Zustand para estado compartido, distinto del estado remoto | Sesión, borrador de agendamiento, agenda, avisos breves | src/store/*.store.ts | La sesión y el borrador pasan entre pantallas |
| Contador contextual con límites | C02 duración del servicio (15 a 180 min en pasos de 15), C04 anticipaciones (1 a 72 h), C09 horas | src/components/Contador.tsx; src/app/(odontologo)/servicios/[id].tsx; src/app/(odontologo)/anticipacion.tsx | La duración cambia las franjas que ve el paciente |
| Cálculo contextual con validaciones | Capacidad de franjas (RF-28): horario − citas − bloqueos ÷ duración | src/utils/franjas.ts; src/utils/validaciones.ts | tests/reglas.test.ts (vacíos, no numéricos, negativos y cero) |
| Formulario con validaciones y mensajes | Registro (A04), nueva cita (O09), editar servicio (C02), perfil (P04) | src/utils/validaciones.ts; src/screens/AccesoScreen.tsx | Mensajes específicos por campo |
| HTTP con Axios: listado y detalle por id | Citas del paciente y del odontólogo | src/services/http/cliente.ts; src/services/remoto/citas.remoto.ts | tests/integracion.test.ts revisa `GET /citas` y `GET /citas?id=eq.{id}` |
| baseURL centralizada, interfaces de respuesta, modelos y mapper | Toda la capa de datos | src/services/http/cliente.ts; src/types/api.ts; src/models/index.ts; src/mappers/remoto.mapper.ts | tests/remoto.test.ts y tests/integracion.test.ts |
| TanStack Query con hooks, queryKey y caché; carga, error, vacío y reintentar | Consultas de datos, citas, cita y ocupación | src/hooks/useDatos.ts; src/hooks/useCitas.ts; src/hooks/useCita.ts; src/hooks/useOcupacion.ts; componente Estado | Estados G01 a G04 en las pantallas |
| Datos remotos en el flujo principal y conservación entre teléfonos | Agendar, aprobar, cancelar, reprogramar, bloquear y horario | src/services/remoto/repositorio.remoto.ts; supabase/migrations | Agendar como paciente en un teléfono y aprobar como odontólogo en otro |
| Mapa con OpenStreetMap y Leaflet en WebView, expo-location | MP01 a MP07 | src/components/MapaVista.tsx; src/constants/mapa-html.ts; src/app/(paciente)/(tabs)/mapa.tsx | Marcador del consultorio con las coordenadas de `configuracion` |
| Permiso, ubicación actual, activar, pausar y reanudar, errores y limpieza de suscripciones | MP01 a MP07 | src/hooks/useSeguimientoUbicacion.ts | `watchPositionAsync` se libera al salir o pasar a segundo plano |
| Sin conexión y sin confirmaciones falsas | G02 | src/hooks/useConexion.ts; src/services/http/errores.ts (`SIN_CONEXION`) | Las acciones fallidas muestran el error y no anuncian éxito |
| .env.template sin credenciales privadas | Configuración | .env.template; README.md | Solo variables `EXPO_PUBLIC_` |
| Bitácora, prueba con el cliente e informe | Entrega | docs/bitacora.md; docs/prueba-con-cliente.md; docs/informe.md | Pendiente: prueba con el cliente y capturas en Android |

## Pruebas reproducibles

`npm test`, `npm run typecheck`, `npm run lint` y `npx expo install --check`. Los tests usan almacenamiento y criptografía simulados en Node para verificar reglas; no sustituyen la prueba del GPS o AsyncStorage nativo en un teléfono.

Los escenarios de demostración están en Avisos del odontólogo. Permiten preparar una solicitud que vence en 30 segundos, simular fallos de consulta/conexión y producir un choque en el siguiente registro. El vencimiento de una pendiente persiste aunque el intento de aprobarla falle.

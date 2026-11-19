# Handoff de App Citas Dr Camilo Bedoya

Actualizado el 19 de noviembre de 2026. La app está conectada a Supabase (Auth real, datos por HTTP con Axios y escrituras por RPC) y conserva la demo local sin `.env`. Todas las migraciones están aplicadas. Hay una versión web publicada en Vercel como plan B para presentar: https://app-citas-dr-bedoya.vercel.app. EAS y Firebase están configurados para generar el APK con push. Pendiente: prueba en Android real, prueba con el cliente y datos reales del consultorio.

## Cliente y alcance

Dr. Camilo Bedoya Orozco, odontólogo independiente en Pereira. Recibe solicitudes por WhatsApp y llamadas y utiliza una agenda de papel; los registros omitidos producen cruces. La app cubre registro, agendamiento, confirmación o aprobación, cambios, avisos, agenda, bloqueos y mapa. No cubre historia clínica, odontograma, imágenes clínicas, múltiples sedes o doctores, integración con WhatsApp/Google Calendar, migración de la agenda ni pagos en línea.

## Fuente visual vigente

El frontend se implementó desde la página [Flujo de navegación](https://www.figma.com/design/nyTAxFuw0CJ5hxoIqvsAIk?node-id=2012-2), marco «Flujo de usuario por rol». Después se modificó el Figma así:

- **C08 Horario de atención, C09 Editar horas del día y C10 Citas fuera del nuevo horario:** en 🎨 Alta fidelidad (sección «7 · Pantallas de apoyo del odontólogo») y como carril «7 · Horario de atención» del flujo; «Cerrar sesión» pasó a ser el carril 8. C10 muestra la lista de citas afectadas.
- **Drawer O03:** ítem nuevo «Horario de atención».
- **C05 en alta fidelidad:** pasó al diseño de línea de tiempo del flujo («Bloquear disponibilidad»). C06 y C07 se dejaron con el diseño anterior por decisión del equipo.

Las 61 pantallas representan rutas y variantes de estado, no 61 archivos independientes. Stack raíz con auth y ambos roles; cada rol tiene Drawer y Tabs. Paciente: Inicio, Agendar con Stack interno, Mis citas y Mapa. Doctor: Agenda, Solicitudes, Nueva cita y Avisos; desde el Drawer, Servicios, Anticipación, Bloqueos y Horario de atención. Detalle compartido cita/[id]/index, reprogramación, solicitud/[id] y consultorio. Cierre de sesión y confirmación de cancelación son modales. S07/S08 reinician el flujo para no volver al resumen al pulsar Atrás.

## Decisiones cerradas

- Un consultorio y un odontólogo; roles paciente y odontólogo. No hay pagos en línea ni historia clínica.
- El paciente respeta dos anticipaciones independientes: para agendar y para cancelar o reprogramar. Ambas se configuran entre 1 y 72 horas, en pasos de 1 hora; valor inicial de ejemplo: 24 horas. El límite exacto está permitido: debe faltar al menos el número de horas configurado.
- El odontólogo no está sujeto a esas anticipaciones al agendar, cancelar o reprogramar. Puede gestionar por llamada una excepción solicitada por el paciente. Sigue respetando horarios de atención, bloqueos y ausencia de solapamientos; la exención no autoriza agendar en el pasado.
- Las citas nuevas registradas por el odontólogo quedan confirmadas directamente, aunque el servicio normalmente requiera aprobación. Las del paciente quedan confirmadas o pendientes según el servicio.
- Una solicitud pendiente reserva su franja. Al llegar su hora de inicio sin respuesta pasa a vencida; ya no puede aprobarse ni tratarse como solicitud activa. Las citas confirmadas no vencen por esta regla.
- El paciente puede cancelar una cita pendiente o confirmada dentro del plazo. Al reprogramar debe respetar el plazo respecto de la cita original y la anticipación para agendar respecto del nuevo inicio. Se aplica nuevamente la regla de confirmación del servicio. Si falla el cambio, conserva la cita original.
- Cada cita conserva el precio en COP y la duración acordados al crearla. Editar el catálogo afecta citas nuevas, sin recalcular las existentes. Reprogramar conserva esos valores; el nuevo fin se calcula con la duración guardada.
- La disponibilidad se calcula por tramos libres de una fecha concreta, sin sumar huecos separados para encajar una cita. Los mensajes muestran la anticipación configurada, no un texto fijo de 24 horas.
- La información del consultorio continúa siendo de solo lectura. El catálogo permite configurar nombre, precio, duración y tipo de confirmación.
- El odontólogo configura su horario de atención y el almuerzo (C08). Si un cambio deja citas pendientes o confirmadas futuras fuera del horario o cruzando el almuerzo, no se guarda: C10 lista todas esas citas para cancelarlas o reprogramarlas (igual que C06 con los bloqueos).
- Una cita y un bloqueo creados al mismo tiempo no se pueden cruzar: la base serializa la ocupación por fecha.

## Estado actual

### Dos modos con la misma interfaz

`src/services/repositorio.ts` elige el servicio de datos:

- **Con `.env`** (`EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_KEY`): `src/services/remoto`. Auth con supabase-js; lecturas con Axios contra `/rest/v1` (listado y detalle de citas por id, servicios, configuración, horario, bloqueos y avisos); escrituras de citas por RPC. Paciente y odontólogo comparten los datos desde teléfonos distintos.
- **Sin `.env`**: `src/services/mock`, la demo local con AsyncStorage, cuentas de prueba y escenarios de demostración.

El paciente no ve citas ajenas (RLS), así que sus franjas se calculan con la ocupación que devuelve la RPC `disponibilidad_dia`.

### Backend

Todo está aplicado en el proyecto de Supabase y documentado en [supabase/README.md](../supabase/README.md). Además de lo recibido de main (tablas, RLS, RPC, avisos, recordatorios y Edge Function de push), se agregaron migraciones nuevas para:

- Estado `vencida`, precio y duración acordados en cada cita, y vencimiento automático con pg_cron.
- `actualizar_horario` para C08–C10, con la lista de citas afectadas.
- Serialización de la ocupación por fecha entre citas y bloqueos (B3).

Las pruebas de la base (`supabase/pruebas`) ya no dependen del día ni la hora. `supabase/datos_prueba.sql` carga una agenda de ejemplo para presentar y se puede repetir.

### Versión web en Vercel (plan B)

Si Expo no corre en el equipo de la presentación, la app se abre en el navegador: **https://app-citas-dr-bedoya.vercel.app**. Usa el mismo Supabase que la app (mismas cuentas y datos) y está pensada para celular: se puede abrir desde el teléfono o en el computador, donde se ve como una columna de celular centrada.

- `vercel.json` compila con `npx expo export --platform web` y manda todas las rutas a `index.html`; `public/index.html` es la plantilla web (idioma, color de la barra del navegador, altura real de la pantalla en el celular y sin zoom al tocar un campo).
- Las variables `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_KEY` están en el proyecto de Vercel `app-citas-dr-bedoya`; el `.env` no se sube (`.vercelignore`).
- En la web no hay push (los avisos se ven al abrir la app) y el mapa pide la ubicación al navegador.
- Para publicar cambios de `main`: `npx vercel deploy --prod` desde la raíz del repo, con la sesión de Vercel del dueño del proyecto.
- **iPhone:** se usa esta versión web. En Safari → Compartir → «Agregar a pantalla de inicio» queda con el ícono «CB» y se abre sin la barra del navegador (`public/manifest.webmanifest`).

### Plan para la presentación

- **Android:** el APK de EAS (con notificaciones push).
- **iPhone:** la versión web (https://app-citas-dr-bedoya.vercel.app) agregada a la pantalla de inicio.
- Las dos usan el mismo Supabase: lo que hace el paciente en un teléfono lo ve el odontólogo en el otro.
- Antes de presentar, correr `supabase/datos_prueba.sql` para tener la agenda de ejemplo.

### Notificaciones push

La app registra el token del teléfono en `tokens_push` al iniciar sesión, lo borra al cerrarla y abre la cita al tocar el aviso. El push solo llega en un APK de EAS (`eas.json`, perfil `preview`). Ya están el proyecto de EAS `@marlborovfx/app-citas-dr-bedoya`, el proyecto de Firebase `app-citas-dr-bedoya` (clave FCM V1 en las credenciales de EAS) y `google-services.json` como variable secreta de EAS; los detalles y el comando del build están en el README.

Se conservan [CONTRIBUTING.md](../CONTRIBUTING.md), [AGENTS.md](../AGENTS.md) y el historial de la bitácora. `main` está protegida: los cambios entran por PR.

## Ajustes incorporados al código

| Pantallas | Ajuste |
| --- | --- |
| O09 y O10 | Doctor sin anticipación mínima; conservar disponibilidad y confirmar directamente sus citas nuevas. |
| M06 | Paciente fuera de plazo solo llama para solicitar excepción; mensaje usa la anticipación configurada. |
| O04, O05 y detalle del paciente | Estado Vencida al llegar inicio; no permitir aprobar. Conservar antecedente consultable. |
| C02 y S03 | Calcular por tramos libres de una fecha; C02 identifica la fecha. No asumir 12 como capacidad universal ni recuperar el cuadro de cantidad de S03. |
| C02, S06 y detalles | Conservar precio y duración acordados por cita. No crear pantallas nuevas para esta regla. |
| S06 a S08 | Resumen dinámico por servicio; «Enviar solicitud» cuando requiere aprobación. |
| O06 | Mostrar resultado y aviso diferentes para aprobar y rechazar. |
| M07 y M08 | Si reprograma el paciente, reaplicar confirmación del servicio y conservar precio/duración. Si falla, no perder horario original. |
| C08 a C10 | Horario por día con interruptor, edición en pasos de 15 minutos, almuerzo y lista de citas que impiden guardar. P05 muestra el horario guardado. |
| MP01 | El marcador del consultorio toma las coordenadas de `configuracion`; sin ellas usa un punto de referencia. |

## Estilo y tecnologías

Referencia de código: `C:/Users/StivenM/Documents/react-native-parcial`, especialmente navegacion-app y movies. Componentes legibles, props tipadas, hooks y servicios separados. React Native, TypeScript, Expo SDK 58, Expo Router, NativeWind de clase, Zustand, TanStack Query, Axios, Leaflet/OpenStreetMap en WebView con expo-location y expo-notifications. Validar versiones antes de instalar; mantener npm y package-lock. Paleta navy y Poppins del flujo; monograma con Libre Baskerville.

## Documentos vigentes

- [Cliente y problema](CLIENTE%20Y%20PROBLEMA%20%28actualizado%20v2%29.docx): negocio y alcance, sin detalles de la demo o frontend.
- [Requerimientos](requerimientos_funcionales_app_citasFinal%20%28actualizado%29.pdf): RF-01 a RF-30 consolidados con las decisiones; fuente editable en requerimientos.md.
- [Especificaciones técnicas](especificaciones-tecnicas.md): Parte I frontend y Parte II backend.
- [Matriz de requisitos](matriz-requisitos.md): RF y requisitos académicos con archivo y evidencia.
- [Informe](informe.md): borrador del informe final.
- [Prueba con el cliente](prueba-con-cliente.md): tareas y plantilla de registro.
- [Bitácora](bitacora.md): avances por fecha y PR.
- Proyecto_Final_Movil_II.docx se conserva intacto como documento recibido. Esta revisión no modifica sus exigencias.

## Implementación y próximos pasos

- [x] Base Expo SDK 58, rutas, componentes del flujo y guardias de sesión.
- [x] Cálculo, formularios, vencimiento, precios/duraciones históricos y excepciones por rol.
- [x] Integración con Supabase: Auth real, HTTP con Axios, RPC y datos compartidos entre teléfonos.
- [x] Horario de atención (C08–C10) en Figma, base y app.
- [x] Concurrencia entre citas y bloqueos en la base.
- [x] Registro del token de push, proyecto de EAS, Firebase (FCM V1) y primer APK con EAS.
- [x] Matriz académica, informe en borrador, guía de prueba con el cliente y bitácora hasta el PR #26.
- [x] Ajustes de uso: ver contraseña, avisos separados en «Por ver» y «Vistos», skeleton con la forma de cada pantalla, A00 Splash al abrir (también el splash nativo) y Nueva cita con Supabase.
- [x] Versión web publicada en Vercel como plan B, con ícono para la pantalla de inicio del iPhone.
- [ ] Prueba de push en un teléfono con el APK.
- [ ] Prueba de punta a punta con cuentas reales y en Android (mapa, permisos y GPS incluidos); capturas.
- [ ] Prueba con el cliente y al menos un ajuste derivado.
- [ ] Observaciones del docente en la bitácora.
- [ ] Completar el informe.

## Pendientes de datos y configuración

- **Datos del consultorio:** horario, almuerzo, precios, coordenadas y teléfono son de prueba hasta que el consultorio confirme los reales. Al tenerlos se actualizan `configuracion`, `horario_atencion` y `servicios` en Supabase; la app los toma sola.
- **Supabase:** «Confirm email» ya está desactivado y las contraseñas piden mínimo 8 caracteres con letras y números. La protección de contraseñas filtradas (Authentication → Attack Protection) es del plan Pro; no es obligatoria.
- Siguen abiertos en B9 de la especificación: recordatorios y resumen diario, vinculación segura de pacientes que llamaron, confirmación de reprogramaciones del doctor y verificación de correo.

## Antecedentes del diseño

El handoff anterior registra revisión del prototipo el 10 de noviembre: cierre al tocar fondo en modales/Drawer, enlaces de registro y tarjetas corregidos, conexión de servicios con aprobación y eliminación de un inicio duplicado. Describe además toques artificiales para mostrar errores y estados del mapa. Esos gestos eran demostrativos y no deben implementarse como reglas reales.

Los inventarios anteriores de Fundamentos, Wireframes y Alta fidelidad se conservan como antecedentes, pero la instrucción vigente es consultar únicamente Flujo de navegación. La fuente visual no elimina las decisiones funcionales registradas en esta versión.

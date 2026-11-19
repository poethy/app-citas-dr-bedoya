# Aplicación Citas Dr Camilo Bedoya

App móvil para gestionar citas del consultorio del Dr. Camilo Bedoya Orozco en Pereira y evitar cruces en la agenda.

## Estado y alcance actual

App implementada con React Native, TypeScript y Expo SDK 58, conectada a Supabase. Incluye navegación por rol, agendamiento, citas, solicitudes, agenda diaria/semanal, servicios, anticipaciones, bloqueos, horario de atención, avisos (también push) y mapa.

La app tiene dos modos, según exista o no el `.env`:

- **Con `.env` (entrega):** usa Supabase. Login, registro y sesión con Supabase Auth; todos los datos por HTTP con Axios contra `/rest/v1` (listado y detalle de citas, servicios, configuración, horario, bloqueos y avisos) y las escrituras de citas por RPC. Paciente y odontólogo comparten la información desde teléfonos distintos.
- **Sin `.env` (demo local):** usa el servicio simulado (`src/services/mock`) con AsyncStorage, las cuentas de prueba de abajo y los escenarios de demostración.

El punto único que elige uno u otro es `src/services/repositorio.ts`.

## Trabajo del equipo

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para ramas y revisiones, y [AGENTS.md](AGENTS.md) para las instrucciones de desarrollo. Los cambios entran mediante PR y revisión de otra persona del equipo.

## Reglas acordadas

- El paciente respeta anticipaciones independientes para agendar y para cancelar/reprogramar, inicialmente 24 h y configurables de 1 a 72 h.
- El doctor está exento de anticipaciones y puede gestionar excepciones por llamada, respetando horario, bloqueos y ausencia de cruces. Sus citas nuevas quedan confirmadas directamente.
- Las solicitudes pendientes vencen al llegar la hora de inicio y ya no se pueden aprobar.
- Las citas conservan precio y duración acordados, incluso al editar el catálogo o reprogramar. El pago se realiza en el consultorio.
- La disponibilidad se calcula por tramos libres de una fecha, sin unir huecos que no permiten una cita completa.
- El odontólogo edita su horario de atención y el almuerzo (C08). Si un cambio deja citas activas fuera del horario, no se guarda y C10 lista esas citas para cancelarlas o reprogramarlas.

## Tecnologías

React Native, TypeScript, Expo SDK 58, Expo Router, NativeWind de clase, Zustand, TanStack Query, Axios, AsyncStorage (demo local), OpenStreetMap/Leaflet con WebView y expo-location, y expo-notifications. Backend: Supabase Auth, PostgreSQL, RLS, RPC, pg_cron y Edge Functions. Las versiones instaladas están en package.json y package-lock.json y se comprobaron con expo install --check.

Estilo de referencia: C:/Users/StivenM/Documents/react-native-parcial. Prioridad a código legible, componentes pequeños, interfaces y separación de hooks y servicios.

## Documentos

| Documento | Contenido |
| --- | --- |
| [Cliente y problema](docs/CLIENTE%20Y%20PROBLEMA%20%28actualizado%20v2%29.docx) | Cliente, problema y alcance del producto. |
| [Requerimientos PDF](docs/requerimientos_funcionales_app_citasFinal%20%28actualizado%29.pdf) | RF-01 a RF-30 consolidados y criterios de aceptación. |
| [Fuente editable de requerimientos](docs/requerimientos.md) | Contenido utilizado para generar el PDF. |
| [Especificaciones técnicas](docs/especificaciones-tecnicas.md) | Parte I frontend; Parte II backend y contrato de integración. |
| [Handoff](docs/Handoff_App_Citas.md) | Estado del proyecto, decisiones y próximos pasos. |
| [Backend Supabase](supabase/README.md) | Migraciones (todas aplicadas), pruebas de la base, datos de prueba y push. |
| [Pantallas y datos](docs/pantallas-y-datos.md) | Qué lee y qué escribe cada pantalla. |
| [Matriz de requisitos](docs/matriz-requisitos.md) | RF-01 a RF-30 y requisitos académicos con archivo y evidencia. |
| [Informe](docs/informe.md) | Borrador del informe de la entrega final. |
| [Prueba con el cliente](docs/prueba-con-cliente.md) | Tareas y plantilla para registrar la prueba de uso. |
| [Bitácora](docs/bitacora.md) | Avances por fecha y PR. |

Proyecto_Final_Movil_II.docx se conserva sin modificaciones. [Datos_ejemplo_wireframes.md](docs/Datos_ejemplo_wireframes.md) reúne los datos de ejemplo que comparten el Figma, el seed y las pruebas.

## Diseño vigente

Se implementó desde [Flujo de navegación en Figma](https://www.figma.com/design/nyTAxFuw0CJ5hxoIqvsAIk?node-id=2012-2), incorporando en código los ajustes funcionales acordados. Después se agregaron al Figma C08–C10 (horario de atención, alta fidelidad y carril 7 del flujo) y C05 en alta fidelidad con el diseño de línea de tiempo.

## Ejecución

Necesitas Node.js compatible con Expo SDK 58 y npm. Usa npm en este proyecto; no mezcles gestores.

```bash
npm ci
npm start
```

Para Android, abre el QR con Expo Go compatible con SDK 58 y usa la misma red. Si la red local impide la conexión, prueba `npx expo start --tunnel` (requiere Internet). `npm run android` inicia el flujo con un dispositivo/emulador preparado; no genera un APK por sí solo. `npm run web` abre la versión de navegador.

Para usar Supabase, copia `.env.template` como `.env` y llena `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_KEY` (Supabase → Project Settings → API, clave pública). Reinicia Expo con `npx expo start --clear` para que tome las variables. Sin `.env` arranca la demo local.

Con Supabase:

- **Odontólogo:** la cuenta se crea una sola vez (ver `supabase/README.md` y `supabase/crear_odontologo.sql`).
- **Pacientes:** se registran desde la app. Para que entren sin confirmar el correo, desactiva «Confirm email» en Supabase → Authentication → Sign In / Providers → Email.
- **Datos de prueba para presentar:** corre `supabase/datos_prueba.sql` en el SQL Editor. Crea una agenda de ejemplo en los próximos días hábiles y pone coordenadas de prueba del consultorio. Se puede repetir antes de cada presentación.

### Notificaciones push (avisos con la app cerrada)

La app registra el token del teléfono en `tokens_push` al iniciar sesión y lo borra al cerrarla; la Edge Function `enviar-notificaciones` manda los avisos. Expo Go en Android no recibe push remotos, así que hace falta un APK propio. En Expo Go y en la web los avisos se ven al abrir la app.

Pasos (una sola vez, con la cuenta de Expo del equipo):

1. `npx eas login` y `npx eas init`. Esto crea el proyecto en Expo y escribe `extra.eas.projectId` en `app.json` (hay que hacer commit de ese cambio).
2. Credenciales de Android para push (FCM): crear un proyecto en Firebase, descargar la clave de cuenta de servicio de FCM v1 y subirla con `npx eas credentials` → Android → Push Notifications.
3. Variables públicas para el build: `npx eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value <url> --visibility plaintext` y lo mismo con `EXPO_PUBLIC_SUPABASE_KEY`. El `.env` no se sube a EAS.
4. `npx eas build -p android --profile preview` genera el APK para instalar en los teléfonos.

### Cuentas de prueba (solo demo local, sin `.env`)

| Rol | Correo | Contraseña de demo |
| --- | --- | --- |
| Paciente | ana@demo.com | Demo2026 |
| Odontólogo | doctor@demo.com | Demo2026 |

El login tiene botones para completar estos datos. El registro crea pacientes locales: utiliza datos ficticios y una contraseña exclusiva para la demo. Se guarda un hash de la contraseña de prueba; esto no constituye autenticación de producción.

### Recorrido con Supabase (con `.env`)

Lo ideal es usar dos teléfonos (o un teléfono y el navegador) para comprobar que los datos se comparten. Antes, corre `supabase/datos_prueba.sql` para tener una agenda de ejemplo.

1. **Paciente:** «Crear cuenta» con datos ficticios. Entra directo si «Confirm email» está desactivado.
2. **Paciente:** Agendar → Resina → una fecha → una franja libre → «Enviar solicitud». Queda en Mis citas → Pendientes. Las franjas ocupadas por otros pacientes no aparecen.
3. **Odontólogo (otro teléfono):** iniciar sesión. En Agenda se ve la agenda de prueba; en Solicitudes, la Resina del paciente. Aprobarla.
4. **Paciente:** la cita pasa a confirmada y llega el aviso «Tu cita fue confirmada» (push solo con el APK de EAS; en Expo Go se ve en Avisos).
5. **Paciente:** intentar cancelar una cita con menos de la anticipación configurada → M06 con las horas vigentes.
6. **Odontólogo:** Nueva cita para un paciente que llamó (nombre y celular) → queda confirmada. Bloquear horarios sobre una cita → C06.
7. **Odontólogo:** Menú → Horario de atención. Apagar el día que tiene citas y «Guardar» → C10 lista esas citas; tocar una abre su detalle. Volver a encenderlo.
8. **Odontólogo:** editar el precio de un servicio; las citas existentes conservan el precio acordado.
9. **Paciente:** Mapa → permitir ubicación → ver el consultorio y la posición propia; pausar y reanudar el seguimiento.

### Recorrido en la demo local (sin `.env`)

1. Entrar como paciente y abrir Agendar. Elegir Resina o Endodoncia, una fecha y una franja futura válida. El resumen debe mostrar el servicio, duración, precio y Enviar solicitud.
2. Consultar Mis citas → Pendientes. Cerrar y abrir la app para comprobar que permanece.
3. Abrir el menú, cerrar sesión e ingresar como doctor. En Solicitudes, aprobar o rechazar la solicitud del paciente.
4. Volver como paciente para consultar el estado y el aviso. Cancelar/reprogramar respeta su anticipación; el doctor puede gestionar excepciones sin ese límite.
5. Como doctor, editar un servicio y comprobar que las citas existentes conservan precio y duración. En Nueva cita se puede usar el mismo día si hay disponibilidad.
6. Desde Avisos → Escenarios de demostración, probar error de consulta, falta de conexión simulada, choque al registrar o solicitud que vence en 30 segundos. Reintentar recupera la consulta. Una vencida no se puede aprobar.
7. Abrir Mapa como paciente. Probar Continuar sin ubicación, centrar, permisos y controles de seguimiento. Al salir o pasar a segundo plano debe detenerse la suscripción.

Los datos iniciales se crean únicamente si no hay almacenamiento previo. Las fechas de ejemplo se sitúan cerca del día de primera ejecución, sin fijar el reloj del dispositivo al del prototipo.

### Organización y verificaciones

Las rutas están en src/app. Componentes, pantallas, hooks, servicios, modelos, mappers, stores y utilidades tienen carpetas separadas. `src/services/repositorio.ts` elige el servicio: `src/services/remoto` (Supabase con Axios) o `src/services/mock` (demo local). Las pruebas de la base están en `supabase/pruebas` (`cd supabase/pruebas && npm test`).

```bash
npm run typecheck
npm run lint
npm test
npx expo install --check
npx expo export --platform web
npx expo export --platform android
```

Consulta [matriz de requisitos](docs/matriz-requisitos.md) y [bitácora](docs/bitacora.md). Pendiente: generar el APK con EAS y probar en un teléfono Android real.

### Límites conocidos

- Las coordenadas, el teléfono, los horarios y los precios del consultorio son de prueba (`supabase/datos_prueba.sql`) hasta que el consultorio confirme los reales. El mapa los lee de `configuracion`.
- Los avisos push solo llegan en un APK de EAS con `projectId` y credenciales de FCM. En Expo Go y en la web los avisos se ven al abrir la app.
- El mapa requiere Internet para Leaflet y las teselas. No calcula rutas: muestra el consultorio y la ubicación del paciente.
- En la demo local las guardias y los hashes de contraseña no ofrecen seguridad de servidor; no usar datos personales reales.
- npm audit detecta alertas transitivas en herramientas de patrones y compilación. Las soluciones automáticas propuestas cambian versiones mayores o degradan Expo; no se aplicó audit fix --force. Revisar actualizaciones compatibles antes de producción.

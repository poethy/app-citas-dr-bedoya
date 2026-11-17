# Aplicación Citas Dr Camilo Bedoya

App móvil para gestionar citas del consultorio del Dr. Camilo Bedoya Orozco en Pereira y evitar cruces en la agenda.

## Estado y alcance actual

Frontend implementado con React Native, TypeScript y Expo SDK 58. Incluye navegación por rol, agendamiento, citas, solicitudes, agenda diaria/semanal, servicios, anticipaciones, bloqueos, avisos y mapa.

La demo guarda datos y sesión con AsyncStorage. Cerrar y volver a abrir conserva los cambios. Cambiar de cuenta permite actuar como paciente y odontólogo en el mismo dispositivo. El backend lo desarrollará otra persona; su diseño sigue en la Parte II de las especificaciones. No hay autenticación real ni sincronización entre teléfonos.

## Reglas acordadas

- El paciente respeta anticipaciones independientes para agendar y para cancelar/reprogramar, inicialmente 24 h y configurables de 1 a 72 h.
- El doctor está exento de anticipaciones y puede gestionar excepciones por llamada, respetando horario, bloqueos y ausencia de cruces. Sus citas nuevas quedan confirmadas directamente.
- Las solicitudes pendientes vencen al llegar la hora de inicio y ya no se pueden aprobar.
- Las citas conservan precio y duración acordados, incluso al editar el catálogo o reprogramar. El pago se realiza en el consultorio.
- La disponibilidad se calcula por tramos libres de una fecha, sin unir huecos que no permiten una cita completa.

## Tecnologías

React Native, TypeScript, Expo SDK 58 como objetivo, Expo Router, NativeWind de clase, Zustand, TanStack Query, AsyncStorage y OpenStreetMap/Leaflet con WebView y expo-location. Axios para el contrato HTTP futuro. Backend previsto: Supabase Auth, PostgreSQL, RLS, RPC y Edge Functions. Las versiones instaladas están en package.json y package-lock.json y se comprobaron con expo install --check.

Estilo de referencia: C:/Users/StivenM/Documents/react-native-parcial. Prioridad a código legible, componentes pequeños, interfaces y separación de hooks y servicios.

## Documentos

| Documento | Contenido |
| --- | --- |
| [Cliente y problema](docs/CLIENTE%20Y%20PROBLEMA%20%28actualizado%20v2%29.docx) | Cliente, problema y alcance del producto. |
| [Requerimientos PDF](docs/requerimientos_funcionales_app_citasFinal%20%28actualizado%29.pdf) | RF-01 a RF-30 consolidados y criterios de aceptación. |
| [Fuente editable de requerimientos](docs/requerimientos.md) | Contenido utilizado para generar el PDF. |
| [Especificaciones técnicas](docs/especificaciones-tecnicas.md) | Parte I frontend; Parte II backend y contrato de integración. |
| [Handoff](docs/Handoff_App_Citas.md) | Decisiones, ajustes de Figma para código y próximos pasos. |

Proyecto_Final_Movil_II.docx se conserva sin modificaciones. Datos_ejemplo_wireframes.md no está disponible en el árbol de trabajo y no se requiere para leer estos documentos.

## Diseño vigente

Se implementó desde [Flujo de navegación en Figma](https://www.figma.com/design/nyTAxFuw0CJ5hxoIqvsAIk?node-id=2012-2), incorporando en código los ajustes funcionales acordados. Figma no fue modificado.

## Ejecución

Necesitas Node.js compatible con Expo SDK 58 y npm. Usa npm en este proyecto; no mezcles gestores.

```bash
npm ci
npm start
```

Para Android, abre el QR con Expo Go compatible con SDK 58 y usa la misma red. Si la red local impide la conexión, prueba `npx expo start --tunnel` (requiere Internet). `npm run android` inicia el flujo con un dispositivo/emulador preparado; no genera un APK por sí solo. `npm run web` abre la versión de navegador.

No se necesita Supabase ni .env para la demo. .env.template conserva un punto de configuración opcional para la integración HTTP futura.

### Cuentas de prueba

| Rol | Correo | Contraseña de demo |
| --- | --- | --- |
| Paciente | ana@demo.com | Demo2026 |
| Odontólogo | doctor@demo.com | Demo2026 |

El login tiene botones para completar estos datos. El registro crea pacientes locales: utiliza datos ficticios y una contraseña exclusiva para la demo. Se guarda un hash de la contraseña de prueba; esto no constituye autenticación de producción.

### Recorrido para probar

1. Entrar como paciente y abrir Agendar. Elegir Resina o Endodoncia, una fecha y una franja futura válida. El resumen debe mostrar el servicio, duración, precio y Enviar solicitud.
2. Consultar Mis citas → Pendientes. Cerrar y abrir la app para comprobar que permanece.
3. Abrir el menú, cerrar sesión e ingresar como doctor. En Solicitudes, aprobar o rechazar la solicitud del paciente.
4. Volver como paciente para consultar el estado y el aviso. Cancelar/reprogramar respeta su anticipación; el doctor puede gestionar excepciones sin ese límite.
5. Como doctor, editar un servicio y comprobar que las citas existentes conservan precio y duración. En Nueva cita se puede usar el mismo día si hay disponibilidad.
6. Desde Avisos → Escenarios de demostración, probar error de consulta, falta de conexión simulada, choque al registrar o solicitud que vence en 30 segundos. Reintentar recupera la consulta. Una vencida no se puede aprobar.
7. Abrir Mapa como paciente. Probar Continuar sin ubicación, centrar, permisos y controles de seguimiento. Al salir o pasar a segundo plano debe detenerse la suscripción.

Los datos iniciales se crean únicamente si no hay almacenamiento previo. Las fechas de ejemplo se sitúan cerca del día de primera ejecución, sin fijar el reloj del dispositivo al del prototipo.

### Organización y verificaciones

Las rutas están en src/app. Componentes, pantallas, hooks, servicios, modelos, mappers, stores y utilidades tienen carpetas separadas. El repositorio mock y sus reglas están en src/services/mock; Axios y los tipos externos quedan preparados para integrar el backend.

```bash
npm run typecheck
npm run lint
npm test
npx expo install --check
npx expo export --platform web
npx expo export --platform android
```

Consulta [matriz de requisitos](docs/matriz-requisitos.md) y [bitácora](docs/bitacora.md). No se ha generado un APK ni probado un teléfono Android real en esta sesión.

### Límites conocidos

- El teléfono y las coordenadas exactas del consultorio están pendientes. El mapa identifica el marcador como una referencia del centro de Pereira, sin presentarlo como posición verificada. Los horarios y precios son de ejemplo.
- Los avisos y recordatorios son locales. Los recordatorios se calculan al consultar/volver a la app y durante su uso; no se promete entrega con la app cerrada. El resumen diario se muestra en Avisos del doctor. No se implementaron push, cron ni servidor.
- El mapa requiere Internet para Leaflet y las teselas. Las operaciones de la demo se guardan localmente; un escenario simulado de conexión no representa sincronización remota.
- Las guardias de navegación y los hashes de demo no ofrecen seguridad de servidor. No usar datos personales reales.
- npm audit detecta alertas transitivas en herramientas de patrones y compilación. Las soluciones automáticas propuestas cambian versiones mayores o degradan Expo; no se aplicó audit fix --force. Revisar actualizaciones compatibles antes de producción.

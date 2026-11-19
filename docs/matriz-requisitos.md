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

## Pruebas reproducibles

`npm test`, `npm run typecheck`, `npm run lint` y `npx expo install --check`. Los tests usan almacenamiento y criptografía simulados en Node para verificar reglas; no sustituyen la prueba del GPS o AsyncStorage nativo en un teléfono.

Los escenarios de demostración están en Avisos del odontólogo. Permiten preparar una solicitud que vence en 30 segundos, simular fallos de consulta/conexión y producir un choque en el siguiente registro. El vencimiento de una pendiente persiste aunque el intento de aprobarla falle.

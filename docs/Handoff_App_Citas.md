# Handoff de App Citas Dr Camilo Bedoya

Actualizado el 17 de noviembre de 2026. Frontend de demo implementado; backend pendiente a cargo de otra persona. Se agregaron instrucciones de ejecución, matriz y bitácora. Prueba de GPS en Android real pendiente.

## Cliente y alcance

Dr. Camilo Bedoya Orozco, odontólogo independiente en Pereira. Recibe solicitudes por WhatsApp y llamadas y utiliza una agenda de papel; los registros omitidos producen cruces. La app cubre registro, agendamiento, confirmación o aprobación, cambios, avisos, agenda, bloqueos y mapa. No cubre historia clínica, odontograma, imágenes clínicas, múltiples sedes o doctores, integración con WhatsApp/Google Calendar, migración de la agenda ni pagos en línea.

## Fuente visual vigente

Se implementó exclusivamente desde la página [Flujo de navegación](https://www.figma.com/design/nyTAxFuw0CJ5hxoIqvsAIk?node-id=2012-2), especialmente el marco Flujo de usuario por rol. Se revisaron las pantallas incluidas en ese flujo. Figma permanece sin modificar; los ajustes siguientes se incorporaron al código.

Las 58 pantallas representan rutas y variantes de estado, no 58 archivos independientes. Stack raíz con auth y ambos roles; cada rol tiene Drawer y Tabs. Paciente: Inicio, Agendar con Stack interno, Mis citas y Mapa. Doctor: Agenda, Solicitudes, Nueva cita y Avisos. Detalle compartido cita/[id]/index, reprogramación, solicitud/[id] y consultorio. Cierre de sesión y confirmación de cancelación son modales. S07/S08 reinician el flujo para no volver al resumen al pulsar Atrás.

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

## Etapa actual y responsable del backend

Se construyó el frontend con mocks persistentes en el teléfono. Conserva cambios al cerrar y volver a abrir; cambiar de sesión permite demostrar la interacción paciente/doctor en el mismo dispositivo. No hay sincronización entre dispositivos ni Auth real. El backend lo desarrollará otra persona con la Parte II de las especificaciones: Supabase, SQL, RLS, RPC y notificaciones. Esta información se conserva y se integra posteriormente.

El vencimiento se reconoce al hidratar, volver al primer plano, consultar o aprobar; con la app abierta se actualiza al llegar la hora. No se promete ejecución de jobs con la demo cerrada. El estado efectivo es vencida desde la hora de inicio.

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

## Estilo y tecnologías

Referencia de código: `C:/Users/StivenM/Documents/react-native-parcial`, especialmente navegacion-app y movies. Componentes legibles, props tipadas, hooks y servicios separados. React Native, TypeScript, Expo SDK 58 como objetivo, Expo Router, NativeWind de clase, Zustand, TanStack Query, Axios para la integración futura y Leaflet/OpenStreetMap en WebView con expo-location. Validar versiones antes de instalar; mantener npm y package-lock. Paleta navy y Poppins del flujo; monograma con Libre Baskerville.

## Documentos vigentes

- [Cliente y problema](CLIENTE%20Y%20PROBLEMA%20%28actualizado%20v2%29.docx): negocio y alcance, sin detalles de la demo o frontend.
- [Requerimientos](requerimientos_funcionales_app_citasFinal%20%28actualizado%29.pdf): RF-01 a RF-30 consolidados con las decisiones; fuente editable en requerimientos.md.
- [Especificaciones técnicas](especificaciones-tecnicas.md): Parte I frontend y Parte II backend.
- Proyecto_Final_Movil_II.docx se conserva intacto como documento recibido. Esta revisión no modifica sus exigencias.

## Implementación y próximos pasos

- [x] Base Expo SDK 58, rutas, componentes del flujo y guardias de sesión demo.
- [x] Servicios mock, persistencia e invalidación de consultas al mutar o cambiar de usuario.
- [x] Cálculo, formularios, vencimiento, precios/duraciones históricos y excepciones por rol.
- [x] Mapa, permisos y limpieza de suscripciones implementados; comprobar funcionamiento en Android real.
- [x] Escenarios de error y persistencia; recorrido paciente/doctor probado en navegador. Prueba con el cliente pendiente.
- [x] Matriz y bitácora creadas. Ver README para ejecución, cuentas y límites.
- Integrar backend cuando exista el contrato remoto operativo y verificar HTTP real e intercambio entre dispositivos.

## Pendientes de datos y mecanismos

Horarios L–V 8:00–18:00, sábado 8:00–12:00, almuerzo 12:30–13:30 y precios son ejemplos por confirmar. Coordenadas y teléfono del consultorio pendientes. No se dispone de Datos_ejemplo_wireframes.md: no restaurarlo ni depender de él sin revisar su eliminación. Los ejemplos del jueves 19 de noviembre de 2026 son referencias del prototipo, no un reloj fijo para la app.

Recordatorios, resumen diario, vinculación de cuentas y confirmación de reprogramaciones realizadas por el doctor tienen pendientes concretos en B9. Las decisiones cerradas de anticipación, vencimiento y conservación de valores ya no están por confirmar.

## Antecedentes del diseño

El handoff anterior registra revisión del prototipo el 10 de noviembre: cierre al tocar fondo en modales/Drawer, enlaces de registro y tarjetas corregidos, conexión de servicios con aprobación y eliminación de un inicio duplicado. Describe además toques artificiales para mostrar errores y estados del mapa. Esos gestos eran demostrativos y no deben implementarse como reglas reales.

Los inventarios anteriores de Fundamentos, Wireframes y Alta fidelidad se conservan como antecedentes, pero la instrucción vigente es consultar únicamente Flujo de navegación. La fuente visual no elimina las decisiones funcionales registradas en esta versión.

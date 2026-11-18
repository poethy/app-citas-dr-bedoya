# Requerimientos de App Citas Dr Camilo Bedoya

Versión 2.0. 17 de noviembre de 2026. Requerimientos consolidados de la aplicación de citas del Dr. Camilo Bedoya Orozco.

Esta versión conserva RF-01 a RF-30 y reemplaza sus criterios anteriores donde cambian las reglas acordadas. Abarca un consultorio, un odontólogo y dos roles. No incluye pagos en línea, historia clínica, odontograma, imágenes clínicas, múltiples sedes, integración con WhatsApp/Google Calendar ni migración de la agenda de papel.

El paciente cumple anticipaciones independientes para agendar y para cancelar/reprogramar. El doctor está exento y puede gestionar excepciones solicitadas por llamada, sin omitir disponibilidad. Fuera de plazo el paciente no ejecuta el cambio por sí mismo.

Una pendiente vence al llegar su inicio y no puede aprobarse después. Vencimiento y plazo de cambios son reglas diferentes. Los precios y duraciones acordados pertenecen a la cita, no al valor actual del catálogo.

La disponibilidad pertenece a una fecha: se cuentan citas completas en cada tramo libre y después se suman. El reloj del consultorio usa America/Bogota. Una cita puede comenzar justo al terminar otra.

El flujo de navegación de Figma es la referencia visual; sus variantes de aprobación, rechazo, vencimiento y resumen se ajustarán al implementar. El alcance técnico de cada etapa y la separación frontend/backend se detallan en especificaciones-tecnicas.md.

## RF-01 Registro de paciente

**Rol:** Paciente.

Crear una cuenta con nombre, teléfono, correo y contraseña.

1. Dado un visitante sin cuenta, cuando completa datos obligatorios válidos, se crea la cuenta con rol paciente y accede a su inicio.
2. Dado un correo ya registrado, cuando se intenta registrar nuevamente, se informa que está en uso y no se crea otra cuenta.

## RF-02 Inicio y cierre de sesión

**Rol:** Paciente y odontólogo.

Ingresar con correo y contraseña y cerrar la sesión.

1. Con credenciales correctas se accede al inicio correspondiente al rol de la cuenta.
2. Con contraseña incorrecta se muestra un error y no se inicia sesión.
3. Al cerrar sesión se exige ingresar nuevamente para consultar información protegida. Cerrar sesión no elimina las citas.

## RF-03 Acceso restringido por rol

**Rol:** Paciente y odontólogo.

Cada rol consulta y modifica únicamente la información autorizada.

1. El paciente consulta solo sus citas y datos personales.
2. Si intenta acceder a la agenda del consultorio o a citas ajenas, se deniega el acceso. El rol no se elige ni cambia desde el registro público.

## RF-04 Consulta de horarios disponibles

**Rol:** Paciente.

Consultar horarios según el servicio y la fecha elegidos.

1. Se ofrecen solo franjas libres, dentro del horario de atención, con duración suficiente y que cumplan la anticipación para agendar del paciente.
2. Las pendientes no vencidas y las confirmadas ocupan su franja; los bloqueos tampoco se ofrecen.

## RF-05 Solicitud de cita

**Rol:** Paciente.

Elegir servicio, fecha y hora y solicitar la cita.

1. Al confirmar una franja libre y válida, se registra paciente, servicio, inicio, fin, precio y duración acordados y se muestra el resultado.
2. El resumen corresponde al servicio seleccionado. Si requiere aprobación, el botón indica Enviar solicitud; de lo contrario, Confirmar cita.

## RF-06 Prevención de solapamientos

**Rol:** Sistema.

Impedir que dos citas activas ocupen intervalos que se crucen.

1. Si una franja está ocupada o se cruza con una cita activa, se rechaza el intento y se pide elegir otra.
2. Si dos pacientes confirman la misma franja libre al mismo tiempo, solo una operación se registra; la otra recibe aviso de horario no disponible.

## RF-07 Agendamiento por el consultorio

**Rol:** Odontólogo.

Registrar una cita para un paciente que llamó o escribió.

1. El doctor registra la cita a nombre del paciente sin exigir que tenga cuenta, respetando horario, duración suficiente, bloqueos y ausencia de solapamientos.
2. No se exige la anticipación mínima del paciente, pero la cita nueva debe comenzar en el futuro.
3. La cita registrada por el doctor queda confirmada directamente, aunque el servicio requiera aprobación para solicitudes del paciente.

## RF-08 Confirmación automática

**Rol:** Sistema.

Confirmar al instante los servicios de confirmación inmediata.

1. Cuando el paciente solicita un servicio de confirmación inmediata en una franja válida, su cita queda Confirmada y el resultado lo informa.

## RF-09 Aprobación por el consultorio

**Rol:** Odontólogo y sistema.

Resolver solicitudes de servicios con aprobación y controlar su vencimiento.

1. Cuando el paciente solicita un servicio con aprobación, queda Pendiente y reserva la franja mientras la solicitud siga activa.
2. Si el doctor aprueba una pendiente antes de su inicio, pasa a Confirmada.
3. Si el doctor la rechaza antes de su inicio, pasa a Rechazada, se libera la franja y el aviso indica rechazo, no aprobación.
4. Al llegar la hora de inicio sin respuesta, la pendiente pasa a Vencida. Se conserva como antecedente y deja de ser una solicitud activa.
5. Si se intenta aprobar cuando la hora actual es igual o posterior al inicio, se impide la aprobación y se informa que venció. Las confirmadas no vencen por esta regla.

## RF-10 Configuración del tipo de confirmación

**Rol:** Odontólogo.

Definir servicios inmediatos o con aprobación.

1. Al guardar un tipo de confirmación, las nuevas solicitudes del paciente de ese servicio siguen la regla elegida.
2. El cambio del catálogo no modifica automáticamente los estados de citas existentes.

## RF-11 Aviso del estado de la cita

**Rol:** Paciente.

Informar cambios de estado y reflejarlos en la consulta de citas.

1. Al quedar confirmada, rechazada o cancelada una cita, el paciente recibe un aviso y su lista muestra el estado actualizado.
2. Al vencer una solicitud pendiente, el paciente ve Vencida y un aviso de que llegó la hora sin aprobación. No se presenta como cita confirmada.

## RF-12 Cancelación de cita

**Rol:** Paciente y odontólogo.

Cancelar una cita futura y liberar su franja.

1. El paciente puede cancelar una pendiente no vencida o confirmada si falta al menos la anticipación de cambios configurada. Pasa a Cancelada y libera la franja.
2. Si falta menos del plazo, se impide la cancelación por el paciente y se ofrece llamar al consultorio para solicitar una excepción.
3. El doctor puede cancelar una cita futura sin ese límite, incluida una excepción gestionada por llamada. El paciente recibe el aviso correspondiente.

## RF-13 Aviso de cancelación al odontólogo

**Rol:** Odontólogo.

Informar las cancelaciones realizadas por el paciente.

1. Si el paciente cancela una pendiente o confirmada, el doctor recibe un aviso con paciente, servicio, fecha y hora; la cita aparece cancelada en la agenda.

## RF-14 Reprogramación de cita

**Rol:** Paciente y odontólogo.

Mover una cita futura a otra franja válida sin perder la original si falla.

1. El paciente debe cumplir la anticipación de cambios respecto del inicio original y la anticipación para agendar respecto del nuevo inicio.
2. Si se confirma el cambio, la franja anterior queda libre y la nueva queda reservada. Para una reprogramación realizada por el paciente se aplica de nuevo la confirmación del servicio.
3. El doctor puede reprogramar sin anticipación mínima, también por una excepción solicitada por llamada, respetando horario, bloqueos y ausencia de cruces.
4. Se conservan precio y duración acordados; el nuevo fin se obtiene con esa duración. Si falla la operación, se mantiene la cita original.

## RF-15 Anticipación para cancelar y reprogramar

**Rol:** Odontólogo.

Configurar el plazo de cambios exigido al paciente.

1. El contador cambia en pasos de 1 hora, de 1 a 72; se desactiva el control correspondiente en cada límite. El valor inicial de ejemplo es 24.
2. La configuración se aplica a nuevas operaciones de cancelación y reprogramación del paciente, independientemente de cuándo se creó la cita; el doctor está exento.
3. Es un valor independiente de la anticipación para agendar. Los avisos muestran las horas configuradas. Exactamente en el límite todavía se permite la operación.

## RF-16 Recordatorio al paciente

**Rol:** Paciente.

Avisar antes de una cita confirmada para reducir ausencias.

1. Cuando llega el momento configurado antes de una cita confirmada, se emite un recordatorio con servicio, fecha y hora.
2. Si fue cancelada o reprogramada, no se emite el recordatorio del horario anterior. La reprogramación usa el nuevo inicio.
3. No se envía un recordatorio de cita confirmada para una solicitud pendiente o vencida.

## RF-17 Resumen de citas para el consultorio

**Rol:** Odontólogo.

Recibir el listado de citas confirmadas del día.

1. Al llegar el inicio de jornada configurado, el doctor recibe el listado de citas confirmadas del día. Una pendiente no se presenta como confirmada.

## RF-18 Agenda diaria y semanal

**Rol:** Odontólogo.

Consultar las citas del consultorio.

1. Al elegir vista diaria o semanal se muestran las citas ordenadas por hora, con paciente, servicio y estado.
2. El estado Vencida se distingue de Pendiente y Confirmada cuando se consulta el antecedente de la solicitud.

## RF-19 Bloqueo de horarios no disponibles

**Rol:** Odontólogo.

Marcar periodos en los que no se atiende.

1. Al bloquear una franja libre, deja de ofrecerse a los pacientes.
2. Si se cruza con una cita activa, se avisa y no se crea el bloqueo hasta cancelar o reprogramar esa cita. La exención de anticipación del doctor no omite esta comprobación.

## RF-20 Mapa con las ubicaciones

**Rol:** Paciente.

Mostrar la posición del paciente y el consultorio.

1. Con una cita agendada y permiso concedido, al abrir el mapa se muestran marcadores distintos para el dispositivo y el consultorio: Calle 18 # 5-27, Edificio Torcoroma, Consultorio 201, Pereira. Las coordenadas exactas deben confirmarse.

## RF-21 Centrar el mapa

**Rol:** Paciente.

Volver a centrar la vista.

1. Con posición disponible, al pulsar centrar se centra en la ubicación actual del dispositivo.
2. Sin posición disponible, se centra en el consultorio y se informa que no se tiene la ubicación del paciente.

## RF-22 Activar pausar y reanudar seguimiento

**Rol:** Paciente.

Controlar la actualización de la posición mientras se consulta el mapa.

1. Con permiso concedido, al activar se actualiza el marcador a medida que el dispositivo se mueve y se indica seguimiento activo.
2. Al pausar, se detienen las actualizaciones y se indica pausa.
3. Al reanudar, se retoman las actualizaciones desde la posición actual.

## RF-23 Permiso de ubicación denegado

**Rol:** Paciente.

Permitir continuar sin permiso de ubicación.

1. Si el permiso está denegado, se explica su finalidad y se ofrecen Abrir ajustes y Continuar sin ubicación, sin cerrar la aplicación.

## RF-24 Regreso desde ajustes

**Rol:** Paciente.

Revisar el permiso al volver a la aplicación.

1. Si el paciente concede permiso en ajustes, al volver se comprueba y se muestra la ubicación sin reiniciar.
2. Si no cambió el permiso, se mantiene la explicación y las opciones para continuar.

## RF-25 GPS no disponible y fallos de carga

**Rol:** Paciente.

Tratar fallos de ubicación y mapa sin bloquear la aplicación.

1. Con GPS apagado o sin señal, se explica que no se pudo obtener la ubicación y se ofrece reintentar.
2. Si falla la carga del mapa, por ejemplo sin conexión, se muestra error con reintento; las otras secciones siguen disponibles.

## RF-26 Continuar sin GPS

**Rol:** Paciente.

Usar la aplicación sin posición del paciente.

1. Al continuar sin ubicación, el mapa muestra solo el consultorio con su dirección y el agendamiento no se bloquea por falta de GPS.

## RF-27 Liberar suscripción al GPS

**Rol:** Paciente y sistema.

Detener el seguimiento cuando ya no se necesita.

1. Si el seguimiento está activo y se sale del mapa o la app pasa a segundo plano, se libera la suscripción y no llegan más actualizaciones.
2. Si se cierra el mapa con seguimiento pausado o desactivado, tampoco queda una suscripción activa.

## RF-28 Cálculo de franjas disponibles

**Rol:** Odontólogo y sistema.

Ajustar la duración y calcular citas completas por tramo libre.

1. El contador de duración aumenta o disminuye de 15 en 15 minutos, entre 15 y 180; desactiva cada botón al alcanzar su límite.
2. Para una fecha, se resta la unión de citas activas y bloqueos al horario. En cada tramo libre efectivo se calcula floor(minutos libres / duración) y se suman los resultados; no se unen huecos separados.
3. Para el paciente, los tramos efectivos respetan además la anticipación para agendar; los inicios se alinean a pasos de 15 minutos. Para el doctor se excluye el pasado, sin esa anticipación.
4. Vacío, texto no numérico, negativo y cero producen mensajes específicos y no permiten guardar; también se rechazan valores fuera de rango o no múltiplos de 15.
5. Sin un tramo suficientemente largo, se informa que no hay horarios y se sugiere otra fecha. Dos huecos de 30 minutos para un servicio de 45 producen cero franjas.
6. C02 identifica la fecha del cálculo y su resultado corresponde a los mismos parámetros usados para ofrecer franjas al paciente. No se define una capacidad universal independiente del día.

## RF-29 Anticipación mínima para agendar

**Rol:** Odontólogo y sistema.

Configurar la anticipación de agendamiento del paciente.

1. El contador cambia de 1 en 1 hora, entre 1 y 72, con botones deshabilitados en los límites; se guarda aparte del plazo de cambios. Valor inicial de ejemplo: 24.
2. Con 24 horas, el paciente solo ve inicios al menos 24 horas después del instante de consulta. Exactamente en el límite se permite agendar.
3. Si al confirmar la franja dejó de cumplir la anticipación por el paso del tiempo, se rechaza y se pide elegir otra, indicando las horas exigidas.
4. El doctor no está sujeto a esta anticipación al registrar una cita, pero respeta disponibilidad y un inicio futuro.

## RF-30 Precio por servicio

**Rol:** Odontólogo y paciente.

Configurar el precio y mostrarlo durante el agendamiento.

1. Al editar el precio del catálogo, el nuevo valor aparece en la lista de servicios y en el resumen de citas nuevas.
2. Si el precio está vacío, no es numérico o es negativo, se muestra un mensaje específico y no se guarda. Se trabaja con pesos colombianos enteros.
3. Al elegir un servicio y revisar el resumen, el paciente ve su precio y que el pago se realiza en el consultorio.
4. Las citas existentes conservan el precio y duración acordados al crearlas, aunque cambie el catálogo. Reprogramar tampoco cambia esos valores; no se añaden pantallas para esta regla.

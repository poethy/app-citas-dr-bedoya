# Informe del proyecto — App de citas del Dr. Camilo Bedoya

Proyecto final de Móvil II. Borrador del 18 de noviembre de 2026: falta completar la prueba con el cliente (sección 8) y las capturas en Android.

## 1. Cliente y problema

El cliente es el Dr. Camilo Bedoya Orozco, odontólogo independiente con consultorio en Pereira (Consultorio 201, Ed. Torcoroma, Calle 18 # 5-27). Hoy recibe las solicitudes por WhatsApp y llamadas y las anota en una agenda de papel. Cuando está ocupado puede olvidar registrar una cita, lo que causa cruces de horarios, problemas en la atención y pérdida de confianza de los pacientes.

La app reúne todo en una sola agenda: el paciente ve la disponibilidad real y agenda, cancela o reprograma; el odontólogo ve su agenda, aprueba solicitudes, registra citas que le piden por teléfono y bloquea horarios. La base de datos impide que dos citas se crucen.

## 2. Alcance

Un consultorio y un odontólogo. Dos roles:

- **Paciente:** registro e inicio de sesión, agendar (servicio, fecha y franja), mis citas, detalle, cancelar y reprogramar dentro del plazo, avisos, perfil y mapa del consultorio.
- **Odontólogo:** agenda diaria y semanal, solicitudes (aprobar o rechazar), nueva cita para pacientes que llaman, avisos, servicios con precio y duración, anticipaciones mínimas, bloqueos de horario y horario de atención.

Fuera del alcance: historia clínica, odontograma, radiografías, integración con WhatsApp o Google Calendar, varios consultorios, migración de la agenda de papel y pagos en línea (el precio se muestra y se paga en el consultorio).

## 3. Reglas de negocio

- **Anticipación:** el paciente agenda con al menos la anticipación configurada (1 a 72 h, 24 por defecto) y cancela o reprograma con otra anticipación aparte. El odontólogo no tiene ese límite, pero sí respeta el horario, los bloqueos y los cruces.
- **Confirmación:** según el servicio, la cita del paciente queda confirmada o pendiente de aprobación. Las que registra el odontólogo quedan confirmadas. Una solicitud pendiente reserva su franja y vence al llegar su hora sin respuesta.
- **Precio y duración acordados:** cada cita guarda los del momento en que se creó; editar el catálogo solo afecta las citas nuevas.
- **Franjas (contador y cálculo):** para una fecha, horario de atención menos citas, bloqueos y almuerzo; en cada tramo libre caben ⌊tramo ÷ duración⌋ citas. La duración se ajusta de 15 a 180 minutos en pasos de 15. Al paciente solo se le ofrecen franjas que respeten su anticipación.
- **Bloqueos:** no se puede bloquear un horario con una cita activa.
- **Horario de atención (C08):** un cambio que deje citas activas fuera del horario no se guarda (propuesta por confirmar con el equipo).

Todas estas reglas las valida la base de datos (funciones RPC en Supabase); la app las muestra y traduce los errores.

## 4. Mapa de pantallas

El flujo completo está en Figma, página «🧭 Flujo de navegación», con un carril por flujo y por rol. Resumen:

| Grupo | Pantallas |
| --- | --- |
| Acceso | A00 inicio, A01 bienvenida, A02–A03 login, A04–A05 registro |
| Paciente | P01 inicio, P02 menú, P03 avisos, P04 perfil, P05 consultorio, P06 salir |
| Agendar | S01 servicio, S02 fecha, S03–S05 franja, S06 resumen, S07–S08 resultado |
| Mis citas | M01–M02 lista, M03–M04 detalle, M05–M06 cancelar, M07–M08 reprogramar |
| Odontólogo | O01–O02 agenda, O03 menú, O04–O07 solicitudes, O08 detalle, O09–O10 nueva cita, O11 avisos, O12 salir |
| Configuración | C01–C03 servicios, C04 anticipación, C05–C07 bloqueos, C08–C10 horario de atención |
| Mapa | MP01–MP07 |
| Estados | G01 cargando, G02 sin conexión, G03 error, G04 acceso denegado |

## 5. Organización del código

```
src/app/              Rutas de Expo Router por rol: (auth), (paciente), (odontologo), cita/[id], solicitud/[id]
src/screens/          Pantallas grandes compartidas (acceso, agendar, detalle, avisos)
src/components/       Componentes reutilizables con props tipadas
src/hooks/            Hooks propios y de TanStack Query
src/services/         repositorio.ts (elige Supabase o la demo), http/ (Axios), remoto/ (Supabase), mock/ (demo)
src/types/api.ts      Respuestas de la API (snake_case)
src/models/           Modelos internos
src/mappers/          Respuesta → modelo
src/store/            Zustand
src/utils/            Lógica pura: franjas, horario, fechas, validaciones
supabase/             Migraciones, seed, datos de prueba y pruebas de la base
```

Detalle técnico en [especificaciones-tecnicas.md](especificaciones-tecnicas.md) y qué lee o escribe cada pantalla en [pantallas-y-datos.md](pantallas-y-datos.md).

## 6. Matriz de requisitos

Ver [matriz-requisitos.md](matriz-requisitos.md): una tabla por requerimiento funcional (RF-01 a RF-30) y otra por cada requisito académico del documento del curso, con función, pantalla, archivo y evidencia.

## 7. Evidencias de pruebas

| Prueba | Comando | Resultado (18/11/2026) |
| --- | --- | --- |
| Tipos | `npx tsc --noEmit` | Sin errores |
| Lint | `npm run lint` | Sin errores |
| Pruebas de la app (reglas, repositorio, horario, capa remota) | `npm test` | 84 de 84 |
| Pruebas de la base (reglas, permisos, vencimiento, horario, concurrencia) | `cd supabase/pruebas && npm test` | 58 de 58 en `main`; 63 de 63 con el PR #11 (concurrencia) |
| Recorrido en el navegador | `npm run web` | C08–C10, menú, P05 y arranque en modo servidor sin errores en consola |
| Android con Expo Go | — | Pendiente |

## 8. Prueba con el cliente

Pendiente. La guía y la plantilla para registrarla están en [prueba-con-cliente.md](prueba-con-cliente.md).

## 9. Límites conocidos

- **Datos de prueba:** la agenda, las coordenadas y el teléfono del consultorio son de prueba (`supabase/datos_prueba.sql`) hasta que el consultorio confirme los reales.
- **Avisos con la app cerrada:** la base y la Edge Function de push están listas, pero la app todavía no registra el token del teléfono, así que los avisos se ven al abrir la app.
- **Confirmación de correo:** con «Confirm email» activo en Supabase, un paciente nuevo debe confirmar su correo antes de entrar.
- **Regla de C10:** propuesta por confirmar con el equipo.
- **Mapa:** necesita Internet para Leaflet y las teselas. No calcula rutas; muestra el consultorio y la ubicación del paciente.
- **Correo de la cuenta:** no se cambia desde P04.

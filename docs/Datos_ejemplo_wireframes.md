# Datos de ejemplo unificados — Wireframes

Referencia para que todas las pantallas cuenten la misma historia (corrige los hallazgos #3, #7 y #8 de la auditoría).

## Calendario
- Hoy en el prototipo: **lunes 9 de noviembre de 2026**. El 1 de noviembre de 2026 cae domingo.
- Día de ejemplo: **jueves 19 de noviembre de 2026**.

## Horario del consultorio
- Lunes a viernes: 8:00 a. m. – 6:00 p. m. (10 h). Sábado: 8:00 a. m. – 12:00 m.
- Almuerzo bloqueado: **12:30 – 1:30 p. m. (1 h)**, igual en todas las pantallas.
- Anticipación para agendar: 24 h. Anticipación para cancelar o reprogramar: 24 h (dos ajustes aparte en C04).

## Servicios
| Servicio | Duración | Precio (ejemplo) | Confirmación |
|---|---|---|---|
| Valoración general | 30 min | $60.000 | Inmediata |
| Limpieza dental | 45 min | $120.000 | Inmediata |
| Resina | 60 min | $180.000 | Con aprobación |
| Endodoncia | 90 min | $450.000 | Con aprobación |

Los precios son supuestos: hay que confirmarlos con el cliente. El pago se hace en el consultorio.

## Agenda del jueves 19 de noviembre
| Hora | Paciente | Servicio | Estado |
|---|---|---|---|
| 8:00 – 8:45 a. m. | Carlos Ruiz | Limpieza dental | Confirmada |
| 9:30 – 11:00 a. m. | Laura Pérez | Endodoncia | Pendiente (reserva la franja) |
| 11:00 – 11:45 a. m. | Ana Gómez | Limpieza dental | Confirmada (la agenda en S01–S07) |
| 12:30 – 1:30 p. m. | — | Almuerzo | Bloqueado |
| 2:15 – 3:45 p. m. | Jorge Díaz | Endodoncia | Confirmada |
| 4:30 – 5:15 p. m. | Sofía Mejía | Limpieza dental | Cancelada (la franja queda libre) |

## Cálculo de franjas (RF-28) — regla única
`franjas = ⌊ (horario de atención − citas agendadas − horarios bloqueados) ÷ duración del servicio ⌋` (se redondea **hacia abajo**).

- **S03** (antes de que Ana agende, Limpieza 45 min): (600 − 225 − 60) ÷ 45 = **7 franjas** (la pantalla ya no muestra el número; solo lista las 7) → 8:45, 11:00, 11:45 a. m., 1:30, 3:45, 4:30, 5:15 p. m.
- **S05** (otra persona tomó las 11:00): (600 − 270 − 60) ÷ 45 = **6 franjas**.
- **C02** (capacidad diaria del servicio): (600 − 0 − 60) ÷ 45 = **12 franjas**.

Las citas agendadas se cuentan sobre la misma rejilla de 45 min, por eso la fórmula coincide con la lista de horarios.

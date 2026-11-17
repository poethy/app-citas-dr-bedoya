# Base de datos (Supabase)

PostgreSQL de Supabase con las tablas, reglas y seguridad de la app. El diseño está en [docs/especificaciones-tecnicas.md](../docs/especificaciones-tecnicas.md), secciones 3 y 4, y lo que usa cada pantalla del Figma en [docs/pantallas-y-datos.md](../docs/pantallas-y-datos.md).

## Proyecto en Supabase

| Dato | Valor |
| --- | --- |
| Proyecto | `app-citas-dr-bedoya` (organización de poethy, plan gratuito) |
| Región | us-east-1 (Virginia) |
| URL | `https://hiechbnorpgzrwfgufjp.supabase.co` |
| Clave para la app | La **publishable** (`sb_publishable_…`), en Project Settings → API. Va en el `.env` (ver [.env.template](../.env.template)); se comparte con el equipo por un canal privado |

Creado el 17 de noviembre de 2026 con las 5 migraciones y el seed de esta carpeta. Se probó en el proyecto real: registro con vinculación de ficha, agendar, choque de horario, aprobación pendiente, cancelación y permisos. El asesor de seguridad de Supabase solo marca las 9 funciones RPC que la app debe poder llamar (validan el rol por dentro).

**Pendiente (requiere el panel de Supabase):**
1. **Authentication → Sign In / Providers → Email**: desactivar **Confirm email** mientras se desarrolla, para que el registro (RF-01) entre directo.
2. ~~Crear la cuenta del odontólogo~~ Hecho el 17 de noviembre: la cuenta del Dr. Camilo Bedoya Orozco tiene rol `odontologo` y ve la agenda completa. Para repetirlo en otro proyecto: **Authentication → Users → Add user** (con «Auto Confirm User») y [crear_odontologo.sql](crear_odontologo.sql) en el **SQL Editor**.
3. Cuando el cliente los confirme: teléfono y coordenadas del consultorio (`update public.configuracion set telefono = …, latitud = …, longitud = … where id = 1;`).

## Archivos

| Archivo | Qué hace |
| --- | --- |
| `migrations/…_esquema.sql` | Tablas, tipos y la restricción que impide citas cruzadas (RF-06) |
| `migrations/…_reglas.sql` | Validación de franjas, avisos automáticos, registro de pacientes y funciones RPC (solicitar, cancelar, reprogramar, aprobar, registrar, bloquear, disponibilidad) |
| `migrations/…_seguridad.sql` | Seguridad por rol con RLS (RF-03) y permisos de las funciones |
| `migrations/…_recordatorios_cron.sql` | Recordatorios cada 15 min y resumen diario a las 8:00 a. m. con pg_cron (RF-16, RF-17) |
| `migrations/…_ajustes_seguridad.sql` | Ajustes que pidió el asesor de seguridad de Supabase |
| `seed.sql` | Datos de ejemplo: horario, almuerzo, 4 servicios con precio, 5 fichas de pacientes y la agenda del jueves 19 de noviembre de 2026 |
| `crear_odontologo.sql` | Convierte una cuenta en la del odontólogo (una sola vez) |
| `config.toml` | Configuración de la CLI de Supabase |

Los nombres de las migraciones coinciden con las versiones registradas en el proyecto, así que la CLI (`npx supabase link` + `npx supabase db push`) solo aplicará las que se agreguen después.

## Cambiar la base

1. Crear un archivo nuevo en `migrations/` (nunca editar uno ya aplicado).
2. Correr las pruebas locales.
3. Aplicarlo con `npx supabase db push` (pide la contraseña de la base) o desde el SQL Editor.

## Probar las reglas sin Supabase

`pruebas/` corre las migraciones y el seed en un PostgreSQL real dentro de Node ([PGlite](https://pglite.dev)), sin Docker ni cuenta, y revisa 36 casos: agendar, choques (RF-06), almuerzo, horario, anticipación (RF-29), cancelación fuera de plazo (RF-12), aprobación (RF-09), bloqueos (RF-19), registro desde el consultorio (RF-07), permisos por rol (RF-03), avisos, recordatorios y los datos que piden las pantallas (número de cita, consultorio, perfil, pestaña Aprobadas).

```bash
cd supabase/pruebas && npm install && npm test
```

Cada línea sale con ✔ o ✘. Hay que correrlas después de cambiar cualquier migración.

## Notas

- **Zona horaria:** todo se guarda en UTC (`timestamptz`); las reglas de horario usan `America/Bogota`.
- **Errores:** las funciones devuelven códigos fijos (`HORARIO_NO_DISPONIBLE`, `FUERA_DE_HORARIO`, `FUERA_DE_ANTICIPACION`, `FUERA_DE_PLAZO`, `CHOQUE_CON_CITA`, `NO_AUTORIZADO`, …) que la app traduce a mensajes (especificación, sección 5.4).
- **Registro:** la app debe enviar `nombre` y `telefono` en `options.data` de `supabase.auth.signUp`. Si el teléfono coincide con una ficha que creó el doctor, la cuenta queda vinculada a esa ficha y el paciente ve sus citas.
- **Fechas del seed:** la agenda de ejemplo es del jueves 19 de noviembre de 2026. La cita de Ana Gómez (11:00 a. m.) no se crea para poder agendarla en vivo en la demo.
- **Plan gratuito:** Supabase pausa el proyecto tras unos días sin uso. Antes de una demo hay que entrar al panel y reactivarlo.

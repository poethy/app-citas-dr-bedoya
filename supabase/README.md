# Base de datos (Supabase)

PostgreSQL de Supabase con las tablas, reglas y seguridad de la app. El diseño está en [docs/especificaciones-tecnicas.md](../docs/especificaciones-tecnicas.md), secciones 3 y 4, y lo que usa cada pantalla del Figma en [docs/pantallas-y-datos.md](../docs/pantallas-y-datos.md).

## Proyecto en Supabase

| Dato | Valor |
| --- | --- |
| Proyecto | `app-citas-dr-bedoya` (organización de poethy, plan gratuito) |
| Región | us-east-1 (Virginia) |
| URL | `https://hiechbnorpgzrwfgufjp.supabase.co` |
| Clave para la app | La **publishable** (`sb_publishable_…`), en Project Settings → API. Va en el `.env` (ver [.env.template](../.env.template)); se comparte con el equipo por un canal privado |

Creado el 17 de noviembre de 2026 con las migraciones, el seed y la Edge Function de esta carpeta. Se probó en el proyecto real: registro con vinculación de ficha, agendar, choque de horario, aprobación pendiente, cancelación y permisos. El asesor de seguridad de Supabase solo marca las 9 funciones RPC que la app debe poder llamar (validan el rol por dentro).

**Pendiente (requiere el panel de Supabase):**
1. **Authentication → Sign In / Providers → Email**: desactivar **Confirm email** mientras se desarrolla, para que el registro (RF-01) entre directo.
2. ~~Crear la cuenta del odontólogo~~ Hecho el 17 de noviembre: la cuenta del Dr. Camilo Bedoya Orozco tiene rol `odontologo` y ve la agenda completa. Para repetirlo en otro proyecto: **Authentication → Users → Add user** (con «Auto Confirm User») y [crear_odontologo.sql](crear_odontologo.sql) en el **SQL Editor**.
3. (Opcional) **Authentication → Attack Protection**: activar la protección de contraseñas filtradas (HaveIBeenPwned), si el plan la incluye. Es el único aviso de seguridad pendiente además de las RPC intencionales.
4. Cuando el cliente los confirme: teléfono y coordenadas del consultorio (`update public.configuracion set telefono = …, latitud = …, longitud = … where id = 1;`).

## Notificaciones push (RF-11, RF-13, RF-16, RF-17)

```
cambio en una cita / pg_cron (recordatorio 15 min, resumen 8:00 a. m.)
        │ triggers y funciones de la base
        ▼
tabla notificaciones (enviada_push = false) ──► la app las lista en P03 y O11
        │ pg_cron cada minuto, solo si hay pendientes (pg_net + secreto de Vault)
        ▼
Edge Function enviar-notificaciones ──► Expo Push ──► teléfonos con token en tokens_push
```

- La app guarda el token de Expo del teléfono en `tokens_push` al iniciar sesión (`POST /rest/v1/tokens_push`). Sin token, el aviso solo aparece dentro de la app.
- La función marca cada notificación como enviada una sola vez, borra los tokens que Expo reporta como `DeviceNotRegistered` y no reenvía avisos de más de 24 horas.
- Seguridad: la función no acepta JWT; exige el encabezado `x-secreto-cron`, que se compara con el secreto `secreto_cron_push` de Supabase Vault. Sin él responde 401.
- Los secretos `project_url` y `secreto_cron_push` ya están en Vault. En otro proyecto se crean una vez en el SQL Editor:

  ```sql
  select vault.create_secret('https://<ref>.supabase.co', 'project_url');
  select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'secreto_cron_push');
  ```

- Para recibir push en Android hace falta un development build o un APK de EAS con credenciales de FCM; en Expo Go no llegan (ver especificación, sección 7).
- Probado el 17/11/2026: un aviso de prueba pasó por el cron, la función y Expo, que devolvió `DeviceNotRegistered` para el token falso; la función lo borró y marcó el aviso.
- Redesplegar después de cambiar el código: `npx supabase functions deploy enviar-notificaciones --no-verify-jwt`.

## Archivos

| Archivo | Qué hace |
| --- | --- |
| `migrations/…_esquema.sql` | Tablas, tipos y la restricción que impide citas cruzadas (RF-06) |
| `migrations/…_reglas.sql` | Validación de franjas, avisos automáticos, registro de pacientes y funciones RPC (solicitar, cancelar, reprogramar, aprobar, registrar, bloquear, disponibilidad) |
| `migrations/…_seguridad.sql` | Seguridad por rol con RLS (RF-03) y permisos de las funciones |
| `migrations/…_recordatorios_cron.sql` | Recordatorios cada 15 min y resumen diario a las 8:00 a. m. con pg_cron (RF-16, RF-17) |
| `migrations/…_ajustes_seguridad.sql` | Ajustes que pidió el asesor de seguridad de Supabase |
| `migrations/…_envio_push_cron.sql` | pg_net, validación del secreto y cron que invoca la Edge Function de push |
| `migrations/…_estado_vencida.sql` | Agrega el estado `vencida` (va solo porque Postgres no deja usar un valor nuevo de un enum en la misma transacción) |
| `migrations/…_cita_acordada_y_vencimiento.sql` | Precio y duración acordados en cada cita; vencimiento de solicitudes, aviso `vencida` y RPC ajustadas (F2, B4) |
| `migrations/…_vencer_solicitudes_cron.sql` | pg_cron cada minuto: pendientes cuya hora llegó pasan a vencida |
| `migrations/…_actualizar_horario.sql` | RPC `actualizar_horario` para C08–C10 (horario de la semana y almuerzo) |
| `functions/enviar-notificaciones/` | Edge Function que manda las notificaciones por Expo Push |
| `../src/types/database.ts` | Tipos TypeScript generados de la base, para la app |
| `seed.sql` | Datos de ejemplo: horario, almuerzo, 4 servicios con precio, 5 fichas de pacientes y la agenda del jueves 19 de noviembre de 2026 |
| `crear_odontologo.sql` | Convierte una cuenta en la del odontólogo (una sola vez) |
| `config.toml` | Configuración de la CLI de Supabase |

Los nombres de las migraciones coinciden con las versiones registradas en el proyecto, así que la CLI (`npx supabase link` + `npx supabase db push`) solo aplicará las que se agreguen después.

## Cambiar la base

1. Crear un archivo nuevo en `migrations/` (nunca editar uno ya aplicado).
2. Correr las pruebas locales.
3. Aplicarlo con `npx supabase db push` (pide la contraseña de la base) o desde el SQL Editor.

## Probar las reglas sin Supabase

`pruebas/` corre las migraciones y el seed en un PostgreSQL real dentro de Node ([PGlite](https://pglite.dev)), sin Docker ni cuenta, y revisa 58 casos: agendar, choques (RF-06), almuerzo, horario, anticipación (RF-29), cancelación fuera de plazo (RF-12), aprobación (RF-09), bloqueos (RF-19), registro desde el consultorio (RF-07), permisos por rol (RF-03), avisos, recordatorios y los datos que piden las pantallas (número de cita, consultorio, perfil, pestaña Aprobadas), precio y duración acordados, solicitudes vencidas y el horario editable (C08–C10).

El seed y las pruebas usan la agenda del jueves 19 de noviembre de 2026. `correr.mjs` cambia esas fechas por el próximo jueves que esté a más de 48 h, así que las pruebas dan lo mismo sin importar el día o la hora en que se corran.

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

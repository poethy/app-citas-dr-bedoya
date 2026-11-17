# Base de datos (Supabase)

PostgreSQL de Supabase con las tablas, reglas y seguridad de la app. El diseño está en [docs/especificaciones-tecnicas.md](../docs/especificaciones-tecnicas.md), secciones 3 y 4, y lo que usa cada pantalla del Figma en [docs/pantallas-y-datos.md](../docs/pantallas-y-datos.md).

## Archivos

| Archivo | Qué hace |
| --- | --- |
| `migrations/…0100_esquema.sql` | Tablas, tipos y la restricción que impide citas cruzadas (RF-06) |
| `migrations/…0200_reglas.sql` | Validación de franjas, avisos automáticos, registro de pacientes y funciones RPC (solicitar, cancelar, reprogramar, aprobar, registrar, bloquear, disponibilidad) |
| `migrations/…0300_seguridad.sql` | Seguridad por rol con RLS (RF-03) y permisos de las funciones |
| `migrations/…0400_recordatorios_cron.sql` | Recordatorios cada 15 min y resumen diario a las 8:00 a. m. con pg_cron (RF-16, RF-17) |
| `seed.sql` | Datos de ejemplo: horario, almuerzo, 4 servicios con precio, 5 fichas de pacientes y la agenda del jueves 19 de noviembre de 2026 |
| `crear_odontologo.sql` | Convierte una cuenta en la del odontólogo (una sola vez) |
| `config.toml` | Configuración de la CLI de Supabase |

## Crear la base en Supabase (una sola vez, la hace una persona del equipo)

1. Crear el proyecto en [supabase.com/dashboard](https://supabase.com/dashboard): **New project**, región **East US (North Virginia)** o la más cercana, y una contraseña de base de datos que se guarda en un gestor de contraseñas.
2. Desde la raíz del repo:

   ```bash
   npx supabase login
   ```

   ```bash
   npx supabase link --project-ref <ref-del-proyecto>
   ```

   ```bash
   npx supabase db push --include-seed
   ```

   El `ref` es la parte de la URL del proyecto: `https://<ref>.supabase.co`. `link` y `db push` piden la contraseña de la base.
3. **Authentication → Sign In / Providers → Email**: desactivar **Confirm email** mientras se desarrolla, para que el registro (RF-01) entre directo.
4. Crear la cuenta del odontólogo y ejecutar [crear_odontologo.sql](crear_odontologo.sql) en el **SQL Editor** (las instrucciones están dentro del archivo).
5. **Project Settings → API**: copiar la **Project URL** y la clave **publishable** (o `anon`) al `.env` de la app. Se comparten con el equipo por un canal privado, nunca en el repo.

**Sin la CLI:** en el SQL Editor se pueden pegar y ejecutar, en orden, los cuatro archivos de `migrations/` y después `seed.sql`.

## Probar las reglas sin Supabase

`pruebas/` corre las migraciones y el seed en un PostgreSQL real dentro de Node ([PGlite](https://pglite.dev)), sin Docker ni cuenta, y revisa 37 casos: agendar, choques (RF-06), almuerzo, horario, anticipación (RF-29), cancelación fuera de plazo (RF-12), aprobación (RF-09), bloqueos (RF-19), registro desde el consultorio (RF-07), permisos por rol (RF-03), avisos, recordatorios y los datos que piden las pantallas (número de cita, consultorio, perfil, pestaña Aprobadas).

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

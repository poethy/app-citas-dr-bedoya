# AGENTS.md — Guía para agentes de IA

Instrucciones para cualquier asistente de IA (Claude Code, Codex, Cursor, Copilot u otro) que trabaje en este repositorio. Los humanos del equipo siguen [CONTRIBUTING.md](CONTRIBUTING.md); este archivo lo complementa con lo que una IA necesita saber para no romper nada.

## Reglas que no se negocian

1. **Nada de coautoría de IA.** Ningún commit, PR, comentario ni archivo lleva líneas como `Co-Authored-By: Claude …`, `Co-authored-by: Copilot …`, «Generated with …», «🤖» ni firmas de herramientas. El autor del commit es la persona que te está usando. Si tu herramienta agrega esas líneas por defecto, quítalas antes de hacer commit. Un chequeo de GitHub rechaza los PR que las tengan.
2. **Nunca hagas push a `main`** ni hagas merge de un PR. Trabajas en una rama y abres un PR; lo revisa y lo aprueba otra persona del equipo.
3. **No subas secretos.** El `.env` no va al repo. Nunca uses ni pidas la clave `service_role`/`secret` de Supabase, ni la contraseña de la base. La app solo usa la clave pública (`EXPO_PUBLIC_SUPABASE_KEY`).
4. **No edites migraciones ya aplicadas** (`supabase/migrations/`). Los cambios a la base van en un archivo nuevo (ver [Base de datos](#base-de-datos)).
5. **No cambies decisiones de diseño por tu cuenta.** Si un requerimiento, una pantalla del Figma y el código no coinciden, o falta un dato, pregúntale a la persona antes de inventar una regla. Las decisiones abiertas están en la sección 11 de la especificación.
6. **Escribe en español** el texto que ve el usuario, los mensajes de commit, los títulos y descripciones de PR, y los comentarios del código. Los nombres de variables y funciones también van en español (`citas`, `calcularFranjas`, `useSesionStore`), salvo términos técnicos sin traducción natural (`props`, `queryKey`, `mapper`).

## El proyecto en 30 segundos

App móvil de citas para el consultorio odontológico del Dr. Camilo Bedoya (Pereira). Tiene dos roles: **paciente** (agenda, cancela, reprograma y ve el mapa) y **odontólogo** (agenda del día, solicitudes, bloqueos y configuración). Es el proyecto final de Móvil II, así que además de funcionar tiene que cumplir los requisitos académicos.

## Lee esto antes de escribir código

| Documento | Para qué |
| --- | --- |
| [docs/especificaciones-tecnicas.md](docs/especificaciones-tecnicas.md) | Stack, reglas de negocio, API, estructura de carpetas, estado y hooks. **Es la fuente de verdad técnica** |
| [docs/pantallas-y-datos.md](docs/pantallas-y-datos.md) | Qué lee y qué escribe cada pantalla (ruta → tabla o RPC) |
| [docs/requerimientos_funcionales_app_citasFinal (actualizado).pdf](docs/) | RF-01 a RF-30 con sus criterios de aceptación (Dado / Cuando / Entonces) |
| [docs/Proyecto_Final_Movil_II.docx](docs/) | Requisitos académicos obligatorios (navegación, estado, HTTP, mapas, entrega) |
| [docs/Datos_ejemplo_wireframes.md](docs/Datos_ejemplo_wireframes.md) | Datos de ejemplo que comparten el Figma, el seed y las pruebas |
| [supabase/README.md](supabase/README.md) | Base de datos: proyecto, migraciones, seed y pruebas |
| [Figma](https://www.figma.com/design/nyTAxFuw0CJ5hxoIqvsAIk) | Página 🎨 Alta fidelidad (pantallas) y 🧭 Flujo de navegación → «Flujo de usuario por rol» |

Cada pantalla tiene un código (A02, S03, M03, O05, C02…). Úsalo en commits, PR y comentarios para que todos sepan de qué hablas.

## Stack (no lo cambies sin acuerdo del equipo)

- React Native + TypeScript + **Expo SDK 58**, con **Expo Router**. Las librerías nativas se instalan con `npx expo install`, nunca con `npm i`, para que coincidan con el SDK.
- **NativeWind** con la versión de clase (por defecto 4.2.x + Tailwind 3.4). Los colores y tipografías salen de la página 🧱 Fundamentos del Figma (navy, Poppins).
- **Supabase**: Auth + PostgreSQL. **supabase-js solo para Auth** (registro, login, sesión, logout).
- **Axios** para todos los datos: `baseURL = ${EXPO_PUBLIC_SUPABASE_URL}/rest/v1`, con un interceptor que pone `apikey` y `Authorization: Bearer <token>`. Es requisito del curso.
- **TanStack Query** para el estado remoto; **Zustand** para el estado compartido local; `useState`/`useEffect` para el de una pantalla.
- **Mapa:** OpenStreetMap + Leaflet en `react-native-webview` y `expo-location`. Es requisito del curso: no lo cambies por react-native-maps ni Google Maps.
- **zod** para formularios; **date-fns** con zona `America/Bogota`.
- **npm** como gestor de paquetes. No uses yarn ni pnpm ni borres `package-lock.json`.

## Estructura

Las rutas siguen el flujo del Figma. La lista completa está en la sección 6 de la especificación; en resumen:

```
src/app/             Rutas de Expo Router: (auth), (paciente), (odontologo), cita/[id], solicitud/[id], consultorio
src/components/      Componentes reutilizables con props tipadas (Boton, Campo, TarjetaCita, Estado*…)
src/hooks/           Hooks propios y hooks de TanStack Query
src/services/http/   Cliente Axios (único lugar con baseURL e interceptores)
src/services/api/    Una función por endpoint o RPC
src/types/api.ts     Respuestas tal como llegan (snake_case)
src/models/          Modelos internos (camelCase, fechas como Date)
src/mappers/         Respuesta → modelo (funciones puras con pruebas)
src/store/           Stores de Zustand
src/utils/           Lógica pura: franjas.ts, fechas.ts, validaciones.ts
supabase/            Migraciones, seed, pruebas de la base
docs/                Requerimientos, especificación y documentos del curso
```

Mientras la app no exista, créala siguiendo esta estructura; no inventes otra.

## Cómo escribir el código

- **TypeScript estricto, sin `any`.** Tipa props, respuestas de API y resultados de funciones. Corrige todos los errores de `tsc`.
- **Nada de lógica de negocio en las pantallas.** Las pantallas llaman hooks; los hooks llaman servicios; los servicios usan el cliente Axios; los mappers convierten la respuesta.
- **No dupliques reglas que ya hace la base.** El servidor valida horario, choques, anticipación, permisos y estados. La app calcula las franjas para mostrarlas (`calcularFranjas`) y traduce los errores; no decide si una cita es válida.
- **Errores:** las RPC devuelven códigos fijos (`HORARIO_NO_DISPONIBLE`, `FUERA_DE_PLAZO`, `CHOQUE_CON_CITA`, `NO_AUTORIZADO`…). Tradúcelos a los mensajes de la sección 5.4 de la especificación y a la pantalla correspondiente (S05, M06, C06, G04…).
- **Toda consulta muestra los cuatro estados:** carga (G01), error con reintentar (G03), vacío y sin conexión (G02). Usa los componentes `Estado*`, no textos sueltos.
- **Textos de la interfaz:** cópialos del Figma tal cual (con tildes y signos de apertura). Fechas y horas en formato colombiano: «Jue 19 nov, 11:00 a. m.».
- **Suscripciones:** todo `watchPositionAsync`, listener o intervalo se limpia al salir de la pantalla (RF-27).
- **Accesibilidad mínima:** botones con `accessibilityLabel`, áreas táctiles de al menos 44 × 44 y formularios que el teclado no tape.

## Base de datos

- El esquema vigente está en `supabase/migrations/`. Para cambiarlo, **crea un archivo nuevo** con el formato `AAAAMMDDHHMMSS_descripcion.sql` (hora UTC); nunca edites uno existente.
- Después de cualquier cambio en la base, corre las pruebas:

  ```bash
  cd supabase/pruebas && npm install && npm test
  ```

  Si agregas una regla, agrega su caso en `supabase/pruebas/pruebas.sql`.
- **No apliques migraciones al proyecto de Supabase.** Eso lo hace una persona del equipo después de aprobar el PR.
- Las escrituras de citas pasan **siempre** por RPC (`solicitar_cita`, `cancelar_cita`, `reprogramar_cita`, `responder_solicitud`, `registrar_cita_consultorio`, `crear_bloqueo`). El rol `authenticated` no puede escribir la tabla `citas` directamente, y debe seguir así.

## Antes de abrir un PR

Corre lo que exista en ese momento y anota el resultado en el PR:

```bash
npx tsc --noEmit
```

```bash
npm test
```

```bash
cd supabase/pruebas && npm test
```

Si cambiaste pantallas, pruébalas en Android (Expo Go) y adjunta capturas. Luego sigue el flujo de [CONTRIBUTING.md](CONTRIBUTING.md#pull-requests): rama propia, commits en español sin coautor de IA y PR con la plantilla completa.

## Cuándo detenerte y preguntar

- El cambio toca más de una parte grande (por ejemplo, base de datos y navegación a la vez): propón dividirlo en varios PR.
- Necesitas una librería nueva, cambiar una versión o tocar `app.json`/`eas.json`.
- Un requerimiento, el Figma y la especificación dicen cosas distintas.
- Una prueba falla y la única forma de pasarla es cambiar la prueba.
- Te piden algo que choca con las reglas de arriba (secretos, push a `main`, coautoría de IA).

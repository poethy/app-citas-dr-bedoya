# Aplicación Citas Dr. Camilo Bedoya

App móvil para agendar citas en el consultorio odontológico del Dr. Camilo Bedoya Orozco (Pereira). Reemplaza la agenda de papel y las citas por WhatsApp, y evita citas cruzadas en la misma franja.

Proyecto final de Móvil II.

## Estado

- **Diseño:** completo en Figma (wireframes, flujo de navegación y alta fidelidad).
- **Backend:** terminado y desplegado en Supabase (ver [supabase/README.md](supabase/README.md)).
- **App:** proyecto Expo creado con todas las rutas del flujo, login, registro y guardia de rol. Las demás pantallas están marcadas «en construcción».

## Stack

React Native + TypeScript + Expo (SDK 58), NativeWind 4, Expo Router, Supabase (Auth y base de datos), Axios + TanStack Query, Zustand, zod, y OpenStreetMap + Leaflet con expo-location para el mapa.

## Ejecutar la app

Requisitos: Node.js LTS, npm y la app **Expo Go** en un teléfono Android (misma red Wi-Fi que el computador).

```bash
npm install
```

Copia `.env.template` como `.env` y llena la URL y la clave pública de Supabase (pídelas al equipo).

```bash
npx expo start
```

Escanea el código QR con Expo Go. Para verla en el navegador: `npx expo start --web`. Si la red no deja conectar el teléfono: `npx expo start --tunnel`.

Antes de abrir un PR:

```bash
npx tsc --noEmit
```

Cuentas de prueba: el odontólogo ya existe (pide las credenciales al equipo). Para probar como paciente, regístrate desde la app; si usas el teléfono **3105551234**, la cuenta queda vinculada a la ficha de ejemplo de Ana Gómez.

## Cómo trabajamos

- [CONTRIBUTING.md](CONTRIBUTING.md): ramas, commits, Pull Requests y revisión.
- [AGENTS.md](AGENTS.md): instrucciones para asistentes de IA (Claude Code lo lee desde [CLAUDE.md](CLAUDE.md)).
- Ningún commit ni PR lleva coautoría de IA; el chequeo «Sin coautor de IA» lo revisa en cada PR.

## Documentos

| Archivo | Contenido |
| --- | --- |
| [docs/Handoff_App_Citas.md](docs/Handoff_App_Citas.md) | Estado del proyecto, decisiones y pendientes |
| [docs/especificaciones-tecnicas.md](docs/especificaciones-tecnicas.md) | Stack, base de datos (Supabase), reglas del servidor, API y estructura del código |
| [docs/pantallas-y-datos.md](docs/pantallas-y-datos.md) | Qué lee y escribe cada pantalla del Figma en la base |
| [supabase/README.md](supabase/README.md) | Migraciones, datos de ejemplo, pruebas y cómo crear la base |
| [docs/CLIENTE Y PROBLEMA (actualizado).docx](docs/) | Cliente, problema y alcance |
| [docs/requerimientos_funcionales_app_citasFinal (actualizado).pdf](docs/) | Requerimientos RF-01 a RF-30 con criterios de aceptación |
| [docs/Proyecto_Final_Movil_II.docx](docs/) | Requisitos académicos del proyecto |
| [docs/Datos_ejemplo_wireframes.md](docs/Datos_ejemplo_wireframes.md) | Datos de ejemplo y fórmula de franjas que usan las pantallas |

Diseño en Figma: [App Citas Dr. Camilo Bedoya (Final)](https://www.figma.com/design/nyTAxFuw0CJ5hxoIqvsAIk)

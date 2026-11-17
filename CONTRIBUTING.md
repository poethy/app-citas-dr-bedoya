# Cómo contribuir

Flujo de trabajo del equipo para la App Citas Dr. Camilo Bedoya. Vale igual para quien escribe el código a mano y para quien usa una IA; si trabajas con una IA, ella además debe seguir [AGENTS.md](AGENTS.md).

## Resumen

1. Toma una tarea y crea una rama desde `main`.
2. Haz commits pequeños en español, **sin coautor de IA**.
3. Abre un Pull Request con la plantilla completa.
4. Otra persona del equipo lo revisa y lo aprueba.
5. Se hace merge a `main` con **Squash and merge** y se borra la rama.
6. Se anota en la bitácora.

## Preparar el entorno

```bash
git clone https://github.com/poethy/app-citas-dr-bedoya.git
```

```bash
cd app-citas-dr-bedoya
```

```bash
git config core.hooksPath .githooks
```

El último comando activa un chequeo local que rechaza commits con coautoría de IA (ver [Commits](#commits)).

Copia `.env.template` como `.env` y pide los valores al equipo por un canal privado. La base de datos y su proyecto en Supabase están descritos en [supabase/README.md](supabase/README.md).

## Ramas

- `main` siempre debe funcionar. Nadie hace push directo a `main`: todo entra por PR.
- Una rama por tarea, creada desde `main` actualizado:

  ```bash
  git switch main
  ```

  ```bash
  git pull
  ```

  ```bash
  git switch -c feature/agendar-horario
  ```

- Nombres: `feature/…` para funciones nuevas, `fix/…` para errores, `db/…` para cambios en la base y `docs/…` para documentos. En minúsculas, con guiones y sin tildes: `feature/mapa-seguimiento`, `fix/m06-plazo-cancelacion`, `db/precio-servicios`.

## Commits

- En español, en imperativo y con una idea por commit: «Agrega el contador de duración en C02», «Corrige el cálculo de franjas con almuerzo».
- Si el commit corresponde a un requerimiento o pantalla, nómbralo: «RF-28: valida duración vacía, no numérica o cero (C03)».
- **Sin coautor de IA.** No pueden aparecer líneas como `Co-Authored-By: Claude …`, `Co-authored-by: Copilot …`, «Generated with …» ni firmas de herramientas, ni en el commit ni en el PR. El autor es la persona que hace el trabajo, aunque use una IA para ayudarse.
  - El hook local (`.githooks/commit-msg`) rechaza el commit si encuentra esas líneas.
  - En GitHub, el chequeo **«Sin coautor de IA»** revisa todos los commits del PR y el texto del PR.
  - Si ya hiciste un commit con esas líneas, corrígelo antes de subirlo con `git commit --amend` (último commit) o pídele ayuda al equipo.

## Pull Requests

### Antes de abrirlo

- Actualiza tu rama con `main` (`git pull --rebase origin main`) y resuelve conflictos.
- Corre lo que aplique y que todo pase:

  ```bash
  npx tsc --noEmit
  ```

  ```bash
  npm test
  ```

  ```bash
  cd supabase/pruebas && npm test
  ```

- Si cambiaste pantallas, pruébalas en un Android con Expo Go.

### Al abrirlo

- **Título:** en español y descriptivo, con el código del requerimiento o la pantalla: «RF-04/RF-28: horarios disponibles en S03».
- **Descripción:** llena la plantilla que GitHub pone sola. Incluye qué cambia, los RF y pantallas que cubre, cómo probarlo y las capturas.
- **Tamaño:** que se pueda revisar en unos 20 minutos. Si toca la base de datos y varias pantallas, mejor en dos PR.
- **Borrador:** si aún no está listo, ábrelo como *Draft* y pásalo a *Ready for review* cuando lo esté.
- Asigna a otra persona del equipo como revisora.

### Revisión

- Cada PR necesita **la aprobación de al menos una persona que no sea el autor**. Nadie aprueba ni hace merge de su propio PR.
- Quien revisa comprueba:
  - Que hace lo que dice y cumple los criterios del requerimiento (Dado / Cuando / Entonces).
  - Que se ve como en el Figma y sigue el flujo de navegación.
  - Que respeta la arquitectura: pantallas → hooks → servicios → Axios → mappers, sin `any` y sin lógica de negocio en las pantallas.
  - Que no tiene secretos, ni coautoría de IA, ni archivos que no van (`.env`, `node_modules`, instaladores).
  - Que lo probó en Android, si cambia pantallas.
- Comentarios con respeto y concretos. Prefijos útiles: **«Bloqueante:»** (hay que cambiarlo antes del merge), **«Sugerencia:»** (opcional) y **«Pregunta:»**.
- El autor responde cada comentario, con un cambio o con una explicación, y marca la conversación como resuelta.
- Los cambios en `supabase/migrations/` los aplica al proyecto de Supabase una sola persona, después del merge, y lo avisa en el PR.

### Merge

- Con todas las conversaciones resueltas, la aprobación y los chequeos en verde: **Squash and merge**.
- El mensaje del squash es el título del PR, revisado para que **no** incluya líneas de coautoría que GitHub o alguna herramienta haya agregado.
- Borra la rama después del merge.

## Qué se considera terminado

- Cumple los criterios de aceptación del requerimiento.
- Se ve como en el Figma, con los estados de carga, vacío, error y sin conexión.
- Tipos sin `any` y sin errores de TypeScript.
- Pruebas que pasan, y pruebas nuevas si agregaste lógica (cálculos, mappers o reglas de la base).
- La documentación que cambie está actualizada (especificación, `pantallas-y-datos.md` y README).
- Está anotado en la bitácora.

## Bitácora (requisito del curso)

Después de cada merge, agrega una fila en `docs/bitacora.md` con fecha, objetivo de clase, tarea, responsable, PR o commit, dificultad, observación del docente y siguiente paso. Cada integrante debe poder explicar y ejecutar lo que hizo, aunque haya usado una IA.

## Base de datos

- Los cambios van en una migración **nueva** en `supabase/migrations/`; nunca se edita una ya aplicada.
- Cada regla nueva lleva su caso en `supabase/pruebas/pruebas.sql`.
- En la descripción del PR, explica qué tablas o funciones cambian y si hace falta volver a cargar datos.

## Dudas y decisiones

Si algo no está claro en los requerimientos, el Figma o la especificación, pregunta en el grupo antes de decidir. Las decisiones pendientes están en la sección 11 de [docs/especificaciones-tecnicas.md](docs/especificaciones-tecnicas.md); cuando se tome una, actualízala ahí en el mismo PR.

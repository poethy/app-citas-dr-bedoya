# Bitácora de desarrollo

## 17 de noviembre de 2026

Objetivo: implementar el frontend del flujo de navegación con datos simulados persistentes y las reglas consensuadas.

Trabajo realizado: base Expo SDK 58 y configuración NativeWind; Stack, Drawer y Tabs por rol; componentes tipados; formularios; cálculo de franjas; repositorio AsyncStorage; citas, solicitudes, servicios, anticipaciones y bloqueos; avisos locales; mapa con Leaflet y gestión de permisos. Se conservaron los documentos y el diseño del backend.

Responsable y revisión de cada integrante: por confirmar en la revisión del PR. Observación del docente pendiente.

Evidencia: código en src; pruebas en tests; matriz en docs/matriz-requisitos.md. En navegador se creó una solicitud como paciente, se recargó para comprobar persistencia, se cerró sesión y se aprobó como doctor. También se registró una cita de Resina para el mismo día desde el doctor, quedando confirmada directamente.

Dificultades resueltas: aislamiento del servidor local durante la verificación; configuración de modo de color con NativeWind; declaración explícita de pantallas del Drawer en Expo 58; tipado genérico de WebView; prioridad de clases en componentes de texto.

Siguiente paso de validación: probar la app en Android real con Expo Go compatible, comprobar permisos/GPS/segundo plano y confirmar coordenadas y teléfono del consultorio. Backend, sincronización entre dispositivos y notificaciones push quedan para la otra persona responsable.

### Corrección de navegación del menú

Se reprodujo que Mi perfil cerraba el menú y dejaba visible el inicio. Las pantallas adicionales de ambos roles estaban dentro de Fragment, que Expo Router ignora al registrar las rutas del Drawer. Se declararon directamente sus componentes Screen en MenuRol.

Verificación en navegador: Mi perfil, Notificaciones desde menú y campana, Anticipación mínima, Bloquear horarios y Servicios y confirmación abren su contenido. También se comprobó el regreso desde las pantallas del menú. TypeScript y ESLint pasaron. La comprobación de esta corrección en Expo Go desde un teléfono sigue pendiente.

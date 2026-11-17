## Qué cambia

<!-- Una o dos frases. Ejemplo: «Pantalla S03 con las franjas disponibles y el cálculo de RF-28». -->

## Requerimientos y pantallas

- RF: <!-- RF-04, RF-28 -->
- Pantallas del Figma: <!-- S03, S04, S05 -->

## Tipo de cambio

- [ ] Función nueva
- [ ] Corrección
- [ ] Base de datos (migración nueva en `supabase/migrations/`)
- [ ] Documentación

## Cómo probarlo

<!-- Pasos concretos para quien revisa, con la cuenta (paciente u odontólogo) y los datos de ejemplo. -->

1.
2.

## Capturas (Android)

<!-- Obligatorias si cambia alguna pantalla. -->

## Revisión del autor

- [ ] Cumple los criterios de aceptación (Dado / Cuando / Entonces) de los RF de arriba
- [ ] Se ve como en el Figma y respeta el flujo de navegación
- [ ] Tiene estados de carga, vacío, error y sin conexión donde aplica
- [ ] `npx tsc --noEmit` sin errores y sin `any`
- [ ] Pruebas que pasan (`npm test` y, si toca la base, `supabase/pruebas`)
- [ ] Sin secretos ni `.env` en el PR
- [ ] Sin coautoría ni firmas de IA en los commits ni en este texto
- [ ] Documentación actualizada si cambió una regla o un dato (especificación, `pantallas-y-datos.md`)
- [ ] Bitácora actualizada o se actualiza al hacer merge

## Notas para quien revisa

<!-- Decisiones tomadas, dudas, partes que merecen más atención. -->

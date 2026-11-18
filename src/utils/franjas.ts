import type { BaseDatos, Franja, HorarioAtencion, Rol } from '@/models';
import { HORA, MINUTO, instante, fechaLocal } from './fechas';
import { almuerzoDe, jornadaDe } from './horario';
export const cruza = (a: Franja, b: Franja): boolean =>
  Date.parse(a.inicio) < Date.parse(b.fin) && Date.parse(b.inicio) < Date.parse(a.fin);

export function obtenerFinalesDeBloqueo(franjas: Franja[], inicio: string): string[] {
  const indice = franjas.findIndex((franja) => franja.inicio === inicio);
  if (indice < 0) return [];

  const finales: string[] = [];
  let siguienteInicio = inicio;
  for (const franja of franjas.slice(indice)) {
    if (franja.inicio !== siguienteInicio) break;
    finales.push(franja.fin);
    siguienteInicio = franja.fin;
  }
  return finales;
}

export function seleccionarTramoDeBloqueo(
  franjas: Franja[],
  ancla: string,
  destino: string,
): Franja | null {
  const primera = franjas.find((franja) => franja.inicio === ancla);
  if (!primera) return null;

  if (destino >= ancla) {
    const finales = obtenerFinalesDeBloqueo(franjas, ancla);
    return { inicio: ancla, fin: finales.reverse().find((hora) => hora <= destino) ?? primera.fin };
  }

  let inicio = ancla;
  for (const franja of [...franjas].reverse()) {
    if (franja.fin > inicio) continue;
    if (franja.fin !== inicio || franja.inicio < destino) break;
    inicio = franja.inicio;
  }
  return { inicio, fin: inicio === ancla ? primera.fin : ancla };
}
/** Apertura y cierre de la fecha según el horario guardado (C08), o null si está cerrado. */
export function horarioDia(fecha: string, horario: HorarioAtencion): Franja | null {
  return jornadaDe(fecha, horario);
}
export function ocupacion(
  db: BaseDatos,
  fecha: string,
  ahora = new Date(),
  excluirId?: string,
): Franja[] {
  const almuerzo = almuerzoDe(fecha, db.horario);
  const citas = db.citas.filter(
    (c) =>
      c.id !== excluirId &&
      (c.estado === 'confirmada' ||
        (c.estado === 'pendiente' && Date.parse(c.inicio) > ahora.getTime())),
  );
  return [...citas, ...db.bloqueos, ...(almuerzo ? [almuerzo] : [])];
}
export function calcularFranjas(
  db: BaseDatos,
  fecha: string,
  duracion: number,
  rol: Rol,
  ahora = new Date(),
  excluirId?: string,
): { franjas: Franja[]; capacidad: number } {
  if (!Number.isFinite(duracion) || duracion < 15 || duracion > 180 || duracion % 15 !== 0)
    return { franjas: [], capacidad: 0 };
  const horario = horarioDia(fecha, db.horario);
  if (!horario) return { franjas: [], capacidad: 0 };
  const limite =
    ahora.getTime() + (rol === 'paciente' ? db.configuracion.anticipacionAgendarHoras * HORA : 0);
  let tramos: [number, number][] = [
    [Math.max(Date.parse(horario.inicio), limite), Date.parse(horario.fin)],
  ];
  for (const rango of ocupacion(db, fecha, ahora, excluirId)) {
    const inicio = Date.parse(rango.inicio),
      fin = Date.parse(rango.fin);
    tramos = tramos.flatMap(([a, b]) =>
      fin <= a || inicio >= b
        ? [[a, b]]
        : ([
            [a, Math.min(inicio, b)],
            [Math.max(fin, a), b],
          ].filter(([x, y]) => y > x) as [number, number][]),
    );
  }
  const franjas: Franja[] = [];
  const medianoche = instante(fecha, 0).getTime();
  for (const [a, b] of tramos) {
    const primero = medianoche + Math.ceil((a - medianoche) / (15 * MINUTO)) * 15 * MINUTO;
    for (let inicio = primero; inicio + duracion * MINUTO <= b; inicio += duracion * MINUTO)
      franjas.push({
        inicio: new Date(inicio).toISOString(),
        fin: new Date(inicio + duracion * MINUTO).toISOString(),
      });
  }
  return { franjas, capacidad: franjas.length };
}
export function dentroHorario(
  db: BaseDatos,
  rango: Franja,
  ahora: Date,
  excluirId?: string,
): boolean {
  const fecha = fechaLocal(rango.inicio),
    horario = horarioDia(fecha, db.horario);
  return (
    !!horario &&
    rango.inicio >= horario.inicio &&
    rango.fin <= horario.fin &&
    !ocupacion(db, fecha, ahora, excluirId).some((r) => cruza(rango, r))
  );
}

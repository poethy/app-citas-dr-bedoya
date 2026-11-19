// Horario de atención (C08–C10, P05). Funciones puras con pruebas en tests/horario.test.ts.
import type { Cita, DiaAtencion, Franja, HorarioAtencion } from '@/models';
import { fechaTexto, horaTexto, instante } from './fechas';

/** El mismo horario del seed de la base: L–V 8:00–18:00, sábado 8:00–12:00, almuerzo L–V. */
export const HORARIO_INICIAL: HorarioAtencion = {
  dias: [1, 2, 3, 4, 5]
    .map((diaSemana): DiaAtencion => ({ diaSemana, apertura: 480, cierre: 1080 }))
    .concat([{ diaSemana: 6, apertura: 480, cierre: 720 }]),
  almuerzo: { inicio: 750, fin: 810, dias: [1, 2, 3, 4, 5] },
};

/** Al activar un día cerrado se propone esta jornada. */
export const JORNADA_POR_DEFECTO = { apertura: 480, cierre: 1080 };
export const PASO_MINUTOS = 15;

export const NOMBRES_DIA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

/** Orden de la lista en C08: de lunes a domingo. */
export const ORDEN_SEMANA = [1, 2, 3, 4, 5, 6, 0] as const;

export function diaDeSemana(fecha: string): number {
  return instante(fecha, 720).getUTCDay();
}

export function buscarDia(horario: HorarioAtencion, diaSemana: number): DiaAtencion | undefined {
  return horario.dias.find((d) => d.diaSemana === diaSemana);
}

/** Apertura y cierre de una fecha (YYYY-MM-DD), o null si ese día está cerrado. */
export function jornadaDe(fecha: string, horario: HorarioAtencion): Franja | null {
  const dia = buscarDia(horario, diaDeSemana(fecha));
  return dia
    ? {
        inicio: instante(fecha, dia.apertura).toISOString(),
        fin: instante(fecha, dia.cierre).toISOString(),
      }
    : null;
}

/** El almuerzo de una fecha, o null si ese día no tiene. */
export function almuerzoDe(fecha: string, horario: HorarioAtencion): Franja | null {
  const a = horario.almuerzo;
  if (!a || !a.dias.includes(diaDeSemana(fecha))) return null;
  return {
    inicio: instante(fecha, a.inicio).toISOString(),
    fin: instante(fecha, a.fin).toISOString(),
  };
}

/** «8:00 a. m.», «12:00 m.», «1:30 p. m.» */
export function textoHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = String(minutos % 60).padStart(2, '0');
  if (h === 12 && m === '00') return '12:00 m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}

/** «8:00 a. m. – 6:00 p. m.»; si las dos son de la tarde: «12:30 – 1:30 p. m.» */
export function textoRango(inicio: number, fin: number): string {
  const a = textoHora(inicio);
  const b = textoHora(fin);
  return a.endsWith('p. m.') && b.endsWith('p. m.')
    ? `${a.slice(0, -' p. m.'.length)} – ${b}`
    : `${a} – ${b}`;
}

/** «lunes a viernes», «lunes, miércoles y viernes» */
export function textoDias(dias: number[]): string {
  const posiciones = ORDEN_SEMANA.flatMap((d, i) => (dias.includes(d) ? [i] : []));
  const nombres = posiciones.map((i) => NOMBRES_DIA[ORDEN_SEMANA[i] ?? 0].toLowerCase());
  if (nombres.length === 0) return 'ningún día';
  const seguidos = posiciones.every((p, i) => i === 0 || p === (posiciones[i - 1] ?? -2) + 1);
  if (seguidos && nombres.length >= 3) return `${nombres[0]} a ${nombres[nombres.length - 1]}`;
  if (nombres.length === 1) return nombres[0] ?? '';
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/** P05: agrupa los días seguidos con la misma jornada. «Lunes a viernes · 8:00 a. m. – 6:00 p. m.» */
export function resumirHorario(horario: HorarioAtencion): { dias: string; horas: string }[] {
  const grupos: { dias: number[]; apertura: number; cierre: number; hasta: number }[] = [];
  ORDEN_SEMANA.forEach((d, posicion) => {
    const dia = buscarDia(horario, d);
    if (!dia) return;
    const ultimo = grupos[grupos.length - 1];
    const contiguo = ultimo !== undefined && ultimo.hasta === posicion - 1;
    if (ultimo && contiguo && ultimo.apertura === dia.apertura && ultimo.cierre === dia.cierre) {
      ultimo.dias.push(d);
      ultimo.hasta = posicion;
    } else grupos.push({ dias: [d], apertura: dia.apertura, cierre: dia.cierre, hasta: posicion });
  });
  return grupos.map((g) => {
    const texto = textoDias(g.dias);
    return {
      dias: texto.charAt(0).toUpperCase() + texto.slice(1),
      horas: textoRango(g.apertura, g.cierre),
    };
  });
}

/** C09: el mensaje de validación de una jornada, o null si es válida. */
export function errorJornada(inicio: number, fin: number): string | null {
  if (!Number.isInteger(inicio) || !Number.isInteger(fin) || inicio < 0 || fin > 24 * 60)
    return 'Elige una hora válida.';
  if (fin <= inicio) return 'La hora de cierre debe ser posterior a la de apertura.';
  return null;
}

/** Revisa todo el horario antes de guardarlo. Devuelve el primer error, o null. */
export function errorHorario(horario: HorarioAtencion): string | null {
  const vistos = new Set<number>();
  for (const d of horario.dias) {
    if (
      !Number.isInteger(d.diaSemana) ||
      d.diaSemana < 0 ||
      d.diaSemana > 6 ||
      vistos.has(d.diaSemana)
    )
      return 'Revisa los días del horario.';
    vistos.add(d.diaSemana);
    const error = errorJornada(d.apertura, d.cierre);
    if (error) return error;
  }
  if (horario.almuerzo) {
    const error = errorJornada(horario.almuerzo.inicio, horario.almuerzo.fin);
    if (error) return 'La hora en que termina el almuerzo debe ser posterior a la de inicio.';
  }
  return null;
}

/** Minutos desde la medianoche de Bogotá de un instante ISO. */
function minutosLocales(valor: string): number {
  const d = new Date(Date.parse(valor) - 5 * 60 * 60_000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}
function fechaLocalDe(valor: string): string {
  return new Date(Date.parse(valor) - 5 * 60 * 60_000).toISOString().slice(0, 10);
}

/**
 * C10: las citas pendientes o confirmadas que todavía no empiezan y que quedarían
 * fuera del horario nuevo o cruzarían el almuerzo, de la más cercana a la más lejana.
 * Es la misma regla que aplica la RPC actualizar_horario en la base.
 */
export function citasFueraDeHorario(citas: Cita[], horario: HorarioAtencion, ahora: Date): Cita[] {
  const activas = citas
    .filter(
      (c) =>
        (c.estado === 'pendiente' || c.estado === 'confirmada') &&
        Date.parse(c.inicio) > ahora.getTime(),
    )
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
  return activas.filter((cita) => {
    const fecha = fechaLocalDe(cita.inicio);
    const dia = buscarDia(horario, diaDeSemana(fecha));
    const inicio = minutosLocales(cita.inicio);
    const fin = inicio + Math.round((Date.parse(cita.fin) - Date.parse(cita.inicio)) / 60_000);
    if (!dia || inicio < dia.apertura || fin > dia.cierre) return true;
    const a = horario.almuerzo;
    return !!a && a.dias.includes(dia.diaSemana) && inicio < a.fin && fin > a.inicio;
  });
}

/** C10: «El jueves 19 de noviembre hay una cita de Ana…» o «Hay 3 citas que quedarían…». */
export function mensajeCitasFuera(afectadas: { pacienteNombre: string; inicio: string }[]): string {
  const [una] = afectadas;
  if (afectadas.length === 1 && una)
    return `El ${fechaTexto(una.inicio).replace(',', '')} hay una cita de ${una.pacienteNombre} a las ${horaTexto(una.inicio)} que quedaría fuera del nuevo horario. Cancélala o reprográmala antes de guardar.`;
  return `Hay ${afectadas.length} citas que quedarían fuera del nuevo horario. Cancélalas o reprográmalas antes de guardar.`;
}

/** La primera cita afectada, o null. */
export function citaFueraDeHorario(
  citas: Cita[],
  horario: HorarioAtencion,
  ahora: Date,
): Cita | null {
  return citasFueraDeHorario(citas, horario, ahora)[0] ?? null;
}

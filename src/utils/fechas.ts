// Fechas y horas en la zona del consultorio (America/Bogota, UTC−5 todo el año: Colombia no
// tiene horario de verano). Se calcula con un desfase fijo para no depender del soporte de
// zonas horarias de Intl en Hermes/Android. Formato como en el Figma: «Jue 19 nov, 11:00 a. m.».

const DESFASE_BOGOTA_MS = -5 * 60 * 60 * 1000;
const DIA_MS = 24 * 60 * 60 * 1000;

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;
const MESES_LARGOS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

/** Partes de la fecha tal como se ven en Bogotá. */
export function partesBogota(fecha: Date) {
  const local = new Date(fecha.getTime() + DESFASE_BOGOTA_MS);
  return {
    anio: local.getUTCFullYear(),
    mes: local.getUTCMonth(), // 0 = enero
    dia: local.getUTCDate(),
    diaSemana: local.getUTCDay(), // 0 = domingo
    hora: local.getUTCHours(),
    minuto: local.getUTCMinutes(),
  };
}

/** Número de día (días desde 1970) en Bogotá, para comparar «hoy», «mañana», etc. */
function numeroDia(fecha: Date): number {
  return Math.floor((fecha.getTime() + DESFASE_BOGOTA_MS) / DIA_MS);
}

/** «11:00 a. m.», «1:30 p. m.», «12:00 m.» */
export function horaCorta(fecha: Date): string {
  const { hora, minuto } = partesBogota(fecha);
  const mm = String(minuto).padStart(2, "0");
  if (hora === 12 && minuto === 0) return "12:00 m.";
  const h12 = hora % 12 === 0 ? 12 : hora % 12;
  return `${h12}:${mm} ${hora < 12 ? "a. m." : "p. m."}`;
}

/** «JUE» (para la caja de fecha de la tarjeta de cita) */
export function diaSemanaCorto(fecha: Date): string {
  return DIAS_CORTOS[partesBogota(fecha).diaSemana]!.toUpperCase();
}

export function diaDelMes(fecha: Date): number {
  return partesBogota(fecha).dia;
}

/** «Jue 19 nov, 11:00 a. m.» */
export function fechaCorta(fecha: Date): string {
  const p = partesBogota(fecha);
  return `${DIAS_CORTOS[p.diaSemana]} ${p.dia} ${MESES_CORTOS[p.mes]}, ${horaCorta(fecha)}`;
}

/** «Jueves 19 de noviembre» */
export function fechaLarga(fecha: Date): string {
  const p = partesBogota(fecha);
  const dia = DIAS_LARGOS[p.diaSemana]!;
  return `${dia[0]!.toUpperCase()}${dia.slice(1)} ${p.dia} de ${MESES_LARGOS[p.mes]}`;
}

/** 0 si es hoy, 1 si es mañana, -1 si fue ayer… (en días de Bogotá) */
export function diasHasta(fecha: Date, ahora: Date = new Date()): number {
  return numeroDia(fecha) - numeroDia(ahora);
}

/**
 * Texto del recordatorio de P01 si la cita es hoy o mañana; null si falta más.
 * «Recordatorio: tu cita es mañana a las 11:00 a. m.»
 */
export function textoRecordatorio(inicio: Date, ahora: Date = new Date()): string | null {
  const dias = diasHasta(inicio, ahora);
  if (inicio.getTime() <= ahora.getTime()) return null;
  if (dias === 0) return `Recordatorio: tu cita es hoy a las ${horaCorta(inicio)}`;
  if (dias === 1) return `Recordatorio: tu cita es mañana a las ${horaCorta(inicio)}`;
  return null;
}

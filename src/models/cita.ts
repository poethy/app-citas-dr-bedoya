export type EstadoCita = "pendiente" | "confirmada" | "rechazada" | "cancelada";

export interface ServicioDeCita {
  nombre: string;
  duracionMin: number;
}

export interface Cita {
  id: string;
  /** Número visible: «Cita #A-1024» */
  numero: number;
  inicio: Date;
  fin: Date;
  estado: EstadoCita;
  servicio: ServicioDeCita;
}

/** Una cita ocupa su franja mientras está pendiente o confirmada (RF-09). */
export const esActiva = (cita: Pick<Cita, "estado">): boolean =>
  cita.estado === "pendiente" || cita.estado === "confirmada";

export const codigoCita = (cita: Pick<Cita, "numero">): string => `#A-${cita.numero}`;

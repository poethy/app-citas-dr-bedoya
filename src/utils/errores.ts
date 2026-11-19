export class ErrorNegocio extends Error {
  constructor(
    public codigo: string,
    mensaje: string,
    /** Dato para actuar sobre el error; por ejemplo, la cita que impide guardar el horario (C10). */
    public referencia?: string,
  ) {
    super(mensaje);
    this.name = 'ErrorNegocio';
  }
}
/** Cita que impide guardar el horario (C10). */
export interface CitaAfectada {
  id: string;
  pacienteNombre: string;
  /** ISO en UTC */
  inicio: string;
}
/** C10: el horario no se guardó porque estas citas quedarían fuera. */
export class ErrorCitasFueraDeHorario extends ErrorNegocio {
  constructor(
    public afectadas: CitaAfectada[],
    mensaje: string,
  ) {
    super('CITAS_FUERA_DE_HORARIO', mensaje, afectadas[0]?.id);
    this.name = 'ErrorCitasFueraDeHorario';
  }
}
export const mensajeError = (error: unknown): string =>
  error instanceof Error ? error.message : 'Ocurrió un problema. Intenta de nuevo.';

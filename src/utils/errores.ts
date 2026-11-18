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
export const mensajeError = (error: unknown): string =>
  error instanceof Error ? error.message : 'Ocurrió un problema. Intenta de nuevo.';

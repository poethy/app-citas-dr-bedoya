export class ErrorNegocio extends Error {
  constructor(
    public codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorNegocio';
  }
}
export const mensajeError = (error: unknown): string =>
  error instanceof Error ? error.message : 'Ocurrió un problema. Intenta de nuevo.';

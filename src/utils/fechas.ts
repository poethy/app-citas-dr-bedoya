export const MINUTO = 60_000;
export const HORA = 60 * MINUTO;
export function fechaLocal(valor: Date | string = new Date()): string {
  const d = new Date(new Date(valor).getTime() - 5 * HORA);
  return d.toISOString().slice(0, 10);
}
export function instante(fecha: string, minutos: number): Date {
  return new Date(new Date(`${fecha}T00:00:00-05:00`).getTime() + minutos * MINUTO);
}
export function sumarDias(fecha: string, dias: number): string {
  return fechaLocal(new Date(instante(fecha, 12 * 60).getTime() + dias * 24 * HORA));
}
export function fechaTexto(valor: string, corta = false): string {
  return new Date(valor.length === 10 ? `${valor}T12:00:00-05:00` : valor).toLocaleDateString(
    'es-CO',
    {
      timeZone: 'America/Bogota',
      weekday: corta ? 'short' : 'long',
      day: 'numeric',
      month: corta ? 'short' : 'long',
    },
  );
}
export function horaTexto(valor: string): string {
  return new Date(valor).toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
export const dinero = (valor: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor);

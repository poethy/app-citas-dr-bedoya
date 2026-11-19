import type { Rol } from '@/models';
import { calcularFranjas } from '@/utils/franjas';
import { useDatos } from './useDatos';
import { useAhora } from './useAhora';
import { useOcupacion } from './useOcupacion';
/**
 * Franjas libres de un día para un servicio (S03, O09).
 * Entradas: fecha, duración en minutos, rol (el paciente respeta la anticipación) y la cita
 * que se reprograma, si aplica. Resultado: franjas, capacidad y estados de la consulta.
 */
export function useFranjasDisponibles(
  fecha: string,
  duracion: number,
  rol: Rol,
  excluirId?: string,
) {
  const consulta = useDatos();
  const ocupacion = useOcupacion(fecha);
  const ahora = useAhora();
  const listo = consulta.data && fecha && !ocupacion.cargando;
  const resultado = listo
    ? calcularFranjas(
        consulta.data!,
        fecha,
        duracion,
        rol,
        new Date(ahora),
        excluirId,
        ocupacion.ocupados,
      )
    : { franjas: [], capacidad: 0 };
  return {
    ...resultado,
    cargando: consulta.isPending || ocupacion.cargando,
    error: consulta.error ?? ocupacion.error,
    reintentar: () => {
      void consulta.refetch();
      void ocupacion.reintentar();
    },
  };
}

import type { Rol } from '@/models';
import { calcularFranjas } from '@/utils/franjas';
import { useDatos } from './useDatos';
import { useAhora } from './useAhora';
export function useFranjasDisponibles(
  fecha: string,
  duracion: number,
  rol: Rol,
  excluirId?: string,
) {
  const consulta = useDatos();
  const ahora = useAhora();
  const resultado =
    consulta.data && fecha
      ? calcularFranjas(consulta.data, fecha, duracion, rol, new Date(ahora), excluirId)
      : { franjas: [], capacidad: 0 };
  return {
    ...resultado,
    cargando: consulta.isPending,
    error: consulta.error,
    reintentar: consulta.refetch,
  };
}

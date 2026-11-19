import { useQuery } from '@tanstack/react-query';
import { repositorio, usaServidor } from '@/services/repositorio';

/**
 * Ocupación de una fecha para calcular franjas (S03, M07, O09).
 * Entrada: la fecha (YYYY-MM-DD). Con Supabase consulta disponibilidad_dia, porque el
 * paciente no ve las citas de otros; en la demo devuelve null y se usan los datos locales.
 * Resultado: los rangos ocupados, si la consulta está cargando y su error.
 */
export function useOcupacion(fecha: string) {
  const consulta = useQuery({
    queryKey: ['ocupacion', fecha],
    queryFn: () => repositorio.ocupacionDia(fecha),
    enabled: usaServidor && !!fecha,
    staleTime: 30_000,
  });
  return {
    ocupados: consulta.data ?? null,
    cargando: usaServidor && !!fecha && consulta.isPending,
    error: consulta.error,
    reintentar: consulta.refetch,
  };
}

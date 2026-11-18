import { useQuery } from '@tanstack/react-query';
import { getCita } from '@/services/api/citas.api';
import { useSesionStore } from '@/store/sesion.store';
export function useCita(id: string) {
  const perfil = useSesionStore((s) => s.perfil);
  return useQuery({
    queryKey: ['cita', perfil?.id, id],
    queryFn: () => getCita(id),
    enabled: !!perfil && !!id,
    retry: false,
    staleTime: 30000,
  });
}

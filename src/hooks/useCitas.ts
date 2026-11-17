import { useQuery } from '@tanstack/react-query';
import { getCitas } from '@/services/api/citas.api';
import { useSesionStore } from '@/store/sesion.store';
export function useCitas() {
  const perfil = useSesionStore((s) => s.perfil);
  return useQuery({
    queryKey: ['citas', perfil?.id],
    queryFn: getCitas,
    enabled: !!perfil,
    staleTime: 30000,
  });
}

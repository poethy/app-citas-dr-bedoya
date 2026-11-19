import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repositorio } from '@/services/repositorio';
import { useInterfazStore } from '@/store/interfaz.store';

export function useDatos() {
  return useQuery({ queryKey: ['datos'], queryFn: repositorio.consultar, staleTime: 0 });
}
export function useAccion<TInput, TResult>(
  accion: (input: TInput) => Promise<TResult>,
  mensaje?: string | ((resultado: TResult) => string),
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: accion,
    onSuccess: async (resultado) => {
      await client.invalidateQueries();
      if (mensaje)
        useInterfazStore
          .getState()
          .mostrar(typeof mensaje === 'function' ? mensaje(resultado) : mensaje);
    },
    onError: async () => {
      await client.invalidateQueries();
    },
  });
}

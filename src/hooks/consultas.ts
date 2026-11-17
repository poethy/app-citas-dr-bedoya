// Hooks de TanStack Query. Las claves (queryKey) identifican cada recurso para la caché y
// para invalidarlo después de una acción (docs/especificaciones-tecnicas.md, sección 6.3).
import { useQuery } from "@tanstack/react-query";

import type { Cita } from "@/models/cita";
import { listarProximasCitas } from "@/services/api/citas.api";
import { obtenerConfiguracion } from "@/services/api/configuracion.api";

export const claves = {
  configuracion: ["configuracion"] as const,
  citas: ["citas"] as const,
  proximasCitas: ["citas", "proximas"] as const,
};

/** Datos del consultorio: casi no cambian, se guardan 10 minutos. */
export function useConfiguracion() {
  return useQuery({
    queryKey: claves.configuracion,
    queryFn: obtenerConfiguracion,
    staleTime: 10 * 60 * 1000,
  });
}

export interface ResumenProximasCitas {
  proxima: Cita | null;
  totalProximas: number;
  pendientes: number;
}

/** P01: la próxima cita y los conteos de «Mis citas» (2 próximas · 1 pendiente). */
export function useProximasCitas() {
  return useQuery({
    queryKey: claves.proximasCitas,
    queryFn: () => listarProximasCitas(),
    staleTime: 30 * 1000,
    select: (citas): ResumenProximasCitas => ({
      proxima: citas[0] ?? null,
      totalProximas: citas.length,
      pendientes: citas.filter((c) => c.estado === "pendiente").length,
    }),
  });
}

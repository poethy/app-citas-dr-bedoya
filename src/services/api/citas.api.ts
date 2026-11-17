import { mapCita } from "@/mappers/cita.mapper";
import type { Cita } from "@/models/cita";
import { http } from "@/services/http/cliente";
import type { CitaConServicioRespuesta } from "@/types/api";

const CAMPOS_CITA = "id,numero,inicio,fin,estado,servicio:servicios(nombre,duracion_min)";

/**
 * Citas activas (pendientes o confirmadas) que aún no han empezado, de la más cercana a la más lejana.
 * La RLS de la base hace que el paciente solo reciba las suyas (RF-03).
 */
export async function listarProximasCitas(ahora: Date = new Date()): Promise<Cita[]> {
  const { data } = await http.get<CitaConServicioRespuesta[]>("/citas", {
    params: {
      select: CAMPOS_CITA,
      estado: "in.(pendiente,confirmada)",
      inicio: `gte.${ahora.toISOString()}`,
      order: "inicio.asc",
    },
  });
  return data.map(mapCita);
}

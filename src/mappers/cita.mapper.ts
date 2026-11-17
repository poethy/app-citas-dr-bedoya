import type { Cita } from "@/models/cita";
import type { CitaConServicioRespuesta } from "@/types/api";

export function mapCita(r: CitaConServicioRespuesta): Cita {
  return {
    id: r.id,
    numero: r.numero,
    inicio: new Date(r.inicio),
    fin: new Date(r.fin),
    estado: r.estado,
    servicio: {
      nombre: r.servicio?.nombre ?? "Servicio",
      duracionMin: r.servicio?.duracion_min ?? Math.round((Date.parse(r.fin) - Date.parse(r.inicio)) / 60_000),
    },
  };
}

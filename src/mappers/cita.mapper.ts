import type { Cita } from '@/models';
import type { CitaRespuesta } from '@/types/api';
export function mapCita(r: CitaRespuesta): Cita {
  return {
    id: r.id,
    pacienteId: r.paciente_id,
    pacienteNombre: r.paciente_nombre,
    telefono: r.telefono,
    servicioId: r.servicio_id,
    servicioNombre: r.servicio_nombre,
    inicio: r.inicio,
    fin: r.fin,
    estado: r.estado,
    precioAcordadoCop: r.precio_acordado_cop,
    duracionAcordadaMin: r.duracion_acordada_min,
    origen: r.origen,
  };
}

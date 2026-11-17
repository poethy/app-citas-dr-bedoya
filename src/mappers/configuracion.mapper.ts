import type { Configuracion } from "@/models/configuracion";
import type { ConfiguracionRespuesta } from "@/types/api";

export function mapConfiguracion(r: ConfiguracionRespuesta): Configuracion {
  return {
    anticipacionAgendarHoras: r.anticipacion_agendar_horas,
    anticipacionCambiosHoras: r.anticipacion_cambios_horas,
    nombreProfesional: r.nombre_profesional,
    especialidad: r.especialidad,
    lugar: r.lugar,
    direccion: r.direccion,
    telefono: r.telefono,
    coordenadas: r.latitud !== null && r.longitud !== null ? { latitud: r.latitud, longitud: r.longitud } : null,
  };
}

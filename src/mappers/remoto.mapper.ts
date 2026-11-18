// Mappers de las respuestas remotas a los modelos internos. Funciones puras con pruebas.
import type { Configuracion, Perfil, Servicio } from '@/models';
import type { ConfiguracionRespuesta, PerfilRespuesta, ServicioRespuesta } from '@/types/api';

/** El perfil remoto no tiene la clave de la demo. */
export type PerfilRemoto = Omit<Perfil, 'claveDemo'>;

export function mapPerfil(r: PerfilRespuesta): PerfilRemoto {
  return { id: r.id, rol: r.rol, nombre: r.nombre, telefono: r.telefono, correo: r.correo };
}

export function mapServicio(r: ServicioRespuesta): Servicio {
  return {
    id: r.id,
    nombre: r.nombre,
    duracionMin: r.duracion_min,
    precioCop: r.precio_cop,
    confirmacion: r.confirmacion,
    activo: r.activo,
  };
}

export function mapConfiguracion(r: ConfiguracionRespuesta): Configuracion {
  return {
    anticipacionAgendarHoras: r.anticipacion_agendar_horas,
    anticipacionCambiosHoras: r.anticipacion_cambios_horas,
  };
}

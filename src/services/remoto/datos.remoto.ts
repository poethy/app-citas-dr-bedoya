// Consultas remotas con Axios que ya calzan con el esquema aplicado en Supabase (B6.2).
// Las citas quedan fuera hasta que la base tenga precio y duración acordados y el estado vencida.
import {
  mapConfiguracion,
  mapPerfil,
  mapServicio,
  type PerfilRemoto,
} from '@/mappers/remoto.mapper';
import type { Configuracion, Servicio } from '@/models';
import { clienteHttp } from '@/services/http/cliente';
import { ErrorApi } from '@/services/http/errores';
import type { ConfiguracionRespuesta, PerfilRespuesta, ServicioRespuesta } from '@/types/api';

/** Perfil del usuario con sesión; RLS solo deja ver el propio, salvo al odontólogo. */
export async function obtenerPerfil(id: string): Promise<PerfilRemoto> {
  const { data } = await clienteHttp.get<PerfilRespuesta[]>('/perfiles', {
    params: { id: `eq.${id}`, select: 'id,rol,nombre,telefono,correo' },
  });
  const fila = data[0];
  if (!fila) throw new ErrorApi('NO_AUTORIZADO', { detalle: 'El usuario no tiene perfil' });
  return mapPerfil(fila);
}

/** S01 y C01. El odontólogo ve también los inactivos. */
export async function listarServicios(soloActivos: boolean): Promise<Servicio[]> {
  const { data } = await clienteHttp.get<ServicioRespuesta[]>('/servicios', {
    params: { select: '*', order: 'nombre', ...(soloActivos ? { activo: 'eq.true' } : {}) },
  });
  return data.map(mapServicio);
}

/** C02. */
export async function obtenerServicio(id: string): Promise<Servicio> {
  const { data } = await clienteHttp.get<ServicioRespuesta[]>('/servicios', {
    params: { id: `eq.${id}`, select: '*' },
  });
  const fila = data[0];
  if (!fila) throw new ErrorApi('SERVICIO_NO_EXISTE');
  return mapServicio(fila);
}

/** C04, S03 y M06: las dos anticipaciones. */
export async function obtenerConfiguracion(): Promise<Configuracion> {
  const { data } = await clienteHttp.get<ConfiguracionRespuesta[]>('/configuracion', {
    params: { id: 'eq.1', select: 'anticipacion_agendar_horas,anticipacion_cambios_horas' },
  });
  const fila = data[0];
  if (!fila)
    throw new ErrorApi('ERROR_SERVICIO', { detalle: 'Falta la configuración del consultorio' });
  return mapConfiguracion(fila);
}

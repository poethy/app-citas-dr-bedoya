// Citas por HTTP con Axios (requisito del curso: listado y detalle por id).
// La RLS de la base hace que el paciente reciba solo las suyas (RF-03).
import { mapCita } from '@/mappers/remoto.mapper';
import type { Cita } from '@/models';
import { clienteHttp } from '@/services/http/cliente';
import { ErrorApi } from '@/services/http/errores';
import type { CitaRespuesta } from '@/types/api';

export const CAMPOS_CITA =
  'id,numero,paciente_id,servicio_id,inicio,fin,estado,origen,precio_acordado_cop,duracion_acordada_min,' +
  'paciente:pacientes(nombre,telefono,perfil_id),servicio:servicios(nombre)';

/** M01, O01, O02, O04: todas las citas visibles para el usuario, de la más antigua a la más nueva. */
export async function listarCitas(): Promise<Cita[]> {
  const { data } = await clienteHttp.get<CitaRespuesta[]>('/citas', {
    params: { select: CAMPOS_CITA, order: 'inicio.asc' },
  });
  return data.map(mapCita);
}

/** M03, O05, O08: detalle por id. Si no existe o no es suya, M04 («Cita no encontrada»). */
export async function obtenerCita(id: string): Promise<Cita> {
  const { data } = await clienteHttp.get<CitaRespuesta[]>('/citas', {
    params: { select: CAMPOS_CITA, id: `eq.${id}` },
  });
  const fila = data[0];
  if (!fila) throw new ErrorApi('CITA_NO_EXISTE');
  return mapCita(fila);
}

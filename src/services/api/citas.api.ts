import type { Cita } from '@/models';
import { repositorio } from '@/services/mock/repositorio';
import { obtenerCita } from '@/services/mock/reglas';
import { ErrorNegocio } from '@/utils/errores';
// Contrato asíncrono: sustituir estas consultas por Axios al integrar el backend.
export async function getCitas(): Promise<Cita[]> {
  const db = await repositorio.consultar();
  const actor = db.perfiles.find((p) => p.id === db.sesionId);
  if (!actor) throw new ErrorNegocio('NO_AUTORIZADO', 'Inicia sesión para consultar tus citas.');
  return db.citas.filter((c) => actor.rol === 'odontologo' || c.pacienteId === actor.id);
}
export async function getCita(id: string): Promise<Cita> {
  const db = await repositorio.consultar();
  const actor = db.perfiles.find((p) => p.id === db.sesionId);
  if (!actor) throw new ErrorNegocio('NO_AUTORIZADO', 'Inicia sesión para consultar esta cita.');
  return obtenerCita(db, actor, id);
}

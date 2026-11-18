import type { BaseDatos, Cita, CrearCita, Perfil } from '@/models';
import { dentroHorario } from '@/utils/franjas';
import { HORA, MINUTO } from '@/utils/fechas';
import { ErrorNegocio } from '@/utils/errores';
import { pacienteNuevaCitaSchema } from '@/utils/validaciones';

export function exigirDoctor(actor: Perfil): void {
  if (actor.rol !== 'odontologo')
    throw new ErrorNegocio('NO_AUTORIZADO', 'Solo el odontólogo puede realizar esta acción.');
}
export function obtenerCita(db: BaseDatos, actor: Perfil, id: string): Cita {
  const cita = db.citas.find((c) => c.id === id);
  if (!cita) throw new ErrorNegocio('NO_ENCONTRADA', 'No encontramos esta cita.');
  if (actor.rol === 'paciente' && cita.pacienteId !== actor.id)
    throw new ErrorNegocio('NO_AUTORIZADO', 'No tienes acceso a esta cita.');
  return cita;
}
export function validarCambio(db: BaseDatos, actor: Perfil, cita: Cita, ahora: Date): void {
  if (
    !['pendiente', 'confirmada'].includes(cita.estado) ||
    Date.parse(cita.inicio) <= ahora.getTime()
  )
    throw new ErrorNegocio('CITA_NO_ACTIVA', 'Esta cita ya no admite cambios.');
  const horas = db.configuracion.anticipacionCambiosHoras;
  if (actor.rol === 'paciente' && Date.parse(cita.inicio) - ahora.getTime() < horas * HORA)
    throw new ErrorNegocio(
      'FUERA_DE_PLAZO',
      `Faltan menos de ${horas} horas. Llama al consultorio para solicitar una excepción.`,
    );
}
export function validarInicio(
  db: BaseDatos,
  actor: Perfil,
  inicio: string,
  duracion: number,
  ahora: Date,
  excluirId?: string,
): string {
  const ms = Date.parse(inicio);
  if (!Number.isFinite(ms) || ms <= ahora.getTime())
    throw new ErrorNegocio('FECHA_INVALIDA', 'Elige una fecha y hora futuras.');
  const horas = db.configuracion.anticipacionAgendarHoras;
  if (actor.rol === 'paciente' && ms - ahora.getTime() < horas * HORA)
    throw new ErrorNegocio(
      'FUERA_DE_ANTICIPACION',
      `Debes agendar con al menos ${horas} horas de anticipación.`,
    );
  const fin = new Date(ms + duracion * MINUTO).toISOString();
  if (!dentroHorario(db, { inicio, fin }, ahora, excluirId))
    throw new ErrorNegocio(
      'HORARIO_NO_DISPONIBLE',
      'Ese horario ya no está disponible o está fuera de atención. Elige otro.',
    );
  return fin;
}
export function registrarCita(
  db: BaseDatos,
  actor: Perfil,
  input: CrearCita,
  id: string,
  ahora: Date,
): Cita {
  const servicio = db.servicios.find((s) => s.id === input.servicioId && s.activo);
  if (!servicio)
    throw new ErrorNegocio('SERVICIO_NO_ENCONTRADO', 'El servicio no está disponible.');
  const fin = validarInicio(db, actor, input.inicio, servicio.duracionMin, ahora);
  const paciente =
    actor.rol === 'paciente'
      ? actor
      : db.perfiles.find((p) => p.rol === 'paciente' && p.telefono === input.telefono);
  const nombre = actor.rol === 'paciente' ? actor.nombre : (input.pacienteNombre ?? '');
  const telefono = actor.rol === 'paciente' ? actor.telefono : (input.telefono ?? '');
  if (actor.rol === 'paciente' && (!nombre || !/^3\d{9}$/.test(telefono)))
    throw new ErrorNegocio(
      'DATOS_INVALIDOS',
      'Escribe el nombre y un celular de 10 dígitos que empiece por 3.',
    );
  const datosPaciente =
    actor.rol === 'odontologo' ? pacienteNuevaCitaSchema.safeParse({ nombre, telefono }) : null;
  if (datosPaciente && !datosPaciente.success)
    throw new ErrorNegocio('DATOS_INVALIDOS', datosPaciente.error.issues[0].message);
  const cita: Cita = {
    solicitudOriginal: actor.rol === 'paciente' && servicio.confirmacion === 'aprobacion',
    id,
    pacienteId: paciente?.id ?? null,
    pacienteNombre: datosPaciente?.data.nombre ?? nombre,
    telefono,
    servicioId: servicio.id,
    servicioNombre: servicio.nombre,
    inicio: input.inicio,
    fin,
    estado:
      actor.rol === 'odontologo' || servicio.confirmacion === 'inmediata'
        ? 'confirmada'
        : 'pendiente',
    precioAcordadoCop: servicio.precioCop,
    duracionAcordadaMin: servicio.duracionMin,
    origen: actor.rol === 'odontologo' ? 'consultorio' : 'app',
  };
  db.citas.push(cita);
  return cita;
}
export function vencerSolicitudes(db: BaseDatos, ahora: Date): Cita[] {
  return db.citas
    .filter((c) => c.estado === 'pendiente' && Date.parse(c.inicio) <= ahora.getTime())
    .map((c) => {
      c.estado = 'vencida';
      return c;
    });
}

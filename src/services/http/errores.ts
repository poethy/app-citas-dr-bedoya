// Traducción de los errores del backend a los mensajes de B6.4 de la especificación.
// ErrorApi hereda de ErrorNegocio para que las pantallas traten igual un error del servicio
// simulado y uno remoto (mensajeError, código).
import { ErrorNegocio } from '@/utils/errores';

export type CodigoError =
  | 'HORARIO_NO_DISPONIBLE'
  | 'FUERA_DE_HORARIO'
  | 'FUERA_DE_ANTICIPACION'
  | 'FUERA_DE_PLAZO'
  | 'CHOQUE_CON_CITA'
  | 'BLOQUEO_EXISTENTE'
  | 'CITA_NO_EXISTE'
  | 'ESTADO_INVALIDO'
  | 'SERVICIO_NO_EXISTE'
  | 'SOLICITUD_VENCIDA'
  | 'HORARIO_INVALIDO'
  | 'CITAS_FUERA_DE_HORARIO'
  | 'TELEFONO_INVALIDO'
  | 'NOMBRE_REQUERIDO'
  | 'NO_AUTORIZADO'
  | 'SIN_CONEXION'
  | 'CORREO_EN_USO'
  | 'CREDENCIALES_INVALIDAS'
  | 'CORREO_SIN_CONFIRMAR'
  | 'SIN_CONFIGURACION'
  | 'ERROR_SERVICIO';

/** Datos opcionales para armar el mensaje, por ejemplo la anticipación vigente. */
export interface ContextoError {
  anticipacionHoras?: number;
  detalle?: string;
}

function mensajeDe(codigo: CodigoError, horas: number | undefined): string {
  const textoHoras = horas !== undefined ? `${horas} h` : 'las horas configuradas';
  switch (codigo) {
    case 'HORARIO_NO_DISPONIBLE':
      return 'Ese horario acaba de ocuparse. Elige otro.';
    case 'FUERA_DE_HORARIO':
      return 'Ese horario está fuera de la atención del consultorio.';
    case 'FUERA_DE_ANTICIPACION':
      return `Las citas se agendan con al menos ${textoHoras} de anticipación.`;
    case 'FUERA_DE_PLAZO':
      return `No se cumple la anticipación de ${textoHoras}. Llama al consultorio para solicitar una excepción.`;
    case 'CHOQUE_CON_CITA':
      return 'Hay una cita en esa franja. Cancélala o reprográmala primero.';
    case 'BLOQUEO_EXISTENTE':
      return 'Esa franja ya está bloqueada.';
    case 'CITA_NO_EXISTE':
      return 'No encontramos esta cita.';
    case 'ESTADO_INVALIDO':
      return 'Esta cita ya no se puede modificar.';
    case 'SERVICIO_NO_EXISTE':
      return 'Ese servicio ya no está disponible.';
    case 'SOLICITUD_VENCIDA':
      return 'Esta solicitud venció al llegar la hora de la cita.';
    case 'HORARIO_INVALIDO':
      return 'La hora de cierre debe ser posterior a la de apertura.';
    case 'CITAS_FUERA_DE_HORARIO':
      return 'Hay citas que quedarían fuera del nuevo horario. Cancélalas o reprográmalas antes de guardar.';
    case 'TELEFONO_INVALIDO':
      return 'Escribe un celular de 10 dígitos que empiece por 3.';
    case 'NOMBRE_REQUERIDO':
      return 'Escribe el nombre del paciente.';
    case 'NO_AUTORIZADO':
      return 'No tienes acceso a esta sección.';
    case 'SIN_CONEXION':
      return 'Sin conexión. Revisa tu internet e intenta de nuevo.';
    case 'CORREO_EN_USO':
      return 'Este correo ya está registrado.';
    case 'CREDENCIALES_INVALIDAS':
      return 'Correo o contraseña incorrectos.';
    case 'CORREO_SIN_CONFIRMAR':
      return 'Confirma tu correo con el enlace que te enviamos y vuelve a intentarlo.';
    case 'SIN_CONFIGURACION':
      return 'Falta configurar la conexión con el servidor.';
    case 'ERROR_SERVICIO':
      return 'Ocurrió un problema con el servicio. Intenta de nuevo en unos segundos.';
  }
}

export class ErrorApi extends ErrorNegocio {
  declare codigo: CodigoError;
  readonly anticipacionHoras?: number;
  readonly detalle?: string;

  constructor(codigo: CodigoError, contexto: ContextoError = {}) {
    super(codigo, mensajeDe(codigo, contexto.anticipacionHoras));
    this.name = 'ErrorApi';
    this.anticipacionHoras = contexto.anticipacionHoras;
    this.detalle = contexto.detalle;
  }
}

const CODIGOS = new Set<string>([
  'HORARIO_NO_DISPONIBLE',
  'FUERA_DE_HORARIO',
  'FUERA_DE_ANTICIPACION',
  'FUERA_DE_PLAZO',
  'CHOQUE_CON_CITA',
  'BLOQUEO_EXISTENTE',
  'CITA_NO_EXISTE',
  'ESTADO_INVALIDO',
  'SERVICIO_NO_EXISTE',
  'SOLICITUD_VENCIDA',
  'HORARIO_INVALIDO',
  'CITAS_FUERA_DE_HORARIO',
  'TELEFONO_INVALIDO',
  'NOMBRE_REQUERIDO',
  'NO_AUTORIZADO',
]);

/** Las RPC devuelven el código fijo en `message`, por ejemplo «FUERA_DE_PLAZO». */
export function codigoDesdeMensaje(mensaje: string | undefined): CodigoError | null {
  return mensaje && CODIGOS.has(mensaje) ? (mensaje as CodigoError) : null;
}

/** Forma del error que devuelve PostgREST. */
export interface ErrorPostgrest {
  code?: string;
  message?: string;
  details?: string | null;
}

/**
 * Convierte la respuesta fallida de PostgREST en un ErrorApi.
 * `estado` es el código HTTP; si no hubo respuesta (red caída o timeout) se pasa `undefined`.
 */
export function traducirErrorHttp(
  estado: number | undefined,
  cuerpo: ErrorPostgrest | undefined,
): ErrorApi {
  if (estado === undefined) return new ErrorApi('SIN_CONEXION');
  const detalle = cuerpo?.details ?? cuerpo?.message ?? undefined;
  const conocido = codigoDesdeMensaje(cuerpo?.message);
  if (conocido) return new ErrorApi(conocido, { detalle: cuerpo?.details ?? undefined });
  if (cuerpo?.code === '23P01') return new ErrorApi('HORARIO_NO_DISPONIBLE');
  if (cuerpo?.code === '42501' || estado === 401 || estado === 403) {
    return new ErrorApi('NO_AUTORIZADO', { detalle });
  }
  return new ErrorApi('ERROR_SERVICIO', { detalle });
}

/** Forma del error de Supabase Auth. */
export interface ErrorAuth {
  code?: string;
  message: string;
  status?: number;
}

export function traducirErrorAuth(error: ErrorAuth): ErrorApi {
  if (error.status === undefined || error.message.toLowerCase().includes('network')) {
    return new ErrorApi('SIN_CONEXION', { detalle: error.message });
  }
  switch (error.code) {
    case 'invalid_credentials':
      return new ErrorApi('CREDENCIALES_INVALIDAS');
    case 'user_already_exists':
    case 'email_exists':
      return new ErrorApi('CORREO_EN_USO');
    case 'email_not_confirmed':
      return new ErrorApi('CORREO_SIN_CONFIRMAR');
    default:
      return new ErrorApi('ERROR_SERVICIO', { detalle: error.message });
  }
}

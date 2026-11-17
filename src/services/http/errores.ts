// Códigos de error de la base y de Auth, y el mensaje que ve el usuario
// (docs/especificaciones-tecnicas.md, sección 5.4).
export type CodigoError =
  | "HORARIO_NO_DISPONIBLE"
  | "FUERA_DE_HORARIO"
  | "FUERA_DE_ANTICIPACION"
  | "FUERA_DE_PLAZO"
  | "CHOQUE_CON_CITA"
  | "BLOQUEO_EXISTENTE"
  | "CITA_NO_EXISTE"
  | "ESTADO_INVALIDO"
  | "SERVICIO_NO_EXISTE"
  | "TELEFONO_INVALIDO"
  | "NOMBRE_REQUERIDO"
  | "NO_AUTORIZADO"
  | "SIN_CONEXION"
  | "CORREO_EN_USO"
  | "CREDENCIALES_INVALIDAS"
  | "CORREO_SIN_CONFIRMAR"
  | "ERROR_SERVICIO";

const mensajes: Record<CodigoError, string> = {
  HORARIO_NO_DISPONIBLE: "Ese horario acaba de ocuparse. Elige otro.",
  FUERA_DE_HORARIO: "Ese horario está fuera de la atención del consultorio.",
  FUERA_DE_ANTICIPACION: "Las citas se agendan con al menos 24 horas de anticipación.",
  FUERA_DE_PLAZO: "Faltan menos de 24 horas. Comunícate con el consultorio.",
  CHOQUE_CON_CITA: "Hay una cita en esa franja. Cancélala o reprográmala primero.",
  BLOQUEO_EXISTENTE: "Esa franja ya está bloqueada.",
  CITA_NO_EXISTE: "No encontramos esta cita.",
  ESTADO_INVALIDO: "Esta cita ya no se puede modificar.",
  SERVICIO_NO_EXISTE: "Ese servicio ya no está disponible.",
  TELEFONO_INVALIDO: "Escribe un celular de 10 dígitos que empiece por 3.",
  NOMBRE_REQUERIDO: "Escribe el nombre del paciente.",
  NO_AUTORIZADO: "No tienes acceso a esta sección.",
  SIN_CONEXION: "Sin conexión. Revisa tu internet e intenta de nuevo.",
  CORREO_EN_USO: "Este correo ya está registrado. Inicia sesión.",
  CREDENCIALES_INVALIDAS: "Correo o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo.",
  CORREO_SIN_CONFIRMAR: "Confirma tu correo con el enlace que te enviamos y vuelve a intentarlo.",
  ERROR_SERVICIO: "Ocurrió un problema con el servicio. Intenta de nuevo en unos segundos.",
};

export class ErrorApi extends Error {
  readonly codigo: CodigoError;
  readonly detalle?: string;

  constructor(codigo: CodigoError, detalle?: string) {
    super(mensajes[codigo]);
    this.name = "ErrorApi";
    this.codigo = codigo;
    this.detalle = detalle;
  }
}

const codigosConocidos = new Set<string>(Object.keys(mensajes));

/** Convierte el `message` que devuelven las RPC (p. ej. "FUERA_DE_PLAZO") en un código conocido. */
export function codigoDesdeMensaje(mensaje: string | undefined): CodigoError | null {
  return mensaje && codigosConocidos.has(mensaje) ? (mensaje as CodigoError) : null;
}

export function mensajeDeError(error: unknown): string {
  return error instanceof ErrorApi ? error.message : mensajes.ERROR_SERVICIO;
}

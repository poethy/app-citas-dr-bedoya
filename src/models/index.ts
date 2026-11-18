export type Rol = 'paciente' | 'odontologo';
export type EstadoCita = 'pendiente' | 'confirmada' | 'rechazada' | 'cancelada' | 'vencida';
export interface Perfil {
  id: string;
  nombre: string;
  telefono: string;
  correo: string;
  rol: Rol;
  claveDemo: string;
}
export interface Servicio {
  id: string;
  nombre: string;
  duracionMin: number;
  precioCop: number;
  confirmacion: 'inmediata' | 'aprobacion';
  activo: boolean;
}
export interface Cita {
  id: string;
  pacienteId: string | null;
  pacienteNombre: string;
  telefono: string;
  servicioId: string;
  servicioNombre: string;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  precioAcordadoCop: number;
  duracionAcordadaMin: number;
  origen: 'app' | 'consultorio';
  solicitudOriginal?: boolean;
}
export interface Bloqueo {
  id: string;
  inicio: string;
  fin: string;
  motivo: string;
}
export interface Aviso {
  id: string;
  destinatarioId: string;
  citaId: string;
  titulo: string;
  cuerpo: string;
  creadoEn: string;
  leida: boolean;
}
export interface Configuracion {
  anticipacionAgendarHoras: number;
  anticipacionCambiosHoras: number;
}
export interface BaseDatos {
  version: 1;
  perfiles: Perfil[];
  servicios: Servicio[];
  citas: Cita[];
  bloqueos: Bloqueo[];
  avisos: Aviso[];
  configuracion: Configuracion;
  sesionId: string | null;
}
export interface Franja {
  inicio: string;
  fin: string;
}
export interface CrearCita {
  servicioId: string;
  inicio: string;
  pacienteNombre?: string;
  telefono?: string;
}

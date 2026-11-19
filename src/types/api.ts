// Respuestas de la API REST de Supabase tal como llegan (snake_case).
// Se derivan de los tipos generados de la base (src/types/database.ts).
import type { Tables } from '@/types/database';

export type PerfilRespuesta = Pick<
  Tables<'perfiles'>,
  'id' | 'rol' | 'nombre' | 'telefono' | 'correo'
>;
export type ServicioRespuesta = Tables<'servicios'>;
export type ConfiguracionRespuesta = Pick<
  Tables<'configuracion'>,
  'anticipacion_agendar_horas' | 'anticipacion_cambios_horas' | 'latitud' | 'longitud'
>;
export type HorarioRespuesta = Tables<'horario_atencion'>;
export type BloqueoRecurrenteRespuesta = Tables<'bloqueos_recurrentes'>;
export type NotificacionRespuesta = Pick<
  Tables<'notificaciones'>,
  'id' | 'destinatario_id' | 'cita_id' | 'titulo' | 'cuerpo' | 'creado_en' | 'leida'
>;

/** `rango` llega como texto: `["2026-11-19 16:30:00+00","2026-11-19 17:15:00+00")`. */
export type BloqueoRespuesta = Pick<Tables<'bloqueos'>, 'id' | 'motivo'> & { rango: string };

/** Fila de una RPC que devuelve `citas` (sin datos del paciente ni del servicio). */
export type CitaFilaRespuesta = Tables<'citas'>;

/** GET /citas con el paciente y el servicio embebidos (CAMPOS_CITA en citas.remoto.ts). */
export type CitaRespuesta = Pick<
  Tables<'citas'>,
  | 'id'
  | 'numero'
  | 'paciente_id'
  | 'servicio_id'
  | 'inicio'
  | 'fin'
  | 'estado'
  | 'origen'
  | 'precio_acordado_cop'
  | 'duracion_acordada_min'
> & {
  paciente: Pick<Tables<'pacientes'>, 'nombre' | 'telefono' | 'perfil_id'> | null;
  servicio: Pick<Tables<'servicios'>, 'nombre'> | null;
};

/** POST /rpc/disponibilidad_dia */
export interface DisponibilidadRespuesta {
  fecha: string;
  abierto: boolean;
  apertura?: string;
  cierre?: string;
  anticipacion_agendar_horas: number;
  ocupados: { inicio: string; fin: string; tipo: 'cita' | 'bloqueo' }[];
}

/** Lo que recibe POST /rpc/actualizar_horario */
export interface ActualizarHorarioParametros {
  p_dias: { dia_semana: number; hora_inicio: string; hora_fin: string }[];
  p_almuerzo: { hora_inicio: string; hora_fin: string; dias: number[] } | null;
}

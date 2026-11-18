import type { EstadoCita } from '@/models';
import type { Tables } from '@/types/database';

// Filas tal como las devuelve hoy la API REST de Supabase (se derivan de los tipos generados).
export type PerfilRespuesta = Pick<
  Tables<'perfiles'>,
  'id' | 'rol' | 'nombre' | 'telefono' | 'correo'
>;
export type ServicioRespuesta = Tables<'servicios'>;
export type ConfiguracionRespuesta = Pick<
  Tables<'configuracion'>,
  'anticipacion_agendar_horas' | 'anticipacion_cambios_horas'
>;

// Contrato acordado para las citas (B6.4). La base todavía no lo expone: faltan
// precio_acordado_cop, duracion_acordada_min y el estado vencida.
export interface CitaRespuesta {
  id: string;
  paciente_id: string | null;
  paciente_nombre: string;
  telefono: string;
  servicio_id: string;
  servicio_nombre: string;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  precio_acordado_cop: number;
  duracion_acordada_min: number;
  origen: 'app' | 'consultorio';
}

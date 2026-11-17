import type { EstadoCita } from '@/models';
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

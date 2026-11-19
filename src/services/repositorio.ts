// Punto único de acceso a los datos para pantallas y hooks.
// Con EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_KEY en el .env, la app usa Supabase
// (Auth + Axios contra /rest/v1). Sin .env usa el servicio simulado de la demo.
import { leerEntorno } from '@/lib/entorno';
import type {
  BaseDatos,
  Bloqueo,
  Cita,
  Configuracion,
  CrearCita,
  Franja,
  HorarioAtencion,
  Perfil,
  Servicio,
} from '@/models';
import { repositorio as simulado } from './mock/repositorio';
import { repositorioRemoto } from './remoto/repositorio.remoto';

export interface Repositorio {
  consultar(): Promise<BaseDatos>;
  login(correo: string, clave: string): Promise<Perfil>;
  registro(datos: {
    nombre: string;
    telefono: string;
    correo: string;
    clave: string;
  }): Promise<Perfil>;
  salir(): Promise<void>;
  crearCita(datos: CrearCita): Promise<Cita>;
  cancelar(id: string): Promise<Cita>;
  reprogramar(id: string, inicio: string): Promise<Cita>;
  responder(id: string, aprobar: boolean): Promise<Cita>;
  guardarServicio(servicio: Servicio): Promise<void>;
  guardarConfiguracion(config: Configuracion): Promise<void>;
  guardarHorario(horario: HorarioAtencion): Promise<HorarioAtencion>;
  guardarPerfil(datos: Pick<Perfil, 'nombre' | 'telefono' | 'correo'>): Promise<void>;
  bloquear(input: Omit<Bloqueo, 'id'>): Promise<void>;
  eliminarBloqueo(id: string): Promise<void>;
  leerAviso(id: string): Promise<void>;
  listarCitas(): Promise<Cita[]>;
  obtenerCita(id: string): Promise<Cita>;
  /**
   * Rangos ocupados de una fecha (citas, bloqueos y almuerzo) para calcular franjas.
   * El servicio remoto los pide a disponibilidad_dia porque el paciente no ve las citas
   * ajenas; el simulado devuelve null y las franjas salen de los datos locales.
   */
  ocupacionDia(fecha: string): Promise<Franja[] | null>;
}

/** true si la app trabaja contra Supabase. */
export const usaServidor = leerEntorno() !== null;

export const repositorio: Repositorio = usaServidor ? repositorioRemoto : simulado;

import type { Cita } from '@/models';
import { repositorio } from '@/services/repositorio';
// M01, O01 (listado) y M03, O08 (detalle por id). Con Supabase van por HTTP con Axios
// (src/services/remoto/citas.remoto.ts); sin .env usan el servicio simulado.
export const getCitas = (): Promise<Cita[]> => repositorio.listarCitas();
export const getCita = (id: string): Promise<Cita> => repositorio.obtenerCita(id);

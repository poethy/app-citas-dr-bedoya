// Respuestas de la API tal como llegan (snake_case). Se derivan de los tipos generados de la base.
import type { Tables } from "@/types/database";

export type PerfilRespuesta = Tables<"perfiles">;
export type ServicioRespuesta = Tables<"servicios">;
export type CitaRespuesta = Tables<"citas">;
export type ConfiguracionRespuesta = Tables<"configuracion">;
export type NotificacionRespuesta = Tables<"notificaciones">;

/** GET /citas?select=id,numero,inicio,fin,estado,servicio:servicios(nombre,duracion_min) */
export type CitaConServicioRespuesta = Pick<CitaRespuesta, "id" | "numero" | "inicio" | "fin" | "estado"> & {
  servicio: Pick<ServicioRespuesta, "nombre" | "duracion_min"> | null;
};

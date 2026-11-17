import { mapConfiguracion } from "@/mappers/configuracion.mapper";
import type { Configuracion } from "@/models/configuracion";
import { http } from "@/services/http/cliente";
import { ErrorApi } from "@/services/http/errores";
import type { ConfiguracionRespuesta } from "@/types/api";

/** Reglas y datos del consultorio (una sola fila). */
export async function obtenerConfiguracion(): Promise<Configuracion> {
  const { data } = await http.get<ConfiguracionRespuesta[]>("/configuracion", { params: { id: "eq.1", select: "*" } });
  const fila = data[0];
  if (!fila) throw new ErrorApi("ERROR_SERVICIO", "Falta la configuración del consultorio");
  return mapConfiguracion(fila);
}

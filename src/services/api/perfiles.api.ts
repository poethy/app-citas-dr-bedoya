import { mapPerfil } from "@/mappers/perfil.mapper";
import type { Perfil } from "@/models/perfil";
import { http } from "@/services/http/cliente";
import { ErrorApi } from "@/services/http/errores";
import type { PerfilRespuesta } from "@/types/api";

/** Perfil del usuario con sesión (RLS solo deja ver el propio, salvo al odontólogo). */
export async function obtenerPerfil(id: string): Promise<Perfil> {
  const { data } = await http.get<PerfilRespuesta[]>("/perfiles", {
    params: { id: `eq.${id}`, select: "id,rol,nombre,telefono,correo,creado_en" },
  });
  const fila = data[0];
  if (!fila) throw new ErrorApi("NO_AUTORIZADO", "El usuario no tiene perfil");
  return mapPerfil(fila);
}

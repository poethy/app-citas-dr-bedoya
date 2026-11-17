import type { Perfil } from "@/models/perfil";
import type { PerfilRespuesta } from "@/types/api";

export function mapPerfil(r: PerfilRespuesta): Perfil {
  return {
    id: r.id,
    rol: r.rol,
    nombre: r.nombre,
    telefono: r.telefono,
    correo: r.correo,
  };
}

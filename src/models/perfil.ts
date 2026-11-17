export type Rol = "paciente" | "odontologo";

export interface Perfil {
  id: string;
  rol: Rol;
  nombre: string;
  telefono: string;
  correo: string;
}

// Autenticación con Supabase Auth (RF-01, RF-02). Es el único lugar que usa supabase-js.
import { supabase } from "@/lib/supabase";
import { ErrorApi } from "@/services/http/errores";
import type { DatosLogin, DatosRegistro } from "@/utils/validaciones";

function traducirErrorAuth(error: { code?: string; message: string; status?: number }): ErrorApi {
  if (error.status === undefined || error.message.toLowerCase().includes("network")) {
    return new ErrorApi("SIN_CONEXION", error.message);
  }
  switch (error.code) {
    case "invalid_credentials":
      return new ErrorApi("CREDENCIALES_INVALIDAS");
    case "user_already_exists":
    case "email_exists":
      return new ErrorApi("CORREO_EN_USO");
    case "email_not_confirmed":
      return new ErrorApi("CORREO_SIN_CONFIRMAR");
    default:
      return new ErrorApi("ERROR_SERVICIO", error.message);
  }
}

export async function iniciarSesion({ correo, contrasena }: DatosLogin): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: contrasena });
  if (error) throw traducirErrorAuth(error);
}

/** Registra un paciente. Devuelve false si Supabase pide confirmar el correo antes de entrar. */
export async function registrarPaciente({ nombre, telefono, correo, contrasena }: DatosRegistro): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({
    email: correo.trim(),
    password: contrasena,
    // El trigger nuevo_usuario de la base crea el perfil y la ficha con estos datos
    options: { data: { nombre: nombre.trim(), telefono } },
  });
  if (error) throw traducirErrorAuth(error);
  // Con confirmación de correo activa, Supabase oculta los correos repetidos devolviendo un usuario sin identidades
  if (data.user && data.user.identities?.length === 0) throw new ErrorApi("CORREO_EN_USO");
  return data.session !== null;
}

export async function cerrarSesion(): Promise<void> {
  await supabase.auth.signOut();
}

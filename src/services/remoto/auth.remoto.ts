// Autenticación con Supabase Auth (RF-01, RF-02). Es el único lugar que usa supabase-js.
// Todavía no lo usan las pantallas: la demo inicia sesión con el servicio simulado.
import { obtenerSupabase } from '@/lib/supabase';
import { ErrorApi, traducirErrorAuth } from '@/services/http/errores';

export interface DatosRegistroRemoto {
  nombre: string;
  telefono: string;
  correo: string;
  clave: string;
}

export async function iniciarSesion(correo: string, clave: string): Promise<void> {
  const { error } = await obtenerSupabase().auth.signInWithPassword({
    email: correo.trim(),
    password: clave,
  });
  if (error) throw traducirErrorAuth(error);
}

/** Registra un paciente. Devuelve false si Supabase pide confirmar el correo antes de entrar. */
export async function registrarPaciente(datos: DatosRegistroRemoto): Promise<boolean> {
  const { data, error } = await obtenerSupabase().auth.signUp({
    email: datos.correo.trim(),
    password: datos.clave,
    // El trigger de registro de la base crea el perfil (rol paciente) con estos datos
    options: { data: { nombre: datos.nombre.trim(), telefono: datos.telefono } },
  });
  if (error) throw traducirErrorAuth(error);
  // Con confirmación de correo activa, Supabase oculta los correos repetidos con un usuario sin identidades
  if (data.user && data.user.identities?.length === 0) throw new ErrorApi('CORREO_EN_USO');
  return data.session !== null;
}

export async function cerrarSesion(): Promise<void> {
  await obtenerSupabase().auth.signOut();
}

/**
 * Avisa cada vez que cambia el usuario de la sesión (también al abrir, con la sesión guardada).
 * Devuelve la función que cancela la suscripción; hay que llamarla al desmontar.
 */
export function escucharSesion(alCambiar: (usuarioId: string | null) => void): () => void {
  const { data } = obtenerSupabase().auth.onAuthStateChange((evento, sesion) => {
    if (evento === 'TOKEN_REFRESHED') return;
    // Se difiere para no llamar a la API dentro del callback de Auth
    setTimeout(() => alCambiar(sesion?.user.id ?? null), 0);
  });
  return () => data.subscription.unsubscribe();
}

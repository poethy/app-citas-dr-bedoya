// Variables públicas para conectar con Supabase (ver .env.template). No son secretos: viajan
// dentro de la app y la seguridad la dan las políticas RLS.
// La demo funciona sin .env, por eso aquí no se lanza ningún error al importar.
export interface Entorno {
  supabaseUrl: string;
  supabaseKey: string;
}

export function leerEntorno(): Entorno | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const clave = process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim();
  if (!url || !clave) return null;
  return { supabaseUrl: url.replace(/\/+$/, ''), supabaseKey: clave };
}

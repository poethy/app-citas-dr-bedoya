// Cliente de Supabase SOLO para autenticación: registro, login, sesión y logout (B6.1).
// Los datos se piden con Axios (src/services/http/cliente.ts), como exige el curso.
// Se crea al primer uso para que la demo con datos simulados no necesite .env.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { leerEntorno } from '@/lib/entorno';
import { ErrorApi } from '@/services/http/errores';

let cliente: SupabaseClient | null = null;

export function obtenerSupabase(): SupabaseClient {
  if (cliente) return cliente;
  const entorno = leerEntorno();
  if (!entorno) throw new ErrorApi('SIN_CONFIGURACION');
  cliente = createClient(entorno.supabaseUrl, entorno.supabaseKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  });
  return cliente;
}

/** Token de la sesión actual; supabase-js lo refresca solo. */
export async function obtenerToken(): Promise<string | null> {
  const { data } = await obtenerSupabase().auth.getSession();
  return data.session?.access_token ?? null;
}

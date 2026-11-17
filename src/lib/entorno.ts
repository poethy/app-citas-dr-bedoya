// Variables de entorno públicas (ver .env.template). No son secretos: viajan dentro de la app.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const clave = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!url || !clave) {
  throw new Error(
    "Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_KEY. Copia .env.template como .env y llena los valores.",
  );
}

export const entorno = {
  supabaseUrl: url,
  supabaseKey: clave,
} as const;

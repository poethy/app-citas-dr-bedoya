// Cliente de Supabase SOLO para autenticación (registro, login, sesión y logout).
// Los datos se piden con Axios (src/services/http/cliente.ts), como exige el curso.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

import { entorno } from "@/lib/entorno";

export const supabase = createClient(entorno.supabaseUrl, entorno.supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

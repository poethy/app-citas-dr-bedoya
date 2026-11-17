// Cliente HTTP único de la app. Todas las consultas a la base pasan por aquí.
// baseURL: API REST de Supabase (PostgREST). Las RPC son POST /rpc/<función>.
import axios, { AxiosError } from "axios";

import { entorno } from "@/lib/entorno";
import { supabase } from "@/lib/supabase";
import { ErrorApi, codigoDesdeMensaje } from "@/services/http/errores";

type RespuestaErrorPostgrest = { code?: string; message?: string; details?: string | null };

export const http = axios.create({
  baseURL: `${entorno.supabaseUrl}/rest/v1`,
  timeout: 10_000,
  headers: {
    apikey: entorno.supabaseKey,
    "Content-Type": "application/json",
  },
});

// Agrega el token de la sesión actual (supabase-js lo refresca solo)
http.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

// Convierte cualquier error en un ErrorApi con un código conocido
http.interceptors.response.use(
  (respuesta) => respuesta,
  (error: AxiosError<RespuestaErrorPostgrest>) => {
    if (!error.response) return Promise.reject(new ErrorApi("SIN_CONEXION", error.message));

    const cuerpo = error.response.data;
    const conocido = codigoDesdeMensaje(cuerpo?.message);
    if (conocido) return Promise.reject(new ErrorApi(conocido, cuerpo?.details ?? undefined));
    if (cuerpo?.code === "23P01") return Promise.reject(new ErrorApi("HORARIO_NO_DISPONIBLE"));
    if (cuerpo?.code === "42501" || error.response.status === 401 || error.response.status === 403) {
      return Promise.reject(new ErrorApi("NO_AUTORIZADO", cuerpo?.message));
    }
    return Promise.reject(new ErrorApi("ERROR_SERVICIO", cuerpo?.message ?? error.message));
  },
);

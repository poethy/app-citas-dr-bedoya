// Cliente HTTP único para el backend (B6.1). Todas las consultas remotas pasan por aquí.
// baseURL: API REST de Supabase (PostgREST); las RPC son POST /rpc/<función>.
// La demo actual usa src/services/mock y no hace HTTP; este cliente se activa al integrar.
import { create, type AxiosError } from 'axios';

import { leerEntorno } from '@/lib/entorno';
import { obtenerToken } from '@/lib/supabase';
import { ErrorApi, traducirErrorHttp, type ErrorPostgrest } from '@/services/http/errores';

const entorno = leerEntorno();

export const clienteHttp = create({
  baseURL: entorno ? `${entorno.supabaseUrl}/rest/v1` : undefined,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

clienteHttp.interceptors.request.use(async (config) => {
  if (!entorno) throw new ErrorApi('SIN_CONFIGURACION');
  config.headers.set('apikey', entorno.supabaseKey);
  const token = await obtenerToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

clienteHttp.interceptors.response.use(
  (respuesta) => respuesta,
  (error: AxiosError<ErrorPostgrest> | ErrorApi) => {
    if (error instanceof ErrorApi) return Promise.reject(error);
    return Promise.reject(traducirErrorHttp(error.response?.status, error.response?.data));
  },
);

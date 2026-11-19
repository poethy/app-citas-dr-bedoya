// Token de Expo Push del teléfono en la tabla tokens_push (RF-11, RF-13, RF-16, RF-17).
// La Edge Function enviar-notificaciones manda los avisos a los tokens de cada perfil.
// RLS: cada quien guarda y borra solo los suyos.
import { clienteHttp } from '@/services/http/cliente';

/** Token registrado en esta sesión, para borrarlo al cerrar sesión. */
let tokenRegistrado: string | null = null;

/** Guarda (o actualiza) el token del teléfono para el perfil con sesión. */
export async function guardarTokenPush(token: string, perfilId: string): Promise<void> {
  await clienteHttp.post(
    '/tokens_push',
    { token, perfil_id: perfilId, actualizado_en: new Date().toISOString() },
    { headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } },
  );
  tokenRegistrado = token;
}

/**
 * Borra el token de este teléfono. Se llama antes de cerrar sesión para que la
 * siguiente cuenta que entre en el mismo teléfono no reciba avisos ajenos.
 * No falla si no hay token o si la red no responde: cerrar sesión no debe bloquearse.
 */
export async function borrarTokenRegistrado(): Promise<void> {
  const token = tokenRegistrado;
  tokenRegistrado = null;
  if (!token) return;
  try {
    await clienteHttp.delete('/tokens_push', { params: { token: `eq.${token}` } });
  } catch {
    // Si falla, la Edge Function lo borra cuando Expo responda DeviceNotRegistered
  }
}

import { useEffect } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { citaDelAviso, obtenerTokenPush } from '@/lib/notificaciones';
import { usaServidor } from '@/services/repositorio';
import { guardarTokenPush } from '@/services/remoto/push.remoto';
import { useSesionStore } from '@/store/sesion.store';

/**
 * Avisos push (RF-11, RF-13, RF-16, RF-17). Solo con Supabase.
 * Entradas: el perfil con sesión (Zustand).
 * Efectos: al entrar, registra el token del teléfono en tokens_push; mientras la app
 * está abierta, refresca los datos cuando llega un aviso y abre la cita al tocarlo.
 * Las suscripciones se liberan al desmontar (RF-27).
 */
export function useNotificacionesPush(): void {
  const perfilId = useSesionStore((s) => s.perfil?.id ?? null);
  const client = useQueryClient();

  useEffect(() => {
    if (!usaServidor || !perfilId) return;
    let activo = true;
    void (async () => {
      const token = await obtenerTokenPush();
      if (!token || !activo) return;
      try {
        await guardarTokenPush(token, perfilId);
      } catch {
        // Sin el token la app sigue mostrando los avisos al abrirse
      }
    })();
    return () => {
      activo = false;
    };
  }, [perfilId]);

  useEffect(() => {
    if (!usaServidor) return;
    const llega = Notifications.addNotificationReceivedListener(() => {
      void client.invalidateQueries();
    });
    const toca = Notifications.addNotificationResponseReceivedListener((respuesta) => {
      const citaId = citaDelAviso(respuesta);
      if (citaId) router.push(`/cita/${citaId}`);
    });
    return () => {
      llega.remove();
      toca.remove();
    };
  }, [client]);
}

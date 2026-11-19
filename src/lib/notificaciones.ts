// Permiso y token de Expo Push del teléfono.
// Los avisos con la app cerrada necesitan un development build: Expo Go en Android no
// recibe push remotos desde el SDK 53, y la web no se usa para push. En esos casos el
// token es null y la app sigue mostrando los avisos al abrirse (P03, O11).
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

/** Muestra el aviso aunque la app esté abierta. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function idProyectoEas(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

/** true si este entorno puede recibir push remotos. */
export function admitePush(): boolean {
  if (Platform.OS === 'web' || !Device.isDevice) return false;
  // Expo Go («storeClient») ya no recibe push remotos en Android
  if (Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient') return false;
  return idProyectoEas() !== null;
}

/**
 * Pide permiso y devuelve el token de Expo Push, o null si no se puede (sin permiso,
 * en Expo Go, en la web o sin proyecto de EAS). Nunca lanza error.
 */
export async function obtenerTokenPush(): Promise<string | null> {
  if (!admitePush()) return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Avisos de citas',
        importance: AndroidImportance.HIGH,
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return null;
    const projectId = idProyectoEas();
    if (!projectId) return null;
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}

/** Id de la cita que trae un aviso (lo pone la Edge Function en `data.citaId`). */
export function citaDelAviso(respuesta: Notifications.NotificationResponse): string | null {
  const datos = respuesta.notification.request.content.data as { citaId?: unknown } | undefined;
  return typeof datos?.citaId === 'string' && datos.citaId ? datos.citaId : null;
}

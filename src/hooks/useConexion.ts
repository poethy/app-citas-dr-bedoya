import { useNetInfo } from '@react-native-community/netinfo';
export function useConexion() {
  const red = useNetInfo();
  return { conectado: red.isConnected !== false && red.isInternetReachable !== false };
}

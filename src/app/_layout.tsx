import '@/global.css';
import { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';
import { LibreBaskerville_400Regular } from '@expo-google-fonts/libre-baskerville';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDatos } from '@/hooks/useDatos';
import { useSesionStore } from '@/store/sesion.store';
import { Estado, AvisoBreve } from '@/components/ui';
import { simularFallo } from '@/services/mock/repositorio';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });
function Aplicacion() {
  const datos = useDatos();
  const establecer = useSesionStore((s) => s.establecer);
  useEffect(() => {
    if (datos.data)
      establecer(datos.data.perfiles.find((p) => p.id === datos.data.sesionId) ?? null);
  }, [datos.data, establecer]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) =>
      focusManager.setFocused(state === 'active'),
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      if (focusManager.isFocused()) queryClient.invalidateQueries();
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const pendientes =
      datos.data?.citas.filter((c) => c.estado === 'pendiente').map((c) => Date.parse(c.inicio)) ??
      [];
    if (!pendientes.length) return;
    const ms = Math.max(25, Math.min(...pendientes) - Date.now() + 25);
    const timer = setTimeout(() => queryClient.invalidateQueries(), Math.min(ms, 2147483647));
    return () => clearTimeout(timer);
  }, [datos.data]);
  if (datos.isError)
    return (
      <Estado
        titulo="No pudimos cargar tus datos"
        detalle={datos.error.message}
        accion={() => {
          simularFallo(null);
          datos.refetch();
        }}
      />
    );
  if (!datos.data) return <Estado titulo="Preparando tu agenda" cargando />;
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f3f6fb' } }} />
      <AvisoBreve />
    </>
  );
}
export default function RootLayout() {
  const [fonts, error] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    LibreBaskerville_400Regular,
  });
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View
            className="flex-1 bg-navy-50"
            style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}
          >
            {fonts || error ? <Aplicacion /> : <Estado titulo="Cargando recursos" cargando />}
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

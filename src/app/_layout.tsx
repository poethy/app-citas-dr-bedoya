// Stack raíz: fuentes, proveedores, escucha de sesión y rutas compartidas (fuera de las tabs).
import "@/global.css";

import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, useFonts } from "@expo-google-fonts/poppins";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colores, fuentes } from "@/constants/tema";
import { useEscucharSesion } from "@/hooks/useEscucharSesion";

SplashScreen.preventAutoHideAsync();

export default function LayoutRaiz() {
  const [fuentesListas, errorFuentes] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold });
  const [clienteConsultas] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }),
  );

  useEscucharSesion();

  useEffect(() => {
    if (fuentesListas || errorFuentes) SplashScreen.hideAsync();
  }, [fuentesListas, errorFuentes]);

  if (!fuentesListas && !errorFuentes) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={clienteConsultas}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerTintColor: colores.navy900,
              headerTitleStyle: { fontFamily: fuentes.semibold, fontSize: 18 },
              headerShadowVisible: false,
              headerStyle: { backgroundColor: colores.blanco },
              contentStyle: { backgroundColor: colores.gris100 },
              headerBackButtonDisplayMode: "minimal",
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(paciente)" options={{ headerShown: false }} />
            <Stack.Screen name="(odontologo)" options={{ headerShown: false }} />
            <Stack.Screen name="cita/[id]/index" options={{ title: "Detalle de la cita" }} />
            <Stack.Screen name="cita/[id]/reprogramar" options={{ title: "Reprogramar cita" }} />
            <Stack.Screen name="solicitud/[id]" options={{ title: "Solicitud de cita" }} />
            <Stack.Screen name="consultorio" options={{ title: "El consultorio" }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Tab Agendar · Stack interno S01 → S02 → S03 → S06 → S07/S08
import { Stack } from "expo-router";

import { BotonMenu } from "@/components/BotonMenu";
import { colores, fuentes } from "@/constants/tema";

export default function StackAgendar() {
  return (
    <Stack
      screenOptions={{
        title: "Agendar cita",
        headerTintColor: colores.navy900,
        headerTitleStyle: { fontFamily: fuentes.semibold, fontSize: 18 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colores.gris100 },
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="index" options={{ headerLeft: () => <BotonMenu /> }} />
      <Stack.Screen name="fecha" />
      <Stack.Screen name="horario" />
      <Stack.Screen name="resumen" />
      {/* S07/S08 se abren con replace y reinician el Stack: sin botón atrás */}
      <Stack.Screen name="resultado" options={{ headerBackVisible: false, gestureEnabled: false }} />
    </Stack>
  );
}

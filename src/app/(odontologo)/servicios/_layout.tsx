// Servicios · Stack C01 → C02
import { Stack } from "expo-router";

import { BotonMenu } from "@/components/BotonMenu";
import { colores, fuentes } from "@/constants/tema";

export default function StackServicios() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colores.navy900,
        headerTitleStyle: { fontFamily: fuentes.semibold, fontSize: 18 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colores.gris100 },
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Servicios", headerLeft: () => <BotonMenu /> }} />
      <Stack.Screen name="[id]" options={{ title: "Editar servicio" }} />
    </Stack>
  );
}

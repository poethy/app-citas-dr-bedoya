import { Stack } from "expo-router";

import { colores } from "@/constants/tema";

export default function LayoutAuth() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colores.blanco },
      }}
    />
  );
}

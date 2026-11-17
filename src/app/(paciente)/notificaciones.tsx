// P03 · Notificaciones
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function Notificaciones() {
  return (
    <PantallaPendiente codigo="P03" titulo="Notificaciones" requerimientos={"RF-11"}>
      <View className="gap-3">
        <Boton titulo="Tocar una notificación" variante="secundario" onPress={() => router.push("/cita/ejemplo")} />
      </View>
    </PantallaPendiente>
  );
}

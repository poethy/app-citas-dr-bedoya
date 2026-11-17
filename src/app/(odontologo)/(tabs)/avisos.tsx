// O11 · Avisos del consultorio
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function Avisos() {
  return (
    <PantallaPendiente codigo="O11" titulo="Avisos del consultorio" requerimientos={"RF-13 · RF-17"}>
      <View className="gap-3">
        <Boton titulo="Tocar un aviso de cita" variante="secundario" onPress={() => router.push("/cita/ejemplo")} />
        <Boton titulo="Tocar un aviso de solicitud" variante="secundario" onPress={() => router.push("/solicitud/ejemplo")} />
      </View>
    </PantallaPendiente>
  );
}

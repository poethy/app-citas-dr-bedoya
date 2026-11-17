// O01 · Agenda diaria (O02 semanal · O10)
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function Agenda() {
  return (
    <PantallaPendiente codigo="O01" titulo="Agenda diaria (O02 semanal · O10)" requerimientos={"RF-18 · RF-19"}>
      <View className="gap-3">
        <Boton titulo="Tocar una cita" variante="secundario" onPress={() => router.push("/cita/ejemplo")} />
        <Boton titulo="Tocar una cita pendiente" variante="secundario" onPress={() => router.push("/solicitud/ejemplo")} />
      </View>
    </PantallaPendiente>
  );
}

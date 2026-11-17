// S02 · Elegir fecha
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function ElegirFecha() {
  return (
    <PantallaPendiente codigo="S02" titulo="Elegir fecha" requerimientos={"RF-04"}>
      <View className="gap-3">
        <Boton titulo="Continuar al horario" variante="secundario" onPress={() => router.push("/agendar/horario")} />
      </View>
    </PantallaPendiente>
  );
}

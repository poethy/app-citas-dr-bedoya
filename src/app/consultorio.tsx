// P05 · Información del consultorio
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function Consultorio() {
  return (
    <PantallaPendiente codigo="P05" titulo="Información del consultorio" requerimientos={"Solo lectura · RF-20"}>
      <View className="gap-3">
        <Boton titulo="Ver en el mapa" variante="secundario" onPress={() => router.push("/mapa")} />
      </View>
    </PantallaPendiente>
  );
}

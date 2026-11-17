// MP01 · Mapa de la cita (MP02 a MP07)
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function Mapa() {
  return (
    <PantallaPendiente codigo="MP01" titulo="Mapa de la cita (MP02 a MP07)" requerimientos={"RF-20 a RF-27"}>
      <View className="gap-3">
        <Boton titulo="Ver dirección del consultorio" variante="secundario" onPress={() => router.push("/consultorio")} />
      </View>
    </PantallaPendiente>
  );
}

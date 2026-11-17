// S06 · Resumen y confirmación
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function Resumen() {
  return (
    <PantallaPendiente codigo="S06" titulo="Resumen y confirmación" requerimientos={"RF-05 · RF-08 · RF-09"}>
      <View className="gap-3">
        <Boton titulo="Confirmar cita (replace)" variante="secundario" onPress={() => router.replace("/agendar/resultado")} />
      </View>
    </PantallaPendiente>
  );
}

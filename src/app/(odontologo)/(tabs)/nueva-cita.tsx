// O09 · Nueva cita para un paciente
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function NuevaCita() {
  return (
    <PantallaPendiente codigo="O09" titulo="Nueva cita para un paciente" requerimientos={"RF-07"}>
      <View className="gap-3">
        <Boton titulo="Registrar cita (vuelve a la agenda)" variante="secundario" onPress={() => router.replace("/agenda")} />
      </View>
    </PantallaPendiente>
  );
}

// M03 · Detalle de la cita (O08 · M04 · M05 · M06 · M08)
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function DetalleCita() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PantallaPendiente codigo="M03" titulo="Detalle de la cita (O08 · M04 · M05 · M06 · M08)" requerimientos={`RF-03 · RF-12 · RF-13 · RF-14 · id: ${id}`}>
      <View className="gap-3">
        <Boton titulo="Reprogramar" variante="secundario" onPress={() => router.push("/cita/ejemplo/reprogramar")} />
      </View>
    </PantallaPendiente>
  );
}

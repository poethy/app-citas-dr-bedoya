// S03 · Elegir horario (S04 · S05)
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function ElegirHorario() {
  return (
    <PantallaPendiente codigo="S03" titulo="Elegir horario (S04 · S05)" requerimientos={"RF-04 · RF-06 · RF-28 · RF-29"}>
      <View className="gap-3">
        <Boton titulo="Continuar al resumen" variante="secundario" onPress={() => router.push("/agendar/resumen")} />
      </View>
    </PantallaPendiente>
  );
}

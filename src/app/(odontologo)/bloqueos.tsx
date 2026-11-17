// C05 · Bloquear horarios (C06 · C07)
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function Bloqueos() {
  return (
    <PantallaPendiente codigo="C05" titulo="Bloquear horarios (C06 · C07)" requerimientos={"RF-19"}>
      <View className="gap-3">
        <Boton titulo="Ver la cita que choca" variante="secundario" onPress={() => router.push("/cita/ejemplo")} />
      </View>
    </PantallaPendiente>
  );
}

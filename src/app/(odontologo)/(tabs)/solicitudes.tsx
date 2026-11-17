// O04 · Solicitudes pendientes (O06 · O07)
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function Solicitudes() {
  return (
    <PantallaPendiente codigo="O04" titulo="Solicitudes pendientes (O06 · O07)" requerimientos={"RF-09"}>
      <View className="gap-3">
        <Boton titulo="Tocar una solicitud" variante="secundario" onPress={() => router.push("/solicitud/ejemplo")} />
      </View>
    </PantallaPendiente>
  );
}

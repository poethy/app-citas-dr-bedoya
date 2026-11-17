// C01 · Servicios
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function Servicios() {
  return (
    <PantallaPendiente codigo="C01" titulo="Servicios" requerimientos={"RF-10 · RF-30"}>
      <View className="gap-3">
        <Boton titulo="Tocar un servicio" variante="secundario" onPress={() => router.push("/servicios/ejemplo")} />
      </View>
    </PantallaPendiente>
  );
}

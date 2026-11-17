// S07 · Cita confirmada / S08 solicitud pendiente
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function Resultado() {
  return (
    <PantallaPendiente codigo="S07" titulo="Cita confirmada / S08 solicitud pendiente" requerimientos={"RF-08 · RF-09"}>
      <View className="gap-3">
        <Boton titulo="Ver mis citas" variante="secundario" onPress={() => router.push("/mis-citas")} />
        <Boton titulo="Ver mi cita" variante="secundario" onPress={() => router.push("/cita/ejemplo")} />
      </View>
    </PantallaPendiente>
  );
}

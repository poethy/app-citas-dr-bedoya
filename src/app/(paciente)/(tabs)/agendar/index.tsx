// S01 · Elegir servicio
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function ElegirServicio() {
  return (
    <PantallaPendiente codigo="S01" titulo="Elegir servicio" requerimientos={"RF-05 · RF-30 (precio)"}>
      <View className="gap-3">
        <Boton titulo="Continuar a la fecha" variante="secundario" onPress={() => router.push("/agendar/fecha")} />
      </View>
    </PantallaPendiente>
  );
}

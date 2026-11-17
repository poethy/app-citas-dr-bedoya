// M01 · Mis citas (M02 sin resultados)
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function MisCitas() {
  return (
    <PantallaPendiente codigo="M01" titulo="Mis citas (M02 sin resultados)" requerimientos={"RF-03 · listado con búsqueda y filtros"}>
      <View className="gap-3">
        <Boton titulo="Tocar una cita" variante="secundario" onPress={() => router.push("/cita/ejemplo")} />
      </View>
    </PantallaPendiente>
  );
}

// P01 · Inicio del paciente
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { router } from "expo-router";
import { View } from "react-native";

import { Boton } from "@/components/Boton";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function InicioPaciente() {
  return (
    <PantallaPendiente codigo="P01" titulo="Inicio del paciente" requerimientos={"Próxima cita, recordatorio y accesos rápidos"}>
      <View className="gap-3">
        <Boton titulo="Agendar cita" variante="secundario" onPress={() => router.push("/agendar")} />
        <Boton titulo="Ver detalle (cita de ejemplo)" variante="secundario" onPress={() => router.push("/cita/ejemplo")} />
        <Boton titulo="Ver en el mapa" variante="secundario" onPress={() => router.push("/mapa")} />
        <Boton titulo="Mis citas" variante="secundario" onPress={() => router.push("/mis-citas")} />
      </View>
    </PantallaPendiente>
  );
}

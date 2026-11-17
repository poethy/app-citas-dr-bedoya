// M07 · Reprogramar cita
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { useLocalSearchParams } from "expo-router";

import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function Reprogramar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PantallaPendiente codigo="M07" titulo="Reprogramar cita" requerimientos={`RF-14 · id: ${id}`}>
    </PantallaPendiente>
  );
}

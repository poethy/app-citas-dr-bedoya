// O05 · Detalle de solicitud
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { useLocalSearchParams } from "expo-router";

import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function DetalleSolicitud() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PantallaPendiente codigo="O05" titulo="Detalle de solicitud" requerimientos={`RF-09 · id: ${id}`}>
    </PantallaPendiente>
  );
}

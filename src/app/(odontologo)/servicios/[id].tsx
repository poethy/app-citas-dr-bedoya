// C02 · Editar servicio (C03 validaciones)
// Pendiente: construir según el Figma (🎨 Alta fidelidad) y docs/pantallas-y-datos.md.
import { useLocalSearchParams } from "expo-router";

import { PantallaPendiente } from "@/components/PantallaPendiente";

export default function EditarServicio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PantallaPendiente codigo="C02" titulo="Editar servicio (C03 validaciones)" requerimientos={`RF-10 · RF-28 (contador y cálculo) · RF-30 · id: ${id}`}>
    </PantallaPendiente>
  );
}

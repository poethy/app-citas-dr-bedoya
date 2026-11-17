import { Text, View } from "react-native";

import type { EstadoCita } from "@/models/cita";

const estilos: Record<EstadoCita, { caja: string; texto: string; punto: string; etiqueta: string }> = {
  confirmada: { caja: "bg-exito-bg", texto: "text-exito", punto: "bg-exito", etiqueta: "Confirmada" },
  pendiente: { caja: "bg-aviso-bg", texto: "text-aviso", punto: "bg-aviso", etiqueta: "Pendiente" },
  rechazada: { caja: "bg-error-bg", texto: "text-error", punto: "bg-error", etiqueta: "Rechazada" },
  cancelada: { caja: "bg-gris-100", texto: "text-gris-500", punto: "bg-gris-400", etiqueta: "Cancelada" },
};

/** Chip de estado de una cita (HF/Chip del Figma). */
export function ChipEstado({ estado }: { estado: EstadoCita }) {
  const e = estilos[estado];
  return (
    <View className={`flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1 ${e.caja}`}>
      <View className={`h-1.5 w-1.5 rounded-full ${e.punto}`} />
      <Text className={`font-poppins-medium text-etiqueta ${e.texto}`}>{e.etiqueta}</Text>
    </View>
  );
}

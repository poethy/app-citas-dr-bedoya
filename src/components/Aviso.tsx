import Feather from "@expo/vector-icons/Feather";
import { Text, View } from "react-native";

import { colores } from "@/constants/tema";

type Tipo = "info" | "error" | "exito" | "aviso";

const estilos: Record<Tipo, { caja: string; texto: string; icono: React.ComponentProps<typeof Feather>["name"]; color: string }> = {
  info: { caja: "bg-navy-50 border-navy-100", texto: "text-navy-900", icono: "info", color: colores.navy900 },
  error: { caja: "bg-error-bg border-error/30", texto: "text-error", icono: "alert-circle", color: colores.error },
  exito: { caja: "bg-exito-bg border-exito/30", texto: "text-exito", icono: "check-circle", color: colores.exito },
  aviso: { caja: "bg-aviso-bg border-aviso/30", texto: "text-aviso", icono: "alert-triangle", color: "#B7791F" },
};

/** Mensaje en caja con ícono (HF/Aviso info y HF/Aviso error del Figma). */
export function Aviso({ tipo = "info", mensaje }: { tipo?: Tipo; mensaje: string }) {
  const e = estilos[tipo];
  return (
    <View accessibilityRole="alert" className={`w-full flex-row items-start gap-2.5 rounded-[14px] border px-3.5 py-3 ${e.caja}`}>
      <Feather name={e.icono} size={18} color={e.color} style={{ marginTop: 2 }} />
      <Text className={`flex-1 font-poppins text-pie ${e.texto}`}>{mensaje}</Text>
    </View>
  );
}

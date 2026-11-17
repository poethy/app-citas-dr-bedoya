import { Text, View } from "react-native";

type Tipo = "info" | "error" | "exito" | "aviso";

const estilos: Record<Tipo, string> = {
  info: "bg-navy-50 border-navy-100",
  error: "bg-error-bg border-error/30",
  exito: "bg-exito-bg border-exito/30",
  aviso: "bg-aviso-bg border-aviso/30",
};

const texto: Record<Tipo, string> = {
  info: "text-navy-800",
  error: "text-error",
  exito: "text-exito",
  aviso: "text-aviso",
};

/** Mensaje en caja (HF/Aviso info y HF/Aviso error del Figma). */
export function Aviso({ tipo = "info", mensaje }: { tipo?: Tipo; mensaje: string }) {
  return (
    <View accessibilityRole="alert" className={`w-full rounded-xl border px-4 py-3 ${estilos[tipo]}`}>
      <Text className={`font-poppins text-cuerpo ${texto[tipo]}`}>{mensaje}</Text>
    </View>
  );
}

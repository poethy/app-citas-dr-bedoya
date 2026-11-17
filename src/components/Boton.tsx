import { ActivityIndicator, Pressable, Text } from "react-native";

import { colores } from "@/constants/tema";

type Variante = "primario" | "secundario" | "peligro" | "texto";

interface BotonProps {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  cargando?: boolean;
  deshabilitado?: boolean;
  accessibilityLabel?: string;
}

const estilos: Record<Variante, { caja: string; texto: string; indicador: string }> = {
  primario: { caja: "bg-navy-900", texto: "text-white", indicador: colores.blanco },
  secundario: { caja: "border border-navy-900 bg-white", texto: "text-navy-900", indicador: colores.navy900 },
  peligro: { caja: "border border-error bg-white", texto: "text-error", indicador: colores.error },
  texto: { caja: "bg-transparent", texto: "text-navy-700", indicador: colores.navy700 },
};

/** Botón del Figma (HF/Botón primario, secundario, peligro y texto). Alto mínimo 52. */
export function Boton({ titulo, onPress, variante = "primario", cargando = false, deshabilitado = false, accessibilityLabel }: BotonProps) {
  const estilo = estilos[variante];
  const inactivo = deshabilitado || cargando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? titulo}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      disabled={inactivo}
      onPress={onPress}
      className={`min-h-[52px] w-full flex-row items-center justify-center rounded-xl px-4 ${estilo.caja} ${inactivo ? "opacity-60" : "active:opacity-80"}`}
    >
      {cargando ? (
        <ActivityIndicator color={estilo.indicador} />
      ) : (
        <Text className={`font-poppins-semibold text-boton ${estilo.texto}`}>{titulo}</Text>
      )}
    </Pressable>
  );
}

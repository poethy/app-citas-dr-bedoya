// Tarjeta de acceso rápido de P01 («Agendar cita» y «Mis citas»).
import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text, View } from "react-native";

import { colores } from "@/constants/tema";

interface AccesoRapidoProps {
  titulo: string;
  descripcion: string;
  icono: React.ComponentProps<typeof Feather>["name"];
  destacado?: boolean;
  onPress: () => void;
}

export function AccesoRapido({ titulo, descripcion, icono, destacado = false, onPress }: AccesoRapidoProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${descripcion}`}
      onPress={onPress}
      className={`flex-1 gap-2.5 rounded-[18px] p-4 active:opacity-80 ${destacado ? "bg-navy-700" : "bg-white"}`}
    >
      <View className={`h-[38px] w-[38px] items-center justify-center rounded-xl ${destacado ? "bg-navy-500" : "bg-navy-50"}`}>
        <Feather name={icono} size={20} color={destacado ? colores.blanco : colores.navy700} />
      </View>
      <Text className={`font-poppins-medium text-cuerpo ${destacado ? "text-white" : "text-navy-900"}`}>{titulo}</Text>
      <Text className={`font-poppins text-pie ${destacado ? "text-navy-100" : "text-gris-500"}`}>{descripcion}</Text>
    </Pressable>
  );
}

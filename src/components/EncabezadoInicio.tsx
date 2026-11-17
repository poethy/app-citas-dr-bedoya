// Encabezado navy de los inicios (P01): menú, saludo y campana de notificaciones.
import Feather from "@expo/vector-icons/Feather";
import { useNavigation } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colores } from "@/constants/tema";

interface EncabezadoInicioProps {
  saludo: string;
  subtitulo: string;
  onCampana: () => void;
}

function BotonRedondo({ icono, etiqueta, onPress }: { icono: "menu" | "bell"; etiqueta: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-full bg-navy-700 active:opacity-80"
    >
      <Feather name={icono} size={20} color={colores.blanco} />
    </Pressable>
  );
}

export function EncabezadoInicio({ saludo, subtitulo, onCampana }: EncabezadoInicioProps) {
  const navegacion = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View className="rounded-b-[28px] bg-navy-900 px-5 pb-5" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-3">
        <BotonRedondo icono="menu" etiqueta="Abrir menú" onPress={() => navegacion.dispatch({ type: "OPEN_DRAWER" })} />
        <View className="flex-1">
          <Text className="font-poppins-semibold text-titulo2 text-white" numberOfLines={1}>
            {saludo}
          </Text>
          <Text className="font-poppins text-pie text-navy-300">{subtitulo}</Text>
        </View>
        <BotonRedondo icono="bell" etiqueta="Notificaciones" onPress={onCampana} />
      </View>
    </View>
  );
}

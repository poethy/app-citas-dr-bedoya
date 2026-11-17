// Botón ☰ que abre el Drawer desde el encabezado de las tabs.
import Feather from "@expo/vector-icons/Feather";
import { useNavigation } from "expo-router";
import { Pressable } from "react-native";

import { colores } from "@/constants/tema";

export function BotonMenu() {
  const navegacion = useNavigation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abrir menú"
      hitSlop={8}
      className="ml-3 h-11 w-11 items-center justify-center rounded-full active:bg-gris-100"
      onPress={() => navegacion.dispatch({ type: "OPEN_DRAWER" })}
    >
      <Feather name="menu" size={22} color={colores.navy900} />
    </Pressable>
  );
}

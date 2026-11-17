import Feather from "@expo/vector-icons/Feather";
import { View, type ColorValue } from "react-native";

type NombreIcono = React.ComponentProps<typeof Feather>["name"];

/**
 * Ícono de una pestaña: devuelve la función que piden las Tabs en `tabBarIcon`.
 * La pestaña activa lleva la píldora de fondo del Figma (HF/Tabs).
 */
export function iconoTab(nombre: NombreIcono) {
  return function IconoTab({ color, focused }: { color: ColorValue; focused: boolean }) {
    return (
      <View className={`h-[30px] w-[56px] items-center justify-center rounded-full ${focused ? "bg-navy-100" : ""}`}>
        <Feather name={nombre} size={20} color={typeof color === "string" ? color : undefined} />
      </View>
    );
  };
}

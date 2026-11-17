import Feather from "@expo/vector-icons/Feather";
import type { ColorValue } from "react-native";

type NombreIcono = React.ComponentProps<typeof Feather>["name"];

/** Ícono de una pestaña: devuelve la función que piden las Tabs en `tabBarIcon`. */
export function iconoTab(nombre: NombreIcono) {
  return function IconoTab({ color }: { color: ColorValue }) {
    return <Feather name={nombre} size={22} color={typeof color === "string" ? color : undefined} />;
  };
}

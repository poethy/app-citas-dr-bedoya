// A00 · Inicio definido: lee la sesión y manda a cada rol a su inicio (replace).
import { Redirect, router } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

import { EstadoError } from "@/components/Estados";
import { colores } from "@/constants/tema";
import { useSesionStore } from "@/store/sesion.store";

export default function Inicio() {
  const { estado, perfil } = useSesionStore();

  if (estado === "sin-sesion") return <Redirect href="/bienvenida" />;
  if (estado === "con-sesion" && perfil?.rol === "paciente") return <Redirect href="/inicio" />;
  if (estado === "con-sesion" && perfil?.rol === "odontologo") return <Redirect href="/agenda" />;
  if (estado === "error") return <EstadoError onReintentar={() => router.replace("/")} />;

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-navy-900">
      <Text className="font-poppins-semibold text-[56px] text-white">CB</Text>
      <Text className="font-poppins text-cuerpo text-navy-300">Odontología · Pereira</Text>
      <ActivityIndicator color={colores.blanco} />
    </View>
  );
}

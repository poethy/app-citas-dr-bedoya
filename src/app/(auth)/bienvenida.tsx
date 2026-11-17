// A01 · Bienvenida
import { router } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Boton } from "@/components/Boton";

export default function Bienvenida() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <View className="flex-[1.1] items-center justify-center rounded-b-[32px] bg-navy-900 px-8">
        <Text className="font-poppins-semibold text-[40px] leading-[46px] text-white">Dr.{"\n"}Camilo{"\n"}Bedoya</Text>
      </View>
      <View className="flex-1 justify-between px-6 pb-6 pt-8">
        <View className="gap-3">
          <Text className="font-poppins-semibold text-titulo1 text-navy-900">Tu sonrisa, a un toque</Text>
          <Text className="font-poppins text-cuerpo text-gris-500">
            Agenda, reprograma o cancela tus citas con el Dr. Camilo Bedoya sin llamadas ni esperas.
          </Text>
        </View>
        <View className="gap-3">
          <Boton titulo="Iniciar sesión" onPress={() => router.push("/login")} />
          <Boton titulo="Crear cuenta" variante="secundario" onPress={() => router.push("/registro")} />
        </View>
      </View>
    </SafeAreaView>
  );
}

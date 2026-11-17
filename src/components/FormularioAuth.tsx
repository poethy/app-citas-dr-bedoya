// Marco común de A02 y A04: botón atrás, monograma, título y formulario que el teclado no tapa.
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colores } from "@/constants/tema";

interface FormularioAuthProps {
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
  pie: React.ReactNode;
}

export function FormularioAuth({ titulo, subtitulo, children, pie }: FormularioAuthProps) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerClassName="grow gap-6 px-6 pb-6" keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            className="mt-2 h-11 w-11 items-center justify-center rounded-full active:bg-gris-100"
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/bienvenida"))}
          >
            <Feather name="arrow-left" size={22} color={colores.navy900} />
          </Pressable>
          <View className="gap-2">
            <Text className="font-poppins-semibold text-[32px] text-navy-900">CB</Text>
            <Text className="font-poppins-semibold text-titulo1 text-navy-900">{titulo}</Text>
            <Text className="font-poppins text-cuerpo text-gris-500">{subtitulo}</Text>
          </View>
          <View className="gap-4">{children}</View>
          <View className="flex-1" />
          {pie}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function EnlacePie({ texto, enlace, onPress }: { texto: string; enlace: string; onPress: () => void }) {
  return (
    <View className="flex-row justify-center gap-1">
      <Text className="font-poppins text-cuerpo text-gris-500">{texto}</Text>
      <Pressable accessibilityRole="link" onPress={onPress} hitSlop={12}>
        <Text className="font-poppins-semibold text-cuerpo text-navy-700">{enlace}</Text>
      </Pressable>
    </View>
  );
}

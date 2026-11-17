import { Text, TextInput, View, type TextInputProps } from "react-native";

import { colores } from "@/constants/tema";

interface CampoProps extends Omit<TextInputProps, "className"> {
  etiqueta: string;
  error?: string;
  ayuda?: string;
}

/** Campo de formulario del Figma (HF/Campo): etiqueta, caja y mensaje de error o ayuda. */
export function Campo({ etiqueta, error, ayuda, ...props }: CampoProps) {
  return (
    <View className="w-full gap-1.5">
      <Text className="font-poppins-medium text-etiqueta text-gris-700">{etiqueta}</Text>
      <TextInput
        accessibilityLabel={etiqueta}
        placeholderTextColor={colores.gris400}
        className={`min-h-[48px] rounded-xl border bg-white px-4 font-poppins text-cuerpo text-gris-900 ${error ? "border-error" : "border-gris-300"}`}
        {...props}
      />
      {error ? (
        <Text className="font-poppins text-pie text-error">{error}</Text>
      ) : ayuda ? (
        <Text className="font-poppins text-pie text-gris-500">{ayuda}</Text>
      ) : null}
    </View>
  );
}

// Marcador temporal para las rutas que existen en la navegación pero aún no tienen su
// pantalla final. Muestra qué pantalla del Figma va aquí. Se elimina al construir cada una.
import { ScrollView, Text, View } from "react-native";

interface PantallaPendienteProps {
  codigo: string;
  titulo: string;
  requerimientos?: string;
  children?: React.ReactNode;
}

export function PantallaPendiente({ codigo, titulo, requerimientos, children }: PantallaPendienteProps) {
  return (
    <ScrollView className="flex-1 bg-gris-100" contentContainerClassName="gap-4 p-4">
      <View className="gap-1 rounded-2xl border border-dashed border-gris-300 bg-white p-4">
        <Text className="font-poppins-medium text-etiqueta text-navy-500">{codigo} · EN CONSTRUCCIÓN</Text>
        <Text className="font-poppins-semibold text-titulo2 text-gris-900">{titulo}</Text>
        {requerimientos ? <Text className="font-poppins text-pie text-gris-500">{requerimientos}</Text> : null}
      </View>
      {children}
    </ScrollView>
  );
}

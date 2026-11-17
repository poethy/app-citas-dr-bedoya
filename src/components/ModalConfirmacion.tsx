// Hoja inferior de confirmación (P06, O12, M05 del Figma). Tocar el fondo la cierra.
import { Modal, Pressable, Text, View } from "react-native";

import { Boton } from "@/components/Boton";

interface ModalConfirmacionProps {
  visible: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  peligro?: boolean;
  cargando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ModalConfirmacion({
  visible,
  titulo,
  mensaje,
  textoConfirmar,
  peligro = false,
  cargando = false,
  onConfirmar,
  onCancelar,
}: ModalConfirmacionProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <Pressable accessibilityLabel="Cerrar" className="flex-1 justify-end bg-black/50" onPress={onCancelar}>
        <Pressable className="gap-3 rounded-t-3xl bg-white px-6 pb-8 pt-3" onPress={() => undefined}>
          <View className="mb-2 h-1 w-10 self-center rounded-full bg-gris-300" />
          <Text className="font-poppins-semibold text-titulo2 text-gris-900">{titulo}</Text>
          <Text className="font-poppins text-cuerpo text-gris-500">{mensaje}</Text>
          <Boton titulo={textoConfirmar} variante={peligro ? "peligro" : "primario"} cargando={cargando} onPress={onConfirmar} />
          <Boton titulo="Cancelar" variante="texto" onPress={onCancelar} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

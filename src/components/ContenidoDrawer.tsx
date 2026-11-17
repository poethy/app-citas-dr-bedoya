// Menú lateral de cada rol (P02 y O03): encabezado navy, opciones y «Cerrar sesión» con modal (P06 / O12).
import Feather from "@expo/vector-icons/Feather";
import { router, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ModalConfirmacion } from "@/components/ModalConfirmacion";
import { colores } from "@/constants/tema";
import { cerrarSesion } from "@/services/api/auth.api";
import { useSesionStore } from "@/store/sesion.store";

export interface OpcionDrawer {
  etiqueta: string;
  icono: React.ComponentProps<typeof Feather>["name"];
  ruta: Href;
}

interface ContenidoDrawerProps {
  subtitulo: string;
  opciones: OpcionDrawer[];
  mensajeCerrarSesion: string;
  cerrar: () => void;
}

export function ContenidoDrawer({ subtitulo, opciones, mensajeCerrarSesion, cerrar }: ContenidoDrawerProps) {
  const perfil = useSesionStore((s) => s.perfil);
  const insets = useSafeAreaInsets();
  const [confirmando, setConfirmando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  const iniciales = (perfil?.nombre ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  async function salir() {
    setSaliendo(true);
    await cerrarSesion();
    setSaliendo(false);
    setConfirmando(false);
    router.replace("/bienvenida");
  }

  return (
    <View className="flex-1 bg-white">
      <View className="gap-2 bg-navy-900 px-5 pb-6" style={{ paddingTop: insets.top + 24 }}>
        <View className="h-14 w-14 items-center justify-center rounded-full bg-navy-700">
          <Text className="font-poppins-semibold text-titulo2 text-white">{iniciales || "CB"}</Text>
        </View>
        <Text className="font-poppins-semibold text-subtitulo text-white">{perfil?.nombre ?? ""}</Text>
        <Text className="font-poppins text-pie text-navy-300">{subtitulo}</Text>
      </View>

      <ScrollView contentContainerClassName="gap-1 p-3">
        {opciones.map((opcion) => (
          <Pressable
            key={opcion.etiqueta}
            accessibilityRole="button"
            className="min-h-[48px] flex-row items-center gap-3 rounded-xl px-3 active:bg-gris-100"
            onPress={() => {
              cerrar();
              router.push(opcion.ruta);
            }}
          >
            <Feather name={opcion.icono} size={20} color={colores.navy700} />
            <Text className="font-poppins-medium text-cuerpo text-gris-900">{opcion.etiqueta}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        className="mx-3 min-h-[48px] flex-row items-center gap-3 rounded-xl px-3 active:bg-error-bg"
        style={{ marginBottom: insets.bottom + 12 }}
        onPress={() => setConfirmando(true)}
      >
        <Feather name="log-out" size={20} color={colores.error} />
        <Text className="font-poppins-medium text-cuerpo text-error">Cerrar sesión</Text>
      </Pressable>

      <ModalConfirmacion
        visible={confirmando}
        titulo="¿Cerrar sesión?"
        mensaje={mensajeCerrarSesion}
        textoConfirmar="Sí, cerrar sesión"
        peligro
        cargando={saliendo}
        onConfirmar={salir}
        onCancelar={() => setConfirmando(false)}
      />
    </View>
  );
}

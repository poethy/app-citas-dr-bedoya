// Tarjeta de cita (HF/Tarjeta cita del Figma): caja con el día, estado, servicio, hora y lugar.
// Se usa en P01, S07/S08 y M01.
import { Pressable, Text, View } from "react-native";

import { ChipEstado } from "@/components/ChipEstado";
import type { Cita } from "@/models/cita";
import { diaDelMes, diaSemanaCorto, horaCorta } from "@/utils/fechas";

interface TarjetaCitaProps {
  cita: Cita;
  /** Tercera línea, p. ej. «Consultorio 201 · Ed. Torcoroma» o «Esperando aprobación» */
  detalle?: string;
  onPress?: () => void;
}

export function TarjetaCita({ cita, detalle, onPress }: TarjetaCitaProps) {
  const contenido = (
    <View className="flex-row items-center gap-3.5 rounded-2xl border border-gris-200 bg-white p-3.5">
      <View className="h-[62px] w-[56px] items-center justify-center rounded-xl bg-navy-50">
        <Text className="font-poppins-medium text-etiqueta text-navy-500">{diaSemanaCorto(cita.inicio)}</Text>
        <Text className="font-poppins-semibold text-titulo1 text-navy-900">{diaDelMes(cita.inicio)}</Text>
      </View>
      <View className="flex-1 gap-1">
        <ChipEstado estado={cita.estado} />
        <Text className="font-poppins-medium text-subtitulo text-navy-900" numberOfLines={1}>
          {cita.servicio.nombre}
        </Text>
        <Text className="font-poppins text-pie text-gris-500">
          {horaCorta(cita.inicio)} · {cita.servicio.duracionMin} min
        </Text>
        {detalle ? (
          <Text className="font-poppins text-pie text-gris-500" numberOfLines={1}>
            {detalle}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (!onPress) return contenido;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Cita de ${cita.servicio.nombre}, ${horaCorta(cita.inicio)}`}
      className="active:opacity-80"
      onPress={onPress}
    >
      {contenido}
    </Pressable>
  );
}

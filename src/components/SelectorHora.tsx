import { Pressable, View } from 'react-native';
import { Icono, Texto } from './ui';
import { PASO_MINUTOS, textoHora } from '@/utils/horario';

interface Props {
  label: string;
  /** Minutos desde la medianoche */
  valor: number;
  onChange: (minutos: number) => void;
  min?: number;
  max?: number;
  error?: boolean;
}

/** C09: hora con pasos de 15 minutos («Abre 8:00 a. m.»). */
export default function SelectorHora({
  label,
  valor,
  onChange,
  min = 5 * 60,
  max = 22 * 60,
  error = false,
}: Props) {
  const bajar = valor - PASO_MINUTOS >= min;
  const subir = valor + PASO_MINUTOS <= max;
  return (
    <View className="flex-1 gap-1.5">
      <Texto className="font-medium text-xs">{label}</Texto>
      <View
        className={`flex-row items-center bg-white border rounded-xl min-h-[52px] ${error ? 'border-danger' : 'border-line'}`}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: 15 minutos antes`}
          accessibilityState={{ disabled: !bajar }}
          disabled={!bajar}
          onPress={() => onChange(valor - PASO_MINUTOS)}
          className={`w-11 h-[52px] items-center justify-center ${bajar ? 'active:opacity-60' : 'opacity-30'}`}
        >
          <Icono nombre="minusNavy" size={16} />
        </Pressable>
        <Texto
          accessibilityLabel={`${label}: ${textoHora(valor)}`}
          className="flex-1 text-center text-sm"
        >
          {textoHora(valor)}
        </Texto>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: 15 minutos después`}
          accessibilityState={{ disabled: !subir }}
          disabled={!subir}
          onPress={() => onChange(valor + PASO_MINUTOS)}
          className={`w-11 h-[52px] items-center justify-center ${subir ? 'active:opacity-60' : 'opacity-30'}`}
        >
          <Icono nombre="plusNavy" size={16} />
        </Pressable>
      </View>
    </View>
  );
}

import { Pressable, View } from 'react-native';
import { Icono, Tarjeta, Texto } from './ui';
interface Props {
  titulo: string;
  valor: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  paso: number;
  unidad: string;
  mostrarLimites?: boolean;
}
export default function Contador({
  titulo,
  valor,
  onChange,
  min,
  max,
  paso,
  unidad,
  mostrarLimites = true,
}: Props) {
  return (
    <Tarjeta>
      <Texto className="text-xs font-medium">{titulo}</Texto>
      <View className="flex-row justify-between items-center gap-4">
        <Pressable
          disabled={valor <= min}
          accessibilityLabel={`Disminuir ${titulo}`}
          accessibilityState={{ disabled: valor <= min }}
          onPress={() => onChange(Math.max(min, valor - paso))}
          className={`bg-navy-900 p-4 rounded-xl ${valor <= min ? 'opacity-30' : ''}`}
        >
          <Icono nombre="minus" />
        </Pressable>
        <View className="items-center">
          <Texto className="font-semibold text-3xl leading-10">{valor}</Texto>
          <Texto className="text-xs text-muted">{unidad}</Texto>
        </View>
        <Pressable
          disabled={valor >= max}
          accessibilityLabel={`Aumentar ${titulo}`}
          accessibilityState={{ disabled: valor >= max }}
          onPress={() => onChange(Math.min(max, valor + paso))}
          className={`bg-navy-900 p-4 rounded-xl ${valor >= max ? 'opacity-30' : ''}`}
        >
          <Icono nombre="plusWhite" />
        </Pressable>
      </View>
      {mostrarLimites && (
        <Texto className="text-[11px] text-muted">
          Pasos de {paso} · mínimo {min}, máximo {max}.
        </Texto>
      )}
    </Tarjeta>
  );
}

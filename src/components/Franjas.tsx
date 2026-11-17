import { Pressable, View } from 'react-native';
import type { Franja } from '@/models';
import { horaTexto } from '@/utils/fechas';
import { Estado, Texto } from './ui';
export default function Franjas({
  franjas,
  valor,
  onChange,
}: {
  franjas: Franja[];
  valor: string;
  onChange: (v: string) => void;
}) {
  if (!franjas.length)
    return (
      <Estado
        titulo="No hay horarios libres este día"
        detalle="El tiempo disponible no alcanza para este servicio o no cumple la anticipación. Elige otra fecha."
      />
    );
  return (
    <View className="flex-row flex-wrap gap-2">
      {franjas.map((f) => (
        <Pressable
          key={f.inicio}
          accessibilityRole="button"
          accessibilityState={{ selected: f.inicio === valor }}
          onPress={() => onChange(f.inicio)}
          className={`min-w-[30%] flex-grow py-4 px-2 border rounded-xl items-center ${valor === f.inicio ? 'bg-navy-900 border-navy-900' : 'bg-white border-line'}`}
        >
          <Texto className={`text-xs ${valor === f.inicio ? 'text-white' : ''}`}>
            {horaTexto(f.inicio)}
          </Texto>
        </Pressable>
      ))}
    </View>
  );
}

import { View } from 'react-native';
import { Icono, Texto } from './ui';
import type { NombreIcono } from '@/constants/iconos';
export function ResumenCita({ filas }: { filas: [NombreIcono, string, string][] }) {
  return (
    <View className="gap-4 py-2">
      {filas.map(([icono, label, valor]) => (
        <View key={label} className="flex-row items-center gap-3">
          <View className="bg-navy-50 p-2 rounded-lg">
            <Icono nombre={icono} size={20} />
          </View>
          <View className="flex-1">
            <Texto className="text-xs text-muted">{label}</Texto>
            <Texto className="font-medium text-sm">{valor}</Texto>
          </View>
        </View>
      ))}
    </View>
  );
}

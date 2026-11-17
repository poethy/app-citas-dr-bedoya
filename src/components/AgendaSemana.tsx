import { Pressable, View } from 'react-native';
import type { Cita } from '@/models';
import { fechaLocal, instante, sumarDias } from '@/utils/fechas';
import { cruza } from '@/utils/franjas';
import { Tarjeta, Texto } from './ui';
export default function AgendaSemana({
  fecha,
  citas,
  onDia,
}: {
  fecha: string;
  citas: Cita[];
  onDia: (dia: string) => void;
}) {
  const lunes = sumarDias(fecha, -((instante(fecha, 720).getUTCDay() + 6) % 7));
  return (
    <>
      <Tarjeta>
        <View className="flex-row gap-1">
          {Array.from({ length: 6 }, (_, i) => {
            const dia = sumarDias(lunes, i);
            return (
              <Pressable
                key={dia}
                accessibilityRole="button"
                accessibilityLabel={`Abrir agenda del ${dia}`}
                onPress={() => onDia(dia)}
                className="flex-1 gap-2 items-center"
              >
                <Texto className="text-[10px]">
                  {instante(dia, 720).toLocaleDateString('es-CO', {
                    weekday: 'short',
                    timeZone: 'America/Bogota',
                  })}
                </Texto>
                <Texto className={`text-xs font-semibold ${dia === fecha ? 'text-navy-500' : ''}`}>
                  {dia.slice(-2)}
                </Texto>
                {Array.from({ length: 5 }, (_, bloque) => {
                  const rango = {
                    inicio: instante(dia, 480 + bloque * 120).toISOString(),
                    fin: instante(dia, 600 + bloque * 120).toISOString(),
                  };
                  const cita = citas.find((c) => fechaLocal(c.inicio) === dia && cruza(c, rango));
                  const color = !cita
                    ? '#f3f6fb'
                    : cita.estado === 'pendiente'
                      ? '#fdf3e1'
                      : cita.estado === 'cancelada' || cita.estado === 'rechazada'
                        ? '#fbe9e7'
                        : cita.estado === 'vencida'
                          ? '#e3e6eb'
                          : '#8fa9d1';
                  return (
                    <View
                      key={bloque}
                      className="w-full h-12 rounded-lg"
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
              </Pressable>
            );
          })}
        </View>
        <View className="flex-row flex-wrap gap-3 mt-3">
          <Texto className="text-xs text-navy-500">■ Cita</Texto>
          <Texto className="text-xs text-[#b7791f]">■ Pendiente</Texto>
          <Texto className="text-xs text-danger">■ Cancelada</Texto>
        </View>
      </Tarjeta>
      <Texto className="text-xs text-muted">Toca un día para abrir su agenda diaria.</Texto>
    </>
  );
}

import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { fechaLocal, instante, sumarDias } from '@/utils/fechas';
import { Tarjeta, Texto } from './ui';
export default function Calendario({
  valor,
  onChange,
  permitirHoy = true,
  error = false,
}: {
  valor: string;
  onChange: (v: string) => void;
  permitirHoy?: boolean;
  error?: boolean;
}) {
  const hoy = fechaLocal();
  const [mes, setMes] = useState((valor || hoy).slice(0, 7));
  const primero = instante(`${mes}-01`, 720);
  const offset = (primero.getUTCDay() + 6) % 7;
  const total = new Date(
    Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0),
  ).getUTCDate();
  const mover = (delta: number) => {
    const d = new Date(Date.UTC(primero.getUTCFullYear(), primero.getUTCMonth() + delta, 1));
    setMes(d.toISOString().slice(0, 7));
  };
  return (
    <Tarjeta className={error ? 'border border-danger' : undefined}>
      <View className="flex-row justify-between items-center">
        <Texto className="font-medium capitalize">
          {primero.toLocaleDateString('es-CO', {
            timeZone: 'America/Bogota',
            month: 'long',
            year: 'numeric',
          })}
        </Texto>
        <View className="flex-row">
          <Pressable accessibilityLabel="Mes anterior" onPress={() => mover(-1)} className="p-3">
            <Texto>‹</Texto>
          </Pressable>
          <Pressable accessibilityLabel="Mes siguiente" onPress={() => mover(1)} className="p-3">
            <Texto>›</Texto>
          </Pressable>
        </View>
      </View>
      <View className="flex-row">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <Texto
            key={i}
            className="text-center text-xs text-navy-500"
            style={{ width: '14.2857%' }}
          >
            {d}
          </Texto>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {Array.from({ length: offset + total }, (_, i) => {
          const dia = i - offset + 1;
          if (dia < 1) return <View key={i} style={{ width: '14.2857%', height: 48 }} />;
          const fecha = `${mes}-${String(dia).padStart(2, '0')}`;
          const disabled =
            dia < 1 ||
            fecha < (permitirHoy ? hoy : sumarDias(hoy, 1)) ||
            instante(fecha, 720).getUTCDay() === 0;
          return (
            <View key={i} style={{ width: '14.2857%' }} className="items-center py-1">
              <Pressable
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={fecha}
                accessibilityState={{ disabled, selected: fecha === valor }}
                onPress={() => onChange(fecha)}
                className={`w-10 h-10 items-center justify-center rounded-full ${fecha === valor ? 'bg-navy-900' : ''}`}
              >
                <Texto
                  className={`text-xs ${disabled ? 'text-line' : fecha === valor ? 'text-white' : ''}`}
                >
                  {dia > 0 ? dia : ''}
                </Texto>
              </Pressable>
            </View>
          );
        })}
      </View>
    </Tarjeta>
  );
}

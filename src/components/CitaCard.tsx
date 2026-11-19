import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { Cita, EstadoCita } from '@/models';
import { fechaTexto, horaTexto } from '@/utils/fechas';
import { Aparecer, Icono, Tarjeta, Texto } from './ui';
export const etiquetas: Record<EstadoCita, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
  vencida: 'Vencida',
};
export function ChipEstado({ estado }: { estado: EstadoCita }) {
  const color =
    estado === 'confirmada'
      ? ['#e5f5ec', '#1e8e5a']
      : estado === 'pendiente'
        ? ['#fdf3e1', '#b7791f']
        : estado === 'vencida'
          ? ['#e6ecf5', '#6b7280']
          : ['#fbe9e7', '#c0392b'];
  return (
    <View
      className="self-start px-2.5 py-1 rounded-full flex-row gap-1 items-center"
      style={{ backgroundColor: color[0] }}
    >
      {estado === 'vencida' ? (
        <View className="w-1.5 h-1.5 rounded-full bg-muted" />
      ) : (
        <Icono
          nombre={
            estado === 'confirmada'
              ? 'pointGreen'
              : estado === 'pendiente'
                ? 'pointAmber'
                : 'pointRed'
          }
          size={6}
        />
      )}
      <Texto style={{ color: color[1] }} className="text-[11px] leading-4 font-medium">
        {etiquetas[estado]}
      </Texto>
    </View>
  );
}
export default function CitaCard({ cita, doctor = false }: { cita: Cita; doctor?: boolean }) {
  const fecha = new Date(cita.inicio);
  return (
    <Aparecer>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver cita de ${doctor ? cita.pacienteNombre : cita.servicioNombre}`}
        onPress={() => router.push(`/cita/${cita.id}`)}
        className="active:opacity-70"
      >
        <Tarjeta>
          <View className="flex-row items-center gap-4">
            <View className="bg-navy-50 rounded-xl w-14 py-3 items-center">
              <Texto className="text-[10px] uppercase text-navy-500">
                {fecha.toLocaleDateString('es-CO', {
                  timeZone: 'America/Bogota',
                  weekday: 'short',
                })}
              </Texto>
              <Texto className="font-semibold text-xl">
                {fecha.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: 'numeric' })}
              </Texto>
            </View>
            <View className="flex-1 gap-1">
              <ChipEstado estado={cita.estado} />
              <Texto className="font-medium">
                {doctor ? cita.pacienteNombre : cita.servicioNombre}
              </Texto>
              <Texto className="text-xs text-muted">
                {doctor ? cita.servicioNombre + ' · ' : ''}
                {horaTexto(cita.inicio)} · {cita.duracionAcordadaMin} min
              </Texto>
              <Texto className="text-[11px] text-muted">{fechaTexto(cita.inicio, true)}</Texto>
            </View>
          </View>
        </Tarjeta>
      </Pressable>
    </Aparecer>
  );
}

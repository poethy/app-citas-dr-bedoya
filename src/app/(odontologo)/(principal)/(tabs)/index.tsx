import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useDatos } from '@/hooks/useDatos';
import { Estado, Icono, Opciones, Pantalla, Texto } from '@/components/ui';
import CitaCard from '@/components/CitaCard';
import AgendaSemana from '@/components/AgendaSemana';
import { useAgendaStore } from '@/store/agenda.store';
import { fechaLocal, fechaTexto, instante, sumarDias } from '@/utils/fechas';
export default function Agenda() {
  const { data } = useDatos();
  const { fecha, vista, setFecha, setVista } = useAgendaStore();
  const lunes = sumarDias(fecha, -((instante(fecha, 720).getUTCDay() + 6) % 7));
  const citas =
    data?.citas
      .filter((c) => {
        const dia = fechaLocal(c.inicio);
        return vista === 'dia' ? dia === fecha : dia >= lunes && dia < sumarDias(lunes, 7);
      })
      .sort((a, b) => a.inicio.localeCompare(b.inicio)) ?? [];
  return (
    <Pantalla
      menu
      oscura
      titulo="Agenda"
      headerRight={
        <Pressable
          accessibilityLabel="Avisos"
          onPress={() => router.push('/(odontologo)/(principal)/(tabs)/avisos')}
          className="p-3"
        >
          <Icono nombre="bellLight" />
        </Pressable>
      }
    >
      <View className="bg-navy-900 -mx-4 -mt-4 p-4 gap-4 rounded-b-[28px]">
        <Opciones
          valor={vista}
          onChange={setVista}
          opciones={[
            { valor: 'dia', label: 'Día' },
            { valor: 'semana', label: 'Semana' },
          ]}
        />
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityLabel="Anterior"
            className="p-3"
            onPress={() => setFecha(sumarDias(fecha, vista === 'dia' ? -1 : -7))}
          >
            <Texto className="text-white text-xl">‹</Texto>
          </Pressable>
          <Texto className="text-white text-center flex-1 capitalize">{fechaTexto(fecha)}</Texto>
          <Pressable
            accessibilityLabel="Siguiente"
            className="p-3"
            onPress={() => setFecha(sumarDias(fecha, vista === 'dia' ? 1 : 7))}
          >
            <Texto className="text-white text-xl">›</Texto>
          </Pressable>
        </View>
        {vista === 'dia' ? (
          <View className="flex-row gap-2">
            {(['confirmada', 'pendiente', 'cancelada'] as const).map((estado) => (
              <View key={estado} className="flex-1 rounded-xl bg-navy-700 p-3">
                <Texto className="text-white font-semibold text-lg">
                  {citas.filter((c) => c.estado === estado).length}
                </Texto>
                <Texto className="text-navy-300 text-[11px]">
                  {estado === 'confirmada'
                    ? 'confirmadas'
                    : estado === 'pendiente'
                      ? 'pendientes'
                      : 'canceladas'}
                </Texto>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      {vista === 'semana' ? (
        <AgendaSemana
          fecha={fecha}
          citas={citas}
          onDia={(dia) => {
            setFecha(dia);
            setVista('dia');
          }}
        />
      ) : citas.length ? (
        citas.map((c) => <CitaCard key={c.id} cita={c} doctor />)
      ) : (
        <Estado
          titulo="No hay citas este día"
          detalle="Usa Nueva cita para registrar una atención."
        />
      )}
    </Pantalla>
  );
}

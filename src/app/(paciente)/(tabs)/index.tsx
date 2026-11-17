import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useDatos } from '@/hooks/useDatos';
import { useAhora } from '@/hooks/useAhora';
import { useSesionStore } from '@/store/sesion.store';
import { Boton, Icono, Pantalla, Tarjeta, Texto } from '@/components/ui';
import CitaCard from '@/components/CitaCard';
export default function InicioPaciente() {
  const ahora = useAhora();
  const { data } = useDatos();
  const perfil = useSesionStore((s) => s.perfil);
  const cita = data?.citas
    .filter(
      (c) =>
        c.pacienteId === perfil?.id &&
        ['confirmada', 'pendiente'].includes(c.estado) &&
        Date.parse(c.inicio) > ahora,
    )
    .sort((a, b) => a.inicio.localeCompare(b.inicio))[0];
  return (
    <Pantalla
      menu
      oscura
      titulo={`Hola, ${perfil?.nombre.split(' ')[0] ?? ''}`}
      subtitulo="¿Lista para tu próxima cita?"
      headerRight={
        <Pressable
          accessibilityLabel="Notificaciones"
          onPress={() => router.push('/(paciente)/notificaciones')}
          className="p-3"
        >
          <Icono nombre="bellLight" />
        </Pressable>
      }
    >
      <Tarjeta>
        <Texto className="font-medium mb-2">Tu próxima cita</Texto>
        {cita ? (
          <>
            <CitaCard cita={cita} />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Boton variant="secondary" onPress={() => router.push(`/cita/${cita.id}`)}>
                  Ver detalle
                </Boton>
              </View>
              <View className="flex-1">
                <Boton onPress={() => router.push('/(paciente)/(tabs)/mapa')}>Ver en el mapa</Boton>
              </View>
            </View>
          </>
        ) : (
          <>
            <Texto className="text-muted">Todavía no tienes una cita próxima.</Texto>
            <Boton onPress={() => router.push('/(paciente)/(tabs)/agendar')}>
              Agendar una cita
            </Boton>
          </>
        )}
      </Tarjeta>
    </Pantalla>
  );
}

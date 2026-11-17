import { View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Boton, Pantalla, Tarjeta, Texto } from '@/components/ui';
import { ResumenCita } from '@/components/ResumenCita';
import Logo from '@/components/Logo';
import { useSesionStore } from '@/store/sesion.store';
export default function Consultorio() {
  const perfil = useSesionStore((s) => s.perfil);
  if (!perfil) return <Redirect href="/(auth)/bienvenida" />;
  return (
    <Pantalla
      titulo="El consultorio"
      footer={
        perfil.rol === 'paciente' ? (
          <Boton onPress={() => router.push('/(paciente)/(tabs)/mapa')}>Ver en el mapa</Boton>
        ) : undefined
      }
    >
      <View className="bg-navy-900 rounded-[20px] p-8 items-center">
        <Logo blanco completo centrado />
      </View>
      <Tarjeta>
        <Texto className="font-medium">Dr. Camilo Bedoya Orozco</Texto>
        <Texto className="text-xs text-muted">Odontología general</Texto>
        <ResumenCita
          filas={[
            ['pin', 'Dirección', 'Calle 18 # 5-27, Ed. Torcoroma, Consultorio 201, Pereira'],
            ['clock', 'Lunes a viernes', '8:00 a. m. – 6:00 p. m. · almuerzo 12:30 – 1:30 p. m.'],
            ['calendar', 'Sábado', '8:00 a. m. – 12:00 m.'],
          ]}
        />
      </Tarjeta>
      <Texto className="text-xs text-muted">
        Horario de ejemplo. Teléfono y coordenadas exactas pendientes de confirmar.
      </Texto>
    </Pantalla>
  );
}

import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { useDatos } from '@/hooks/useDatos';
import { Boton, Pantalla, Tarjeta, Texto } from '@/components/ui';
import { dinero } from '@/utils/fechas';
export default function Servicios() {
  const { data } = useDatos();
  return (
    <Pantalla
      titulo="Servicios"
      footer={
        <Boton onPress={() => router.push('/(odontologo)/servicios/nuevo')}>+ Nuevo servicio</Boton>
      }
    >
      <Texto className="text-muted text-xs">Define duración, precio y tipo de confirmación.</Texto>
      {data?.servicios.map((s) => (
        <Pressable
          key={s.id}
          accessibilityRole="button"
          onPress={() => router.push(`/(odontologo)/servicios/${s.id}`)}
        >
          <Tarjeta>
            <Texto className="font-medium">{s.nombre}</Texto>
            <Texto className="text-muted text-xs">
              {s.duracionMin} min · {dinero(s.precioCop)}
            </Texto>
            <Texto className="text-navy-500 text-xs">
              {s.confirmacion === 'inmediata' ? 'Confirmación inmediata' : 'Con aprobación'}
            </Texto>
          </Tarjeta>
        </Pressable>
      ))}
    </Pantalla>
  );
}

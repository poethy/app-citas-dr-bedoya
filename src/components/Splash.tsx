import { ActivityIndicator, View } from 'react-native';
import { Texto } from './ui';
import Logo from './Logo';

/**
 * A00 Splash: lo que se ve al abrir la app mientras cargan las fuentes, la sesión y los datos.
 * Después se entra a A01, P01 u O01, así que no muestra la silueta de ninguna lista.
 */
export default function Splash({ titulo }: { titulo: string }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={titulo}
      className="flex-1 items-center justify-center gap-4 bg-navy-900"
    >
      <Logo blanco grande centrado />
      <Texto className="text-sm text-navy-300">Odontología · Pereira</Texto>
      <ActivityIndicator color="#ffffff" />
    </View>
  );
}

import { Redirect } from 'expo-router';
import { Stack, type StackNavigationOptions } from 'expo-router/js-stack';
import { Easing } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSesionStore } from '@/store/sesion.store';

export const unstable_settings = { anchor: '(principal)' };

const frenadoSuave = Easing.bezier(0.22, 0.61, 0.36, 1);
const transicionAjustes: StackNavigationOptions['transitionSpec'] = {
  open: { animation: 'timing', config: { duration: 220, easing: frenadoSuave } },
  close: { animation: 'timing', config: { duration: 190, easing: frenadoSuave } },
};

export default function DoctorLayout() {
  const perfil = useSesionStore((s) => s.perfil);
  const reducirMovimiento = useReducedMotion();
  if (!perfil) return <Redirect href="/(auth)/bienvenida" />;
  if (perfil.rol !== 'odontologo') return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: reducirMovimiento ? 'none' : 'slide_from_right',
        transitionSpec: reducirMovimiento ? undefined : transicionAjustes,
        cardStyle: { backgroundColor: '#f3f6fb' },
      }}
    >
      <Stack.Screen name="(principal)" />
      <Stack.Screen name="servicios" />
      <Stack.Screen name="anticipacion" />
      <Stack.Screen name="bloqueos" />
    </Stack>
  );
}

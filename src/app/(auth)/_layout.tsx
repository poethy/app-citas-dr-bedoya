import { Redirect, Stack } from 'expo-router';
import { useSesionStore } from '@/store/sesion.store';
export default function AuthLayout() {
  const perfil = useSesionStore((s) => s.perfil);
  return perfil ? <Redirect href="/" /> : <Stack screenOptions={{ headerShown: false }} />;
}
